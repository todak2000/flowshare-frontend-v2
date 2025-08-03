// lib/allocation-engine.ts
import crypto from "crypto";

import {
  AllocationInput,
  AllocationOutput,
  TerminalReceipt,
  STANDARD_CONDITIONS,
} from "../types";

export class AllocationEngine {
  /**
   * Calculate temperature correction factor using API MPMS Chapter 12.3
   */

  private getTemperatureCorrectionCoefficients(apiGravity: number): {
    alpha: number;
    beta: number;
  } {
    // API MPMS 11.1 coefficients based on API gravity
    // Linear interpolation between standard values

    if (apiGravity <= 10) {
      // Heavy crude
      return { alpha: 0.0003, beta: 0.0000001 };
    } else if (apiGravity <= 25) {
      // Medium crude
      const factor = (apiGravity - 10) / 15;
      return {
        alpha: 0.0003 + factor * 0.0001,
        beta: 0.0000001 + factor * 0.0000001,
      };
    } else if (apiGravity <= 45) {
      // Light crude
      const factor = (apiGravity - 25) / 20;
      return {
        alpha: 0.0004 + factor * 0.0001,
        beta: 0.0000002 + factor * 0.0000003,
      };
    } else {
      // Very light crude/condensate
      return { alpha: 0.0005, beta: 0.0000005 };
    }
  }

  private calculateAPIGravityCorrection(
    apiGravity: number,
    standardAPI: number // e.g., 35° API
  ): number {
    // Convert API to specific gravity
    const specificGravity = 141.5 / (apiGravity + 131.5);
    const standardSpecificGravity =
      141.5 / (standardAPI ?? STANDARD_CONDITIONS.API_GRAVITY + 131.5);

    // Volume correction based on density difference
    // Higher API (lighter crude) = larger volume at same mass
    const correction = standardSpecificGravity / specificGravity;

    return Math.max(0.9, Math.min(1.15, correction));
  }

  private calculateTemperatureCorrection(
    observedTemp: number,
    apiGravity: number,
    standardTemp: number = STANDARD_CONDITIONS.TEMPERATURE_DEGF
  ): number {
    const tempDifference = observedTemp - standardTemp;
    const { alpha, beta } =
      this.getTemperatureCorrectionCoefficients(apiGravity);

    // VCF = 1 - α(T - Tₛ) - β(T - Tₛ)²
    const correction =
      1 - alpha * tempDifference - beta * Math.pow(tempDifference, 2);

    return Math.max(0.95, Math.min(1.05, correction));
  }

  public calculateNetVolume(
    entry: AllocationInput,
    terminalGravity: number
  ): number {
    const { gross_volume_bbl, bsw_percent, temperature_degF, api_gravity } =
      entry;
    // Water cut correction
    const waterCutFactor = 1 - bsw_percent / 100;

    // API-dependent temperature correction
    const tempCorrection = this.calculateTemperatureCorrection(
      temperature_degF,
      api_gravity
    );

    // API gravity correction to standard conditions
    const apiCorrection = this.calculateAPIGravityCorrection(
      api_gravity,
      terminalGravity
    );

    // Combined net volume
    const netVolumeWithCorrection =
      gross_volume_bbl * waterCutFactor * tempCorrection * apiCorrection;

    const netVolume = gross_volume_bbl * waterCutFactor;

    // return Math.round(netVolume * 100) / 100; // Round to 2 decimal places
    return Math.round(netVolumeWithCorrection * 100) / 100;
  }

  /**
   * Calculate shrinkage factor based on total input vs terminal receipt
   */
  private calculateShrinkageFactor(
    totalNetInput: number,
    terminalVolume: number
  ): number {
    if (totalNetInput === 0) return 0;
    return (totalNetInput - terminalVolume) / totalNetInput;
  }

  /**
   * Main allocation function
   */
  public calculateAllocation(
    productionEntries: AllocationInput[],
    terminalReceipt: TerminalReceipt
  ): AllocationOutput {
    if (productionEntries.length === 0) {
      throw new Error("No production entries provided for allocation");
    }

    // Step 1: Calculate net volumes for each entry
    const netVolumes = productionEntries.map((entry) => ({
      ...entry,
      net_volume: this.calculateNetVolume(
        entry,
        terminalReceipt?.api_gravity as number
      ),
    }));

    // Step 2: Calculate totals
    const totalInputVolume = productionEntries.reduce(
      (sum, entry) => sum + entry.gross_volume_bbl,
      0
    );

    const totalNetVolume = netVolumes.reduce(
      (sum, entry) => sum + entry.net_volume,
      0
    );

    const terminalVolume = terminalReceipt.final_volume_bbl;

    // Step 3: Calculate shrinkage factor
    const shrinkageFactor = this.calculateShrinkageFactor(
      totalNetVolume,
      terminalVolume
    );

    // Step 4: Allocate terminal volume proportionally
    const allocationResults = netVolumes.map((entry) => {
      const percentage =
        totalNetVolume > 0 ? entry.net_volume / totalNetVolume : 0;
      const allocatedVolume = terminalVolume * percentage;

      return {
        partner: entry.partner,
        input_volume: entry.gross_volume_bbl,
        net_volume: entry.net_volume,
        allocated_volume: Math.round(allocatedVolume * 100) / 100,
        percentage: Math.round(percentage * 10000) / 100, // Convert to percentage with 2 decimals
      };
    });

    return {
      total_terminal_volume: terminalVolume,
      total_input_volume: Math.round(totalInputVolume * 100) / 100,
      total_net_volume: Math.round(totalNetVolume * 100) / 100,
      shrinkage_factor: Math.round(shrinkageFactor * 10000) / 100, // Convert to percentage
      allocation_results: allocationResults,
    };
  }

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
   * Validate allocation inputs
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

      if (entry.bsw_percent < 0 || entry.bsw_percent >= 100) {
        errors.push(
          `Entry ${index + 1}: BS&W percentage must be between 0 and 99.99`
        );
      }

      if (entry.temperature_degF < -50 || entry.temperature_degF > 200) {
        errors.push(
          `Entry ${index + 1}: Temperature must be between -50°F and 200°F`
        );
      }

      if (entry.api_gravity < 10 || entry.api_gravity > 36) {
        errors.push(
          `Entry ${index + 1}: API Gravity be between 10 and 36°API `
        );
      }
    });

    return errors;
  }

  /**
   * Generate detailed allocation report
   */
  public generateAllocationReport(
    allocation: AllocationOutput,
    timestamp: Date,
    reconciliationId: string
  ): unknown {
    return {
      reconciliation_id: reconciliationId,
      timestamp: timestamp.toISOString(),
      summary: {
        total_input_volume: allocation.total_input_volume,
        total_net_volume: allocation.total_net_volume,
        total_terminal_volume: allocation.total_terminal_volume,
        shrinkage_factor: allocation.shrinkage_factor,
        number_of_partners: allocation.allocation_results.length,
      },
      partner_allocations: allocation.allocation_results,
      calculations: {
        temperature_correction_applied: true,
        api_gravity_correction_applied: true,
        bsw_correction_applied: true,
        allocation_method: "proportional_by_net_volume",
      },
      hash: this.generateHash({
        allocation,
        timestamp: timestamp.toISOString(),
        reconciliationId,
      }),
    };
  }
}
