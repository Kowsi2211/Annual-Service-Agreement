// Copyright (c) 2025, kowsalya and contributors
// For license information, please see license.txt

frappe.query_reports["Active Service Agreements"] = {
	"filters": [
    {
      "fieldname": "sla_type",
      "label": "SLA Type",
      "fieldtype": "Select",
      "options": "\nBronze\nSilver\nGold\nPlatinum",
      "reqd": 0
    },
    {
      "fieldname": "service_category",
      "label": "Service Category",
      "fieldtype": "Select",
      "options": "\nHVAC\nPlumbing\nElectrical\nFire & Safety\nMixed",
      "reqd": 0
    },
    {
      "fieldname": "from_date",
      "label": "From Date",
      "fieldtype": "Date",
      "reqd": 1
    },
    {
      "fieldname": "to_date",
      "label": "To Date",
      "fieldtype": "Date",
      "reqd": 1
    },
    {
      "fieldname": "status",
      "label": "Status",
      "fieldtype": "MultiSelectList",
      "options": [
        { "value": "Draft", "description": "Draft" },
        { "value": "Active", "description": "Active" },
        { "value": "Suspended", "description": "Suspended" },
        { "value": "Expired", "description": "Expired" },
        { "value": "Terminated", "description": "Terminated" }
      ],
      "reqd": 0
    }
  ]
};
