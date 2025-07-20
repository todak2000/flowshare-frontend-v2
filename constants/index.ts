import { Permission } from "../types";

export const userDB = "appUsers";
export const permissionsList: Record<string, Permission> = {
  canCreateProd: "create_production_entry",
  canEditProd: "edit_production_entry",
  canViewProd: "view_production_data",
  canCreateTerminal: "create_terminal_receipt",
  canTriggerReconcilliation: "trigger_reconciliation",
  canViewAllAllocations: "view_all_allocations",
  canManageUsers: "manage_users",
  canAudit: "view_audit_logs",
  canExport: "export_reports",
  canViewAllocation: "view_allocation_results",
};
