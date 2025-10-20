/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calculator } from "lucide-react";
import { COLORS } from "../../../component/Home";
import { useUser } from "../../../hook/useUser";
import { useDateFilter } from "../../../hook/useDateFilter";
import LoadingSpinner from "../../../component/LoadingSpinner";
import { ReconciliationSummary } from "./components/ReconciliationSummary";
import { ReconciliationTable } from "./components/ReconciliationTable";
import { RunReconciliationModal } from "./components/RunReconciliationModal";
import { ReportModal } from "./components/ReportModal";
import {
  useReconciliationStats,
  useReconciliationReport,
  useReconciliationPeriodSummary,
  useTriggerReconciliation,
} from "../../../lib/queries/useReconciliationData";
import { ErrorBoundary } from "../../../component/ErrorBoundary";


// Main Reconciliation Page Component
const ReconciliationPage: React.FC = () => {
  const router = useRouter();
  const { auth, loading: userLoading } = useUser();

  // React Query hooks
  const { data: stats, runs, isLoading: runsLoading } = useReconciliationStats(5);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const { data: selectedReport } = useReconciliationReport(selectedRunId);
  const triggerMutation = useTriggerReconciliation();

  const [showRunForm, setShowRunForm] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // Default to current month - calculate days from first to last day of month
  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();

  const { dateFilter: reconcileDateRange, updateStartDate, updateEndDate } =
    useDateFilter(daysInMonth - 1);

  // Period summary - only fetched when dates are available
  const periodSummaryStartDate = reconcileDateRange.startDate
    ? new Date(reconcileDateRange.startDate)
    : null;
  const periodSummaryEndDate = reconcileDateRange.endDate
    ? new Date(reconcileDateRange.endDate)
    : null;

  const { data: periodSummary, refetch: refetchPeriodSummary, isLoading: periodSummaryLoading } =
    useReconciliationPeriodSummary(periodSummaryStartDate, periodSummaryEndDate);

  useEffect(() => {
    if (!userLoading && !auth) {
      router.push("/onboarding/login");
      return;
    }
  }, [userLoading, auth, router]);

  const reconciliationRuns = runs || [];
  const loading = runsLoading || triggerMutation.isPending || periodSummaryLoading;

  const handlePeriodSummaryCheck = async (): Promise<void> => {
    if (!reconcileDateRange.startDate || !reconcileDateRange.endDate) return;

    try {
      await refetchPeriodSummary();
    } catch (error) {
      console.error("Error getting period summary:", error);
    }
  };

  const handleRunReconciliation = async () => {
    try {
      const reconciliationId = await triggerMutation.mutateAsync({
        startDate: new Date(reconcileDateRange.startDate),
        endDate: new Date(reconcileDateRange.endDate),
        userId: auth.uid,
      });

      setShowRunForm(false);
      alert(
        `Reconciliation completed successfully for the period! ID: ${reconciliationId}`
      );
    } catch (error: any) {
      console.error("Error running reconciliation:", error);
      alert(`Error running reconciliation: ${error.message}`);
    }
  };

  const handleViewReport = async (run: any) => {
    try {
      setSelectedRunId(run.id);
      setShowReportModal(true);
    } catch (error) {
      console.error("Error loading reconciliation report:", error);
      alert("Error loading reconciliation report.");
    }
  };

  // Calculate statistics from React Query
  const totalVolume = stats?.totalVolume || 0;
  const completedRuns = stats?.completedRuns || 0;

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
    <ErrorBoundary>
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
          onViewReport={handleViewReport}
        />
      </div>

      {/* Run Reconciliation Modal */}
      <RunReconciliationModal
        isOpen={showRunForm}
        onClose={() => {
          setShowRunForm(false);
        }}
        reconcileDateRange={reconcileDateRange}
        updateStartDate={updateStartDate}
        updateEndDate={updateEndDate}
        periodSummary={periodSummary || null}
        loading={loading}
        onCheckPeriod={handlePeriodSummaryCheck}
        onRunReconciliation={handleRunReconciliation}
      />

      {/* Reconciliation Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        report={selectedReport || null}
      />
    </div>
    </ErrorBoundary>
  );
};

export default ReconciliationPage;
