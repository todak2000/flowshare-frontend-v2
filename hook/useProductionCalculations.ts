import { useMemo } from "react";
import { ProductionEntry } from "../types";
import { ChartDataPoint, PartnerData } from "@/app/production/page";

export const useProductionCalculations = (
  filteredData: ProductionEntry[]
) => {
  const calculations = useMemo(() => {
    // Summary calculations
    const totalVolume = filteredData.reduce(
      (sum, item) => sum + item.gross_volume_bbl,
      0
    );
    const averageBSW =
      filteredData.length === 0
        ? 0
        : filteredData.reduce((sum, item) => sum + item.bsw_percent, 0) /
          filteredData.length;
    const averageGravity =
      filteredData.length === 0
        ? 0
        : filteredData.reduce((sum, item) => sum + item.api_gravity, 0) /
          filteredData.length;
    const averageTemperature =
      filteredData.length === 0
        ? 0
        : Math.round(
            filteredData.reduce((sum, item) => sum + item.temperature_degF, 0) /
              filteredData.length
          );

    // Chart data
    const chartData = filteredData.reduce((acc: ChartDataPoint[], entry) => {
      const date = new Date(entry.timestamp).toLocaleDateString();
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.volume += entry.gross_volume_bbl;
        existing.entries += 1;
      } else {
        acc.push({
          date,
          volume: entry.gross_volume_bbl,
          entries: 1
        });
      }
      return acc;
    }, []);
    
    // Partner data
    const partnerData= Object.values(
      filteredData.reduce((acc: Record<string, PartnerData>, entry) => {
        if (!acc[entry.partner]) {
          acc[entry.partner] = {
            partner: entry.partner,
            volume: 0,
            percentage: 0
          };
        }
        acc[entry.partner].volume += entry.gross_volume_bbl;
        return acc;
      }, {})
    ).map(partner => ({
      ...partner,
      percentage: Math.round((partner.volume / filteredData.reduce((sum, entry) => sum + entry.gross_volume_bbl, 0)) * 100)
    }))
    return {
      totalVolume,
      averageBSW,
      averageGravity,
      averageTemperature,
      chartData,
      partnerData,
    };
  }, [filteredData]);
  return calculations;
};
