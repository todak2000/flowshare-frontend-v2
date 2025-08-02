import { Timestamp } from "firebase/firestore";

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
  edited_by?: string;
  isApproved?: boolean;
}

export interface TerminalReceipt {
  id: string;
  initial_volume_bbl: number;
  final_volume_bbl: number;
  temperature_degF: number;
  pressure_psi?: number;
  timestamp: Date;
  hash: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}



// Add new interface for monthly summary
export interface MonthlyAllocationSummary {
  partner: string;
  period: string;
  totalProductionInput: number;
  totalAllocatedVolume: number;
  totalVolumeLoss: number;
  allocationCount: number;
  allocations: AllocationResult[];
  productionEntries: ProductionEntry[];
}

// Add new interface for reconciliation report
export interface ReconciliationReport {
  reconciliation: ReconciliationRun;
  allocations: AllocationResult[];
  summary: {
    totalPartners: number;
    totalInputVolume: number;
    actualTerminalVolume: number;
    totalAllocatedVolume: number;
    totalVolumeLoss: number;
    shrinkagePercentage: number;
  };
}
// types.ts - Updated interfaces with date range support

export interface ReconciliationRun {
  id: string;
  total_terminal_volume: number;
  total_input_volume: number;
  total_net_volume: number;
  shrinkage_factor: number;
  start_date: Timestamp | Date; // Period start date
  end_date: Timestamp | Date; // Period end date
  timestamp: Date; // When reconciliation was run
  status: "completed" | "failed" | "in_progress";
  triggered_by: string;
  created_at: Date;
  hash: string;
}

export interface AllocationResult {
  id: string;
  partner: string;
  input_volume: number;
  net_volume: number;
  allocated_volume: number;
  percentage: number;
  volume_loss: number; // Volume loss calculation
  start_date: Timestamp | Date; // Period start date
  end_date: Timestamp | Date; // Period end date
  timestamp: Timestamp | Date; // When allocation was calculated
  reconciliation_id: string;
  created_at: Timestamp | Date;
  hash: string;
}

// Add new interface for monthly summary
export interface MonthlyAllocationSummary {
  partner: string;
  period: string;
  totalProductionInput: number;
  totalAllocatedVolume: number;
  totalVolumeLoss: number;
  allocationCount: number;
  allocations: AllocationResult[];
  productionEntries: ProductionEntry[];
}

// Add new interface for reconciliation report
export interface ReconciliationReport {
  reconciliation: ReconciliationRun;
  allocations: AllocationResult[];
  summary: {
    totalPartners: number;
    totalInputVolume: number;
    actualTerminalVolume: number;
    totalAllocatedVolume: number;
    totalVolumeLoss: number;
    shrinkagePercentage: number;
  };
}

// Add interface for reconciliation period summary
export interface ReconciliationPeriodSummary {
  periodStart: Date;
  periodEnd: Date;
  totalProductionEntries: number;
  totalTerminalReceipts: number;
  partnersInvolved: string[];
  readyForReconciliation: boolean;
  issues: string[];
}

// Add interface for existing reconciliation check
export interface ExistingReconciliationCheck {
  exists: boolean;
  reconciliation?: ReconciliationRun;
  message?: string;
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
  | "view_allocation_results"
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
  "id" | "hash" | "created_at" | "updated_at" | "isApproved" | "edited_by"
>;
export type CreateTerminalReceiptData = Omit<
  TerminalReceipt,
  "id" | "hash" | "created_at" | "updated_at"
>;
export type UpdateProductionEntryData = Partial<CreateProductionEntryData>;
export type UpdateTerminalReceiptData = Partial<CreateTerminalReceiptData>;

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
