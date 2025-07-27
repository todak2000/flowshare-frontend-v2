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
  Activity,
  Zap,
  Eye,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { COLORS } from "../../../../component/Home";
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
interface SummaryCardProps {
  title: string;
  value: number | string;
  unit?: string;
  color: "blue" | "green" | "orange" | "purple" | "red";
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  unit = "",
  color,
  icon: Icon,
  trend,
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

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm border rounded-2xl p-6 transition-all duration-300 hover:scale-105`}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center ${iconColors[color]}`}
        >
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div
            className={`flex items-center space-x-1 text-sm ${
              trend.isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            <TrendingUp
              className={`w-4 h-4 ${trend.isPositive ? "" : "rotate-180"}`}
            />
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className={`text-sm ${COLORS.text.muted}`}>{title}</p>
        <p className={`text-2xl font-bold ${COLORS.text.primary}`}>
          {typeof value === "number" ? value.toLocaleString() : value}
          {unit}
        </p>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  color,
}) => (
  <div className="text-center">
    <div className={`text-3xl font-bold ${color} mb-2`}>{value}</div>
    <div className={`text-lg font-semibold ${COLORS.text.primary} mb-1`}>
      {title}
    </div>
    <div className={`text-sm ${COLORS.text.muted}`}>{description}</div>
  </div>
);

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

const TrendChart: React.FC<TrendChartProps> = ({ data, title }) => (
  <div
    className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-2xl p-6`}
  >
    <div className="flex items-center space-x-3 mb-6">
      <TrendingUp className={`w-5 h-5 ${COLORS.primary.blue[400]}`} />
      <h3 className={`text-lg font-semibold ${COLORS.text.primary}`}>
        {title}
      </h3>
    </div>
    {data.length > 0 ? (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              color: "#fff",
            }}
            formatter={(value: number, name: string) => [
              `${value.toLocaleString()} BBL`,
              name === "allocatedVolume"
                ? "Allocated"
                : name === "inputVolume"
                ? "Input"
                : "Loss",
            ]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="allocatedVolume"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
            name="Allocated Volume"
          />
          <Line
            type="monotone"
            dataKey="inputVolume"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
            name="Input Volume"
          />
          <Line
            type="monotone"
            dataKey="volumeLoss"
            stroke="#f59e0b"
            strokeWidth={3}
            dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
            name="Volume Loss"
          />
        </LineChart>
      </ResponsiveContainer>
    ) : (
      <div className="h-72 flex items-center justify-center">
        <div className={`text-center ${COLORS.text.muted}`}>
          <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No trend data available</p>
        </div>
      </div>
    )}
  </div>
);

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
      {data.length > 0 ? (
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
    const monthKey = `${(allocation.timestamp as Date)
      //   .toDate()
      .getFullYear()}-${((allocation.timestamp as Date).getMonth() + 1)
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

  // Calculate additional metrics
  const allocationEfficiency = monthlyData
    ? (monthlyData.totalAllocatedVolume /
        Math.max(monthlyData.totalProductionInput, 1)) *
      100
    : 0;
  const lossPercentage = monthlyData
    ? (monthlyData.totalVolumeLoss /
        Math.max(monthlyData.totalProductionInput, 1)) *
      100
    : 0;

  // // Volume distribution data
  // const volumeData: VolumeDistribution[] = monthlyData ? [
  //   {
  //     name: "Allocated Volume",
  //     value: monthlyData.totalAllocatedVolume,
  //     color: "#3b82f6",
  //   },
  //   {
  //     name: "Volume Loss",
  //     value: monthlyData.totalVolumeLoss,
  //     color: "#f59e0b",
  //   },
  // ] : [];

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
            <div>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className={`w-6 h-6 ${COLORS.primary.blue[400]}`} />
              <h3 className={`text-lg font-semibold ${COLORS.text.primary}`}>
                Monthly Report
              </h3>
            </div>
            <div className="flex items-center space-x-4">
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
                trend={{ value: 8.5, isPositive: true }}
              />
              <SummaryCard
                title="Allocated Volume"
                value={monthlyData?.totalAllocatedVolume || 0}
                unit=" BBL"
                color="green"
                icon={Target}
                trend={{ value: 6.2, isPositive: true }}
              />
              <SummaryCard
                title="Volume Loss"
                value={monthlyData?.totalVolumeLoss || 0}
                unit=" BBL"
                color="red"
                icon={TrendingDown}
                trend={{ value: 2.1, isPositive: false }}
              />
              <SummaryCard
                title="Reconciliations"
                value={monthlyData?.allocationCount || 0}
                color="purple"
                icon={Database}
              />
            </div>

            {/* Key Metrics */}
            {monthlyData && (
              <div
                className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-2xl p-6 mb-8`}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <Activity className={`w-5 h-5 ${COLORS.primary.blue[400]}`} />
                  <h3
                    className={`text-lg font-semibold ${COLORS.text.primary}`}
                  >
                    Volume Analysis
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <MetricCard
                    title="Allocation Efficiency"
                    value={`${allocationEfficiency.toFixed(1)}%`}
                    description="Volume allocated vs input"
                    color="text-blue-400"
                  />
                  <MetricCard
                    title="Total Volume Loss"
                    value={monthlyData.totalVolumeLoss.toLocaleString()}
                    description="BBL lost in processing"
                    color="text-red-400"
                  />
                  <MetricCard
                    title="Loss Percentage"
                    value={`${lossPercentage.toFixed(1)}%`}
                    description="Percentage of total input"
                    color="text-orange-400"
                  />
                </div>
              </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <TrendChart
                data={chartData as ChartDataPoint[]}
                title="6-Month Volume Trend"
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
                  <button
                    onClick={handleExportResults}
                    className={`flex items-center space-x-2 px-4 py-2 ${COLORS.background.glass} backdrop-blur-sm ${COLORS.border.light} border rounded-xl ${COLORS.text.primary} hover:${COLORS.background.glassHover} transition-all duration-300`}
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
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

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleExportResults}
                disabled={!monthlyData?.allocations.length}
                className={`flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Download className="w-4 h-4" />
                <span>Export Allocation Results</span>
              </button>
              <button
                onClick={() => router.push("/production")}
                className={`flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} text-white rounded-xl hover:${COLORS.primary.blue[700]} hover:${COLORS.primary.purple[700]} transition-all duration-300 transform hover:scale-[1.02]`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>View Production Data</span>
              </button>
              <button
                onClick={() => router.push("/reconciliation")}
                className={`flex items-center justify-center space-x-2 px-6 py-3 ${COLORS.background.glass} backdrop-blur-sm ${COLORS.border.light} border rounded-xl ${COLORS.text.primary} hover:${COLORS.background.glassHover} transition-all duration-300`}
              >
                <Activity className="w-4 h-4" />
                <span>View Reconciliation History</span>
              </button>
            </div>

            {/* Performance Summary */}
            {monthlyData && (
              <div
                className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-2xl p-6 mt-8`}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <Zap className={`w-5 h-5 ${COLORS.primary.blue[400]}`} />
                  <h3
                    className={`text-lg font-semibold ${COLORS.text.primary}`}
                  >
                    Performance Summary
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 rounded-xl bg-white/5">
                    <div
                      className={`text-2xl font-bold ${COLORS.text.primary} mb-2`}
                    >
                      {(
                        (monthlyData.totalAllocatedVolume /
                          monthlyData.totalProductionInput) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                    <div className={`text-sm ${COLORS.text.muted}`}>
                      Overall Efficiency
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-white/5">
                    <div
                      className={`text-2xl font-bold ${COLORS.text.primary} mb-2`}
                    >
                      {(
                        monthlyData.totalVolumeLoss /
                        monthlyData.allocationCount
                      ).toFixed(0)}
                    </div>
                    <div className={`text-sm ${COLORS.text.muted}`}>
                      Avg Loss per Run (BBL)
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-white/5">
                    <div
                      className={`text-2xl font-bold ${COLORS.text.primary} mb-2`}
                    >
                      {(
                        monthlyData.totalAllocatedVolume /
                        monthlyData.allocationCount
                      ).toFixed(0)}
                    </div>
                    <div className={`text-sm ${COLORS.text.muted}`}>
                      Avg Allocation per Run (BBL)
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-white/5">
                    <div
                      className={`text-2xl font-bold ${COLORS.text.primary} mb-2`}
                    >
                      {(
                        monthlyData.allocations.reduce(
                          (sum, a) => sum + a.percentage,
                          0
                        ) / monthlyData.allocationCount
                      ).toFixed(1)}
                      %
                    </div>
                    <div className={`text-sm ${COLORS.text.muted}`}>
                      Avg Share Percentage
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default JVPartnerDashboard;
// /* eslint-disable @typescript-eslint/no-explicit-any */
// // src/app/dashboard/jv-partner/page.tsx
// "use client";
// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useUser } from "../../../../hook/useUser";
// import { firebaseService } from "../../../../lib/firebase-service";
// import {
//   AllocationResult,
//   MonthlyAllocationSummary,
//   ReconciliationRun,
// } from "../../../../types";
// import LoadingSpinner from "../../../../component/LoadingSpinner";
// import SummaryCard from "../../../../component/SummaryCard";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
// } from "recharts";
// import { formatDateForInput } from "../../../../utils/date";
// import { Timestamp } from "firebase/firestore";

// export default function JVPartnerDashboard() {
//   const { auth, data: userData, loading: userLoading } = useUser();
//   const router = useRouter();
//   const [monthlyData, setMonthlyData] =
//     useState<MonthlyAllocationSummary | null>(null);
// const [allocationResults, setAllocationResults] = useState<
//   AllocationResult[]
// >([]);
//   const [loading, setLoading] = useState(false);
//   const [selectedMonth, setSelectedMonth] = useState(() => {
//     const now = new Date();
//     return {
//       year: now.getFullYear(),
//       month: now.getMonth() + 1, // JavaScript months are 0-indexed
//     };
//   });
//   useEffect(() => {
//     if (!userLoading && !auth) {
//       router.push("/onboarding/login");
//       return;
//     }

//     // if (userData?.role !== 'jv_partner') {
//     //   router.push('/dashboard');
//     //   return;
//     // }

//     if (userData?.company) {
//       loadPartnerData();
//     }
//   }, [userLoading, auth, userData, router, selectedMonth]);

//   const loadPartnerData = async () => {
//     if (!userData?.company) return;

//     setLoading(true);
//     try {
//       // Get monthly summary for current/selected month
//       const monthly = await firebaseService.getMonthlyAllocationSummary(
//         userData.company,
//         selectedMonth.year,
//         selectedMonth.month
//       );
//       setMonthlyData(monthly);

//       // Get recent allocation results (last 6 months for trends)
//       const sixMonthsAgo = new Date();
//       sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

//       const allocations = await firebaseService.getPartnerAllocations(
//         userData.company,
//         sixMonthsAgo,
//         new Date()
//       );
//       setAllocationResults(allocations);
//     } catch (error) {
//       console.error("Error loading partner data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };
// const trendData = allocationResults.reduce((acc, allocation) => {
//   const monthKey = `${(allocation.timestamp as Date)
//     //   .toDate()
//     .getFullYear()}-${((allocation.timestamp as Date).getMonth() + 1)
//     .toString()
//     .padStart(2, "0")}`;

//   if (!acc[monthKey]) {
//     acc[monthKey] = {
//       month: monthKey,
//       allocatedVolume: 0,
//       inputVolume: 0,
//       volumeLoss: 0,
//       count: 0,
//     };
//   }

//   acc[monthKey].allocatedVolume += allocation.allocated_volume;
//   acc[monthKey].inputVolume += allocation.input_volume;
//   acc[monthKey].volumeLoss += allocation.volume_loss || 0;
//   acc[monthKey].count += 1;

//   return acc;
// }, {} as Record<string, any>);

// const chartData = Object.values(trendData)
//   .sort((a: any, b: any) => a.month.localeCompare(b.month))
//   .slice(-6); // Last 6 months

// // Volume distribution data
// const volumeData = monthlyData
//   ? [
//       {
//         name: "Allocated Volume",
//         value: monthlyData.totalAllocatedVolume,
//         color: "#8884d8",
//       },
//       {
//         name: "Volume Loss",
//         value: monthlyData.totalVolumeLoss,
//         color: "#ff7300",
//       },
//     ]
//   : [];

//   const handleMonthChange = (direction: "prev" | "next") => {
//     setSelectedMonth((prev) => {
//       const newDate = new Date(prev.year, prev.month - 1); // Convert to 0-indexed month
//       if (direction === "prev") {
//         newDate.setMonth(newDate.getMonth() - 1);
//       } else {
//         newDate.setMonth(newDate.getMonth() + 1);
//       }

//       return {
//         year: newDate.getFullYear(),
//         month: newDate.getMonth() + 1, // Convert back to 1-indexed month
//       };
//     });
//   };
//   if (userLoading) {
//     return <LoadingSpinner  message="Loading user data..." />;
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-7xl mx-auto p-6">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">
//             JV Partner Dashboard
//           </h1>
//           <p className="text-gray-600">
//             Welcome, {userData?.email} - {userData?.company}
//           </p>
//           <p className="text-sm text-gray-500 mt-1">
//             View your allocation results and verify revenue distribution
//           </p>
//         </div>

//         {/* Month Selector */}
//         <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
//           <div className="flex items-center justify-between">
//             <h3 className="text-lg font-semibold">Monthly Report</h3>
//             <div className="flex items-center space-x-4">
//               <button
//                 onClick={() => handleMonthChange("prev")}
//                 className="p-2 hover:bg-gray-100 rounded-md"
//               >
//                 ←
//               </button>
//               <span className="text-lg font-medium">
//                 {new Date(
//                   selectedMonth.year,
//                   selectedMonth.month - 1
//                 ).toLocaleDateString("en-US", {
//                   year: "numeric",
//                   month: "long",
//                 })}
//               </span>
//               <button
//                 onClick={() => handleMonthChange("next")}
//                 className="p-2 hover:bg-gray-100 rounded-md"
//                 disabled={
//                   selectedMonth.year === new Date().getFullYear() &&
//                   selectedMonth.month >= new Date().getMonth() + 1
//                 }
//               >
//                 →
//               </button>
//             </div>
//           </div>
//         </div>

//         {loading ? (
//           <LoadingSpinner message="Loading allocation data..." />
//         ) : (
//           <>
//             {/* Summary Cards */}
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//               <SummaryCard
//                 title="Total Input"
//                 value={monthlyData?.totalProductionInput || 0}
//                 color="blue"
//                 unit=" BBL"
//               />
//               <SummaryCard
//                 title="Allocated Volume"
//                 value={monthlyData?.totalAllocatedVolume || 0}
//                 color="green"
//                 unit=" BBL"
//               />
//               <SummaryCard
//                 title="Volume Loss"
//                 value={monthlyData?.totalVolumeLoss || 0}
//                 color="red"
//                 unit=" BBL"
//               />
//               <SummaryCard
//                 title="Reconciliations"
//                 value={monthlyData?.allocationCount || 0}
//                 color="purple"
//               />
//             </div>

//             {/* Key Metrics */}
//             {monthlyData && (
//               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
//                 <h3 className="text-lg font-semibold mb-4">Volume Analysis</h3>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                   <div className="text-center">
//                     <div className="text-2xl font-bold text-blue-600">
//                       {(
//                         (monthlyData.totalAllocatedVolume /
//                           Math.max(monthlyData.totalProductionInput, 1)) *
//                         100
//                       ).toFixed(1)}
//                       %
//                     </div>
//                     <div className="text-sm text-gray-600">
//                       Allocation Efficiency
//                     </div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-2xl font-bold text-red-600">
//                       {monthlyData.totalVolumeLoss.toLocaleString()}
//                     </div>
//                     <div className="text-sm text-gray-600">
//                       Total Volume Loss (BBL)
//                     </div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-2xl font-bold text-orange-600">
//                       {(
//                         (monthlyData.totalVolumeLoss /
//                           Math.max(monthlyData.totalProductionInput, 1)) *
//                         100
//                       ).toFixed(1)}
//                       %
//                     </div>
//                     <div className="text-sm text-gray-600">Loss Percentage</div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Charts Section */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//               {/* Volume Trend Chart */}
//               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
//                 <h3 className="text-lg font-semibold mb-4">
//                   6-Month Volume Trend
//                 </h3>
//                 {chartData.length > 0 ? (
//                   <ResponsiveContainer width="100%" height={300}>
//                     <LineChart data={chartData}>
//                       <CartesianGrid strokeDasharray="3 3" />
//                       <XAxis dataKey="month" />
//                       <YAxis />
//                       <Tooltip
//                         formatter={(value, name) => [
//                           `${value} BBL`,
//                           name === "allocatedVolume"
//                             ? "Allocated"
//                             : name === "inputVolume"
//                             ? "Input"
//                             : "Loss",
//                         ]}
//                       />
//                       <Line
//                         type="monotone"
//                         dataKey="allocatedVolume"
//                         stroke="#8884d8"
//                         strokeWidth={2}
//                         name="allocatedVolume"
//                       />
//                       <Line
//                         type="monotone"
//                         dataKey="inputVolume"
//                         stroke="#82ca9d"
//                         strokeWidth={2}
//                         name="inputVolume"
//                       />
//                       <Line
//                         type="monotone"
//                         dataKey="volumeLoss"
//                         stroke="#ff7300"
//                         strokeWidth={2}
//                         name="volumeLoss"
//                       />
//                     </LineChart>
//                   </ResponsiveContainer>
//                 ) : (
//                   <div className="h-300 flex items-center justify-center text-gray-500">
//                     No trend data available
//                   </div>
//                 )}
//               </div>

//               {/* Volume Distribution Pie Chart */}
//               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
//                 <h3 className="text-lg font-semibold mb-4">
//                   Current Month Distribution
//                 </h3>
//                 {volumeData.length > 0 ? (
//                   <ResponsiveContainer width="100%" height={300}>
//                     <PieChart>
//                       <Pie
//                         data={volumeData}
//                         cx="50%"
//                         cy="50%"
//                         labelLine={false}
//                         label={({ name, percent }) =>
//                           `${name} ${((percent as number) * 100).toFixed(1)}%`
//                         }
//                         outerRadius={80}
//                         fill="#8884d8"
//                         dataKey="value"
//                       >
//                         {volumeData.map((entry, index) => (
//                           <Cell key={`cell-${index}`} fill={entry.color} />
//                         ))}
//                       </Pie>
//                       <Tooltip
//                         formatter={(value) => [
//                           `${value.toLocaleString()} BBL`,
//                           "Volume",
//                         ]}
//                       />
//                     </PieChart>
//                   </ResponsiveContainer>
//                 ) : (
//                   <div className="h-300 flex items-center justify-center text-gray-500">
//                     No volume data for selected month
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Recent Allocations Table */}
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200">
//               <div className="p-6 border-b border-gray-200">
//                 <h3 className="text-lg font-semibold">
//                   Recent Allocation Results
//                 </h3>
//               </div>

//               <div className="overflow-x-auto">
//                 {loading ? (
//                   <div className="p-8 text-center">
//                     <LoadingSpinner message="Loading allocation results..." />
//                   </div>
//                 ) : monthlyData?.allocations.length === 0 ? (
//                   <div className="p-8 text-center text-gray-500">
//                     No allocation results found for the selected period.
//                   </div>
//                 ) : (
//                   <table className="w-full">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Date
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Input Volume (BBL)
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Volume Loss (BBL)
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Allocated Volume (BBL)
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Share (%)
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Reconciliation ID
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-200">
//                       {monthlyData?.allocations.map((result) => (
//                         <tr key={result.id} className="hover:bg-gray-50">
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
// {new Date(
//   result.timestamp as Date
// ).toLocaleDateString()}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                             {result.input_volume.toLocaleString()}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                             {result.volume_loss.toLocaleString()}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
//                             {result.allocated_volume.toLocaleString()}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                             {result.percentage.toFixed(2)}%
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
//                             {result.reconciliation_id.substring(0, 8)}...
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 )}
//               </div>
//             </div>

//             {/* Action Buttons */}
//             {/* <div className="mt-8 flex gap-4">
//               <button
//                 onClick={() => {
//                   const csv = allocationResults.map((result) => ({
//                     Date: new Date(
//                       (result.timestamp as Timestamp).toDate()
//                     ).toLocaleDateString(),

//                     "Input Volume (BBL)": result.input_volume,
//                     "Net Volume (BBL)": result.net_volume,
//                     "Allocated Volume (BBL)": result.allocated_volume,
//                     "Share (%)": result.percentage,
//                     "Reconciliation ID": result.reconciliation_id,
//                   }));

//                   const csvContent =
//                     "data:text/csv;charset=utf-8," +
//                     Object.keys(csv[0] || {}).join(",") +
//                     "\n" +
//                     csv.map((row) => Object.values(row).join(",")).join("\n");

//                   const encodedUri = encodeURI(csvContent);
//                   const link = document.createElement("a");
//                   link.setAttribute("href", encodedUri);
//                   link.setAttribute(
//                     "download",
//                     `allocation_results_${userData?.company}_${
//                       new Date().toISOString().split("T")[0]
//                     }.csv`
//                   );
//                   document.body.appendChild(link);
//                   link.click();
//                   document.body.removeChild(link);
//                 }}
//                 className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
//               >
//                 Export Results
//               </button>
//               <button
//                 onClick={() => router.push("/production")}
//                 className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
//               >
//                 View Production Data
//               </button>
//             </div> */}
//           </>
//         )}
//       </div>
//     </div>
//   );
// }
