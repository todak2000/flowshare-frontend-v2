"use client";
import { Play, Calendar, Info, Calculator, Activity, X } from "lucide-react";
import { COLORS } from "../../../../component/Home";
import { PeriodSummaryDisplay } from "./PeriodSummaryDisplay";

interface ReconciliationPeriodSummary {
  periodStart: Date;
  periodEnd: Date;
  totalProductionEntries: number;
  totalTerminalReceipts: number;
  partnersInvolved: string[];
  readyForReconciliation: boolean;
  issues: string[];
}

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
    <label className={`block text-sm font-medium ${COLORS.text.primary}`} htmlFor={`input-${label.replace(/\s+/g, '-').toLowerCase()}`}>
      {label}
    </label>
    <div className="relative">
      <div
        className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${COLORS.text.muted}`}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </div>
      <input
        id={`input-${label.replace(/\s+/g, '-').toLowerCase()}`}
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
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        ></div>

        {/* Modal panel */}
        <div
          className={`inline-block align-bottom ${COLORS.background.card} backdrop-blur-xl rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizeClasses[size]} sm:w-full ${COLORS.border.light} border`}
        >
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 id="modal-title" className={`text-lg font-semibold ${COLORS.text.primary}`}>
                {title}
              </h3>
              <button
                onClick={onClose}
                className={`${COLORS.text.muted} hover:${COLORS.text.primary} transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded`}
                aria-label="Close modal"
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

interface RunReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reconcileDateRange: {
    startDate: string;
    endDate: string;
  };
  updateStartDate: (date: string) => void;
  updateEndDate: (date: string) => void;
  periodSummary: ReconciliationPeriodSummary | null;
  loading: boolean;
  onCheckPeriod: () => Promise<void>;
  onRunReconciliation: () => Promise<void>;
}

export const RunReconciliationModal: React.FC<RunReconciliationModalProps> = ({
  isOpen,
  onClose,
  reconcileDateRange,
  updateStartDate,
  updateEndDate,
  periodSummary,
  loading,
  onCheckPeriod,
  onRunReconciliation,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Run Period Reconciliation"
      size="lg"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Start Date"
            type="date"
            value={reconcileDateRange.startDate}
            onChange={updateStartDate}
            icon={Calendar}
            disabled={loading}
          />
          <InputField
            label="End Date"
            type="date"
            value={reconcileDateRange.endDate}
            onChange={updateEndDate}
            icon={Calendar}
            disabled={loading}
          />
        </div>

        {/* Period Summary Check */}
        <div className="flex items-center gap-4">
          <button
            onClick={onCheckPeriod}
            disabled={
              loading ||
              !reconcileDateRange.startDate ||
              !reconcileDateRange.endDate
            }
            className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} text-white rounded-xl hover:${COLORS.primary.blue[700]} hover:${COLORS.primary.purple[700]} transition-all duration-300 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            aria-label="Check period data availability"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true"></div>
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
            onClick={onRunReconciliation}
            disabled={
              loading ||
              !reconcileDateRange?.startDate ||
              !reconcileDateRange?.endDate ||
              !periodSummary?.readyForReconciliation
            }
            className={`flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-green-500`}
            aria-label="Run reconciliation for selected period"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true"></div>
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
            onClick={onClose}
            className={`flex-1 ${COLORS.background.glass} ${COLORS.text.primary} py-3 px-4 rounded-xl font-medium hover:${COLORS.background.glassHover} transition-all duration-300 ${COLORS.border.light} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            aria-label="Cancel and close modal"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
