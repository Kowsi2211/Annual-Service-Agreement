# Copyright (c) 2025, kowsalya and contributors
# For license information, please see license.txt

import frappe

def execute(filters=None):
    if not filters:
        filters = {}

    columns = get_columns()
    data = get_data(filters)

    return columns, data


def get_columns():
    return [
        {"label": "Agreement Title", "fieldname": "agreement_title", "fieldtype": "Data", "width": 200},
        {"label": "Customer Name", "fieldname": "customer_name", "fieldtype": "Data", "width": 180},
        {"label": "SLA Type", "fieldname": "sla_type", "fieldtype": "Data", "width": 120},
        {"label": "Category", "fieldname": "service_category", "fieldtype": "Data", "width": 150},
        {"label": "Assigned Engineer", "fieldname": "assigned_engineer", "fieldtype": "Data", "width": 150},
        {"label": "Total SLA Value", "fieldname": "total_sla_value", "fieldtype": "Currency", "width": 150},
        {"label": "Visits Logged", "fieldname": "total_visits", "fieldtype": "Int", "width": 120},
        {"label": "Agreement Status", "fieldname": "status", "fieldtype": "Data", "width": 150},
    ]


def get_data(filters):
    conditions = []

    if filters.get("sla_type"):
        conditions.append("sla_type = %(sla_type)s")

    if filters.get("service_category"):
        conditions.append("service_category = %(service_category)s")

    if filters.get("status"):
        status_list = filters.get("status")
        if isinstance(status_list, str):
            status_list = [status_list]
        conditions.append("status IN %(status)s")
        filters["status"] = tuple(status_list)

    if filters.get("from_date") and filters.get("to_date"):
        conditions.append("start_date BETWEEN %(from_date)s AND %(to_date)s")

    where_clause = " AND ".join(conditions)
    if where_clause:
        where_clause = "WHERE " + where_clause

    query = f"""
        SELECT
            agreement_title,
            customer_name,
            sla_type,
            service_category,
            assigned_engineer,
            total_sla_value,
            total_visits,
            status
        FROM `tabAnnual Service Agreement`
        {where_clause}
    """

    return frappe.db.sql(query, filters, as_dict=True)


