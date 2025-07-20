/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/reconciliation/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../../hook/useUser";
import { firebaseService } from "../../../lib/firebase-service";
import {
  ReconciliationRun,
  AllocationResult,
  ReconciliationPeriodSummary,
  ReconciliationReport,
} from "../../../types";
import LoadingSpinner from "../../../component/LoadingSpinner";
import SummaryCard from "../../../component/SummaryCard";
import Modal from "../../../component/Modal";
import { formatDateForInput } from "../../../utils/date";
import { formatFirebaseTimestampRange } from "../../../utils/timestampToPeriod";
import { Timestamp } from "firebase/firestore";

export default function ReconciliationPage() {
  const { auth, data: userData, loading: userLoading } = useUser();
  const router = useRouter();
  const [reconciliationRuns, setReconciliationRuns] = useState<
    ReconciliationRun[]
  >([]);
  const [selectedReport, setSelectedReport] =
    useState<ReconciliationReport | null>(null);

  const [allocationResults, setAllocationResults] = useState<
    AllocationResult[]
  >([]);
  const [periodSummary, setPeriodSummary] =
    useState<ReconciliationPeriodSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRunForm, setShowRunForm] = useState(false);
  const [selectedRun, setSelectedRun] = useState<ReconciliationRun | null>(
    null
  );
  //  Default to current month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [reconcileDateRange, setReconcileDateRange] = useState({
    startDate: formatDateForInput(firstDayOfMonth),
    endDate: formatDateForInput(lastDayOfMonth),
  });
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (!userLoading && !auth) {
      router.push("/onboarding/login");
      return;
    }

    // if (userData?.role !== 'jv_coordinator' && userData?.role !== 'admin') {
    //   router.push('/dashboard');
    //   return;
    // }

    loadReconciliationData();
  }, [userLoading, auth, userData, router]);

  const loadReconciliationData = async () => {
    setLoading(true);
    try {
      const [runs, allocations] = await Promise.all([
        firebaseService.getReconciliationRuns(),
        firebaseService.getAllocationResults(),
      ]);
      setReconciliationRuns(runs);
      setAllocationResults(allocations);
    } catch (error) {
      console.error("Error loading reconciliation data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodSummaryCheck = async () => {
    if (!reconcileDateRange.startDate || !reconcileDateRange.endDate) return;

    setLoading(true);
    try {
      const summary = await firebaseService.getReconciliationSummaryForPeriod(
        new Date(reconcileDateRange.startDate),
        new Date(reconcileDateRange.endDate)
      );
      setPeriodSummary(summary);
    } catch (error) {
      console.error("Error getting period summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunReconciliation = async () => {
    setLoading(true);
    try {
      // First check if reconciliation already exists
      const existingCheck = await firebaseService.checkExistingReconciliation(
        new Date(reconcileDateRange.startDate),
        new Date(reconcileDateRange.endDate)
      );

      if (existingCheck.exists) {
        alert(existingCheck.message);
        setLoading(false);
        return;
      }

      const reconciliationId = await firebaseService.triggerReconciliation(
        new Date(reconcileDateRange.startDate),
        new Date(reconcileDateRange.endDate),
        auth.uid
      );

      setShowRunForm(false);
      setPeriodSummary(null);
      await loadReconciliationData();
      alert(
        `Reconciliation completed successfully for the period! ID: ${reconciliationId}`
      );
    } catch (error: any) {
      console.error("Error running reconciliation:", error);
      alert(`Error running reconciliation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (run: ReconciliationRun) => {
    setLoading(true);
    try {
      const report = await firebaseService.getReconciliationReport(run.id);
      setSelectedReport(report);
      setShowReportModal(true);
    } catch (error) {
      console.error("Error loading reconciliation report:", error);
      alert("Error loading reconciliation report.");
    } finally {
      setLoading(false);
    }
  };

  const totalVolume = reconciliationRuns.reduce(
    (sum, run) => sum + run.total_terminal_volume,
    0
  );
  const averageShrinkage =
    reconciliationRuns.length > 0
      ? reconciliationRuns.reduce((sum, run) => sum + run.shrinkage_factor, 0) /
        reconciliationRuns.length
      : 0;
  const completedRuns = reconciliationRuns.filter(
    (run) => run.status === "completed"
  ).length;

  console.log(reconciliationRuns, "rerserswew");

  if (userLoading) {
    return <LoadingSpinner fullScreen message="Loading user data..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reconciliation Management
          </h1>
          <p className="text-gray-600">
            Trigger period-based reconciliations and manage partner
            back-allocations
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <SummaryCard
            title="Total Runs"
            value={reconciliationRuns.length}
            color="blue"
          />
          <SummaryCard title="Completed" value={completedRuns} color="green" />
          <SummaryCard
            title="Total Volume"
            value={totalVolume}
            color="orange"
            unit=" BBL"
          />
          <SummaryCard
            title="Avg Shrinkage"
            value={averageShrinkage.toFixed(2)}
            color="purple"
            unit="%"
          />
        </div>

        {/* Action Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Period Reconciliation</h3>
              <p className="text-sm text-gray-600">
                Run reconciliations for a specific period (usually monthly)
              </p>
            </div>
            <button
              onClick={() => setShowRunForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              Run Reconciliation
            </button>
          </div>
        </div>

        {/* Reconciliation Runs Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold">
              Recent Reconciliation Runs
            </h4>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <LoadingSpinner message="Loading reconciliation runs..." />
              </div>
            ) : reconciliationRuns.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No reconciliation runs yet.
                <div className="mt-2">
                  <button
                    onClick={() => setShowRunForm(true)}
                    className="text-green-600 hover:underline"
                  >
                    Run your first reconciliation
                  </button>
                </div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Input Volume
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Terminal Volume
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volume Loss
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shrinkage %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Run Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reconciliationRuns.map((run) => {
                    const volumeLoss =
                      run.total_input_volume - run.total_terminal_volume;
                    return (
                      <tr key={run.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">
                              {/* {new Date(run.start_date).toLocaleDateString()} -{" "}
                              {new Date(run.end_date).toLocaleDateString()} */}
                              {formatFirebaseTimestampRange(
                                run.start_date as Timestamp,
                                run.end_date as Timestamp
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {run.total_input_volume.toLocaleString()} BBL
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {run.total_terminal_volume.toLocaleString()} BBL
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                          {volumeLoss.toLocaleString()} BBL
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {run.shrinkage_factor.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(run.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewReport(run)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Report
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Run Reconciliation Modal */}
      <Modal
        isOpen={showRunForm}
        onClose={() => {
          setShowRunForm(false);
          setPeriodSummary(null);
        }}
        title="Run Period Reconciliation"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={reconcileDateRange.startDate}
                onChange={(e) =>
                  setReconcileDateRange((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={reconcileDateRange.endDate}
                onChange={(e) =>
                  setReconcileDateRange((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Period Summary Check */}
          <div className="flex gap-2">
            <button
              onClick={handlePeriodSummaryCheck}
              disabled={
                loading ||
                !reconcileDateRange.startDate ||
                !reconcileDateRange.endDate
              }
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:bg-blue-300"
            >
              {loading ? "Checking..." : "Check Period"}
            </button>
            <span className="text-sm text-gray-500 flex items-center">
              Verify data availability for the selected period
            </span>
          </div>

          {/* Period Summary Display */}
          {periodSummary && (
            <div
              className={`p-4 rounded-md ${
                periodSummary.readyForReconciliation
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <h4
                className={`text-sm font-semibold mb-2 ${
                  periodSummary.readyForReconciliation
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                Period Summary (
                {new Date(periodSummary.periodStart).toLocaleDateString()} -{" "}
                {new Date(periodSummary.periodEnd).toLocaleDateString()})
              </h4>

              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div>
                  <span className="text-gray-600">Production Entries:</span>
                  <span className="ml-2 font-medium">
                    {periodSummary.totalProductionEntries}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Terminal Receipts:</span>
                  <span className="ml-2 font-medium">
                    {periodSummary.totalTerminalReceipts}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <span className="text-gray-600 text-sm">
                  Partners Involved:
                </span>
                <div className="mt-1">
                  {periodSummary.partnersInvolved.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {periodSummary.partnersInvolved.map((partner) => (
                        <span
                          key={partner}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {partner}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-red-600 text-sm">
                      No partners found
                    </span>
                  )}
                </div>
              </div>

              {periodSummary.issues.length > 0 && (
                <div>
                  <span className="text-red-600 font-medium text-sm">
                    Issues:
                  </span>
                  <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                    {periodSummary.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {periodSummary.readyForReconciliation && (
                <div className="mt-3 p-2 bg-green-100 rounded text-sm text-green-800">
                  ✓ Ready for reconciliation! All required data is available for
                  this period.
                </div>
              )}
            </div>
          )}

          <div className="bg-yellow-50 p-4 rounded-md">
            <h4 className="text-sm font-semibold text-yellow-800 mb-2">
              Period Reconciliation:
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>
                • Reconciliation will process ALL production entries and
                terminal receipts in the selected period
              </li>
              <li>• Usually done monthly (e.g., 1st to 31st of a month)</li>
              <li>
                • System will check if reconciliation already exists for this
                period
              </li>
              <li>
                • Back-allocation will be calculated proportionally for all
                partners
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Back-Allocation Process:</strong> This will aggregate all
              production data and terminal receipts for the selected period,
              then distribute the total terminal volume proportionally to each
              partner based on their net volume contributions.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleRunReconciliation}
              disabled={
                !!(
                  loading ||
                  !reconcileDateRange?.startDate ||
                  !reconcileDateRange?.endDate ||
                  (periodSummary && !periodSummary.readyForReconciliation)
                )
              }
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition disabled:bg-green-300 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Run Period Reconciliation"}
            </button>
            <button
              onClick={() => {
                setShowRunForm(false);
                setPeriodSummary(null);
              }}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Reconciliation Report Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title={`Reconciliation Report - ${
          selectedReport?.reconciliation.start_date
            ? `${formatFirebaseTimestampRange(
                selectedReport.reconciliation.start_date as Timestamp,
                selectedReport.reconciliation.end_date as Timestamp
              )}`
            : ""
        }`}
      >
        {selectedReport && (
          <div className="space-y-6">
            {/* Period Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-blue-900">
                Reconciliation Period
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Period:</span>
                  <span className="ml-2 font-medium">
                    {formatFirebaseTimestampRange(
                      selectedReport.reconciliation.start_date as Timestamp,
                      selectedReport.reconciliation.end_date as Timestamp
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Days:</span>
                  <span className="ml-2 font-medium">
                    {Math.ceil(
                      (new Date(
                        selectedReport.reconciliation.end_date as Date
                      ).getTime() -
                        new Date(
                          selectedReport.reconciliation.start_date as Date
                        ).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    days
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Run Date:</span>
                  <span className="ml-2 font-medium">
                    {new Date(
                      selectedReport.reconciliation.timestamp
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">Volume Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Partners:</span>
                  <span className="ml-2 font-medium">
                    {selectedReport.summary.totalPartners}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Input Volume:</span>
                  <span className="ml-2 font-medium">
                    {selectedReport.summary.totalInputVolume.toLocaleString()}{" "}
                    BBL
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Terminal Volume:</span>
                  <span className="ml-2 font-medium">
                    {selectedReport.summary.actualTerminalVolume.toLocaleString()}{" "}
                    BBL
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Total Volume Loss:</span>
                  <span className="ml-2 font-medium text-red-600">
                    {selectedReport.summary.totalVolumeLoss.toLocaleString()}{" "}
                    BBL
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Shrinkage:</span>
                  <span className="ml-2 font-medium">
                    {selectedReport.summary.shrinkagePercentage.toFixed(2)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Allocated Volume:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {selectedReport.summary.totalAllocatedVolume.toLocaleString()}{" "}
                    BBL
                  </span>
                </div>
              </div>
            </div>

            {/* Partner Allocations */}
            <div>
              <h4 className="font-semibold mb-3">Partner Allocations</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">
                        Partner
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">
                        Input (BBL)
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">
                        Allocated (BBL)
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">
                        Loss (BBL)
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">
                        Share (%)
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">
                        Efficiency (%)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedReport.allocations.map((allocation) => {
                      const efficiency =
                        (allocation.allocated_volume /
                          Math.max(allocation.input_volume, 1)) *
                        100;
                      return (
                        <tr key={allocation.id}>
                          <td className="px-3 py-2 font-medium">
                            {allocation.partner}
                          </td>
                          <td className="px-3 py-2">
                            {allocation.input_volume.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-green-600 font-medium">
                            {allocation.allocated_volume.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-red-600 font-medium">
                            {(allocation.volume_loss || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2">
                            {allocation.percentage.toFixed(2)}%
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                efficiency >= 95
                                  ? "bg-green-100 text-green-800"
                                  : efficiency >= 90
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {efficiency.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  // Export reconciliation report
                  const csv = selectedReport.allocations.map((allocation) => ({
                    Partner: allocation.partner,
                    "Period Start": new Date(
                      allocation.start_date as Date
                    ).toLocaleDateString(),
                    "Period End": new Date(
                      allocation.end_date as Date
                    ).toLocaleDateString(),
                    "Input Volume (BBL)": allocation.input_volume,
                    "Net Volume (BBL)": allocation.net_volume,
                    "Allocated Volume (BBL)": allocation.allocated_volume,
                    "Volume Loss (BBL)": allocation.volume_loss || 0,
                    "Share (%)": allocation.percentage,
                    "Efficiency (%)": (
                      (allocation.allocated_volume /
                        Math.max(allocation.input_volume, 1)) *
                      100
                    ).toFixed(2),
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
                    `reconciliation_report_${
                      new Date(selectedReport.reconciliation.start_date as Date)
                        .toISOString()
                        .split("T")[0]
                    }_to_${
                      new Date(selectedReport.reconciliation.end_date as Date)
                        .toISOString()
                        .split("T")[0]
                    }.csv`
                  );
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
              >
                Export Report
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
