/* eslint-disable @typescript-eslint/no-explicit-any */
import { memo } from "react";
import { PartnerData } from "@/app/production/page";
import { PieChart } from "lucide-react";
import { COLORS } from "./Home";
import { Cell, ResponsiveContainer, Tooltip, PieChart as RechartsPieChart, Pie } from "recharts";

interface PartnerPieChartProps {
  data: PartnerData[];
  title: string;
  colors: string[];
}

export const PartnerPieChart = memo<PartnerPieChartProps>(function PartnerPieChart({ data, title, colors }) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl p-3 text-white">
          <p className="font-medium">{data.partner}</p>
          <p className="text-sm text-gray-300">
            Volume: {data.volume.toLocaleString()} BBL
          </p>
          <p className="text-sm text-gray-300">
            Share: {data.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-2xl p-6`}>
      <div className="flex items-center space-x-3 mb-6">
        <PieChart className={`w-5 h-5 ${COLORS.primary.blue[400]}`} />
        <h3 className={`text-lg font-semibold ${COLORS.text.primary}`}>{title}</h3>
      </div>
      
      {data.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pie Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                  dataKey="volume"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colors[index % colors.length]}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="space-y-3 flex flex-col justify-center">
            {data.map((partner, index) => (
              <div key={partner.partner} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  ></div>
                  <span className={`text-sm ${COLORS.text.primary}`}>{partner.partner}</span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${COLORS.text.primary}`}>
                    {partner.volume.toLocaleString()} BBL
                  </div>
                  <div className={`text-xs ${COLORS.text.muted}`}>
                    {partner.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center">
          <div className={`text-center ${COLORS.text.muted}`}>
            <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No data available</p>
            <p className="text-xs mt-1">Add production entries to see distribution</p>
          </div>
        </div>
      )}
    </div>
  );
});