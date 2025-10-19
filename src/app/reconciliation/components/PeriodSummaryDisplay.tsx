import { CheckCircle, AlertTriangle } from "lucide-react";
import { COLORS } from "../../../../component/Home";

interface ReconciliationPeriodSummary {
  periodStart: Date;
  periodEnd: Date;
  totalProductionEntries: number;
  totalTerminalReceipts: number;
  partnersInvolved: string[];
  readyForReconciliation: boolean;
  issues: string[];
}

interface PeriodSummaryDisplayProps {
  summary: ReconciliationPeriodSummary;
}

export const PeriodSummaryDisplay: React.FC<PeriodSummaryDisplayProps> = ({
  summary,
}) => (
  <div
    className={`p-4 rounded-xl border ${
      summary.readyForReconciliation
        ? "bg-green-500/10 border-green-500/20"
        : "bg-red-500/10 border-red-500/20"
    }`}
    role="region"
    aria-label="Period summary"
  >
    <h4
      className={`text-sm font-semibold mb-3 flex items-center space-x-2 ${
        summary.readyForReconciliation ? "text-green-400" : "text-red-400"
      }`}
    >
      {summary.readyForReconciliation ? (
        <CheckCircle className="w-4 h-4" aria-hidden="true" />
      ) : (
        <AlertTriangle className="w-4 h-4" aria-hidden="true" />
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
      <div className="mb-4" role="alert">
        <span className="text-red-400 font-medium text-sm">Issues:</span>
        <ul className="mt-1 text-sm text-red-300 space-y-1">
          {summary.issues.map((issue, index) => (
            <li key={index} className="flex items-start space-x-2">
              <span className="text-red-400 mt-1" aria-hidden="true">•</span>
              <span>{issue}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {summary.readyForReconciliation && (
      <div
        className="p-3 bg-green-500/20 rounded-lg text-sm text-green-300"
        role="status"
      >
        ✓ Ready for reconciliation! All required data is available for this
        period.
      </div>
    )}
  </div>
);
