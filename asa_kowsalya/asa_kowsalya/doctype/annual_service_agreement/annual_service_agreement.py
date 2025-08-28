# Copyright (c) 2025, kowsalya and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import  days_diff


class AnnualServiceAgreement(Document):
	def on_update(self):
		if self.workflow_state == "Suspended":
			self.cancel()

@frappe.whitelist()
def duration(start_date,end_date):
	value = days_diff(end_date,start_date)
	return value

@frappe.whitelist()
def status(value,name):
	doc = frappe.get_doc("Annual Service Agreement", name)
	doc.db_set("status",value)
	
	
	return value,name

@frappe.whitelist()
def visit_date(name):
	doc = frappe.get_doc("Annual Service Agreement", name)
	value = []
	test = 0
	for i in doc.visit_log_table:
		if i.visit_date not in value:
			value.append(i.visit_date)
		else:
			test = -1
	
	
	return test