/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calculator } from "lucide-react";
import { COLORS } from "../../../component/Home";
import { useUser } from "../../../hook/useUser";
import { useDateFilter } from "../../../hook/useDateFilter";
import { firebaseService } from "../../../lib/firebase-service";
import LoadingSpinner from "../../../component/LoadingSpinner";
import { ReconciliationReport, ReconciliationRun } from "../../../types";
import { ReconciliationSummary } from "./components/ReconciliationSummary";
import { ReconciliationTable } from "./components/ReconciliationTable";
import { RunReconciliationModal } from "./components/RunReconciliationModal";
import { ReportModal } from "./components/ReportModal";

interface ReconciliationPeriodSummary {
  periodStart: Date;
  periodEnd: Date;
  totalProductionEntries: number;
  totalTerminalReceipts: number;
  partnersInvolved: string[];
  readyForReconciliation: boolean;
  issues: string[];
}

// Main Reconciliation Page Component
const ReconciliationPage: React.FC = () => {
  const router = useRouter();
  const [reconciliationRuns, setReconciliationRuns] = useState<
    ReconciliationRun[]
  >([]);
  const [selectedReport, setSelectedReport] =
    useState<ReconciliationReport | null>(null);
  const [periodSummary, setPeriodSummary] =
    useState<ReconciliationPeriodSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showRunForm, setShowRunForm] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  const { auth, data: userData, loading: userLoading } = useUser();

  // Default to current month - calculate days from first to last day of month
  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();

  const { dateFilter: reconcileDateRange, updateStartDate, updateEndDate } =
    useDateFilter(daysInMonth - 1);

  useEffect(() => {
    if (!userLoading && !auth) {
      router.push("/onboarding/login");
      return;
    }

    loadReconciliationData();
  }, [userLoading, auth, userData, router]);

  const loadReconciliationData = async () => {
    setLoading(true);
    try {
      const runs = await firebaseService.getReconciliationRuns();
      setReconciliationRuns(runs.slice(0, 5) as any);
    } catch (error) {
      console.error("Error loading reconciliation data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodSummaryCheck = async (): Promise<void> => {
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

  // Calculate statistics
  const totalVolume = reconciliationRuns.reduce(
    (sum, run) => sum + run.total_terminal_volume,
    0
  );

  const completedRuns = reconciliationRuns.filter(
    (run) => run.status === "completed"
  ).length;

  if (userLoading) {
    return (
      <div
        className={`min-h-screen ${COLORS.background.gradient} flex flex-col items-center justify-center`}
      >
        <LoadingSpinner message="Wait..." />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${COLORS.background.gradient} pt-20`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} flex items-center justify-center`}
              aria-hidden="true"
            >
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <div className="w-[60%] md:w-auto">
              <h1 className={`text-3xl font-bold ${COLORS.text.primary}`}>
                Reconciliation
              </h1>
              <p className={`${COLORS.text.secondary}`}>
                Trigger period-based reconciliations and manage partner
                back-allocations
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <ReconciliationSummary
          totalRuns={reconciliationRuns.length}
          completedRuns={completedRuns}
          totalVolume={totalVolume}
        />

        {/* Reconciliation Runs Table */}
        <ReconciliationTable
          reconciliationRuns={reconciliationRuns}
          loading={loading}
          userRole={userData?.role}
          onViewReport={handleViewReport}
          onShowRunForm={() => setShowRunForm(true)}
        />
      </div>

      {/* Run Reconciliation Modal */}
      <RunReconciliationModal
        isOpen={showRunForm}
        onClose={() => {
          setShowRunForm(false);
          setPeriodSummary(null);
        }}
        reconcileDateRange={reconcileDateRange}
        updateStartDate={updateStartDate}
        updateEndDate={updateEndDate}
        periodSummary={periodSummary}
        loading={loading}
        onCheckPeriod={handlePeriodSummaryCheck}
        onRunReconciliation={handleRunReconciliation}
      />

      {/* Reconciliation Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        report={selectedReport}
      />
    </div>
  );
};

export default ReconciliationPage;
