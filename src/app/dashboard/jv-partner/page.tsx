/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  Target,
  Database,
  FileText,
  Eye,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { COLORS } from "../../../../component/Home";
import SummaryCard from "../../../../component/cards/SummaryCard";
import { ChartDataPoint } from "@/app/production/page";
import { firebaseService } from "../../../../lib/firebase-service";
import { useUser } from "../../../../hook/useUser";
import { AllocationResult, MonthlyAllocationSummary } from "../../../../types";

interface VolumeDistribution {
  name: string;
  value: number;
  color: string;
}

const exportCSV = (data: AllocationResult[], company: string): void => {
  const csv = data.map((result) => ({
    Date: new Date(result.timestamp as Date).toLocaleDateString(),
    "Input Volume (BBL)": result.input_volume,
    "Net Volume (BBL)": result.net_volume,
    "Allocated Volume (BBL)": result.allocated_volume,
    "Volume Loss (BBL)": result.volume_loss,
    "Share (%)": result.percentage,
    "Reconciliation ID": result.reconciliation_id,
  }));

  const csvContent = [
    Object.keys(csv[0] || {}).join(","),
    ...csv.map((row) => Object.values(row).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `allocation_results_${company}_${
    new Date().toISOString().split("T")[0]
  }.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Reusable Components
const LoadingSpinner: React.FC<{ message?: string }> = ({
  message = "Loading...",
}) => (
  <div className="flex items-center justify-center space-x-3">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
    <span className={COLORS.text.secondary}>{message}</span>
  </div>
);

// Chart Components
interface TrendChartProps {
  data: ChartDataPoint[];
  title: string;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, title }) => {
  // Helper function to format Y-axis values to MBBL
  const formatYAxisValue = (value: number) => {
    const mbblValue = value / 1000;
    return mbblValue >= 1000
      ? `${(mbblValue / 1000).toFixed(1)}`
      : mbblValue.toFixed(1);
  };

  // Helper function to format month from various date formats
  const formatMonth = (dateValue: string | Date) => {
    try {
      let date: Date;

      if (typeof dateValue === "string") {
        // Handle various string formats
        if (dateValue.includes("-")) {
          // Handle YYYY-MM-DD or YYYY-MM format
          date = new Date(dateValue);
        } else if (dateValue.length === 6) {
          // Handle YYYYMM format
          const year = dateValue.substring(0, 4);
          const month = dateValue.substring(4, 6);
          date = new Date(`${year}-${month}-01`);
        } else {
          date = new Date(dateValue);
        }
      } else {
        date = new Date(dateValue);
      }

      // Return short month format (Jan, Feb, etc.)
      return date.toLocaleDateString("en-US", { month: "short" });
    } catch (error) {
      // Fallback: return original value if parsing fails
      return dateValue.toString().substring(0, 3);
    }
  };

  // Process data to ensure proper month formatting
  const processedData = data.map((item: any) => ({
    ...item,
    displayMonth: formatMonth(item.month),
    // Keep original month for tooltip
    originalMonth: item.month,
  }));

  return (
    <div
      className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-2xl p-6`}
    >
      <div className="flex items-center space-x-3 mb-6">
        <TrendingUp className={`w-5 h-5 ${COLORS.primary.blue[400]}`} />
        <h3 className={`text-lg font-semibold ${COLORS.text.primary}`}>
          {title}
        </h3>
      </div>

      {processedData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={processedData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis
              dataKey="displayMonth"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              interval="preserveStartEnd"
              minTickGap={20}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              tickFormatter={formatYAxisValue}
              label={{
                value: "Volume (MBBL)",
                angle: -90,
                position: "insideLeft",
                style: {
                  textAnchor: "middle",
                  fill: "#9CA3AF",
                  fontSize: "12px",
                },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                color: "#fff",
              }}
              labelFormatter={(label, payload) => {
                // Show original month in tooltip for better context
                const originalMonth = payload?.[0]?.payload?.originalMonth;
                return originalMonth
                  ? `Month: ${formatMonth(originalMonth)}`
                  : `Month: ${label}`;
              }}
              formatter={(value: number, name: string) => [
                `${(value / 1000).toFixed(2)} MBBL`,
                name === "allocatedVolume"
                  ? "Allocated"
                  : name === "inputVolume"
                  ? "Input"
                  : "Loss",
              ]}
            />
          
            <Line
              type="monotone"
              dataKey="allocatedVolume"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
              name="allocatedVolume"
            />
            <Line
              type="monotone"
              dataKey="inputVolume"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
              name="inputVolume"
            />
            <Line
              type="monotone"
              dataKey="volumeLoss"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#f59e0b", strokeWidth: 2 }}
              name="volumeLoss"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-72 flex items-center justify-center">
          <div className={`text-center ${COLORS.text.muted}`}>
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No trend data available</p>
            <p className="text-sm mt-1">Data will appear here once available</p>
          </div>
        </div>
      )}
    </div>
  );
};

interface DistributionChartProps {
  data: VolumeDistribution[];
  title: string;
}

const DistributionChart: React.FC<DistributionChartProps> = ({
  data,
  title,
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl p-3 text-white">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-300">
            Volume: {data.value.toLocaleString()} BBL
          </p>
        </div>
      );
    }
    return null;
  };
  const isAllocatedVolumePositive = data.some(
    (item) => item.name === "Allocated Volume" && item.value > 0
  );
  return (
    <div
      className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-2xl p-6`}
    >
      <div className="flex items-center space-x-3 mb-6">
        <PieChart className={`w-5 h-5 ${COLORS.primary.blue[400]}`} />
        <h3 className={`text-lg font-semibold ${COLORS.text.primary}`}>
          {title}
        </h3>
      </div>

      {data.length > 0 && isAllocatedVolumePositive ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 flex flex-col justify-center">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className={`text-sm ${COLORS.text.primary}`}>
                    {item.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${COLORS.text.primary}`}>
                    {item.value.toLocaleString()} BBL
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
            <p>No volume data available</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Main JV Partner Dashboard Component
const JVPartnerDashboard: React.FC = () => {
  const router = useRouter();
  const { auth, data: userData, loading: userLoading } = useUser();
  const [monthlyData, setMonthlyData] =
    useState<MonthlyAllocationSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [allocationResults, setAllocationResults] = useState<
    AllocationResult[]
  >([]);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1, // JavaScript months are 0-indexed
    };
  });

  useEffect(() => {
    if (!userLoading && !auth) {
      router.push("/onboarding/login");
      return;
    }

    if (userData?.company) {
      loadPartnerData();
    }
  }, [userLoading, auth, userData, router, selectedMonth]);

  const loadPartnerData = async () => {
    if (!userData?.company) return;

    setLoading(true);
    try {
      // Get monthly summary for current/selected month
      const monthly = await firebaseService.getMonthlyAllocationSummary(
        userData.company,
        selectedMonth.year,
        selectedMonth.month
      );
      setMonthlyData(monthly);

      // Get recent allocation results (last 6 months for trends)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const allocations = await firebaseService.getPartnerAllocations(
        userData.company,
        sixMonthsAgo,
        new Date()
      );
      setAllocationResults(allocations);
    } catch (error) {
      console.error("Error loading partner data:", error);
    } finally {
      setLoading(false);
    }
  };

  const trendData = allocationResults.reduce((acc, allocation) => {
    const monthKey = `${(allocation.timestamp as Date).getFullYear()}-${(
      (allocation.timestamp as Date).getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}`;

    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        allocatedVolume: 0,
        inputVolume: 0,
        volumeLoss: 0,
        count: 0,
      };
    }

    acc[monthKey].allocatedVolume += allocation.allocated_volume;
    acc[monthKey].inputVolume += allocation.input_volume;
    acc[monthKey].volumeLoss += allocation.volume_loss || 0;
    acc[monthKey].count += 1;

    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.values(trendData)
    .sort((a: any, b: any) => a.month.localeCompare(b.month))
    .slice(-6); // Last 6 months

  // Volume distribution data
  const volumeData = monthlyData
    ? [
        {
          name: "Allocated Volume",
          value: monthlyData.totalAllocatedVolume,
          color: "#8884d8",
        },
        {
          name: "Volume Loss",
          value: monthlyData.totalVolumeLoss,
          color: "#ff7300",
        },
      ]
    : [];
  const handleMonthChange = (direction: "prev" | "next"): void => {
    setSelectedMonth((prev) => {
      const newDate = new Date(prev.year, prev.month - 1); // Convert to 0-indexed month
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }

      return {
        year: newDate.getFullYear(),
        month: newDate.getMonth() + 1, // Convert back to 1-indexed month
      };
    });
  };

  const handleExportResults = (): void => {
    if (monthlyData?.allocations) {
      exportCSV(monthlyData.allocations, userData?.company as string);
    }
  };

  const isCurrentOrFutureMonth =
    selectedMonth.year === new Date().getFullYear() &&
    selectedMonth.month >= new Date().getMonth() + 1;

  return (
    <div className={`min-h-screen ${COLORS.background.gradient} pt-20`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} flex items-center justify-center`}
            >
              <Target className="w-8 h-8 text-white" />
            </div>
            <div className="w-[60%] md:w-auto">
              <p className={`${COLORS.text.secondary} flex flex-col`}>
                <span>Welcome, {userData?.email as string}</span>
                {/* <span>{userData?.company as string}</span> */}
              </p>
              <p className={`text-sm ${COLORS.text.muted} mt-1`}>
                View your allocation results and verify revenue distribution
              </p>
            </div>
          </div>
        </div>

        {/* Month Selector */}
        <div
          className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-2xl p-6 mb-8`}
        >
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className={`w-6 h-6 ${COLORS.primary.blue[400]}`} />
              <h3 className={`text-lg font-semibold ${COLORS.text.primary}`}>
                Monthly Report
              </h3>
            </div>
            <div className="flex items-center md:space-x-4">
              <button
                onClick={() => handleMonthChange("prev")}
                className={`p-2 rounded-xl ${COLORS.background.glass} hover:${COLORS.background.glassHover} transition-colors ${COLORS.border.light} border`}
              >
                <ChevronLeft className={`w-5 h-5 ${COLORS.text.primary}`} />
              </button>
              <span
                className={`text-lg font-medium ${COLORS.text.primary} min-w-[180px] text-center`}
              >
                {new Date(
                  selectedMonth.year,
                  selectedMonth.month - 1
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                })}
              </span>
              <button
                onClick={() => handleMonthChange("next")}
                disabled={isCurrentOrFutureMonth}
                className={`p-2 rounded-xl ${COLORS.background.glass} hover:${COLORS.background.glassHover} transition-colors ${COLORS.border.light} border disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <ChevronRight className={`w-5 h-5 ${COLORS.text.primary}`} />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12">
            <LoadingSpinner message="Loading allocation data..." />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <SummaryCard
                title="Total Input"
                value={monthlyData?.totalProductionInput || 0}
                unit=" BBL"
                color="blue"
                icon={BarChart3}
                // trend={{ value: 8.5, isPositive: true }}
              />
              <SummaryCard
                title="Allocated Volume"
                value={monthlyData?.totalAllocatedVolume || 0}
                unit=" BBL"
                color="green"
                icon={Target}
                // trend={{ value: 6.2, isPositive: true }}
              />
              <SummaryCard
                title="Volume Loss"
                value={monthlyData?.totalVolumeLoss || 0}
                unit=" BBL"
                color="red"
                icon={TrendingDown}
                // trend={{ value: 2.1, isPositive: false }}
              />
              <SummaryCard
                title="Reconciliations"
                value={monthlyData?.allocationCount || 0}
                color="purple"
                icon={Database}
              />
            </div>
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <TrendChart
                data={chartData as ChartDataPoint[]}
                title="6-Month Back Allocated Volume Trend"
              />
              <DistributionChart
                data={volumeData}
                title="Current Month Distribution"
              />
            </div>

            {/* Recent Allocations Table */}
            <div
              className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-2xl overflow-hidden mb-8`}
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText
                      className={`w-5 h-5 ${COLORS.primary.blue[400]}`}
                    />
                    <h3
                      className={`text-lg font-semibold ${COLORS.text.primary}`}
                    >
                      Recent Allocation Results
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${COLORS.background.glassHover} ${COLORS.text.secondary}`}
                    >
                      {monthlyData?.allocations.length || 0} entries
                    </span>
                  </div>
                  {userData?.role === "admin" ? (
                    <button
                      onClick={handleExportResults}
                      className={`flex items-center space-x-2 px-4 py-2 ${COLORS.background.glass} backdrop-blur-sm ${COLORS.border.light} border rounded-xl ${COLORS.text.primary} hover:${COLORS.background.glassHover} transition-all duration-300`}
                    >
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </button>
                  ) : (
                    ""
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <LoadingSpinner message="Loading allocation results..." />
                  </div>
                ) : !monthlyData?.allocations.length ? (
                  <div className="p-8 text-center">
                    <FileText
                      className={`w-16 h-16 ${COLORS.text.muted} mx-auto mb-4 opacity-50`}
                    />
                    <p className={`text-lg ${COLORS.text.secondary} mb-2`}>
                      No allocation results found
                    </p>
                    <p className={`${COLORS.text.muted}`}>
                      No data available for the selected period
                    </p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className={`${COLORS.background.overlay}`}>
                      <tr>
                        <th
                          className={`px-6 py-4 text-left text-xs font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                        >
                          Date
                        </th>
                        <th
                          className={`px-6 py-4 text-left text-xs font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                        >
                          Input Volume
                        </th>
                        <th
                          className={`px-6 py-4 text-left text-xs font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                        >
                          Allocated Volume
                        </th>
                        <th
                          className={`px-6 py-4 text-left text-xs font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                        >
                          Share
                        </th>
                        <th
                          className={`px-6 py-4 text-left text-xs font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                        >
                          Volume Loss/Gain
                        </th>
                        <th
                          className={`px-6 py-4 text-left text-xs font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                        >
                          Efficiency
                        </th>
                        <th
                          className={`px-6 py-4 text-left text-xs font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                        >
                          Reconciliation ID
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {monthlyData.allocations.map((result) => {
                        const efficiency =
                          (result.allocated_volume /
                            Math.max(result.input_volume, 1)) *
                          100;
                        return (
                          <tr
                            key={result.id}
                            className="hover:bg-white/5 transition-colors"
                          >
                            <td
                              className={`px-6 py-4 whitespace-nowrap ${COLORS.text.primary}`}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {new Date(
                                    result.timestamp as Date
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </td>
                            <td
                              className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.text.primary}`}
                            >
                              {result.input_volume.toLocaleString()} bbl
                            </td>

                            <td
                              className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400`}
                            >
                              {result.allocated_volume.toLocaleString()} bbl
                            </td>
                            <td
                              className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.text.primary}`}
                            >
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                                {result.percentage.toFixed(2)}%
                              </span>
                            </td>
                            <td
                              className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                                result.volume_loss < 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {(result.volume_loss < 0
                                ? -result.volume_loss
                                : result.volume_loss || 0
                              ).toLocaleString()}{" "}
                              bbl
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  efficiency >= 95
                                    ? "bg-green-500/20 text-green-400"
                                    : efficiency >= 90
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {efficiency.toFixed(1)}%
                              </span>
                            </td>
                            <td
                              className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.text.muted} font-mono`}
                            >
                              <div className="flex items-center space-x-2">
                                <span>
                                  {result.reconciliation_id.substring(0, 8)}...
                                </span>
                                <button
                                  onClick={() => {
                                    /* View reconciliation details */
                                  }}
                                  className="p-1 rounded hover:bg-blue-500/20 text-blue-400 transition-colors"
                                  title="View details"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default JVPartnerDashboard;
