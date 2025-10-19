/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Download,
  Calendar,
  BarChart3,
  TrendingUp,
  Calculator,
  CheckCircle,
  Clock,
  AlertTriangle,
  Database,
  Users,
  Workflow,
  RefreshCw,
  X,
  Info,
  Activity,
  Eye,
} from "lucide-react";
import { COLORS } from "../../../component/Home";
import { useUser } from "../../../hook/useUser";
import { useDateFilter } from "../../../hook/useDateFilter";
import { firebaseService } from "../../../lib/firebase-service";
import LoadingSpinner from "../../../component/LoadingSpinner";
import { SummaryCard } from "../../../component/cards/SummaryCard";
import { ReconciliationReport, ReconciliationRun } from "../../../types";
import { Timestamp } from "firebase/firestore";
import { formatFirebaseTimestampRange } from "../../../utils/timestampToPeriod";

interface AllocationResult {
  id: string;
  reconciliation_id: string;
  partner: string;
  input_volume: number;
  net_volume: number;
  allocated_volume: number;
  volume_loss?: number;
  percentage: number;
  start_date: Date;
  end_date: Date;
}

interface ReconciliationPeriodSummary {
  periodStart: Date;
  periodEnd: Date;
  totalProductionEntries: number;
  totalTerminalReceipts: number;
  partnersInvolved: string[];
  readyForReconciliation: boolean;
  issues: string[];
}

interface ReconciliationDateRange {
  startDate: string;
  endDate: string;
}

// Reusable Components
interface InputFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  icon: Icon,
  disabled = false,
}) => (
  <div className="space-y-2">
    <label className={`block text-sm font-medium ${COLORS.text.primary}`}>
      {label}
    </label>
    <div className="relative">
      <div
        className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${COLORS.text.muted}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full pl-10 pr-4 py-3 
          ${COLORS.background.glass} backdrop-blur-sm 
          ${COLORS.border.light} border rounded-xl 
          ${COLORS.text.primary} 
          placeholder-gray-500
          focus:outline-none focus:ring-2 focus:${COLORS.border.ring} focus:border-transparent 
          transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      />
    </div>
  </div>
);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "sm:max-w-md",
    md: "sm:max-w-lg",
    lg: "sm:max-w-2xl",
    xl: "sm:max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div
          className={`inline-block align-bottom ${COLORS.background.card} backdrop-blur-xl rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizeClasses[size]} sm:w-full ${COLORS.border.light} border`}
        >
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${COLORS.text.primary}`}>
                {title}
              </h3>
              <button
                onClick={onClose}
                className={`${COLORS.text.muted} hover:${COLORS.text.primary} transition-colors`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

interface PeriodSummaryDisplayProps {
  summary: ReconciliationPeriodSummary;
}

const PeriodSummaryDisplay: React.FC<PeriodSummaryDisplayProps> = ({
  summary,
}) => (
  <div
    className={`p-4 rounded-xl border ${
      summary.readyForReconciliation
        ? "bg-green-500/10 border-green-500/20"
        : "bg-red-500/10 border-red-500/20"
    }`}
  >
    <h4
      className={`text-sm font-semibold mb-3 flex items-center space-x-2 ${
        summary.readyForReconciliation ? "text-green-400" : "text-red-400"
      }`}
    >
      {summary.readyForReconciliation ? (
        <CheckCircle className="w-4 h-4" />
      ) : (
        <AlertTriangle className="w-4 h-4" />
      )}
      <span>
        Period Summary ({summary.periodStart.toLocaleDateString()} -{" "}
        {summary.periodEnd.toLocaleDateString()})
      </span>
    </h4>

    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
      <div className="flex justify-between">
        <span className={COLORS.text.muted}>Production Entries:</span>
        <span className={`${COLORS.text.primary} font-medium`}>
          {summary.totalProductionEntries}
        </span>
      </div>
      <div className="flex justify-between">
        <span className={COLORS.text.muted}>Terminal Receipts:</span>
        <span className={`${COLORS.text.primary} font-medium`}>
          {summary.totalTerminalReceipts}
        </span>
      </div>
    </div>

    <div className="mb-4">
      <span className={`${COLORS.text.muted} text-sm`}>Partners Involved:</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {summary.partnersInvolved.map((partner) => (
          <span
            key={partner}
            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs"
          >
            {partner}
          </span>
        ))}
      </div>
    </div>

    {summary.issues.length > 0 && (
      <div className="mb-4">
        <span className="text-red-400 font-medium text-sm">Issues:</span>
        <ul className="mt-1 text-sm text-red-300 space-y-1">
          {summary.issues.map((issue, index) => (
            <li key={index} className="flex items-start space-x-2">
              <span className="text-red-400 mt-1">•</span>
              <span>{issue}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {summary.readyForReconciliation && (
      <div className="p-3 bg-green-500/20 rounded-lg text-sm text-green-300">
        ✓ Ready for reconciliation! All required data is available for this
        period.
      </div>
    )}
  </div>
);

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
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysFromFirstOfMonth = currentDay - 1; // Days from 1st to today

  const { dateFilter: reconcileDateRange, updateStartDate, updateEndDate } = useDateFilter(daysInMonth - 1);

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

  // Export report as CSV
  const exportReportCSV = (report: ReconciliationReport): void => {
    const csv = report.allocations.map((allocation) => ({
      Partner: allocation.partner,
      "Period Start": new Date(
        allocation.start_date as Date
      ).toLocaleDateString(),
      "Period End": new Date(allocation.end_date as Date).toLocaleDateString(),
      "Input Volume (BBL)": allocation.input_volume,
      "Net Volume (BBL)": allocation.net_volume,
      "Allocated Volume (BBL)": allocation.allocated_volume,
      "Volume Loss (BBL)": allocation.volume_loss || 0,
      "Share (%)": allocation.percentage,
      "Efficiency (%)": (
        (allocation.allocated_volume / Math.max(allocation.input_volume, 1)) *
        100
      ).toFixed(2),
    }));

    const csvContent = [
      Object.keys(csv[0] || {}).join(","),
      ...csv.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reconciliation_report_${
      new Date(report.reconciliation.start_date as Date)
        .toISOString()
        .split("T")[0]
    }_to_${
      new Date(report.reconciliation.end_date as Date)
        .toISOString()
        .split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export report as PDF using browser print
  const exportReportPDF = (report: ReconciliationReport): void => {
    const periodRange = formatFirebaseTimestampRange(
      report.reconciliation.start_date as Timestamp,
      report.reconciliation.end_date as Timestamp
    );

    // Create printable HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>FlowShare Reconciliation Report - ${periodRange}</title>
        <style>
          @media print {
            body { margin: 0; padding: 20px; }
            @page { size: A4; margin: 1cm; }
          }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.5;
            color: #1f2937;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 15px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            background: linear-gradient(135deg, #3b82f6 0%, #9333ea 50%, #06b6d4 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 5px;
          }
          .period {
            font-size: 18px;
            color: #64748b;
            margin-bottom: 5px;
          }
          .date {
            font-size: 12px;
            color: #94a3b8;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 25px;
          }
          .summary-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
          }
          .summary-label {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .summary-value {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }
          th {
            background: #f8fafc;
            font-weight: 600;
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
          }
          td {
            font-size: 13px;
          }
          .ai-summary {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 6px;
          }
          .ai-summary h3 {
            margin: 0 0 10px 0;
            color: #1e40af;
            font-size: 14px;
            font-weight: 600;
          }
          .ai-summary p {
            margin: 0 0 10px 0;
            color: #475569;
            font-size: 12px;
            line-height: 1.6;
          }
          .ai-summary ul {
            margin: 10px 0;
            padding-left: 20px;
            color: #475569;
            font-size: 12px;
          }
          .ai-summary li {
            margin-bottom: 6px;
            line-height: 1.5;
          }
          .ai-summary strong {
            font-weight: 600;
            color: #1e293b;
          }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">⚡ FlowShare</div>
          <div class="period">Reconciliation Report</div>
          <div class="date">${periodRange}</div>
        </div>

        <div class="summary">
          <div class="summary-card">
            <div class="summary-label">Total Partners</div>
            <div class="summary-value">${report.summary.totalPartners}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Input Volume</div>
            <div class="summary-value">${report.summary.totalInputVolume.toLocaleString()} BBL</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Terminal Volume</div>
            <div class="summary-value">${report.summary.actualTerminalVolume.toLocaleString()} BBL</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Volume Loss/Gain</div>
            <div class="summary-value">${report.summary.totalVolumeLoss.toLocaleString()} BBL</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Shrinkage</div>
            <div class="summary-value">${Math.abs(report.summary.shrinkagePercentage).toFixed(2)}%</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Allocated Volume</div>
            <div class="summary-value">${report.summary.totalAllocatedVolume.toLocaleString()} BBL</div>
          </div>
        </div>

        ${report.reconciliation.ai_summary ? `
          <div class="ai-summary">
            <h3>🤖 AI-Powered Executive Summary</h3>
            <div>${report.reconciliation.ai_summary}</div>
          </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              <th>Partner</th>
              <th>Input Volume</th>
              <th>Allocated Volume</th>
              <th>Gain/Loss</th>
              <th>Share</th>
              <th>Efficiency</th>
            </tr>
          </thead>
          <tbody>
            ${report.allocations.map(allocation => {
              const efficiency = (allocation.allocated_volume / Math.max(allocation.input_volume, 1)) * 100;
              return `
                <tr>
                  <td>${allocation.partner}</td>
                  <td>${allocation.input_volume.toLocaleString()} bbl</td>
                  <td>${allocation.allocated_volume.toLocaleString()} bbl</td>
                  <td>${Math.abs(allocation.volume_loss || 0).toLocaleString()} bbl</td>
                  <td>${allocation.percentage.toFixed(2)}%</td>
                  <td>${efficiency.toFixed(1)}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          Generated on ${new Date().toLocaleString()} • FlowShare Reconciliation System<br>
          Run Date: ${new Date(report.reconciliation.timestamp).toLocaleDateString()}
        </div>
      </body>
      </html>
    `;

    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
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
      {/* CSS for AI Summary HTML rendering */}
      <style jsx global>{`
        .ai-summary-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: currentColor;
        }
        .ai-summary-content p {
          margin-bottom: 0.75rem;
          line-height: 1.625;
        }
        .ai-summary-content ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .ai-summary-content li {
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }
        .ai-summary-content strong {
          font-weight: 600;
          color: currentColor;
        }
      `}</style>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} flex items-center justify-center`}
            >
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <div className="w-[60%] md:w-auto">
              <p className={`${COLORS.text.secondary}`}>
                Trigger period-based reconciliations and manage partner
                back-allocations
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SummaryCard
            title="Total Runs"
            value={reconciliationRuns.length}
            color="blue"
            icon={Database}
            // trend={{ value: 15.2, isPositive: true }}
          />
          <SummaryCard
            title="Completed"
            value={completedRuns}
            color="green"
            icon={CheckCircle}
            // trend={{ value: 8.7, isPositive: true }}
          />
          <SummaryCard
            title="Total Volume"
            value={Math.round(totalVolume)}
            unit=" BBL"
            color="orange"
            icon={BarChart3}
          />
        </div>

        {/* Reconciliation Runs Table */}
        <div
          className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-2xl overflow-hidden`}
        >
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <RefreshCw className={`w-5 h-5 ${COLORS.primary.blue[400]}`} />
              <h4 className={`text-lg font-semibold ${COLORS.text.primary}`}>
                Recent Reconciliation Runs
              </h4>
              <span
                className={`px-3 py-1 rounded-full text-xs ${COLORS.background.glassHover} ${COLORS.text.secondary}`}
              >
                {reconciliationRuns.length} runs
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <LoadingSpinner message="Loading reconciliation runs..." />
              </div>
            ) : reconciliationRuns.length === 0 ? (
              <div className="p-8 text-center">
                <Calculator
                  className={`w-16 h-16 ${COLORS.text.muted} mx-auto mb-4 opacity-50`}
                />
                <p className={`text-lg ${COLORS.text.secondary} mb-2`}>
                  No reconciliation runs yet
                </p>
                {userData?.role === "jv_coordinator" ? (
                  <button
                    onClick={() => setShowRunForm(true)}
                    className="text-green-400 hover:text-green-300 font-medium hover:underline transition-colors"
                  >
                    Run your first reconciliation
                  </button>
                ) : (
                  ""
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead className={`${COLORS.background.overlay}`}>
                  <tr>
                    <th
                      className={`px-6 py-4 text-left text-xs font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                    >
                      Date Period
                    </th>
                    <th
                      className={`px-6 py-4 text-left text-xs font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                    >
                      Total Volume
                    </th>
                    <th
                      className={`px-6 py-4 text-left text-xs font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                    >
                      Allocated Volume
                    </th>
                    <th
                      className={`px-6 py-4 text-left text-xs font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                    >
                      Volume Loss/Gain
                    </th>
                    <th
                      className={`px-6 py-4 text-left text-xs font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                    >
                      Shrinkage %
                    </th>
                    <th
                      className={`px-6 py-4 text-left text-xs font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                    >
                      Run Date
                    </th>
                    <th
                      className={`px-6 py-4 text-left text-xs font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                    >
                      Status
                    </th>
                    <th
                      className={`px-6 py-4 text-left text-xs font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {reconciliationRuns.map((run) => {
                    // Use stored volume loss if available, otherwise calculate fallback
                    const volumeLoss = run.total_volume_loss !== undefined
                      ? run.total_volume_loss
                      : (run.total_input_volume - run.total_terminal_volume);

                    // Use stored allocated volume if available, otherwise use terminal volume as fallback
                    const allocatedVolume = run.total_allocated_volume !== undefined
                      ? run.total_allocated_volume
                      : run.total_terminal_volume;

                    return (
                      <tr
                        key={run.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td
                          className={`px-6 py-4 whitespace-nowrap ${COLORS.text.primary}`}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {formatFirebaseTimestampRange(
                                run.start_date as Timestamp,
                                run.end_date as Timestamp
                              )}
                            </span>
                          </div>
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.text.primary} font-medium`}
                        >
                          {run.total_input_volume.toLocaleString()} BBL
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400`}
                        >
                          {allocatedVolume.toLocaleString()} BBL
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            volumeLoss > 0 ? "text-red-400" : "text-green-400"
                          }`}
                        >
                          {volumeLoss.toLocaleString()} BBL
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.text.primary}`}
                        >
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              run.shrinkage_factor > 0
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {(-run.shrinkage_factor).toFixed(2)}%
                          </span>
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap ${COLORS.text.primary}`}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {new Date(run.timestamp).toLocaleDateString()}
                            </span>
                            <span className={`text-xs ${COLORS.text.muted}`}>
                              {new Date(run.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs ${
                              run.status === "completed"
                                ? "bg-green-500/20 text-green-400"
                                : run.status === "in_progress"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {run.status === "completed" && (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            {run.status === "in_progress" && (
                              <Clock className="w-3 h-3" />
                            )}
                            {run.status === "failed" && (
                              <AlertTriangle className="w-3 h-3" />
                            )}
                            <span className="capitalize">{run.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleViewReport(run)}
                            className="flex cursor-pointer items-center space-x-1 px-3 py-1 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Report</span>
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
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Start Date"
              type="date"
              value={reconcileDateRange.startDate}
              onChange={(value) => updateStartDate(value)}
              icon={Calendar}
              disabled={loading}
            />
            <InputField
              label="End Date"
              type="date"
              value={reconcileDateRange.endDate}
              onChange={(value) => updateEndDate(value)}
              icon={Calendar}
              disabled={loading}
            />
          </div>

          {/* Period Summary Check */}
          <div className="flex items-center gap-4">
            <button
              onClick={handlePeriodSummaryCheck}
              disabled={
                loading ||
                !reconcileDateRange.startDate ||
                !reconcileDateRange.endDate
              }
              className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} text-white rounded-xl hover:${COLORS.primary.blue[700]} hover:${COLORS.primary.purple[700]} transition-all duration-300 disabled:opacity-50`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  <span>Check Period</span>
                </>
              )}
            </button>
            <span className={`text-sm ${COLORS.text.muted}`}>
              Verify data availability for the selected period
            </span>
          </div>

          {/* Period Summary Display */}
          {periodSummary && <PeriodSummaryDisplay summary={periodSummary} />}

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center space-x-2">
                <Info className="w-4 h-4" />
                <span>Period Reconciliation</span>
              </h4>
              <ul className="text-sm text-yellow-300/80 space-y-1">
                <li>
                  • Processes ALL production entries and terminal receipts in
                  selected period
                </li>
                <li>• Usually done monthly (e.g., 1st to 31st of a month)</li>
                <li>
                  • System checks if reconciliation already exists for this
                  period
                </li>
                <li>
                  • Back-allocation calculated proportionally for all partners
                </li>
              </ul>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center space-x-2">
                <Calculator className="w-4 h-4" />
                <span>Back-Allocation Process</span>
              </h4>
              <p className="text-sm text-blue-300/80">
                Aggregates all production data and terminal receipts for the
                selected period, then distributes the total terminal volume
                proportionally to each partner based on their net volume
                contributions.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleRunReconciliation}
              disabled={
                loading ||
                !reconcileDateRange?.startDate ||
                !reconcileDateRange?.endDate ||
                !periodSummary?.readyForReconciliation
              }
              className={`flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Period Reconciliation</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowRunForm(false);
                setPeriodSummary(null);
              }}
              className={`flex-1 ${COLORS.background.glass} ${COLORS.text.primary} py-3 px-4 rounded-xl font-medium hover:${COLORS.background.glassHover} transition-all duration-300 ${COLORS.border.light} border`}
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
          selectedReport
            ? formatFirebaseTimestampRange(
                selectedReport.reconciliation.start_date as Timestamp,
                selectedReport.reconciliation.end_date as Timestamp
              )
            : ""
        }`}
        size="xl"
      >
        {selectedReport && (
          <div className="space-y-6">
            {/* Period Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <h4 className="font-semibold mb-3 text-blue-400 flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Reconciliation Period</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className={COLORS.text.muted}>Period:</span>
                  <span className={`${COLORS.text.primary} font-medium`}>
                    {formatFirebaseTimestampRange(
                      selectedReport.reconciliation.start_date as Timestamp,
                      selectedReport.reconciliation.end_date as Timestamp
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className={COLORS.text.muted}>Run Date:</span>
                  <span className={`${COLORS.text.primary} font-medium`}>
                    {new Date(
                      selectedReport.reconciliation.timestamp
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div
              className={`${COLORS.background.glass} rounded-xl p-4 ${COLORS.border.light} border`}
            >
              <h4
                className={`font-semibold mb-3 ${COLORS.text.primary} flex items-center space-x-2`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Volume Summary</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className={COLORS.text.muted}>Total Partners:</span>
                  <span className={`${COLORS.text.primary} font-medium`}>
                    {selectedReport.summary.totalPartners}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={COLORS.text.muted}>Input Volume:</span>
                  <span className={`${COLORS.text.primary} font-medium`}>
                    {selectedReport.summary.totalInputVolume.toLocaleString()}{" "}
                    BBL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={COLORS.text.muted}>Terminal Volume:</span>
                  <span className={`${COLORS.text.primary} font-medium`}>
                    {selectedReport.summary.actualTerminalVolume.toLocaleString()}{" "}
                    BBL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={COLORS.text.muted}>Volume Loss/Gain:</span>
                  <span
                    className={`${
                      selectedReport.summary.totalVolumeLoss > 0
                        ? "text-red-400"
                        : "text-green-400"
                    } font-medium`}
                  >
                    {selectedReport.summary.totalVolumeLoss.toLocaleString()}{" "}
                    BBL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={COLORS.text.muted}>Shrinkage:</span>
                  <span
                    className={`${
                      selectedReport.summary.shrinkagePercentage < 0
                        ? "text-orange-400"
                        : "text-green-400"
                    }  font-medium`}
                  >
                    {Math.abs(
                      selectedReport.summary.shrinkagePercentage
                    ).toFixed(2)}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={COLORS.text.muted}>Allocated Volume:</span>
                  <span className="text-green-400 font-medium">
                    {selectedReport.summary.totalAllocatedVolume.toLocaleString()}{" "}
                    BBL
                  </span>
                </div>
              </div>
            </div>

            {/* Partner Allocations */}
            <div>
              <h4
                className={`font-semibold mb-3 ${COLORS.text.primary} flex items-center space-x-2`}
              >
                <Users className="w-4 h-4" />
                <span>Partner Allocations</span>
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className={`${COLORS.background.overlay}`}>
                    <tr>
                      <th
                        className={`px-3 py-3 text-left font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                      >
                        Partner
                      </th>
                      <th
                        className={`px-3 py-3 text-left font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                      >
                        Input Vol
                      </th>
                      <th
                        className={`px-3 py-3 text-left font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                      >
                        Allocated Vol
                      </th>
                      <th
                        className={`px-3 py-3 text-left font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                      >
                        GAIN/Loss
                      </th>
                      <th
                        className={`px-3 py-3 text-left font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                      >
                        Share
                      </th>
                      <th
                        className={`px-3 py-3 text-left font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                      >
                        Efficiency
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {selectedReport.allocations.map((allocation) => {
                      const efficiency =
                        (allocation.allocated_volume /
                          Math.max(allocation.input_volume, 1)) *
                        100;
                      return (
                        <tr
                          key={allocation.id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td
                            className={`px-3 py-3 font-medium ${COLORS.text.primary}`}
                          >
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <span>{allocation.partner}</span>
                            </div>
                          </td>
                          <td className={`px-3 py-3 ${COLORS.text.primary}`}>
                            {allocation.input_volume.toLocaleString()} bbl
                          </td>
                          <td className="px-3 py-3 text-green-400 font-medium">
                            {allocation.allocated_volume.toLocaleString()} bbl
                          </td>
                          <td
                            className={`px-3 py-3 font-medium ${
                              allocation.volume_loss < 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {(allocation.volume_loss < 0
                              ? -allocation.volume_loss
                              : allocation.volume_loss || 0
                            ).toLocaleString()}{" "}
                            bbl
                          </td>
                          <td className={`px-3 py-3 ${COLORS.text.primary}`}>
                            {allocation.percentage.toFixed(2)}%
                          </td>
                          <td className="px-3 py-3">
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Analysis Section */}
            {selectedReport.reconciliation.ai_summary && (
              <div
                className={`${COLORS.background.glass} rounded-xl p-4 ${COLORS.border.light} border`}
              >
                <h4
                  className={`font-semibold mb-3 ${COLORS.text.primary} flex items-center space-x-2`}
                >
                  <span className="text-xl">🤖</span>
                  <span>AI-Powered Executive Summary</span>
                </h4>
                <div
                  className={`${COLORS.text.primary} text-sm leading-relaxed ai-summary-content`}
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  dangerouslySetInnerHTML={{ __html: selectedReport.reconciliation.ai_summary }}
                />
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className={`text-xs ${COLORS.text.muted} italic`}>
                    Generated by Gemini AI • Insights based on reconciliation data and historical patterns
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 flex-wrap">
              {/* PDF Download */}
              <button
                onClick={() => exportReportPDF(selectedReport)}
                className="flex cursor-pointer items-center space-x-2 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 px-4 rounded-xl font-medium hover:from-red-700 hover:to-pink-700 transition-all duration-300"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>

              {/* CSV Download */}
              <button
                onClick={() => exportReportCSV(selectedReport)}
                className="flex cursor-pointer items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
              >
                <Download className="w-4 h-4" />
                <span>Download CSV</span>
              </button>

              {/* Close Button */}
              <button
                onClick={() => setShowReportModal(false)}
                className={`${COLORS.background.glass} ${COLORS.text.primary} py-3 px-4 rounded-xl font-medium hover:${COLORS.background.glassHover} transition-all duration-300 ${COLORS.border.light} border`}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default ReconciliationPage;
