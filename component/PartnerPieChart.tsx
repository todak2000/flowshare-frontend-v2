import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { PartnerDataItem } from "../types";

interface PartnerPieChartProps {
  data: PartnerDataItem[];
  title: string;
  colors: string[];
}

 const PartnerPieChart: React.FC<PartnerPieChartProps> = ({
  data,
  title,
  colors,
}) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          dataKey="volume"
          label={({ percent, partner }) =>
            `${partner} (${((percent as number) * 100).toFixed(0)}%)`
          }
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>
);
export default PartnerPieChart