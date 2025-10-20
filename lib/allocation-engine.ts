import crypto from "crypto";

import { AllocationInput } from "../types";

/**
 * AllocationEngine - Utility class for data validation and cryptographic operations
 *
 * NOTE: Allocation calculations have been moved to the Accountant Agent (backend AI service)
 * This class now only handles:
 * - Input validation
 * - Hash generation for data integrity
 * - Audit trail hashing
 */
export class AllocationEngine {
  /**
   * Generate hash for data integrity
   */
  public generateHash(data: unknown): string {
    const dataString = typeof data === "string" ? data : JSON.stringify(data);
    return crypto.createHash("sha256").update(dataString).digest("hex");
  }

  /**
   * Verify hash integrity
   */
  public verifyHash(data: unknown, expectedHash: string): boolean {
    const calculatedHash = this.generateHash(data);
    return calculatedHash === expectedHash;
  }

  /**
   * Create audit trail entry
   */
  public createAuditHash(
    action: string,
    entityId: string,
    userId: string,
    timestamp: Date,
    changes?: Record<string, unknown>
  ): string {
    const auditData = {
      action,
      entityId,
      userId,
      timestamp: timestamp.toISOString(),
      changes: changes || {},
    };
    return this.generateHash(auditData);
  }

  /**
   * Validate allocation inputs following methodology constraints
   *
   * NOTE: This provides basic validation before data entry.
   * Advanced validation and anomaly detection is handled by the Auditor Agent.
   */
  public validateInputs(entries: AllocationInput[]): string[] {
    const errors: string[] = [];

    if (entries.length === 0) {
      errors.push("At least one production entry is required");
      return errors;
    }

    entries.forEach((entry, index) => {
      if (!entry.partner || entry.partner.trim() === "") {
        errors.push(`Entry ${index + 1}: Partner name is required`);
      }

      if (entry.gross_volume_bbl <= 0) {
        errors.push(`Entry ${index + 1}: Gross volume must be greater than 0`);
      }

      // Methodology constraint: 0 ≤ BSW < 100
      if (entry.bsw_percent < 0 || entry.bsw_percent >= 100) {
        errors.push(
          `Entry ${index + 1}: BS&W percentage must be between 0 and 99.99`
        );
      }

      // Methodology constraint: -50°F ≤ T ≤ 200°F
      if (entry.temperature_degF < -50 || entry.temperature_degF > 200) {
        errors.push(
          `Entry ${index + 1}: Temperature must be between -50°F and 200°F`
        );
      }

      // API gravity range per industry standards: 10-45°API
      if (entry.api_gravity < 10 || entry.api_gravity > 45) {
        errors.push(
          `Entry ${index + 1}: API Gravity must be between 10 and 45°API`
        );
      }
    });

    return errors;
  }
}
