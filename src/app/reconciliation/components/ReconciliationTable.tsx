"use client";
import {
  RefreshCw,
  Calculator,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { COLORS } from "../../../../component/Home";
import { ReconciliationRun } from "../../../../types";
import { Timestamp } from "firebase/firestore";
import { formatFirebaseTimestampRange } from "../../../../utils/timestampToPeriod";
import LoadingSpinner from "../../../../component/LoadingSpinner";

interface ReconciliationTableProps {
  reconciliationRuns: ReconciliationRun[];
  loading: boolean;
  onViewReport: (run: ReconciliationRun) => void;
}

export const ReconciliationTable: React.FC<ReconciliationTableProps> = ({
  reconciliationRuns,
  loading,
  onViewReport
}) => {
  return (
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
                const volumeLoss =
                  run.total_volume_loss !== undefined
                    ? run.total_volume_loss
                    : run.total_input_volume - run.total_terminal_volume;

                // Use stored allocated volume if available, otherwise use terminal volume as fallback
                const allocatedVolume =
                  run.total_allocated_volume !== undefined
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
                        onClick={() => onViewReport(run)}
                        className="flex cursor-pointer items-center space-x-1 px-3 py-1 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
                        aria-label={`View report for ${formatFirebaseTimestampRange(
                          run.start_date as Timestamp,
                          run.end_date as Timestamp
                        )}`}
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
  );
};
