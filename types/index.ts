// types/index.ts
export interface ProductionEntry {
  id: string;
  partner: string;
  gross_volume_bbl: number;
  bsw_percent: number;
  temperature_degF: number;
  pressure_psi: number;
  timestamp: Date;
  hash: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface TerminalReceipt {
  id: string;
  final_volume_bbl: number;
  temperature_degF: number;
  pressure_psi: number;
  timestamp: Date;
  hash: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface AllocationResult {
  id: string;
  partner: string;
  input_volume: number;
  net_volume: number;
  allocated_volume: number;
  percentage: number;
  timestamp: Date;
  hash: string;
  reconciliation_id: string;
  created_at: Date;
}

export interface ReconciliationRun {
  id: string;
  total_terminal_volume: number;
  total_input_volume: number;
  total_net_volume: number;
  shrinkage_factor: number;
  timestamp: Date;
  status: "pending" | "completed" | "failed";
  triggered_by: string;
  created_at: Date;
  hash: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  user_email: string;
  timestamp: Date;
  hash: string;
  changes?: Record<string, unknown>;
  ip_address?: string;
}

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  company: string;
  permissions: Permission[];
  created_at: Date;
  last_login?: Date;
  active: boolean;
}

export type UserRole =
  | "field_operator"
  | "admin"
  | "jv_coordinator"
  | "auditor"
  | "jv_partner";

export type Permission =
  | "create_production_entry"
  | "edit_production_entry"
  | "view_production_data"
  | "create_terminal_receipt"
  | "trigger_reconciliation"
  | "view_all_allocations"
  | "manage_users"
  | "view_audit_logs"
  | "export_reports";

export interface AllocationInput {
  partner: string;
  gross_volume_bbl: number;
  bsw_percent: number;
  temperature_degF: number;
  pressure_psi: number;
}

export interface AllocationOutput {
  total_terminal_volume: number;
  total_input_volume: number;
  total_net_volume: number;
  shrinkage_factor: number;
  allocation_results: {
    partner: string;
    input_volume: number;
    net_volume: number;
    allocated_volume: number;
    percentage: number;
  }[];
}

// Configuration constants
export const STANDARD_CONDITIONS = {
  TEMPERATURE_DEGF: 60,
  PRESSURE_PSI: 14.7,
} as const;

export const API_MPMS_CONSTANTS = {
  // API MPMS Chapter 12.3 constants for temperature correction
  ALPHA_COEFFICIENT: 0.000645, // Thermal expansion coefficient for crude oil
  BETA_COEFFICIENT: 0.00035, // Additional correction factor
} as const;

// Utility types for Firebase
export interface FirebaseDocument {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export interface HashedDocument {
  hash: string;
}

export type CreateProductionEntryData = Omit<
  ProductionEntry,
  "id" | "hash" | "created_at" | "updated_at"
>;
export type CreateTerminalReceiptData = Omit<
  TerminalReceipt,
  "id" | "hash" | "created_at" | "updated_at"
>;
export type UpdateProductionEntryData = Partial<CreateProductionEntryData>;
export type UpdateTerminalReceiptData = Partial<CreateTerminalReceiptData>;

// export interface ProductionEntry {
//   id: string;
//   partner: string;
//   gross_volume_bbl: number;
//   bsw_percent: number;
//   temperature_degF: number;
//   pressure_psi: number;
//   timestamp: Date | string;
//   created_by: string;
// }

export interface Filters {
  partner: string;
  startDate: string;
  endDate: string;
  search: string;
}

export interface ChartDataItem {
  date: string;
  totalVolume: number;
  count: number;
}

export interface PartnerDataItem {
  partner: string;
  volume: number;
}

export type TabType = "dashboard" | "data";