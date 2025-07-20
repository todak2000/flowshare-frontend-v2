import React from "react";

interface SummaryCardProps {
  title: string;
  value: string | number;
  color: "blue" | "green" | "orange" | "purple" | "red";
  unit?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  color,
  unit = "",
}) => {
  const colorClasses = {
    blue: "text-blue-600",
    red: "text-red-600",
    green: "text-green-600",
    orange: "text-orange-600",
    purple: "text-purple-600",
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className={`text-3xl font-bold ${colorClasses[color]}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
        {unit}
      </p>
    </div>
  );
};
export default SummaryCard;
