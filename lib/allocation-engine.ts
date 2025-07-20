// lib/allocation-engine.ts
import crypto from "crypto";

import {
  AllocationInput,
  AllocationOutput,
  ProductionEntry,
  TerminalReceipt,
  STANDARD_CONDITIONS,
  API_MPMS_CONSTANTS,
} from "../types";

export class AllocationEngine {
  /**
   * Calculate temperature correction factor using API MPMS Chapter 12.3
   */
  private calculateTemperatureCorrection(
    observedTemp: number,
    standardTemp: number = STANDARD_CONDITIONS.TEMPERATURE_DEGF
  ): number {
    const tempDifference = observedTemp - standardTemp;
    const { ALPHA_COEFFICIENT, BETA_COEFFICIENT } = API_MPMS_CONSTANTS;

    // VCF = 1 - α(T - Tₛ) - β(T - Tₛ)²
    const correction =
      1 -
      ALPHA_COEFFICIENT * tempDifference -
      BETA_COEFFICIENT * Math.pow(tempDifference, 2);

    return Math.max(0.95, Math.min(1.05, correction)); // Clamp between 0.95 and 1.05
  }

  /**
   * Calculate pressure correction factor
   */
  private calculatePressureCorrection(
    observedPressure: number,
    standardPressure: number = STANDARD_CONDITIONS.PRESSURE_PSI
  ): number {
    // Simplified pressure correction for liquid hydrocarbons
    // CPL = 1 + (P - Pₛ) × F
    const pressureFactor = 0.000001; // Typical factor for crude oil
    const correction =
      1 + (observedPressure - standardPressure) * pressureFactor;

    return Math.max(0.998, Math.min(1.002, correction));
  }

  /**
   * Calculate net volume after BS&W and temperature/pressure corrections
   */
  private calculateNetVolume(entry: AllocationInput): number {
    const { gross_volume_bbl, bsw_percent, temperature_degF, pressure_psi } =
      entry;

    // Remove BS&W (Basic Sediment and Water)
    const volumeAfterBSW = gross_volume_bbl * (1 - bsw_percent / 100);

    // Apply temperature correction
    const tempCorrection =
      this.calculateTemperatureCorrection(temperature_degF);
    const volumeAfterTemp = volumeAfterBSW * tempCorrection;

    // Apply pressure correction
    const pressureCorrection = this.calculatePressureCorrection(pressure_psi);
    const netVolume = volumeAfterTemp * pressureCorrection;

    return Math.round(netVolume * 100) / 100; // Round to 2 decimal places
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
    terminalReceipt: Pick<TerminalReceipt, "final_volume_bbl">
  ): AllocationOutput {
    if (productionEntries.length === 0) {
      throw new Error("No production entries provided for allocation");
    }

    // Step 1: Calculate net volumes for each entry
    const netVolumes = productionEntries.map((entry) => ({
      ...entry,
      net_volume: this.calculateNetVolume(entry),
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

      if (entry.pressure_psi < 0 || entry.pressure_psi > 1000) {
        errors.push(
          `Entry ${index + 1}: Pressure must be between 0 and 1000 PSI`
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
        pressure_correction_applied: true,
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
