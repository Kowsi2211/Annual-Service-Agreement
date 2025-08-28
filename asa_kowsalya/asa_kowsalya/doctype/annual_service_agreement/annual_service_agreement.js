// Copyright (c) 2025, kowsalya and contributors
// For license information, please see license.txt

frappe.ui.form.on("Annual Service Agreement", {
    refresh(frm) {
        if (frm.doc.customer_name) {
            if (!frm.doc.customer_email) {
                frm.set_df_property("customer_email", "read_only", 0)
            }
            else {
                frm.set_df_property("customer_email", "read_only", 1)
            }
            if (!frm.doc.contact_number) {
                frm.set_df_property("contact_number", "read_only", 0)
            }
            else {
                frm.set_df_property("contact_number", "read_only", 1)
            }
            if (!frm.doc.billing_address) {
                frm.set_df_property("billing_address", "read_only", 0)
            }
            else {
                frm.set_df_property("billing_address", "read_only", 1)
            }

        }
        if (frm.doc.status === 'Active') {
            frm.add_custom_button('Add Visit Entry', () => {
                const d = new frappe.ui.Dialog({
                    title: 'Add Visit',
                    fields: [
                        {
                            fieldname: 'visit_date',
                            label: 'Visit Date',
                            fieldtype: 'Date',
                            default: frappe.datetime.get_today(),
                            reqd: 1
                        },
                        {
                            fieldname: 'performed_by',
                            label: 'Performed By',
                            fieldtype: 'Link',
                            options: 'Employee'
                        },
                        {
                            fieldname: 'service_provided',
                            label: 'Service Provided',
                            fieldtype: 'Small Text'
                        },
                        {
                            fieldname: 'time_spent',
                            label: 'Time Spent (hrs)',
                            fieldtype: 'Float',
                            default: 1
                        },
                        {
                            fieldname: 'remarks',
                            label: 'Remarks',
                            fieldtype: 'Small Text'
                        },
                        {
                            fieldname: 'visit_verified',
                            label: 'Visit Verified',
                            fieldtype: 'Check'
                        }
                    ],
                    primary_action_label: 'Add',
                    primary_action(values) {
                        frm.add_child('visit_log_table', {
                            visit_date: values.visit_date,
                            performed_by: values.performed_by,
                            service_provided: values.service_provided,
                            time_spent: values.time_spent,
                            remarks: values.remarks,
                            visit_verified: values.visit_verified ? 1 : 0
                        });
                        frm.refresh_field('visit_log_table');
                        frm.save_or_update()
                        d.hide();
                        frappe.show_alert({ message: 'Visit entry added', indicator: 'green' });
                    }
                });

                d.show();
            });
        }
        if (frm.doc.workflow_state == "Approved" && frm.doc.docstatus == 1) {
            frm.add_custom_button("Update Agreement Status", () => {
                let d = new frappe.ui.Dialog({
                    title: "Status Update",
                    fields: [
                        {
                            label: __("Status"),
                            fieldname: "status",
                            fieldtype: "Select",
                            options: ["Expired", "Suspended", "Terminated"],
                        },
                    ],
                    primary_action_label: "Update",
                    primary_action(values) {
                        frappe.call({
                            method: "asa_kowsalya.asa_kowsalya.doctype.annual_service_agreement.annual_service_agreement.status",
                            args: { value: values.status, name: frm.doc.name },
                            callback: function (r) {
                                if (r) {
                                    frm.reload_doc()
                                    frappe.msgprint("Status Update Successfully")
                                }
                            }
                        })

                        d.hide();

                    },
                });
                d.show();
            });
        }
    },
    before_save(frm) {
        if (frm.doc.total_invoiced && frm.doc.total_sla_value) {
            let value = 0
            value = frm.doc.total_sla_value - frm.doc.total_invoiced
            frm.set_value("outstanding_amount", value)
        }
        if (frm.doc.start_date && frm.doc.end_date && !frm.doc.duration) {
            duration(frm)
        }
    },
    before_workflow_action: async function (frm) {
        const action = frm.selected_workflow_action;

        if (action && action.toLowerCase() === "submit") {
            frappe.dom.unfreeze();
            frappe.validated = false;

            if (frm.doc.end_date < frm.doc.start_date) {
                frappe.throw("End Date must be after Start Date")
            }
            if (frm.doc.total_sla_value == 0) {
                frappe.throw("SLA Value must not be zero")
            }
            if (frm.doc.total_sla_value >= frm.doc.total_invoiced) {
                frappe.throw("Total SLA value ≥ Total Billing Amount")
            }
            if (frm.doc.total_visits === 1 || !frm.doc.total_visits) {
                frappe.throw('Total Visits must be ≥ 1 before completion')
            }

            frm.doc.sla_coverage_table.forEach(r => {
                if (!r.frequency) {
                    frappe.throw("Frequency not present in SLA row " + r.idx)
                }
                if (!r.on_site_response_time) {
                    frappe.throw("Rate not present in SLA row " + r.idx)
                }
            });

            return new Promise((resolve, reject) => {
                frappe.call({
                    method: "asa_kowsalya.asa_kowsalya.doctype.annual_service_agreement.annual_service_agreement.visit_date",
                    args: { name: frm.doc.name },
                    callback: function (r) {
                        if (r.message == -1) {
                            frappe.throw("No duplicate Visit Dates");
                            frappe.validated = false;  
                            reject("Duplicate visit dates found.");
                        } else {
                            const d = new frappe.ui.Dialog({
                                title: "ANNUAL SERVICE DETAILS",
                                fields: [
                                    { label: __("Agreement Title"), fieldname: "agreement_title", fieldtype: "Data", default: frm.doc.agreement_title, read_only: 1 },
                                    { label: __("SLA Type"), fieldname: "sla_type", fieldtype: "Data", default: frm.doc.sla_type, read_only: 1 },
                                    { label: __("Total SLA Value"), fieldname: "total_sla_value", fieldtype: "Data", default: frm.doc.total_sla_value, read_only: 1 },
                                    { label: __("Duration (Days)"), fieldname: "duration", fieldtype: "Data", default: frm.doc.duration, read_only: 1 },
                                ],
                                primary_action_label: "Confirm",
                                primary_action: () => {
                                    frm.set_value("workflow_state", "Under Review");
                                    d.hide();
                                    resolve();
                                },
                                secondary_action_label: "Back",
                                secondary_action: () => {
                                    d.hide();
                                    frm.set_value("workflow_state", "Draft");
                                    reject("Action cancelled by user.");
                                }
                            });

                            d.$wrapper.on("hide.bs.modal", () => {
                                if (!frm.doc.workflow_state || frm.doc.workflow_state !== "Under Review") {
                                    frm.set_value("workflow_state", "Draft");
                                    frm.set_value("status", "Draft");
                                    frm.save();
                                    reject("Dialog closed by user.");
                                }
                            });

                            d.show();
                        }
                    }
                });
            });
        }
    },



    customer_name(frm) {
        if (frm.doc.customer_name) {
            if (!frm.doc.customer_email) {
                frm.set_df_property("customer_email", "read_only", 0)
            }
            else {
                frm.set_df_property("customer_email", "read_only", 1)
            }
            if (!frm.doc.contact_number) {
                frm.set_df_property("contact_number", "read_only", 0)
            }
            else {
                frm.set_df_property("contact_number", "read_only", 1)
            }
            if (!frm.doc.billing_address) {
                frm.set_df_property("billing_address", "read_only", 0)
            }
            else {
                frm.set_df_property("billing_address", "read_only", 1)
            }
        }
    },
    start_date(frm) {
        duration(frm)
        frm.refresh_field("duration")
    },
    end_date(frm) {
        duration(frm)
        frm.refresh_field("duration")
    }
});
function duration(frm) {
    if (frm.doc.end_date < frm.doc.start_date) {
        frappe.throw("End Date must be after Start Date")
    }
    else if (frm.doc.end_date && frm.doc.start_date) {
        frappe.call({
            method: "asa_kowsalya.asa_kowsalya.doctype.annual_service_agreement.annual_service_agreement.duration",
            args: {
                start_date: frm.doc.start_date,
                end_date: frm.doc.end_date
            },
            callback: function (r) {
                if (r.message) {
                    frm.set_value("duration", r.message)
                }

            }
        })
    }
    else {
        frm.set_value("duration", "")
    }
}
frappe.ui.form.on("ASA Coverage", {
    estimated_service_time(frm, cdn, cdt) {
        sla_value(frm, cdn, cdt)
        total(frm)
    },
    rate(frm, cdn, cdt) {
        sla_value(frm, cdn, cdt)
        total(frm)
    },
    sla_coverage_table_add(frm, cdn, cdt) {
        total(frm)
    },
    sla_coverage_table_remove(frm, cdn, cdt) {
        total(frm)
    },
    sla_value(frm, cdn, cdt) {
        total(frm)
    },

})
function sla_value(frm, cdn, cdt) {
    frm.doc.sla_coverage_table.forEach((r) => {
        let value = 0
        if (r.estimated_service_time && r.rate) {
            value = r.estimated_service_time * r.rate
            frappe.model.set_value(cdn, cdt, "sla_value", value)
        }
        else {
            frappe.model.set_value(cdn, cdt, "sla_value", 0)
        }
    })
}
function total(frm) {
    let total = 0
    frm.doc.sla_coverage_table.forEach((r) => {
        if (r.sla_value) {
            total += r.sla_value
        }
    })
    frm.set_value("total_sla_value", total)
}
frappe.ui.form.on("ASA Visit", {
    visit_log_table_add(frm) {
        frm.set_value("total_visits", frm.doc.visit_log_table.length)
    },
    visit_log_table_remove(frm) {
        frm.set_value("total_visits", frm.doc.visit_log_table.length)
    },

})
frappe.ui.form.on("ASA Billing", {
    amount(frm) {
        billing(frm)
    },
    billing_schedule_table_add(frm) {
        billing(frm)
    },
    billing_schedule_table_remove(frm) {
        billing(frm)
    },
})

function billing(frm) {
    let total = 0
    frm.doc.billing_schedule_table.forEach((r) => {
        if (r.amount) {
            total += r.amount
        }
    })
    frm.set_value("total_invoiced", total)
}