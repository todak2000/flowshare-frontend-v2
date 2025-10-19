import React from 'react';
import { TrendingUp } from 'lucide-react';
import { COLORS } from '../Home';

export interface SummaryCardProps {
  title: string;
  value: number | string;
  unit?: string;
  color: "blue" | "green" | "orange" | "purple" | "red";
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  'aria-label'?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  unit = "",
  color,
  icon: Icon,
  trend,
  'aria-label': ariaLabel,
}) => {
  const colorClasses = {
    blue: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
    green: "from-green-500/20 to-emerald-500/20 border-green-500/30",
    orange: "from-orange-500/20 to-yellow-500/20 border-orange-500/30",
    purple: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
    red: "from-red-500/20 to-rose-500/20 border-red-500/30",
  };

  const iconColors = {
    blue: "text-blue-400",
    green: "text-green-400",
    orange: "text-orange-400",
    purple: "text-purple-400",
    red: "text-red-400",
  };

  const formattedValue = typeof value === "number" ? value.toLocaleString() : value;
  const displayValue = `${formattedValue}${unit}`;

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm border rounded-2xl p-6 transition-all duration-300 hover:scale-105`}
      role="region"
      aria-label={ariaLabel || `${title}: ${displayValue}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center ${iconColors[color]}`}
          aria-hidden="true"
        >
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div
            className={`flex items-center space-x-1 text-sm ${
              trend.isPositive ? "text-green-400" : "text-red-400"
            }`}
            role="status"
            aria-label={`Trend: ${trend.isPositive ? 'up' : 'down'} ${Math.abs(trend.value)} percent`}
          >
            <TrendingUp
              className={`w-4 h-4 ${trend.isPositive ? "" : "rotate-180"}`}
              aria-hidden="true"
            />
            <span aria-hidden="true">{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className={`text-sm ${COLORS.text.muted}`} id={`${title}-label`}>
          {title}
        </p>
        <p
          className={`text-2xl font-bold ${COLORS.text.primary}`}
          aria-labelledby={`${title}-label`}
        >
          {displayValue}
        </p>
      </div>
    </div>
  );
};

export default SummaryCard;
