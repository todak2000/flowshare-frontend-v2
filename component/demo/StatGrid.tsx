// components/StatGrid.tsx
import React from "react";
import { CheckCircle } from "lucide-react";
import { GenerationStats } from "../../types";

interface StatGridProps {
  stats: GenerationStats;
}

export const StatGrid: React.FC<StatGridProps> = ({ stats }) => (
  <>
    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
      <CheckCircle className="text-green-500 mr-2" size={20} />
      Generation Summary
    </h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <StatCard label="Total Entries" value={stats.totalEntries} color="green" />
      <StatCard label="Successful" value={stats.successfulEntries} color="blue" />
      <StatCard label="Partners" value={stats.partners} color="purple" />
      <StatCard label="Months" value={stats.months} color="orange" />
    </div>
    <div className="text-sm text-slate-600 text-center">
      Data period: {stats.startDate} to {stats.endDate}
    </div>
  </>
);

interface StatCardProps {
  label: string;
  value: number;
  color: "green" | "blue" | "purple" | "orange";
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => {
  const colorClasses = {
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <div className="text-center p-3 rounded-lg bg-opacity-80" style={{ backgroundColor: colorClasses[color].split(' ')[0] + '1A' }}>
      <div className="text-2xl font-bold" style={{ color: colorClasses[color].split(' ')[1] }}>
        {value}
      </div>
      <div className="text-sm text-slate-600">{label}</div>
    </div>
  );
};