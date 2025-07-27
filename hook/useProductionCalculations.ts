import { useMemo } from "react";
import { ProductionEntry, ChartDataItem, PartnerDataItem } from "../types";
import { ChartDataPoint, PartnerData } from "@/app/production/page";

export const useProductionCalculations = (
  filteredData: ProductionEntry[],
  totalData: ProductionEntry[]
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
    // const dailyData = filteredData.reduce<Record<string, ChartDataItem>>(
    //   (acc, item) => {
    //     const date =
    //       item.timestamp instanceof Date
    //         ? item.timestamp.toLocaleDateString()
    //         : new Date(item.timestamp).toLocaleDateString();

    //     if (!acc[date]) {
    //       acc[date] = { date, totalVolume: 0, count: 0 };
    //     }
    //     acc[date].totalVolume += item.gross_volume_bbl;
    //     acc[date].count += 1;
    //     return acc;
    //   },
    //   {}
    // );

    // const chartData = Object.values(dailyData).sort(
    //   (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    // );

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
  
    // const partners = totalData.reduce<Record<string, PartnerDataItem>>(
    //   (acc, item) => {
    //     if (!acc[item.partner]) {
    //       acc[item.partner] = { partner: item.partner, volume: 0 };
    //     }
    //     acc[item.partner].volume += item.gross_volume_bbl;
    //     return acc;
    //   },
    //   {}
    // );

    // const partnerData = Object.values(partners);

    return {
      totalVolume,
      averageBSW,
      averageTemperature,
      chartData,
      partnerData,
    };
  }, [filteredData, totalData]);
  return calculations;
};
