import React from 'react';
import { SummaryCard } from '../../../../component/cards/SummaryCard';
import { BarChart3, Droplets, Thermometer, Database } from 'lucide-react';
import { formatVolume } from '../../../../utils/formatVolume';

interface ProductionStatsProps {
  totalVolume: number;
  averageBSW: number;
  averageTemperature: number;
  averageGravity: number;
}

/**
 * ProductionStats Component
 * Displays summary statistics for production data
 * Shows total volume, average BSW, average temperature, and average API gravity
 */
export const ProductionStats: React.FC<ProductionStatsProps> = ({
  totalVolume,
  averageBSW,
  averageTemperature,
  averageGravity,
}) => {
  const formattedVolume = formatVolume(totalVolume);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <SummaryCard
        title="Total Volume"
        value={formattedVolume.value}
        unit={formattedVolume.unit}
        color="blue"
        icon={BarChart3}
        aria-label={`Total production volume: ${formattedVolume.value} ${formattedVolume.unit}`}
      />
      <SummaryCard
        title="Avg BSW"
        value={averageBSW.toFixed(2)}
        color="green"
        unit="%"
        icon={Droplets}
        aria-label={`Average BSW: ${averageBSW.toFixed(2)} percent`}
      />
      <SummaryCard
        title="Avg Temperature"
        value={averageTemperature}
        color="orange"
        unit="°F"
        icon={Thermometer}
        aria-label={`Average temperature: ${averageTemperature} degrees Fahrenheit`}
      />
      <SummaryCard
        title="Average API Gravity"
        value={averageGravity.toFixed(0)}
        unit="°API"
        color="purple"
        icon={Database}
        aria-label={`Average API gravity: ${averageGravity.toFixed(0)} degrees API`}
      />
    </div>
  );
};
