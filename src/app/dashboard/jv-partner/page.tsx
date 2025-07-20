/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/dashboard/jv-partner/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../../../hook/useUser";
import { firebaseService } from "../../../../lib/firebase-service";
import {
  AllocationResult,
  MonthlyAllocationSummary,
  ReconciliationRun,
} from "../../../../types";
import LoadingSpinner from "../../../../component/LoadingSpinner";
import SummaryCard from "../../../../component/SummaryCard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatDateForInput } from "../../../../utils/date";
import { Timestamp } from "firebase/firestore";

export default function JVPartnerDashboard() {
  const { auth, data: userData, loading: userLoading } = useUser();
  const router = useRouter();
  const [monthlyData, setMonthlyData] =
    useState<MonthlyAllocationSummary | null>(null);
  const [allocationResults, setAllocationResults] = useState<
    AllocationResult[]
  >([]);
  const [loading, setLoading] = useState(false);
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

    // if (userData?.role !== 'jv_partner') {
    //   router.push('/dashboard');
    //   return;
    // }

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

  const handleMonthChange = (direction: "prev" | "next") => {
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
  if (userLoading) {
    return <LoadingSpinner fullScreen message="Loading user data..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            JV Partner Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome, {userData?.email} - {userData?.company}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            View your allocation results and verify revenue distribution
          </p>
        </div>

        {/* Month Selector */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Monthly Report</h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleMonthChange("prev")}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                ←
              </button>
              <span className="text-lg font-medium">
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
                className="p-2 hover:bg-gray-100 rounded-md"
                disabled={
                  selectedMonth.year === new Date().getFullYear() &&
                  selectedMonth.month >= new Date().getMonth() + 1
                }
              >
                →
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading allocation data..." />
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <SummaryCard
                title="Total Input"
                value={monthlyData?.totalProductionInput || 0}
                color="blue"
                unit=" BBL"
              />
              <SummaryCard
                title="Allocated Volume"
                value={monthlyData?.totalAllocatedVolume || 0}
                color="green"
                unit=" BBL"
              />
              <SummaryCard
                title="Volume Loss"
                value={monthlyData?.totalVolumeLoss || 0}
                color="red"
                unit=" BBL"
              />
              <SummaryCard
                title="Reconciliations"
                value={monthlyData?.allocationCount || 0}
                color="purple"
              />
            </div>

            {/* Key Metrics */}
            {monthlyData && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
                <h3 className="text-lg font-semibold mb-4">Volume Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {(
                        (monthlyData.totalAllocatedVolume /
                          Math.max(monthlyData.totalProductionInput, 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                    <div className="text-sm text-gray-600">
                      Allocation Efficiency
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {monthlyData.totalVolumeLoss.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      Total Volume Loss (BBL)
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {(
                        (monthlyData.totalVolumeLoss /
                          Math.max(monthlyData.totalProductionInput, 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                    <div className="text-sm text-gray-600">Loss Percentage</div>
                  </div>
                </div>
              </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Volume Trend Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">
                  6-Month Volume Trend
                </h3>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => [
                          `${value} BBL`,
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
                        stroke="#8884d8"
                        strokeWidth={2}
                        name="allocatedVolume"
                      />
                      <Line
                        type="monotone"
                        dataKey="inputVolume"
                        stroke="#82ca9d"
                        strokeWidth={2}
                        name="inputVolume"
                      />
                      <Line
                        type="monotone"
                        dataKey="volumeLoss"
                        stroke="#ff7300"
                        strokeWidth={2}
                        name="volumeLoss"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-300 flex items-center justify-center text-gray-500">
                    No trend data available
                  </div>
                )}
              </div>

              {/* Volume Distribution Pie Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">
                  Current Month Distribution
                </h3>
                {volumeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={volumeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${((percent as number) * 100).toFixed(1)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {volumeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          `${value.toLocaleString()} BBL`,
                          "Volume",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-300 flex items-center justify-center text-gray-500">
                    No volume data for selected month
                  </div>
                )}
              </div>
            </div>

            {/* Recent Allocations Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">
                  Recent Allocation Results
                </h3>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <LoadingSpinner message="Loading allocation results..." />
                  </div>
                ) : monthlyData?.allocations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No allocation results found for the selected period.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Input Volume (BBL)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Volume Loss (BBL)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Allocated Volume (BBL)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Share (%)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reconciliation ID
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {monthlyData?.allocations.map((result) => (
                        <tr key={result.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(
                              result.timestamp as Date
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {result.input_volume.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {result.volume_loss.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {result.allocated_volume.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {result.percentage.toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {result.reconciliation_id.substring(0, 8)}...
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => {
                  const csv = allocationResults.map((result) => ({
                    Date: new Date(
                      (result.timestamp as Timestamp).toDate()
                    ).toLocaleDateString(),

                    "Input Volume (BBL)": result.input_volume,
                    "Net Volume (BBL)": result.net_volume,
                    "Allocated Volume (BBL)": result.allocated_volume,
                    "Share (%)": result.percentage,
                    "Reconciliation ID": result.reconciliation_id,
                  }));

                  const csvContent =
                    "data:text/csv;charset=utf-8," +
                    Object.keys(csv[0] || {}).join(",") +
                    "\n" +
                    csv.map((row) => Object.values(row).join(",")).join("\n");

                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute(
                    "download",
                    `allocation_results_${userData?.company}_${
                      new Date().toISOString().split("T")[0]
                    }.csv`
                  );
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Export Results
              </button>
              <button
                onClick={() => router.push("/production")}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                View Production Data
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
