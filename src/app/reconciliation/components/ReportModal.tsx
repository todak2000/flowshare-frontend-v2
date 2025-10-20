"use client";
import {
  Download,
  Calendar,
  BarChart3,
  Users,
  X,
} from "lucide-react";
import { COLORS } from "../../../../component/Home";
import { ReconciliationReport } from "../../../../types";
import { Timestamp } from "firebase/firestore";
import { formatFirebaseTimestampRange } from "../../../../utils/timestampToPeriod";

/**
 * Utility function to clean AI-generated HTML content
 * Removes markdown code block markers (```html ... ```)
 */
const cleanAIContent = (html: string): string => {
  if (!html) return '';

  // Remove markdown code blocks: ```html ... ``` or ``` ... ```
  return html
    .replace(/```(?:html|xml|css|javascript|js)?\s*\n?/g, '')
    .replace(/```\s*$/g, '')
    .trim();
};

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
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
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
              <h3 id="report-modal-title" className={`text-lg font-semibold ${COLORS.text.primary}`}>
                {title}
              </h3>
              <button
                onClick={onClose}
                className={`${COLORS.text.muted} hover:${COLORS.text.primary} transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded`}
                aria-label="Close report modal"
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

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReconciliationReport | null;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
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
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  if (!report) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reconciliation Report - ${formatFirebaseTimestampRange(
        report.reconciliation.start_date as Timestamp,
        report.reconciliation.end_date as Timestamp
      )}`}
      size="xl"
    >
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
                  report.reconciliation.start_date as Timestamp,
                  report.reconciliation.end_date as Timestamp
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className={COLORS.text.muted}>Run Date:</span>
              <span className={`${COLORS.text.primary} font-medium`}>
                {new Date(report.reconciliation.timestamp).toLocaleDateString()}
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
                {report.summary.totalPartners}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={COLORS.text.muted}>Input Volume:</span>
              <span className={`${COLORS.text.primary} font-medium`}>
                {report.summary.totalInputVolume.toLocaleString()} BBL
              </span>
            </div>
            <div className="flex justify-between">
              <span className={COLORS.text.muted}>Terminal Volume:</span>
              <span className={`${COLORS.text.primary} font-medium`}>
                {report.summary.actualTerminalVolume.toLocaleString()} BBL
              </span>
            </div>
            <div className="flex justify-between">
              <span className={COLORS.text.muted}>Volume Loss/Gain:</span>
              <span
                className={`${
                  report.summary.totalVolumeLoss > 0
                    ? "text-red-400"
                    : "text-green-400"
                } font-medium`}
              >
                {report.summary.totalVolumeLoss.toLocaleString()} BBL
              </span>
            </div>
            <div className="flex justify-between">
              <span className={COLORS.text.muted}>Shrinkage:</span>
              <span
                className={`${
                  report.summary.shrinkagePercentage < 0
                    ? "text-orange-400"
                    : "text-green-400"
                } font-medium`}
              >
                {Math.abs(report.summary.shrinkagePercentage).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className={COLORS.text.muted}>Allocated Volume:</span>
              <span className="text-green-400 font-medium">
                {report.summary.totalAllocatedVolume.toLocaleString()} BBL
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
            <table className="w-full text-sm" aria-label="Partner allocations table">
              <thead className={`${COLORS.background.overlay}`}>
                <tr>
                  <th
                    scope="col"
                    className={`px-3 py-3 text-left font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                  >
                    Partner
                  </th>
                  <th
                    scope="col"
                    className={`px-3 py-3 text-left font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                  >
                    Input Vol
                  </th>
                  <th
                    scope="col"
                    className={`px-3 py-3 text-left font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                  >
                    Allocated Vol
                  </th>
                  <th
                    scope="col"
                    className={`px-3 py-3 text-left font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                  >
                    GAIN/Loss
                  </th>
                  <th
                    scope="col"
                    className={`px-3 py-3 text-left font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                  >
                    Share
                  </th>
                  <th
                    scope="col"
                    className={`px-3 py-3 text-left font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                  >
                    Efficiency
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {report.allocations.map((allocation) => {
                  const efficiency =
                    (allocation.allocated_volume /
                      Math.max(allocation.input_volume, 1)) *
                    100;
                  return (
                    <tr
                      key={allocation.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className={`px-3 py-3 font-medium ${COLORS.text.primary}`}>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full" aria-hidden="true"></div>
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
        {report.reconciliation.ai_summary && (
          <div
            className={`${COLORS.background.glass} rounded-xl p-4 ${COLORS.border.light} border`}
          >
            <h4
              className={`font-semibold mb-3 ${COLORS.text.primary} flex items-center space-x-2`}
            >
              <span className="text-xl" aria-hidden="true">🤖</span>
              <span>AI-Powered Executive Summary</span>
            </h4>
            <div
              className={`${COLORS.text.primary} text-sm leading-relaxed ai-summary-content`}
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              dangerouslySetInnerHTML={{
                __html: cleanAIContent(report.reconciliation.ai_summary),
              }}
            />
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className={`text-xs ${COLORS.text.muted} italic`}>
                Generated by Gemini AI • Insights based on reconciliation data
                and historical patterns
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 flex-wrap">
          {/* PDF Download */}
          <button
            onClick={() => exportReportPDF(report)}
            className="flex cursor-pointer items-center space-x-2 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 px-4 rounded-xl font-medium hover:from-red-700 hover:to-pink-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Download report as PDF"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          {/* CSV Download */}
          <button
            onClick={() => exportReportCSV(report)}
            className="flex cursor-pointer items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Download report as CSV"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className={`${COLORS.background.glass} ${COLORS.text.primary} py-3 px-4 rounded-xl font-medium hover:${COLORS.background.glassHover} transition-all duration-300 ${COLORS.border.light} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            aria-label="Close report"
          >
            Close
          </button>
        </div>

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
      </div>
    </Modal>
  );
};
