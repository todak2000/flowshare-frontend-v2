import { TrendingUp } from "lucide-react";
import { COLORS } from "./Home";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartDataPoint } from "@/app/production/page";

interface ProductionChartProps {
  data: ChartDataPoint[];
  title: string;
}

export const ProductionChart: React.FC<ProductionChartProps> = ({ data, title }) => (
  <div className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-2xl p-6`}>
    <div className="flex items-center space-x-3 mb-6">
      <TrendingUp className={`w-5 h-5 ${COLORS.primary.blue[400]}`} />
      <h3 className={`text-lg font-semibold ${COLORS.text.primary}`}>{title}</h3>
    </div>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis 
          dataKey="date" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: '#fff'
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="volume"
          stroke="#3b82f6"
          strokeWidth={3}
          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);