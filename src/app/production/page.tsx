/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Edit,
  Activity,
  Table,
  CheckCircle,
  Database,
  CircleQuestionMark,
  Trash2,
} from "lucide-react";
import { ProductionFormData } from "../../../component/formField";
import { ProductionEntry, UserRole } from "../../../types";
import { COLORS } from "../../../component/Home";
import { CHART_COLORS } from "../../../constants/ui";
import { PRODUCTION_FORM_FIELD_CONFIGS } from "../../../constants/forms";
import { useUser } from "../../../hook/useUser";
import { useProductionCalculations } from "../../../hook/useProductionCalculations";
import { firebaseService } from "../../../lib/firebase-service";
import { formatDateForInput } from "../../../utils/date";
import { Modal } from "../../../component/Modal";
import {
  validateProductionEntry,
  sendNotification,
} from "../../../lib/agents-api";
import { ProductionChart } from "../../../component/ProductionChart";
import { PartnerPieChart } from "../../../component/PartnerPieChart";
import LoadingSpinner from "../../../component/LoadingSpinner";
import { formatWithOrdinal } from "../../../utils/timestampToPeriod";
import { formatNumber } from "../../../utils/formatNumber";
import { formatAiAnalysis } from "../../../utils/formatAiAnalysis";
import { ProductionStats } from "./components/ProductionStats";
import { ProductionFilters } from "./components/ProductionFilters";
import { ProductionForm } from "./components/ProductionForm";

interface Filters {
  partner: string;
  startDate: string;
  endDate: string;
  search: string;
}

export interface ChartDataPoint {
  date: string;
  volume: number;
  entries: number;
}

export interface PartnerData {
  partner: string;
  volume: number;
  percentage: number;
}
interface FormFieldConfig {
  id: string;
  key: keyof ProductionFormData;
  label: string;
  unit: string;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
}

type TabType = "dashboard" | "data" | "analytics";

// Use imported constants
const FORM_FIELDS = PRODUCTION_FORM_FIELD_CONFIGS;

// Utility functions
const downloadCSV = (data: ProductionEntry[]): void => {
  const csvContent = [
    [
      "Date",
      "Partner",
      "Volume (BBL)",
      "BSW (%)",
      "Temperature (°F)",
      "API Gravity (°API)",
    ].join(","),
    ...data.map((entry) =>
      [
        new Date(entry.timestamp).toLocaleDateString(),
        entry.partner,
        entry.gross_volume_bbl,
        entry.bsw_percent,
        entry.temperature_degF,
        entry.api_gravity,
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `production-data-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Reusable Components
interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  handleMonthChange: (i: "prev" | "next") => void;
  selectedMonth: {
    year: number;
    month: number;
  };
  paginationInfo?: Record<string, number | string | undefined | boolean>;
  isCurrentOrFutureMonth: boolean;
  entriesCount: {
    filtered: number;
    total: number;
  };
  role: UserRole;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  handleMonthChange,
  selectedMonth,
  paginationInfo,
  isCurrentOrFutureMonth,
  entriesCount,
  role,
}) => {
  const tabs: {
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "data", label: "Data Table", icon: Table },
    { id: "dashboard", label: "Analytics", icon: Activity },
  ];

  return (
    <div className="p-6 border-b border-white/10">
      <div className="flex space-x-1 justify-between items-center">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex cursor-pointer items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} text-white shadow-lg`
                    : `${COLORS.text.secondary} hover:${COLORS.text.primary} hover:${COLORS.background.glassHover}`
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <ProductionFilters
          selectedMonth={selectedMonth}
          onMonthChange={handleMonthChange}
          isCurrentOrFutureMonth={isCurrentOrFutureMonth}
        />
        <ActionButtons
          entriesCount={entriesCount}
          paginationInfo={paginationInfo}
          role={role}
        />
      </div>
    </div>
  );
};
interface ActionButtonsProps {
  entriesCount: { filtered: number; total: number };
  paginationInfo:
    | Record<string, string | number | boolean | undefined>
    | undefined;
  role: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  entriesCount,
  paginationInfo,
  role,
}) => {
  return (
    <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
      <div className="flex items-center space-x-4">
        {role === "jv_coordinator" && paginationInfo ? (
          <div className="flex items-center space-x-4">
            <div className={`text-sm ${COLORS.text.secondary}`}>
              Showing {paginationInfo.startItem}-{paginationInfo.endItem} of{" "}
              {paginationInfo.totalItems}
            </div>
            <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
              Page {paginationInfo.currentPage}/{paginationInfo.totalPages}
            </div>
            {entriesCount.total && (
              <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                Month Total: {entriesCount.total}
              </div>
            )}
          </div>
        ) : (
          <div className={`text-sm ${COLORS.text.secondary}`}>
            Showing {entriesCount.filtered} of {entriesCount.total} entries
          </div>
        )}
      </div>
    </div>
  );
};

interface ProductionTableProps {
  data: ProductionEntry[];
  loading: boolean;
  canEdit: boolean;
  onEdit: (entry: ProductionEntry) => void;
  onDelete: (id: string) => void;
  onApprove: (entry: ProductionEntry) => void;
  onViewFlagged: (entry: ProductionEntry) => void;
  goToPreviousPage: () => void;
  hasPrevious: boolean;
  hasMore: boolean;
  total: number;
  role: UserRole;
  currentPage: number;
  goToNextPage: () => void;
  paginationInfo:
    | Record<string, string | boolean | number | undefined>
    | undefined;
}

const ProductionTable: React.FC<ProductionTableProps> = ({
  data,
  loading,
  canEdit,
  onEdit,
  onApprove,
  onDelete,
  onViewFlagged,
  goToPreviousPage,
  hasPrevious,
  role,
  hasMore,
  currentPage,
  total,
  goToNextPage,
  paginationInfo,
}) => {
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
          <span className={COLORS.text.secondary}>
            Loading production data...
          </span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-8 text-center">
        <Database className={`w-16 h-16 ${COLORS.text.muted} mx-auto mb-4`} />
        <p className={`text-lg ${COLORS.text.secondary} mb-2`}>
          No production data found
        </p>
        <p className={`${COLORS.text.muted}`}>
          Try adjusting your filters or add new entries
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${COLORS.background.overlay}`}>
            <tr>
              {[
                "Date & Time",
                "Partner",
                "Volume (BBL)",
                "BSW (%)",
                "Temperature (°F)",
                "API Gravity (°API)",
                "Status",
                canEdit && role === "jv_coordinator" ? "Actions" : "",
              ].map((i) => (
                <th
                  key={i}
                  className={`px-6 py-4 text-left text-xs font-medium ${COLORS.text.muted} uppercase tracking-wider`}
                >
                  {i}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {data.map((entry) => (
              <tr
                key={entry.id}
                className={`${
                  entry.flagged ? "hover:bg-red-500/20" : "hover:bg-white/5"
                } transition-colors`}
              >
                <td
                  className={`px-6 py-4 whitespace-nowrap ${COLORS.text.primary}`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {formatWithOrdinal(entry.timestamp)}
                    </span>
                    <span className={`text-xs ${COLORS.text.muted}`}>
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.text.primary}`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>{entry.partner}</span>
                  </div>
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.text.primary} font-medium`}
                >
                  {entry.gross_volume_bbl.toLocaleString()}
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.text.primary}`}
                >
                  {entry.bsw_percent.toFixed(2)}
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.text.primary}`}
                >
                  {entry.temperature_degF}
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.text.primary}`}
                >
                  {entry.api_gravity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {entry.flagged ? (
                    <button
                      onClick={() => onViewFlagged(entry)}
                      className="flex items-center gap-2 cursor-pointer hover:bg-red-500/10 px-3 py-1 rounded-lg transition-colors"
                    >
                      <span className="text-red-600 text-xl">⚠️</span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-red-600 text-white">
                        FLAGGED - View Details
                      </span>
                    </button>
                  ) : entry?.edited_by && !entry?.isApproved ? (
                    <button
                      disabled={role !== "jv_partner"}
                      onClick={
                        role !== "jv_partner"
                          ? () => null
                          : () => onApprove(entry)
                      }
                      className="inline-flex items-center disabled:cursor-not-allowed cursor-pointer space-x-1 px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400"
                    >
                      <CircleQuestionMark className="w-3 h-3" />
                      <span>Pending Partner Approval</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                      <CheckCircle className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  )}
                </td>
                {canEdit && role === "jv_coordinator" && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(entry)}
                        className="p-2 rounded-lg cursor-pointer hover:bg-blue-500/20 text-blue-400 transition-colors"
                        title="Edit entry"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {role !== "jv_coordinator" ? (
                        <button
                          onClick={() => onDelete(entry.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        ""
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationComponent
        goToPreviousPage={goToPreviousPage}
        loading={loading}
        hasPrevious={hasPrevious}
        paginationInfo={paginationInfo}
        currentPage={currentPage}
        data={data}
        goToNextPage={goToNextPage}
        hasMore={hasMore}
        total={total}
      />
    </>
  );
};

interface PaginationProps {
  data: ProductionEntry[];
  loading: boolean;
  goToPreviousPage: () => void;
  hasPrevious: boolean;
  hasMore: boolean;
  total: number;
  currentPage: number;
  goToNextPage: () => void;
  paginationInfo:
    | Record<string, string | boolean | number | undefined>
    | undefined;
}
const PaginationComponent: React.FC<PaginationProps> = ({
  goToPreviousPage,
  loading,
  hasPrevious,
  paginationInfo,
  currentPage,
  data,
  goToNextPage,
  hasMore,
  total,
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-t border-white/10">
      <button
        onClick={goToPreviousPage}
        disabled={!hasPrevious || loading}
        className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
          !hasPrevious || loading
            ? "text-gray-300 cursor-not-allowed opacity-50"
            : "text-blue-400 hover:bg-blue-400/10"
        }`}
      >
        <span>← Previous</span>
      </button>

      <div className="flex items-center space-x-4">
        {paginationInfo ? (
          <>
            {/* Page Info */}
            <span className={`text-sm ${COLORS.text.secondary}`}>
              Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
            </span>

            {/* Items Range */}
            <span className={`text-xs ${COLORS.text.muted}`}>
              {paginationInfo.startItem}-{paginationInfo.endItem} of{" "}
              {paginationInfo.totalItems}
            </span>

            {/* Progress bar for large datasets */}
            {(paginationInfo?.totalItems as number) > 31 && (
              <div className="flex items-center space-x-2">
                <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-400 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        paginationInfo?.progressPercentage as number
                      )}%`,
                    }}
                  />
                </div>
                <span className={`text-xs ${COLORS.text.muted}`}>
                  {paginationInfo.progressPercentage}%
                </span>
              </div>
            )}
          </>
        ) : (
          // Fallback to original display
          <>
            <span className={`text-sm ${COLORS.text.secondary}`}>
              Page {currentPage + 1}
            </span>
            <span className={`text-xs ${COLORS.text.muted}`}>
              Showing {data.length} of {total} entries
            </span>
          </>
        )}
      </div>

      <button
        onClick={goToNextPage}
        disabled={!hasMore || loading}
        className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
          !hasMore || loading
            ? "text-gray-300 cursor-not-allowed opacity-50"
            : "text-blue-400 hover:bg-blue-400/10"
        }`}
      >
        <span>{loading ? "Loading..." : "Next →"}</span>
      </button>
    </div>
  );
};

interface FormFieldProps {
  field: FormFieldConfig;
  value: string;
  onChange: (key: keyof ProductionFormData, value: string) => void;
  disabled?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  field,
  value,
  onChange,
  disabled = false,
}) => {
  const IconComponent = field.icon;

  return (
    <div className="space-y-2">
      <label className={`block text-sm font-medium ${COLORS.text.primary}`}>
        {field.label} ({field.unit})
      </label>
      <div className="relative">
        <div
          className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${COLORS.text.muted}`}
        >
          <IconComponent className="h-5 w-5" />
        </div>
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
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
};

// Main Production Dashboard Component
const ProductionDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("data");
  const [allProductionData, setAllProductionData] = useState<ProductionEntry[]>(
    []
  );

  const [total, setTotal] = useState<number>(0);

  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [hasPrevious, setHasPrevious] = useState<boolean>(false);
  const [filteredData, setFilteredData] = useState<ProductionEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<ProductionEntry | null>(
    null
  );
  const [flaggedEntry, setFlaggedEntry] = useState<ProductionEntry | null>(null);
  const [showFlaggedModal, setShowFlaggedModal] = useState<boolean>(false);
  const { auth, data: userData, loading: userLoading } = useUser();

  // Initialize date filters to current month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [filters, setFilters] = useState<Filters>({
    partner: "",
    startDate: formatDateForInput(firstDayOfMonth),
    endDate: formatDateForInput(lastDayOfMonth),
    search: "",
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1, // JavaScript months are 0-indexed
    };
  });
  // Load data on component mount
  useEffect(() => {
    if (userData?.role !== "jv_coordinator") {
      setFilters((prev) => ({
        ...prev,
        partner: userData?.company || "",
      }));
    }
    if (userData?.company) {
      loadProductionData("reset");
      loadAllProductionData();
    }
  }, [userData]);

  const calculations = useProductionCalculations(
    userData?.role === "jv_coordinator" ? allProductionData : filteredData
  );

  const loadAllProductionData = async () => {
    try {
      const partnerId =
        userData?.role === "jv_coordinator" ? undefined : userData?.company;

      const firstDay = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
      const lastDay = new Date(selectedMonth.year, selectedMonth.month, 0);
      lastDay.setHours(23, 59, 59, 999);

      const start =
        firstDay ||
        (filters.startDate ? new Date(filters.startDate) : undefined);
      const end =
        lastDay || (filters.endDate ? new Date(filters.endDate) : undefined);

      // Use the new method to get ALL entries for the period
      const allData = await firebaseService.getAllProductionEntriesForPeriod(
        partnerId,
        start,
        end
      );

      setAllProductionData(allData);
    } catch (error) {
      console.error("Error loading all production data:", error);
      setAllProductionData([]);
    }
  };

  const loadProductionData = async (
    direction: "next" | "previous" | "reset" = "reset"
  ) => {
    setLoading(true);
    try {
      const partnerId =
        userData?.role === "jv_coordinator" ? undefined : userData?.company;

      const firstDay = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
      const lastDay = new Date(selectedMonth.year, selectedMonth.month, 0);
      lastDay.setHours(23, 59, 59, 999);

      let targetPageIndex = currentPageIndex;

      if (direction === "reset") {
        targetPageIndex = 0;
      } else if (direction === "next") {
        targetPageIndex = currentPageIndex + 1;
      } else if (direction === "previous") {
        targetPageIndex = Math.max(0, currentPageIndex - 1);
      }

      // Calculate how many items to skip
      const skipCount = targetPageIndex * 31;

      // Get all data needed (from start to current page + 1 page)
      const allDataResult = await firebaseService.getProductionEntries(
        partnerId,
        firstDay,
        lastDay,
        skipCount + 31, // Get enough data to include our target page
        undefined,
        "next"
      );

      // Extract just the target page data
      const startIndex = skipCount;
      const endIndex = startIndex + 31;
      const targetPageData = allDataResult.data.slice(startIndex, endIndex);

      setAllProductionData(targetPageData);
      setTotal(allDataResult.total);
      setFilteredData(targetPageData);
      setCurrentPageIndex(targetPageIndex);

      // Update navigation states
      setHasPrevious(targetPageIndex > 0);
      const totalPages = Math.ceil(allDataResult.total / 31);
      setHasMore(targetPageIndex < totalPages - 1);
    } catch (error) {
      console.error("Error loading production data:", error);
      setAllProductionData([]);
      setFilteredData([]);
      setTotal(0);
      setHasMore(false);
      setHasPrevious(false);
    } finally {
      setLoading(false);
    }
  };
  // 3. Simplified navigation functions
  const goToNextPage = () => {
    if (hasMore && !loading) {
      loadProductionData("next");
    }
  };

  const goToPreviousPage = () => {
    if (hasPrevious && !loading && currentPageIndex > 0) {
      loadProductionData("previous");
    }
  };

  useEffect(() => {
    setCurrentPageIndex(0);
    loadProductionData("reset");
    loadAllProductionData();
  }, [filters.startDate, filters.endDate, userData?.company, selectedMonth]);

  // Add a helper function to get pagination info
  const getPaginationInfo = () => {
    const startItem = currentPageIndex * 31 + 1;
    const endItem = Math.min(startItem + filteredData.length - 1, total);

    return {
      startItem,
      endItem,
      totalItems: total,
      currentPage: currentPageIndex + 1,
      totalPages: Math.ceil(total / 31),
      hasNextPage: hasMore,
      hasPreviousPage: hasPrevious,
      itemsOnCurrentPage: filteredData.length,
      progressPercentage:
        total > 0
          ? Math.round((((currentPageIndex + 1) * 31) / total) * 100)
          : 0,
    };
  };

  // Form handling
  const handleSubmit = async (data: ProductionFormData): Promise<void> => {
    if (!userData) {
      alert("You are not authorized to perform this operation");
      return;
    }
    setLoading(true);
    try {
      if (editingEntry) {
        const updateData = {
          gross_volume_bbl: parseFloat(data.gross_volume_bbl),
          bsw_percent: parseFloat(data.bsw_percent),
          temperature_degF: parseFloat(data.temperature_degF),
          api_gravity: parseFloat(data.api_gravity),
          isApproved: userData?.role === "jv_partner",
          ...(userData?.role !== "jv_partner" && { edited_by: auth.uid || "" }),
        };
        await firebaseService.updateProductionEntry(
          editingEntry.id,
          updateData
        );

        // If entry was flagged and JV coordinator edited it, re-run auditor agent
        if (editingEntry.flagged && userData?.role === "jv_coordinator") {
          console.log("🤖 Re-running Auditor Agent after edit...");
          try {
            const validationRequest = {
              entry_id: editingEntry.id,
              entry_data: {
                id: editingEntry.id,
                partner: editingEntry.partner,
                gross_volume_bbl: parseFloat(data.gross_volume_bbl),
                bsw_percent: parseFloat(data.bsw_percent),
                temperature_degF: parseFloat(data.temperature_degF),
                api_gravity: parseFloat(data.api_gravity),
                timestamp: typeof editingEntry.timestamp === 'string'
                  ? editingEntry.timestamp
                  : new Date(editingEntry.timestamp).toISOString(),
              },
            };

            const validationResult = await validateProductionEntry(validationRequest);
            console.log("Revalidation result:", validationResult);

            // Update with new validation result
            await firebaseService.updateProductionEntry(editingEntry.id, {
              flagged: validationResult.flagged,
              ai_analysis: validationResult.ai_analysis,
              anomaly_score: validationResult.confidence_score,
            });

            if (!validationResult.flagged) {
              alert("✅ Entry updated and validated successfully! Flag has been cleared.");
            } else {
              alert(`⚠️ Entry updated but still flagged.\n\nAI Analysis: ${validationResult.ai_analysis || "Anomaly detected"}\n\nConfidence Score: ${validationResult.confidence_score?.toFixed(2) || "N/A"}`);
            }
          } catch (revalidationError) {
            console.error("Error revalidating entry:", revalidationError);
            alert("Entry updated but could not be revalidated. Please check manually.");
          }
        }
      } else {
        const submissionData = {
          partner: userData.company,
          gross_volume_bbl: parseFloat(data.gross_volume_bbl),
          bsw_percent: parseFloat(data.bsw_percent),
          temperature_degF: parseFloat(data.temperature_degF),
          api_gravity: parseFloat(data.api_gravity),
          timestamp: new Date(),
          created_by: auth.uid || "",
          isApproved: false,
        };

        // 1. Save to Firestore
        console.log("💾 Saving production entry to Firestore...");
        const entryId = await firebaseService.createProductionEntry(
          submissionData
        );
        console.log(`✅ Entry saved with ID: ${entryId}`);

        // 2. Validate with Auditor Agent
        console.log("🤖 Calling Auditor Agent for validation...");
        console.log(
          "Auditor Agent URL:",
          process.env.NEXT_PUBLIC_AUDITOR_AGENT_URL || "http://localhost:8081"
        );

        try {
          const validationRequest = {
            entry_id: entryId,
            entry_data: {
              id: entryId,
              partner: userData.company,
              gross_volume_bbl: parseFloat(data.gross_volume_bbl),
              bsw_percent: parseFloat(data.bsw_percent),
              temperature_degF: parseFloat(data.temperature_degF),
              api_gravity: parseFloat(data.api_gravity),
              timestamp: new Date().toISOString(), // Required by Auditor Agent
            },
          };

          console.log(
            "Validation request:",
            JSON.stringify(validationRequest, null, 2)
          );
          const validationResult = await validateProductionEntry(
            validationRequest
          );
          console.log(
            "Validation result:",
            JSON.stringify(validationResult, null, 2)
          );

          // 3. Update Firestore with validation result if flagged
          if (validationResult.flagged) {
            await firebaseService.updateProductionEntry(entryId, {
              flagged: true,
              ai_analysis: validationResult.ai_analysis,
              anomaly_score: validationResult.confidence_score,
            });

            // 4. Send notification via Communicator Agent for flagged entry
            try {
              await sendNotification({
                notification_id: `notif_flagged_${entryId}`,
                notification_data: {
                  type: "email",
                  recipient: "todak2000@gmail.com",
                  subject: `⚠️ Flagged Production Entry - ${userData.company}`,
                  body: `A production entry from ${
                    userData.company
                  } has been flagged for review.\n\nEntry ID: ${entryId}\nVolume: ${parseFloat(
                    data.gross_volume_bbl
                  )} BBL\nBS&W: ${parseFloat(
                    data.bsw_percent
                  )}%\nTemperature: ${parseFloat(
                    data.temperature_degF
                  )}°F\nAPI Gravity: ${parseFloat(
                    data.api_gravity
                  )}°\n\nAI Analysis: ${
                    validationResult.ai_analysis || "Anomaly detected"
                  }\nConfidence Score: ${
                    validationResult.confidence_score?.toFixed(2) || "N/A"
                  }`,
                  metadata: {
                    entry_id: entryId,
                    partner: userData.company,
                    confidence_score: validationResult.confidence_score,
                    flagged: true,
                  },
                },
              });
              console.log(
                "✅ Communicator Agent notification sent for flagged entry"
              );
            } catch (notificationError) {
              console.error(
                "❌ Error sending notification for flagged entry:",
                notificationError
              );
              // Don't fail the entry creation if notification fails
            }

            // Show warning message
            alert(
              `⚠️ Entry saved but flagged for review!\n\nAI Analysis: ${
                validationResult.ai_analysis ||
                "Anomaly detected by Auditor Agent"
              }\n\nConfidence Score: ${
                validationResult.confidence_score?.toFixed(2) || "N/A"
              }\n\nAuditors have been notified.`
            );
          } else {
            // Show success message
            alert("✅ Entry validated and saved successfully!");
          }
        } catch (validationError) {
          console.error(
            "Error validating entry with Auditor Agent:",
            validationError
          );
          // Entry is still saved, just couldn't validate
          alert(
            "⚠️ Entry saved but could not be validated by Auditor Agent. Please check manually."
          );
        }
      }

      handleCloseForm();
      await Promise.all([
        loadProductionData(),
        loadAllProductionData(), // Reload both datasets
      ]);
    } catch (error) {
      console.error("Error saving production entry:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: ProductionEntry): void => {
    setEditingEntry(entry);
    setShowForm(true);
  };
  const handleApproval = (entry: ProductionEntry): void => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        await firebaseService.deleteProductionEntry(id);
        await Promise.all([
          loadProductionData(),
          loadAllProductionData(), // Reload both datasets
        ]);
      } catch (error) {
        console.error("Error deleting entry:", error);
      }
    }
  };

  const handleCloseForm = (): void => {
    setShowForm(false);
    setEditingEntry(null);
  };

  const handleDownloadReport = (): void => {
    downloadCSV(filteredData);
  };

  if (userLoading) {
    return (
      <div
        className={`min-h-screen ${COLORS.background.gradient} flex flex-col items-center justify-center`}
      >
        <LoadingSpinner message="Wait..." />
      </div>
    );
  }
  const isCurrentOrFutureMonth =
    selectedMonth.year === new Date().getFullYear() &&
    selectedMonth.month >= new Date().getMonth() + 1;

  const handleMonthChange = (direction: "prev" | "next"): void => {
    setSelectedMonth((prev) => {
      const newDate = new Date(prev.year, prev.month - 1); // Convert to 0-indexed month
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }

      return {
        year: newDate.getFullYear(),
        month: newDate.getMonth() + 1, // Convert back to 1-indexed month
      };
    });
  };

  return (
    <div className={`min-h-screen ${COLORS.background.gradient} pt-20`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} flex items-center justify-center`}
            >
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div className="w-[60%] md:w-auto">
              <p className={`${COLORS.text.secondary}`}>
                Enter and view your company&#39;s production contributions
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Container */}
        <div
          className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-2xl mb-6 overflow-hidden`}
        >
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            handleMonthChange={handleMonthChange}
            selectedMonth={selectedMonth}
            isCurrentOrFutureMonth={isCurrentOrFutureMonth}
            paginationInfo={getPaginationInfo()}
            role={userData?.role as UserRole}
            entriesCount={{
              filtered: getPaginationInfo().itemsOnCurrentPage,
              total: getPaginationInfo().totalItems,
              // allEntries: allProductionData.length, // For showing month total
            }}
          />
        </div>

        {/* Tab Content */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <ProductionStats
              totalVolume={calculations.totalVolume}
              averageBSW={calculations.averageBSW}
              averageTemperature={calculations.averageTemperature}
              averageGravity={calculations.averageGravity}
            />

            {/* Charts */}
            <div
              className={`grid grid-cols-1 ${
                !["field_operator", "jv_partner"].includes(
                  userData?.role as string
                )
                  ? "lg:grid-cols-2"
                  : "lg:grid-cols-1"
              }  gap-6`}
            >
              {/* Production Chart */}
              <div className="space-y-3">
                <ProductionChart
                  data={calculations.chartData}
                  title={`${new Date(
                    selectedMonth.year,
                    selectedMonth.month - 1
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })} Production Volume`}
                />
              </div>

              {/* Partner Distribution */}

              {!["field_operator", "jv_partner"].includes(
                userData?.role as string
              ) ? (
                <div className="space-y-3">
                  <PartnerPieChart
                    data={calculations.partnerData}
                    title={
                      userData?.role === "jv_coordinator"
                        ? "Volume by Partner"
                        : "Your Volume"
                    }
                    colors={CHART_COLORS}
                  />
                </div>
              ) : (
                ""
              )}
            </div>
          </div>
        )}

        {activeTab === "data" && (
          <div
            className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-2xl overflow-hidden`}
          >
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center space-x-3 justify-between">
                <div className="flex space-x-3 items-center ">
                  <Table className={`w-5 h-5 ${COLORS.primary.blue[400]}`} />
                  <h3
                    className={`text-lg font-semibold ${COLORS.text.primary}`}
                  >
                    Production Data Table
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${COLORS.background.glassHover} ${COLORS.text.secondary}`}
                  >
                    {(() => {
                      const info = getPaginationInfo();
                      return `${info.startItem}-${info.endItem} of ${info.totalItems}`;
                    })()}
                  </span>

                  {total > 31 && (
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <span>
                        Page {getPaginationInfo().currentPage} of{" "}
                        {getPaginationInfo().totalPages}
                      </span>
                    </div>
                  )}
                </div>
                <PaginationComponent
                  goToPreviousPage={goToPreviousPage}
                  loading={loading}
                  hasPrevious={hasPrevious}
                  paginationInfo={getPaginationInfo()}
                  currentPage={currentPageIndex}
                  data={filteredData}
                  goToNextPage={goToNextPage}
                  hasMore={hasMore}
                  total={total}
                />
                <p className="text-white">
                  Total Production:{" "}
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${COLORS.background.glassHover} ${COLORS.text.secondary}`}
                  >
                    {formatNumber(calculations.totalVolume)} bbls
                  </span>
                </p>
              </div>
            </div>
            <ProductionTable
              data={filteredData}
              loading={loading}
              role={userData?.role as UserRole}
              canEdit={
                userData?.permissions.includes("edit_production_entry") || false
              }
              total={total}
              currentPage={currentPageIndex}
              onEdit={handleEdit}
              onApprove={handleApproval}
              onDelete={handleDelete}
              onViewFlagged={(entry) => {
                setFlaggedEntry(entry);
                setShowFlaggedModal(true);
              }}
              goToPreviousPage={goToPreviousPage}
              hasPrevious={hasPrevious}
              hasMore={hasMore}
              goToNextPage={goToNextPage}
              paginationInfo={getPaginationInfo()}
            />
          </div>
        )}

        {activeTab === "analytics" && (
          <div
            className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-2xl p-6`}
          >
            <div className="flex items-center space-x-3 mb-6">
              <Activity className={`w-5 h-5 ${COLORS.primary.blue[400]}`} />
              <h3 className={`text-lg font-semibold ${COLORS.text.primary}`}>
                Advanced Analytics
              </h3>
            </div>
            <div className="text-center py-12">
              <Activity
                className={`w-16 h-16 ${COLORS.text.muted} mx-auto mb-4 opacity-50`}
              />
              <p className={`text-lg ${COLORS.text.secondary} mb-2`}>
                Advanced Analytics Coming Soon
              </p>
              <p className={`${COLORS.text.muted}`}>
                Detailed insights and predictive analytics will be available
                here
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <ProductionForm
        isOpen={showForm}
        onClose={handleCloseForm}
        editingEntry={editingEntry}
        onSubmit={handleSubmit}
        loading={loading}
        role={userData?.role as UserRole}
      />

      {/* Flagged Entry Details Modal */}
      <Modal
        isOpen={showFlaggedModal}
        onClose={() => {
          setShowFlaggedModal(false);
          setFlaggedEntry(null);
        }}
        title="⚠️ Flagged Entry - AI Analysis"
      >
        {flaggedEntry && (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-red-400 mb-3">
                Entry Details
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400">Partner:</p>
                  <p className="text-white font-medium">{flaggedEntry.partner}</p>
                </div>
                <div>
                  <p className="text-gray-400">Volume (BBL):</p>
                  <p className="text-white font-medium">
                    {flaggedEntry.gross_volume_bbl.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">BSW (%):</p>
                  <p className="text-white font-medium">
                    {flaggedEntry.bsw_percent.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Temperature (°F):</p>
                  <p className="text-white font-medium">
                    {flaggedEntry.temperature_degF}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">API Gravity (°API):</p>
                  <p className="text-white font-medium">
                    {flaggedEntry.api_gravity}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Date:</p>
                  <p className="text-white font-medium">
                    {new Date(flaggedEntry.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <span>🤖</span> AI Analysis
              </h4>
              <div className="text-sm mb-3 max-h-96 overflow-y-auto">
                {formatAiAnalysis(flaggedEntry.ai_analysis || "Anomaly detected by Auditor Agent")}
              </div>
              {flaggedEntry.anomaly_score && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-yellow-500/20">
                  <span className="text-gray-400 text-xs">Confidence Score:</span>
                  <span className="text-yellow-400 font-semibold">
                    {flaggedEntry.anomaly_score.toFixed(2)}%
                  </span>
                  <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-yellow-400 h-full transition-all duration-300"
                      style={{ width: `${flaggedEntry.anomaly_score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-blue-400 mb-2">
                Recommended Actions
              </h4>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Review the flagged values for accuracy</li>
                <li>• Verify measurement equipment calibration</li>
                <li>• Check for data entry errors</li>
                <li>• Contact the field operator if needed</li>
              </ul>
            </div>

            {userData?.role === "jv_coordinator" && (
              <button
                onClick={() => {
                  setShowFlaggedModal(false);
                  handleEdit(flaggedEntry);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit This Entry</span>
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductionDashboard;
