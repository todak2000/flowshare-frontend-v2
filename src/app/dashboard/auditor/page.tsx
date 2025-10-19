/* eslint-disable react-hooks/exhaustive-deps */
// src/app/dashboard/auditor/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../../../hook/useUser";
import { useDateFilter } from "../../../../hook/useDateFilter";
import { firebaseService } from "../../../../lib/firebase-service";
import {
  AuditLog,
  ProductionEntry,
  TerminalReceipt,
  ReconciliationRun,
  AllocationResult,
} from "../../../../types";
import LoadingSpinner from "../../../../component/LoadingSpinner";
import SummaryCard from "../../../../component/cards/SummaryCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity, Users, Database, CheckCircle } from "lucide-react";

export default function AuditorDashboard() {
  const { auth, data: userData, loading: userLoading } = useUser();
  const router = useRouter();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [productionEntries, setProductionEntries] = useState<ProductionEntry[]>(
    []
  );
  const [terminalReceipts, setTerminalReceipts] = useState<TerminalReceipt[]>(
    []
  );
  const [reconciliationRuns, setReconciliationRuns] = useState<
    ReconciliationRun[]
  >([]);
  const [allocationResults, setAllocationResults] = useState<
    AllocationResult[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "audit-logs" | "data-integrity" | "reconciliation"
  >("overview");
  const { dateFilter, updateStartDate, updateEndDate } = useDateFilter(30);

  useEffect(() => {
    if (!userLoading && !auth) {
      router.push("/onboarding/login");
      return;
    }

    // if (userData?.role !== "auditor") {
    //   router.push("/dashboard");
    //   return;
    // }

    loadAuditData();
  }, [userLoading, auth, userData, router]);

  const loadAuditData = async () => {
    setLoading(true);
    try {
      const startDate = new Date(dateFilter.startDate);
      const endDate = new Date(dateFilter.endDate);

      const [logs, production, terminal, reconciliation, allocation] =
        await Promise.all([
          firebaseService.getAuditLogs(),
          firebaseService.getProductionEntries(undefined, startDate, endDate),
          firebaseService.getTerminalReceipts(startDate, endDate),
          firebaseService.getReconciliationRuns(startDate, endDate),
          firebaseService.getAllocationResults(),
        ]);

      setAuditLogs(logs);
      setProductionEntries(production.data);
      setTerminalReceipts(terminal);
      setReconciliationRuns(reconciliation);
      setAllocationResults(
        allocation.filter((result) => {
          const resultDate = new Date(result.timestamp as Date);
          return resultDate >= startDate && resultDate <= endDate;
        })
      );
    } catch (error) {
      console.error("Error loading audit data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const totalActions = auditLogs.length;
  const uniqueUsers = new Set(auditLogs.map((log) => log.user_id)).size;
  const dataIntegrityIssues = auditLogs.filter(
    (log) => log.action.includes("DELETE") || log.action.includes("UPDATE")
  ).length;

  // Prepare activity chart data
  const activityData = auditLogs.reduce((acc, log) => {
    const date = new Date(log.timestamp).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { date, count: 0 };
    }
    acc[date].count++;
    return acc;
  }, {} as Record<string, { date: string; count: number }>);

  const chartData = Object.values(activityData)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14); // Last 14 days

  // Calculate reconciliation accuracy
  const reconciliationAccuracy =
    (reconciliationRuns.filter((run) => run.status === "completed").length /
      Math.max(reconciliationRuns.length, 1)) *
    100;

  if (userLoading) {
    return <LoadingSpinner message="Loading user data..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Auditor Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome, {userData?.email} - Verify data integrity and compliance
          </p>
        </div>

        {/* Date Filter */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => updateStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => updateEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <button
              onClick={loadAuditData}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Apply Filter
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {[
                { id: "overview", label: "Overview" },
                { id: "audit-logs", label: "Audit Logs" },
                { id: "data-integrity", label: "Data Integrity" },
                { id: "reconciliation", label: "Reconciliation" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(
                      tab.id as
                        | "overview"
                        | "audit-logs"
                        | "data-integrity"
                        | "reconciliation"
                    )
                  }
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <SummaryCard
                title="Total Actions"
                value={totalActions}
                color="blue"
                icon={Activity}
              />
              <SummaryCard
                title="Active Users"
                value={uniqueUsers}
                color="green"
                icon={Users}
              />
              <SummaryCard
                title="Data Changes"
                value={dataIntegrityIssues}
                color="orange"
                icon={Database}
              />
              <SummaryCard
                title="Reconciliation Rate"
                value={reconciliationAccuracy.toFixed(1)}
                color="purple"
                unit="%"
                icon={CheckCircle}
              />
            </div>

            {/* Activity Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">
                Daily Activity (Last 14 Days)
              </h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-gray-500">
                  No activity data available
                </div>
              )}
            </div>

            {/* System Health Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-lg font-semibold mb-2">
                  Production Entries
                </h4>
                <p className="text-3xl font-bold text-blue-600">
                  {productionEntries.length}
                </p>
                <p className="text-sm text-gray-500">Entries in period</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-lg font-semibold mb-2">
                  Terminal Receipts
                </h4>
                <p className="text-3xl font-bold text-green-600">
                  {terminalReceipts.length}
                </p>
                <p className="text-sm text-gray-500">Receipts in period</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-lg font-semibold mb-2">Reconciliations</h4>
                <p className="text-3xl font-bold text-purple-600">
                  {reconciliationRuns.length}
                </p>
                <p className="text-sm text-gray-500">Runs in period</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "audit-logs" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Audit Trail</h3>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <LoadingSpinner message="Loading audit logs..." />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No audit logs found for the selected period.
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entity Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entity ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hash
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.slice(0, 50).map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              log.action.includes("CREATE")
                                ? "bg-green-100 text-green-800"
                                : log.action.includes("UPDATE")
                                ? "bg-yellow-100 text-yellow-800"
                                : log.action.includes("DELETE")
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.entity_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {log.entity_id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.user_email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {log.hash.substring(0, 8)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === "data-integrity" && (
          <div className="space-y-6">
            {/* Data Integrity Checks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-lg font-semibold mb-4">
                  Production Data Integrity
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Entries:</span>
                    <span className="font-semibold">
                      {productionEntries.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entries with Valid BSW:</span>
                    <span className="font-semibold text-green-600">
                      {
                        productionEntries.filter(
                          (entry) =>
                            entry.bsw_percent >= 0 && entry.bsw_percent < 100
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entries with Valid Temperature:</span>
                    <span className="font-semibold text-green-600">
                      {
                        productionEntries.filter(
                          (entry) =>
                            entry.temperature_degF >= -50 &&
                            entry.temperature_degF <= 200
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entries with Valid API Gravity:</span>
                    <span className="font-semibold text-green-600">
                      {
                        productionEntries.filter(
                          (entry) =>
                            entry.api_gravity >= 10 && entry.api_gravity <= 36
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-lg font-semibold mb-4">
                  Terminal Receipt Integrity
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Receipts:</span>
                    <span className="font-semibold">
                      {terminalReceipts.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valid Final Volumes:</span>
                    <span className="font-semibold text-green-600">
                      {
                        terminalReceipts.filter(
                          (receipt) => receipt.final_volume_bbl > 0
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valid Temperatures:</span>
                    <span className="font-semibold text-green-600">
                      {
                        terminalReceipts.filter(
                          (receipt) =>
                            receipt.temperature_degF >= -50 &&
                            receipt.temperature_degF <= 200
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Complete Records:</span>
                    <span className="font-semibold text-green-600">
                      {
                        terminalReceipts.filter(
                          (receipt) =>
                            receipt.final_volume_bbl > 0 &&
                            receipt.temperature_degF >= -50 &&
                            receipt.temperature_degF <= 200
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hash Verification */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h4 className="text-lg font-semibold mb-4">
                Hash Verification Status
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">✓</div>
                  <div className="text-sm text-gray-600">
                    Production Entries
                  </div>
                  <div className="text-lg font-semibold">
                    {productionEntries.length}
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">✓</div>
                  <div className="text-sm text-gray-600">Terminal Receipts</div>
                  <div className="text-lg font-semibold">
                    {terminalReceipts.length}
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">✓</div>
                  <div className="text-sm text-gray-600">
                    Allocation Results
                  </div>
                  <div className="text-lg font-semibold">
                    {allocationResults.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "reconciliation" && (
          <div className="space-y-6">
            {/* Reconciliation Summary */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h4 className="text-lg font-semibold mb-4">
                Reconciliation Analysis
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {reconciliationRuns.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Runs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {
                      reconciliationRuns.filter(
                        (run) => run.status === "completed"
                      ).length
                    }
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {reconciliationRuns
                      .reduce((sum, run) => sum + run.total_terminal_volume, 0)
                      .toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total Volume (BBL)
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {reconciliationRuns.length > 0
                      ? (
                          reconciliationRuns.reduce(
                            (sum, run) => sum + run.shrinkage_factor,
                            0
                          ) / reconciliationRuns.length
                        ).toFixed(2)
                      : "0.00"}
                    %
                  </div>
                  <div className="text-sm text-gray-600">Avg Shrinkage</div>
                </div>
              </div>
            </div>

            {/* Recent Reconciliations Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h4 className="text-lg font-semibold">
                  Recent Reconciliation Runs
                </h4>
              </div>
              <div className="overflow-x-auto">
                {reconciliationRuns.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No reconciliation runs found for the selected period.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Terminal Volume
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Input Volume
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Net Volume
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Shrinkage %
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Triggered By
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reconciliationRuns.map((run) => (
                        <tr key={run.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(run.timestamp).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {run.total_terminal_volume.toLocaleString()} BBL
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {run.total_input_volume.toLocaleString()} BBL
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {run.total_net_volume.toLocaleString()} BBL
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {run.shrinkage_factor.toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {run.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            User ID: {run.triggered_by.substring(0, 8)}...
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Export Actions */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => {
              const auditCsv = auditLogs.map((log) => ({
                Timestamp: new Date(log.timestamp).toLocaleString(),
                Action: log.action,
                "Entity Type": log.entity_type,
                "Entity ID": log.entity_id,
                "User Email": log.user_email,
                Hash: log.hash,
              }));

              const csvContent =
                "data:text/csv;charset=utf-8," +
                Object.keys(auditCsv[0] || {}).join(",") +
                "\n" +
                auditCsv.map((row) => Object.values(row).join(",")).join("\n");

              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute(
                "download",
                `audit_report_${new Date().toISOString().split("T")[0]}.csv`
              );
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            Export Audit Report
          </button>
          <button
            onClick={() => router.push("/production")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            View Production Data
          </button>
        </div>
      </div>
    </div>
  );
}
