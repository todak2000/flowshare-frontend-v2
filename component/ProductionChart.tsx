/* eslint-disable @typescript-eslint/no-explicit-any */
import { memo } from "react";
import { TrendingUp } from "lucide-react";
import { COLORS } from "./Home";
import { CartesianGrid,  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartDataPoint } from "@/app/production/page";

interface ProductionChartProps {
  data: ChartDataPoint[];
  title: string;
}

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  
  // Add ordinal suffix
  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  // return `${day}${getOrdinalSuffix(day)} ${month}`;
  return `${day}${getOrdinalSuffix(day)}`;
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const volume = payload[0].value;
    const volumeInMbbl = (volume / 1000).toFixed(2);
    
    return (
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: '#fff',
        padding: '12px',
        fontSize: '14px'
      }}>
        <p style={{ margin: 0, marginBottom: '4px', fontWeight: 'bold' }}>
          {formatDate(label)}
        </p>
        <p style={{ margin: 0, color: '#3b82f6' }}>
          Volume: {volumeInMbbl} mbbl
        </p>
      </div>
    );
  }
  return null;
};

// Custom tick formatter for X-axis
const formatXAxisTick = (tickItem: string) => {
  return formatDate(tickItem);
};

// Custom tick formatter for Y-axis (convert to mbbl)
const formatYAxisTick = (tickItem: number) => {
  return `${(tickItem / 1000).toFixed(1)}`;
};

export const ProductionChart = memo(
  function ProductionChart({ data, title }: ProductionChartProps) {
    // Sort data by date to ensure correct chronological order (earliest first)
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <div className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-2xl p-6`}>
        <div className="flex items-center space-x-3 mb-6">
          <TrendingUp className={`w-5 h-5 ${COLORS.primary.blue[400]}`} />
          <h3 className={`text-lg font-semibold ${COLORS.text.primary}`}>{title}</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={formatXAxisTick}
              interval="preserveStartEnd" // Show first and last ticks
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={formatYAxisTick}
              label={{
                value: 'mbbl',
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: '12px' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />

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
  },
  // Custom comparison function
  (prevProps, nextProps) => {
    return (
      prevProps.data.length === nextProps.data.length &&
      prevProps.title === nextProps.title &&
      prevProps.data.every((item, index) =>
        item.date === nextProps.data[index]?.date &&
        item.volume === nextProps.data[index]?.volume
      )
    );
  }
);
