/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  BarChart3,
  TrendingUp,
  Thermometer,
  CheckCircle,
  Clock,
  Database,
  RefreshCw,
  AlertTriangle,
  Target,
  Calculator,
  Terminal,
  Workflow,
  Info,
} from "lucide-react";
import { COLORS } from "../../../../component/Home";
import LoadingSpinner from "../../../../component/LoadingSpinner";
import { useUser } from "../../../../hook/useUser";
import { firebaseService } from "../../../../lib/firebase-service";
import { Modal } from "../../../../component/Modal";

// TypeScript Interfaces
interface TerminalReceipt {
  id: string;
  initial_volume_bbl: number;
  final_volume_bbl: number;
  temperature_degF: number;
  timestamp: Date;
  created_by: string;
}

export interface ReconciliationRun {
  id: string;
  timestamp: Date;
  total_terminal_volume: number;
  total_production_volume: number;
  shrinkage_factor: number;
  status: "completed" | "pending" | "failed";
  created_at: Date;
  created_by: string;
}

interface CreateTerminalReceiptData {
  initial_volume_bbl: number;
  final_volume_bbl: number;
  temperature_degF: number;
  api_gravity: number;
  timestamp: Date;
  created_by: string;
}

interface TerminalFormData {
  initial_volume_bbl: string;
  final_volume_bbl: string;
  temperature_degF: string;
  api_gravity: string;
  month: number;
  year: number;
}

interface ReconciliationDateRange {
  startDate: string;
  endDate: string;
}

// Reusable Components
interface SummaryCardProps {
  title: string;
  value: number | string;
  unit?: string;
  color: "blue" | "green" | "orange" | "purple";
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
  };

  const iconColors = {
    blue: "text-blue-400",
    green: "text-green-400",
    orange: "text-orange-400",
    purple: "text-purple-400",
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

interface ActionCardProps {
  title: string;
  description: string;
  buttonText: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant: "primary" | "secondary";
}

const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  buttonText,
  icon: Icon,
  onClick,
  variant,
}) => {
  const variants = {
    primary: `bg-gradient-to-br ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} hover:${COLORS.primary.blue[700]} hover:${COLORS.primary.purple[700]}`,
    secondary: `bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700`,
  };

  return (
    <div
      className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-2xl p-6 transition-all duration-300 hover:${COLORS.background.glassHover}`}
    >
      <div className="flex items-start space-x-4 mb-4">
        <div
          className={`w-12 h-12 rounded-xl ${COLORS.background.glassHover} flex items-center justify-center`}
        >
          <Icon className={`w-6 h-6 ${COLORS.primary.blue[400]}`} />
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${COLORS.text.primary} mb-2`}>
            {title}
          </h3>
          <p className={`${COLORS.text.secondary} text-sm leading-relaxed`}>
            {description}
          </p>
        </div>
      </div>
      <button
        onClick={onClick}
        className={`w-full cursor-pointer ${variants[variant]} text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02]`}
      >
        {buttonText}
      </button>
    </div>
  );
};

interface InputFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  step?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  icon: Icon,
  disabled = false,
  step,
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
        step={step}
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

interface DataTableProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  data: any[];
  columns: string[];
  renderRow: (item: any) => React.ReactNode;
  loading: boolean;
  emptyMessage: string;
}

const DataTable: React.FC<DataTableProps> = ({
  title,
  icon: Icon,
  data,
  columns,
  renderRow,
  loading,
  emptyMessage,
}) => (
  <div
    className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-2xl overflow-hidden`}
  >
    <div className="p-6 border-b border-white/10">
      <div className="flex items-center space-x-3">
        <Icon className={`w-5 h-5 ${COLORS.primary.blue[400]}`} />
        <h3 className={`text-lg font-semibold ${COLORS.text.primary}`}>
          {title}
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-xs ${COLORS.background.glassHover} ${COLORS.text.secondary}`}
        >
          {data.length} entries
        </span>
      </div>
    </div>

    <div className="overflow-x-auto">
      {loading ? (
        <div className="p-8 text-center">
          <LoadingSpinner message={`Loading ${title.toLowerCase()}...`} />
        </div>
      ) : data.length === 0 ? (
        <div className="p-8 text-center">
          <Database
            className={`w-16 h-16 ${COLORS.text.muted} mx-auto mb-4 opacity-50`}
          />
          <p className={`text-lg ${COLORS.text.secondary} mb-2`}>
            {emptyMessage}
          </p>
        </div>
      ) : (
        <table className="w-full">
          <thead className={`${COLORS.background.overlay}`}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className={`px-6 py-4 text-left text-xs font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {data.slice(0, 5).map((item) => renderRow(item))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);

// Main JV Coordinator Dashboard Component
const JVCoordinatorDashboard: React.FC = () => {
  const router = useRouter();
  const { auth, data: userData, loading: userLoading } = useUser();
  const [terminalReceipts, setTerminalReceipts] = useState<TerminalReceipt[]>(
    []
  );
  const [reconciliationRuns, setReconciliationRuns] = useState<
    ReconciliationRun[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showTerminalForm, setShowTerminalForm] = useState<boolean>(false);
  const [showReconcileForm, setShowReconcileForm] = useState<boolean>(false);

  const currentDate = new Date();
  const [terminalFormData, setTerminalFormData] = useState<TerminalFormData>({
    initial_volume_bbl: "",
    final_volume_bbl: "",
    temperature_degF: "",
    api_gravity: "",
    month: currentDate.getMonth(), // 0-11 (January is 0)
    year: currentDate.getFullYear(),
  });

  // Default to current month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [reconcileDateRange, setReconcileDateRange] =
    useState<ReconciliationDateRange>({
      startDate: formatDateForInput(firstDayOfMonth),
      endDate: formatDateForInput(lastDayOfMonth),
    });

  useEffect(() => {
    if (!userLoading && !auth) {
      router.push("/onboarding/login");
      return;
    }

    loadDashboardData();
  }, [userLoading, auth, userData, router]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [receipts, runs] = await Promise.all([
        firebaseService.getTerminalReceipts(undefined, undefined, 10),
        firebaseService.getReconciliationRuns(undefined, undefined, 10),
      ]);
      setTerminalReceipts(receipts);
      setReconciliationRuns(runs as any);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Convert month and year to last day of month at 23:59:59
  const getLastDayOfMonth = (month: number, year: number): Date => {
    // Create date for first day of next month, then subtract 1 millisecond
    const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return lastDay;
  };

  const handleTerminalSubmit = async () => {
    setLoading(true);
    try {
      // Convert month/year to last day of month at 23:59:59
      const timestamp = getLastDayOfMonth(terminalFormData.month, terminalFormData.year);

      const submissionData: CreateTerminalReceiptData = {
        initial_volume_bbl: parseFloat(terminalFormData.initial_volume_bbl),
        final_volume_bbl: parseFloat(terminalFormData.final_volume_bbl),
        temperature_degF: parseFloat(terminalFormData.temperature_degF),
        api_gravity: parseFloat(terminalFormData.api_gravity),
        timestamp: timestamp,
        created_by: auth.uid,
      };

      await firebaseService.createTerminalReceipt(submissionData);
      setShowTerminalForm(false);
      const resetDate = new Date();
      setTerminalFormData({
        initial_volume_bbl: "",
        final_volume_bbl: "",
        api_gravity: "",
        temperature_degF: "",
        month: resetDate.getMonth(),
        year: resetDate.getFullYear(),
      });
      await loadDashboardData();
    } catch (error: any) {
      console.error("Error saving terminal receipt:", error.message);
      alert(
        ` ${
          error.message ?? "Error saving terminal receipt. Please try again."
        } `
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async () => {
    setLoading(true);
    try {
      const existingCheck = await firebaseService.checkExistingReconciliation(
        new Date(reconcileDateRange.startDate),
        new Date(reconcileDateRange.endDate)
      );
      if (existingCheck.exists) {
        alert(existingCheck.message);
        setLoading(false);
        return;
      }

      await firebaseService.triggerReconciliation(
        new Date(reconcileDateRange.startDate),
        new Date(reconcileDateRange.endDate),
        auth.uid
      );

      setShowReconcileForm(false);
      await loadDashboardData();
      alert("Reconciliation completed successfully!");
    } catch (error) {
      console.error("Error triggering reconciliation:", error);
      alert(
        "Error running reconciliation. Please check that production entries and terminal receipts exist for the selected date."
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const todaysReceipts = terminalReceipts.filter((receipt) => {
    const today = new Date();
    const receiptDate = new Date(receipt.timestamp);
    return receiptDate.toDateString() === today.toDateString();
  });

  const thisWeekRuns = reconciliationRuns.filter((run) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(run.created_at) >= weekAgo;
  });

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
            >
              <Workflow className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className={`${COLORS.text.secondary} flex flex-col`}>
                <span>Welcome, {userData?.email}</span>
                <span>Manage terminal receipts and reconciliations</span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SummaryCard
            title="Today's Receipts"
            value={todaysReceipts.length}
            color="blue"
            icon={Terminal}
            // trend={{ value: 15.2, isPositive: true }}
          />
          <SummaryCard
            title="This Week's Runs"
            value={thisWeekRuns.length}
            color="green"
            icon={RefreshCw}
            // trend={{ value: 8.7, isPositive: true }}
          />
          <SummaryCard
            title="Total Receipts"
            value={terminalReceipts.length}
            color="orange"
            icon={Database}
          />
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <ActionCard
            title="Record Terminal Receipt"
            description="Enter terminal measurement data for allocation calculations. Record initial and final volumes along with temperature readings."
            buttonText="Add Terminal Receipt"
            icon={Terminal}
            onClick={() => setShowTerminalForm(true)}
            variant="primary"
          />
          <ActionCard
            title="Trigger Reconciliation"
            description="Run monthly reconciliation to calculate partner allocations. Ensure production entries and terminal receipts exist for the selected period."
            buttonText="Run Reconciliation"
            icon={Calculator}
            // onClick={() => setShowReconcileForm(true)}
            onClick={() => router.push("/reconciliation")}
            variant="secondary"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Terminal Receipts */}
          <DataTable
            title="Recent Terminal Receipts"
            icon={Terminal}
            data={terminalReceipts?.slice(0, 5)}
            columns={["Date", "Final Volume", "Temperature", "Status"]}
            loading={loading}
            emptyMessage="No terminal receipts recorded yet."
            renderRow={(receipt: TerminalReceipt) => (
              <tr
                key={receipt.id}
                className="hover:bg-white/5 transition-colors"
              >
                <td
                  className={`px-6 py-4 whitespace-nowrap ${COLORS.text.primary}`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {new Date(receipt.timestamp).toLocaleDateString()}
                    </span>
                    <span className={`text-xs ${COLORS.text.muted}`}>
                      {new Date(receipt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.text.primary} font-medium`}
                >
                  {receipt.final_volume_bbl.toLocaleString()} BBL
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.text.primary}`}
                >
                  {receipt.temperature_degF}°F
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </td>
              </tr>
            )}
          />

          {/* Recent Reconciliation Runs */}
          <DataTable
            title="Recent Reconciliation Runs"
            icon={RefreshCw}
            data={reconciliationRuns.slice(0, 5)}
            columns={["Date", "Terminal Volume", "Shrinkage", "Status"]}
            loading={loading}
            emptyMessage="No reconciliation runs yet."
            renderRow={(run: ReconciliationRun) => (
              <tr key={run.id} className="hover:bg-white/5 transition-colors">
                <td
                  className={`px-6 py-4 whitespace-nowrap ${COLORS.text.primary}`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {new Date(run.timestamp).toLocaleDateString()}
                    </span>
                    <span className={`text-xs ${COLORS.text.muted}`}>
                      {new Date(run.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.text.primary} font-medium`}
                >
                  {run.total_terminal_volume.toLocaleString()} BBL
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.text.primary}`}
                >
                  {((1 - run.shrinkage_factor) * 100).toFixed(2)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs ${
                      run.status === "completed"
                        ? "bg-green-500/20 text-green-400"
                        : run.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {run.status === "completed" && (
                      <CheckCircle className="w-3 h-3" />
                    )}
                    {run.status === "pending" && <Clock className="w-3 h-3" />}
                    {run.status === "failed" && (
                      <AlertTriangle className="w-3 h-3" />
                    )}
                    <span className="capitalize">{run.status}</span>
                  </span>
                </td>
              </tr>
            )}
          />
        </div>
      </div>

      {/* Terminal Receipt Form Modal */}
      <Modal
        isOpen={showTerminalForm}
        onClose={() => setShowTerminalForm(false)}
        title="Add Terminal Receipt"
      >
        <div className="space-y-6">
          {/* Month and Year Selector */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Month
              </label>
              <select
                value={terminalFormData.month}
                onChange={(e) =>
                  setTerminalFormData((prev) => ({
                    ...prev,
                    month: parseInt(e.target.value),
                  }))
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              >
                <option value={0}>January</option>
                <option value={1}>February</option>
                <option value={2}>March</option>
                <option value={3}>April</option>
                <option value={4}>May</option>
                <option value={5}>June</option>
                <option value={6}>July</option>
                <option value={7}>August</option>
                <option value={8}>September</option>
                <option value={9}>October</option>
                <option value={10}>November</option>
                <option value={11}>December</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Year
              </label>
              <input
                type="number"
                value={terminalFormData.year}
                onChange={(e) =>
                  setTerminalFormData((prev) => ({
                    ...prev,
                    year: parseInt(e.target.value),
                  }))
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                placeholder="Enter year"
                min="2020"
                max="2100"
              />
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-200">
                Terminal receipt will be recorded for the last day of{" "}
                {new Date(terminalFormData.year, terminalFormData.month).toLocaleDateString(
                  "en-US",
                  { month: "long", year: "numeric" }
                )}{" "}
                at 11:59 PM
              </p>
            </div>
          </div>

          <InputField
            label="Initial Volume (BBL)"
            type="number"
            step="0.01"
            value={terminalFormData.initial_volume_bbl}
            onChange={(value) =>
              setTerminalFormData((prev) => ({
                ...prev,
                initial_volume_bbl: value,
              }))
            }
            placeholder="Enter initial volume"
            icon={BarChart3}
            disabled={loading}
          />

          <InputField
            label="Final Volume (BBL)"
            type="number"
            step="0.01"
            value={terminalFormData.final_volume_bbl}
            onChange={(value) =>
              setTerminalFormData((prev) => ({
                ...prev,
                final_volume_bbl: value,
              }))
            }
            placeholder="Enter final volume"
            icon={Target}
            disabled={loading}
          />
          <InputField
            label="Final API Gravity (°API)"
            type="number"
            step="0.1"
            value={terminalFormData.api_gravity}
            onChange={(value) =>
              setTerminalFormData((prev) => ({
                ...prev,
                api_gravity: value,
              }))
            }
            placeholder="Enter API Gravity"
            icon={Thermometer}
            disabled={loading}
          />
          <InputField
            label="Temperature (°F)"
            type="number"
            step="0.1"
            value={terminalFormData.temperature_degF}
            onChange={(value) =>
              setTerminalFormData((prev) => ({
                ...prev,
                temperature_degF: value,
              }))
            }
            placeholder="Enter temperature"
            icon={Thermometer}
            disabled={loading}
          />

          {/* Volume Difference Preview */}
          {terminalFormData.initial_volume_bbl &&
            terminalFormData.final_volume_bbl && (
              <div
                className={`p-4 ${COLORS.background.glass} rounded-xl ${COLORS.border.light} border`}
              >
                <h4
                  className={`text-sm font-medium ${COLORS.text.primary} mb-2`}
                >
                  Volume Analysis:
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex justify-between">
                    <span className={COLORS.text.muted}>Initial Volume:</span>
                    <span className={COLORS.text.secondary}>
                      {parseFloat(
                        terminalFormData.initial_volume_bbl
                      ).toLocaleString()}{" "}
                      BBL
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={COLORS.text.muted}>Final Volume:</span>
                    <span className={COLORS.text.secondary}>
                      {parseFloat(
                        terminalFormData.final_volume_bbl
                      ).toLocaleString()}{" "}
                      BBL
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={COLORS.text.muted}>Volume Loss:</span>
                    <span className="text-orange-400">
                      {(
                        parseFloat(terminalFormData.initial_volume_bbl) -
                        parseFloat(terminalFormData.final_volume_bbl)
                      ).toFixed(2)}{" "}
                      BBL
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={COLORS.text.muted}>Shrinkage %:</span>
                    <span className="text-red-400">
                      {(
                        ((parseFloat(terminalFormData.initial_volume_bbl) -
                          parseFloat(terminalFormData.final_volume_bbl)) /
                          parseFloat(terminalFormData.initial_volume_bbl)) *
                        100
                      ).toFixed(2)}
                      %
                    </span>
                  </div>
                </div>
              </div>
            )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleTerminalSubmit}
              disabled={
                loading ||
                !terminalFormData.initial_volume_bbl ||
                !terminalFormData.final_volume_bbl ||
                !terminalFormData.temperature_degF ||
                !terminalFormData.api_gravity
              }
              className={`flex-1 bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} text-white py-3 px-4 rounded-xl font-medium hover:${COLORS.primary.blue[700]} hover:${COLORS.primary.purple[700]} transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Receipt</span>
              )}
            </button>
            <button
              onClick={() => setShowTerminalForm(false)}
              className={`flex-1 ${COLORS.background.glass} ${COLORS.text.primary} py-3 px-4 rounded-xl font-medium hover:${COLORS.background.glassHover} transition-all duration-300 ${COLORS.border.light} border`}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Reconciliation Form Modal */}
      <Modal
        isOpen={showReconcileForm}
        onClose={() => setShowReconcileForm(false)}
        title="Trigger Reconciliation"
      >
        <div className="space-y-6">
          <InputField
            label="Start Date"
            type="date"
            value={reconcileDateRange.startDate}
            onChange={(value) =>
              setReconcileDateRange((prev) => ({ ...prev, startDate: value }))
            }
            icon={Calendar}
            disabled={loading}
          />

          <InputField
            label="End Date"
            type="date"
            value={reconcileDateRange.endDate}
            onChange={(value) =>
              setReconcileDateRange((prev) => ({ ...prev, endDate: value }))
            }
            icon={Calendar}
            disabled={loading}
          />

          {/* Date Range Preview */}
          <div
            className={`p-4 ${COLORS.background.glass} rounded-xl ${COLORS.border.light} border`}
          >
            <h4
              className={`text-sm font-medium ${COLORS.text.primary} mb-2 flex items-center space-x-2`}
            >
              <Info className="w-4 h-4" />
              <span>Reconciliation Period:</span>
            </h4>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className={COLORS.text.muted}>Period:</span>
                <span className={COLORS.text.secondary}>
                  {new Date(reconcileDateRange.startDate).toLocaleDateString()}{" "}
                  - {new Date(reconcileDateRange.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={COLORS.text.muted}>Duration:</span>
                <span className={COLORS.text.secondary}>
                  {Math.ceil(
                    (new Date(reconcileDateRange.endDate).getTime() -
                      new Date(reconcileDateRange.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  days
                </span>
              </div>
            </div>
          </div>

          {/* Warning Note */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-400 font-medium mb-1">
                  Important Note:
                </p>
                <p className="text-sm text-yellow-300/80">
                  Ensure that production entries and terminal receipts exist for
                  the selected date range before running reconciliation. The
                  system will calculate partner allocations based on available
                  data.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleReconcile}
              disabled={
                loading ||
                !reconcileDateRange.startDate ||
                !reconcileDateRange.endDate
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
                  <Calculator className="w-4 h-4" />
                  <span>Run Reconciliation</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowReconcileForm(false)}
              className={`flex-1 ${COLORS.background.glass} ${COLORS.text.primary} py-3 px-4 rounded-xl font-medium hover:${COLORS.background.glassHover} transition-all duration-300 ${COLORS.border.light} border`}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default JVCoordinatorDashboard;
