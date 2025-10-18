import crypto from "crypto";

import { AllocationInput, AllocationOutput, TerminalReceipt } from "../types";

export class AllocationEngine {
  /**
   * Get temperature correction coefficients based on API gravity
   * Following the methodology document's ranges and values
   */
  private getTemperatureCorrectionCoefficients(apiGravity: number): {
    alpha: number;
    beta: number;
  } {
    // Based on methodology document ranges
    if (apiGravity <= 10) {
      // Heavy crude
      return { alpha: 0.0003, beta: 0.0000001 };
    } else if (apiGravity <= 25) {
      // Medium crude: α = 0.0003 to 0.0004, β = 0.0000001 to 0.0000002
      const factor = (apiGravity - 10) / 15;
      return {
        alpha: 0.0003 + factor * 0.0001,
        beta: 0.0000001 + factor * 0.0000001,
      };
    } else if (apiGravity <= 45) {
      // Light crude: α = 0.0004 to 0.0005, β = 0.0000002 to 0.0000005
      const factor = (apiGravity - 25) / 20;
      return {
        alpha: 0.0004 + factor * 0.0001,
        beta: 0.0000002 + factor * 0.0000003,
      };
    } else {
      // Condensate: α = 0.0005, β = 0.0000005
      return { alpha: 0.0005, beta: 0.0000005 };
    }
  }

  /**
   * Calculate API gravity correction following methodology document
   * Standard SG / Observed SG format
   */
  private calculateAPIGravityCorrection(
    observedAPI: number,
    terminalAPI: number
  ): number {
    // Calculate specific gravities using the exact formula from methodology
    const observedSG = 141.5 / (observedAPI + 131.5);
    const standardSG = 141.5 / (terminalAPI + 131.5);

    // API Correction = Standard SG / Observed SG (as per methodology)
    const correction = standardSG / observedSG;

    // Apply methodology constraints: 0.9 ≤ correction ≤ 1.15
    return Math.max(0.9, Math.min(1.15, correction));
  }

  /**
   * Calculate temperature correction following methodology document
   * Temperature Correction = 1 - α(T - Ts) - β(T - Ts)²
   */
  private calculateTemperatureCorrection(
    observedTemp: number,
    apiGravity: number,
    standardTemp: number = 60 // Standard temperature is 60°F per methodology
  ): number {
    const tempDifference = observedTemp - standardTemp;
    const { alpha, beta } =
      this.getTemperatureCorrectionCoefficients(apiGravity);

    // VCF = 1 - α(T - Ts) - β(T - Ts)² (exact formula from methodology)
    const correction =
      1 - alpha * tempDifference - beta * Math.pow(tempDifference, 2);

    // Apply methodology constraints: 0.95 ≤ correction ≤ 1.05
    return Math.max(0.95, Math.min(1.05, correction));
  }

  /**
   * Calculate net volume following the exact methodology formula
   * Net Volume = Gross Volume × Water Cut Factor × Temp Correction × API Correction
   */
  public calculateNetVolume(
    entry: AllocationInput,
    terminalGravity: number
  ): number {
    const { gross_volume_bbl, bsw_percent, temperature_degF, api_gravity } =
      entry;

    // Step 1: Water Cut Factor = 1 - (BSW% / 100)
    const waterCutFactor = 1 - bsw_percent / 100;

    // Step 2: Temperature Correction
    const tempCorrection = this.calculateTemperatureCorrection(
      temperature_degF,
      api_gravity
    );

    // Step 3: API Gravity Correction
    const apiCorrection = this.calculateAPIGravityCorrection(
      api_gravity,
      terminalGravity
    );

    // Step 4: Complete Net Volume Formula (from methodology)
    const netVolume =
      gross_volume_bbl * waterCutFactor * tempCorrection * apiCorrection;

    return Math.round(netVolume * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate shrinkage factor based on methodology
   * Shrinkage Factor (%) = [(Total Net Volume - Terminal Volume) / Total Net Volume] × 100
   */
  private calculateShrinkageFactor(
    totalNetInput: number,
    terminalVolume: number
  ): number {
    if (totalNetInput === 0) return 0;
    return ((totalNetInput - terminalVolume) / totalNetInput) * 100;
  }

  /**
   * Main allocation function following exact methodology
   */
  public calculateAllocation(
    productionEntries: AllocationInput[],
    terminalReceipt: TerminalReceipt
  ): AllocationOutput {
    if (productionEntries.length === 0) {
      throw new Error("No production entries provided for allocation");
    }

    // Step 1: Calculate net volumes for each entry using terminal API gravity
    const netVolumes = productionEntries.map((entry) => ({
      ...entry,
      net_volume: this.calculateNetVolume(
        entry,
        terminalReceipt.api_gravity as number
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

    // Step 3: Calculate shrinkage factor using methodology formula
    const shrinkageFactor = this.calculateShrinkageFactor(
      totalNetVolume,
      terminalVolume
    );

    // Step 4: Proportional allocation with percentage capping and normalization
    // Strategy: Work with percentages first, then calculate volumes from percentages
    const MAX_PERCENTAGE = 99.99999;

    // Calculate raw percentages for each partner
    const rawAllocations = netVolumes.map((entry) => {
      const rawPercentage =
        totalNetVolume > 0 ? (entry.net_volume / totalNetVolume) * 100 : 0;

      return {
        partner: entry.partner,
        gross_volume: entry.gross_volume_bbl,
        net_volume: entry.net_volume,
        rawPercentage,
      };
    });

    // Cap percentages at MAX_PERCENTAGE
    const cappedAllocations = rawAllocations.map((alloc) => ({
      ...alloc,
      cappedPercentage:
        alloc.rawPercentage > MAX_PERCENTAGE
          ? MAX_PERCENTAGE
          : alloc.rawPercentage,
    }));

    // Normalize percentages to sum to exactly 100%
    const totalCappedPercentage = cappedAllocations.reduce(
      (sum, a) => sum + a.cappedPercentage,
      0
    );

    const normalizedAllocations = cappedAllocations.map((alloc) => {
      const normalizedPercentage =
        totalCappedPercentage > 0
          ? (alloc.cappedPercentage / totalCappedPercentage) * 100
          : 0;

      // Ensure no single partner exceeds the cap after normalization
      const finalPercentage = Math.min(normalizedPercentage, MAX_PERCENTAGE);

      return {
        ...alloc,
        finalPercentage,
      };
    });

    // Calculate allocated volumes from final percentages
    const volumeAllocations = normalizedAllocations.map((alloc) => ({
      ...alloc,
      allocatedVolume: terminalVolume * (alloc.finalPercentage / 100),
    }));

    // CRITICAL CONSTRAINT: Allocated volume CANNOT exceed 99.9% of input volume
    // Cap each allocation at 99.9% of their input volume (ensure minimum 0.1% loss)
    const MAX_ALLOCATION_FACTOR = 0.999; // 99.9%
    const cappedVolumeAllocations = volumeAllocations.map((alloc) => {
      const maxAllocation = alloc.gross_volume * MAX_ALLOCATION_FACTOR;
      const allocatedVolume =
        alloc.allocatedVolume > maxAllocation
          ? maxAllocation
          : alloc.allocatedVolume;

      if (alloc.allocatedVolume > maxAllocation) {
        console.warn(
          `Partner ${alloc.partner} allocation exceeds 99.9% of input, capping`,
          {
            calculated: alloc.allocatedVolume.toFixed(2),
            input: alloc.gross_volume.toFixed(2),
            maxAllowed: maxAllocation.toFixed(2),
          }
        );
      }

      return {
        ...alloc,
        allocatedVolume,
      };
    });

    // Round allocated volumes
    const roundedAllocations = cappedVolumeAllocations.map((alloc) => ({
      ...alloc,
      allocatedVolume: Math.round(alloc.allocatedVolume * 100) / 100,
    }));

    // Calculate total allocated after capping and rounding
    const totalAllocated = roundedAllocations.reduce(
      (sum, a) => sum + a.allocatedVolume,
      0
    );
    const volumeDifference =
      Math.round((terminalVolume - totalAllocated) * 100) / 100;

    // If there's excess terminal volume after capping, try to redistribute
    if (volumeDifference > 0) {
      // Find partners with room (allocated < 99.9% of input)
      const partnersWithRoom = roundedAllocations.filter(
        (alloc) => alloc.allocatedVolume < alloc.gross_volume * MAX_ALLOCATION_FACTOR
      );

      if (partnersWithRoom.length > 0) {
        // Calculate how much room each has (up to 99.9% of input)
        const totalRoom = partnersWithRoom.reduce(
          (sum, alloc) =>
            sum +
            (alloc.gross_volume * MAX_ALLOCATION_FACTOR - alloc.allocatedVolume),
          0
        );

        // Distribute proportionally to available room, but don't exceed 99.9% of input
        let remainingDifference = volumeDifference;
        partnersWithRoom.forEach((alloc) => {
          const maxAllocation = alloc.gross_volume * MAX_ALLOCATION_FACTOR;
          const partnerRoom = maxAllocation - alloc.allocatedVolume;
          if (totalRoom > 0 && remainingDifference > 0) {
            const additional = Math.min(
              remainingDifference * (partnerRoom / totalRoom),
              partnerRoom
            );
            alloc.allocatedVolume += additional;
            alloc.allocatedVolume =
              Math.round(alloc.allocatedVolume * 100) / 100;
            remainingDifference =
              Math.round((remainingDifference - additional) * 100) / 100;
          }
        });

        console.info(
          "Redistributed excess terminal volume to partners with room",
          {
            redistributed: (volumeDifference - remainingDifference).toFixed(2),
            unallocated: remainingDifference.toFixed(2),
          }
        );
      } else {
        console.warn(
          "Terminal volume exceeds total input volume, cannot allocate excess",
          {
            terminal: terminalVolume.toFixed(2),
            totalInput: roundedAllocations
              .reduce((sum, a) => sum + a.gross_volume, 0)
              .toFixed(2),
            excess: volumeDifference.toFixed(2),
          }
        );
      }
    } else if (volumeDifference < 0) {
      // We allocated too much (shouldn't happen with caps, but handle it)
      const absDiff = Math.abs(volumeDifference);
      const largestIdx = roundedAllocations.reduce(
        (maxIdx, alloc, idx, arr) =>
          alloc.allocatedVolume > arr[maxIdx].allocatedVolume ? idx : maxIdx,
        0
      );
      roundedAllocations[largestIdx].allocatedVolume -= absDiff;
      roundedAllocations[largestIdx].allocatedVolume =
        Math.round(roundedAllocations[largestIdx].allocatedVolume * 100) / 100;
    }

    // Recalculate final percentages from adjusted volumes (and ensure cap)
    const finalAllocations = roundedAllocations.map((alloc) => ({
      ...alloc,
      finalPercentage: Math.min(
        (alloc.allocatedVolume / terminalVolume) * 100,
        MAX_PERCENTAGE
      ),
    }));

    // Create final results
    const allocationResults = finalAllocations.map((alloc) => {
      const volumeLoss = alloc.gross_volume - alloc.allocatedVolume;

      return {
        partner: alloc.partner,
        input_volume: alloc.gross_volume,
        net_volume: alloc.net_volume,
        allocated_volume: Math.round(alloc.allocatedVolume * 100) / 100,
        percentage: Math.round(alloc.finalPercentage * 100) / 100,
        volume_loss: Math.round(volumeLoss * 100) / 100,
      };
    });

    return {
      total_terminal_volume: terminalVolume,
      total_input_volume: Math.round(totalInputVolume * 100) / 100,
      total_net_volume: Math.round(totalNetVolume * 100) / 100,
      shrinkage_factor: Math.round(shrinkageFactor * 100) / 100, // Already in percentage
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
   * Validate allocation inputs following methodology constraints
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

      // Update API gravity range to match broader industry standards
      // Original constraint was too narrow (10-36), expanding to 10-45 per methodology
      if (entry.api_gravity < 10 || entry.api_gravity > 45) {
        errors.push(
          `Entry ${index + 1}: API Gravity must be between 10 and 45°API`
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
        standard_conditions: {
          temperature: "60°F",
          pressure: "atmospheric",
        },
      },
      hash: this.generateHash({
        allocation,
        timestamp: timestamp.toISOString(),
        reconciliationId,
      }),
    };
  }
}