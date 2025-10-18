/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AI Agents API Client
 * Handles communication with backend agents deployed on Cloud Run
 */

const AUDITOR_URL = process.env.NEXT_PUBLIC_AUDITOR_AGENT_URL || 'http://localhost:8081';
const ACCOUNTANT_URL = process.env.NEXT_PUBLIC_ACCOUNTANT_AGENT_URL || 'http://localhost:8082';
const COMMUNICATOR_URL = process.env.NEXT_PUBLIC_COMMUNICATOR_AGENT_URL || 'http://localhost:8083';

// ==================== TYPES ====================

export interface ProductionEntry {
  partner: string;
  gross_volume_bbl: number;
  bsw_percent: number;
  temperature_degF: number;
  api_gravity: number;
}

export interface ValidationRequest {
  entry_id: string;
  entry_data: {
    id: string;
    partner: string;
    gross_volume_bbl: number;
    bsw_percent: number;
    temperature_degF: number;
    api_gravity: number;
    timestamp: string; // ISO format
  };
}

export interface ValidationResult {
  entry_id: string;
  status: 'valid' | 'warning' | 'flagged';
  flagged: boolean;
  issues: Array<{
    field: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    suggestion: string;
    value: any;
  }>;
  ai_analysis: string;
  confidence_score: number;
  timestamp: string;
  anomaly_score?: number; // For backwards compatibility
}

export interface AllocationRequest {
  receipt_id: string;
  receipt_data: {
    terminal_volume_bbl: number;
    api_gravity: number;
    production_entries: ProductionEntry[];
  };
}

export interface AllocationResult {
  partner: string;
  gross_volume: number;
  net_volume: number;
  allocated_volume: number;
  percentage: number;
  volume_loss: number;
  water_cut_factor: number;
  temp_correction: number;
  api_correction: number;
  bsw_deduction: number;
  temperature_adjustment: number;
  api_adjustment: number;
}

export interface NotificationRequest {
  notification_id: string;
  notification_data: {
    type: 'email' | 'sms' | 'webhook';
    recipient: string;
    subject?: string;
    body: string; // Changed from 'message' to match backend
    metadata?: Record<string, any>;
  };
}

// ==================== AUDITOR AGENT ====================

/**
 * Validate production entry using Auditor Agent
 */
export async function validateProductionEntry(
  request: ValidationRequest
): Promise<ValidationResult> {
  try {
    console.log(`🔍 Auditor Agent URL: ${AUDITOR_URL}/validate`);
    console.log('📤 Sending request to Auditor Agent:', request);

    const response = await fetch(`${AUDITOR_URL}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    console.log(`📥 Auditor Agent response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Auditor Agent error response: ${errorText}`);
      throw new Error(`Auditor Agent error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Auditor Agent response data:', data);

    if (!data.success) {
      throw new Error(data.error || 'Validation failed');
    }

    return data.validation_result;
  } catch (error) {
    console.error('❌ Error validating production entry:', error);
    throw error;
  }
}

/**
 * Check Auditor Agent health
 */
export async function checkAuditorHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${AUDITOR_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
}

// ==================== ACCOUNTANT AGENT ====================

/**
 * Calculate allocations using Accountant Agent
 */
export async function calculateAllocations(
  request: AllocationRequest
): Promise<AllocationResult[]> {
  try {
    const response = await fetch(`${ACCOUNTANT_URL}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Accountant Agent error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Calculation failed');
    }

    return data.allocations;
  } catch (error) {
    console.error('Error calculating allocations:', error);
    throw error;
  }
}

/**
 * Check Accountant Agent health
 */
export async function checkAccountantHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${ACCOUNTANT_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
}

// ==================== COMMUNICATOR AGENT ====================

/**
 * Send notification using Communicator Agent
 */
export async function sendNotification(
  request: NotificationRequest
): Promise<{ success: boolean; message_id?: string }> {
  try {
    const response = await fetch(`${COMMUNICATOR_URL}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Communicator Agent error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Notification failed');
    }

    return {
      success: true,
      message_id: data.notification_id,
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

/**
 * Check Communicator Agent health
 */
export async function checkCommunicatorHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${COMMUNICATOR_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
}

// ==================== AGENT STATUS ====================

export interface AgentStatus {
  name: string;
  status: 'online' | 'offline';
  url: string;
}

/**
 * Get status of all agents
 */
export async function getAllAgentsStatus(): Promise<AgentStatus[]> {
  const [auditorHealthy, accountantHealthy, communicatorHealthy] = await Promise.all([
    checkAuditorHealth(),
    checkAccountantHealth(),
    checkCommunicatorHealth(),
  ]);

  return [
    {
      name: 'Auditor Agent',
      status: auditorHealthy ? 'online' : 'offline',
      url: AUDITOR_URL,
    },
    {
      name: 'Accountant Agent',
      status: accountantHealthy ? 'online' : 'offline',
      url: ACCOUNTANT_URL,
    },
    {
      name: 'Communicator Agent',
      status: communicatorHealthy ? 'online' : 'offline',
      url: COMMUNICATOR_URL,
    },
  ];
}
