"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Calendar,
  BarChart3,
  TrendingUp,
  Droplets,
  Thermometer,
  Gauge,
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
import { useUser } from "../../../hook/useUser";
import { useProductionCalculations } from "../../../hook/useProductionCalculations";
import { firebaseService } from "../../../lib/firebase-service";
import { Modal } from "../../../component/Modal";
import { ProductionChart } from "../../../component/ProductionChart";
import { PartnerPieChart } from "../../../component/PartnerPieChart";
import LoadingSpinner from "../../../component/LoadingSpinner";
import { Timestamp } from "firebase/firestore";

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

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981"];

// Form field configurations
const FORM_FIELDS: FormFieldConfig[] = [
  {
    id: "temperature",
    key: "temperature_degF",
    label: "Temperature",
    unit: "°F",
    placeholder: "Enter temperature in Fahrenheit",
    icon: Thermometer,
  },
  {
    id: "pressure",
    key: "pressure_psi",
    label: "Pressure",
    unit: "PSI",
    placeholder: "Enter pressure in PSI",
    icon: Gauge,
  },
  {
    id: "bsw",
    key: "bsw_percent",
    label: "Basic Sediment and Water",
    unit: "%",
    placeholder: "Enter BSW percentage",
    icon: Droplets,
  },
  {
    id: "production",
    key: "gross_volume_bbl",
    label: "Production Volume",
    unit: "BBL",
    placeholder: "Enter volume in barrels",
    icon: BarChart3,
  },
];

// Utility functions
const formatDateForInput = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const downloadCSV = (data: ProductionEntry[]): void => {
  const csvContent = [
    [
      "Date",
      "Partner",
      "Volume (BBL)",
      "BSW (%)",
      "Temperature (°F)",
      "Pressure (PSI)",
    ].join(","),
    ...data.map((entry) =>
      [
        new Date(entry.timestamp).toLocaleDateString(),
        entry.partner,
        entry.gross_volume_bbl,
        entry.bsw_percent,
        entry.temperature_degF,
        entry.pressure_psi,
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

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs: {
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "data", label: "Data Table", icon: Table },
    { id: "dashboard", label: "Analytics", icon: Activity },
    // { id: "analytics", label: "Analytics", icon: PieChart },
  ];

  return (
    <div className="p-6 border-b border-white/10">
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
    </div>
  );
};

interface DateFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

const DateFilters: React.FC<DateFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <label className={`block text-sm font-medium ${COLORS.text.primary}`}>
          Start Date
        </label>
        <div className="relative">
          <Calendar
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${COLORS.text.muted}`}
          />
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              onFiltersChange({ ...filters, startDate: e.target.value })
            }
            className={`w-full pl-10 pr-4 py-3 ${COLORS.background.glass} backdrop-blur-sm ${COLORS.border.light} border rounded-xl ${COLORS.text.primary} focus:outline-none focus:ring-2 focus:${COLORS.border.ring} focus:border-transparent transition-all duration-300`}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className={`block text-sm font-medium ${COLORS.text.primary}`}>
          End Date
        </label>
        <div className="relative">
          <Calendar
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${COLORS.text.muted}`}
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              onFiltersChange({ ...filters, endDate: e.target.value })
            }
            className={`w-full pl-10 pr-4 py-3 ${COLORS.background.glass} backdrop-blur-sm ${COLORS.border.light} border rounded-xl ${COLORS.text.primary} focus:outline-none focus:ring-2 focus:${COLORS.border.ring} focus:border-transparent transition-all duration-300`}
          />
        </div>
      </div>
    </div>
  );
};

interface ActionButtonsProps {
  role: string;
  onAddEntry: () => void;
  onDownloadReport: () => void;
  entriesCount: { filtered: number; total: number };
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  role,
  onAddEntry,
  onDownloadReport,
  entriesCount,
}) => {
  const canCreate = ["field_operator", "jv_coordinator", "admin"].includes(
    role
  );

  return (
    <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
      <div className="flex items-center space-x-4">
        <div className={`text-sm ${COLORS.text.secondary}`}>
          Showing {entriesCount.filtered} of {entriesCount.total} entries
        </div>
        {entriesCount.filtered !== entriesCount.total && (
          <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
            Filtered
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
  goToPreviousPage: () => void;
  hasPrevious: boolean;
  hasMore: boolean;
  total: number;
  role: UserRole;
  currentPage: number;
  goToNextPage: () => void;
}

const ProductionTable: React.FC<ProductionTableProps> = ({
  data,
  loading,
  canEdit,
  onEdit,
  onApprove,
  onDelete,
  goToPreviousPage,
  hasPrevious,
  role,
  hasMore,
  currentPage,
  total,
  goToNextPage,
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
  console.log(role, "role");
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
                "Pressure (PSI)",
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
              <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                <td
                  className={`px-6 py-4 whitespace-nowrap ${COLORS.text.primary}`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {new Date(entry.timestamp).toLocaleDateString()}
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
                  {entry.pressure_psi}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {entry?.edited_by && !entry?.isApproved ? (
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
      <div className="flex items-center justify-between p-4 border-t border-white/10">
        <button
          onClick={goToPreviousPage}
          disabled={!hasPrevious || loading}
          className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
            !hasPrevious || loading
              ? "text-gray-500 cursor-not-allowed"
              : "text-blue-400 hover:bg-blue-400/10"
          }`}
        >
          <span>← Previous</span>
        </button>

        <div className="flex items-center space-x-4">
          <span className={`text-sm ${COLORS.text.secondary}`}>
            Page {currentPage + 1}
          </span>
          <span className={`text-xs ${COLORS.text.muted}`}>
            Showing {data.length} of {total} entries
          </span>
        </div>

        <button
          onClick={goToNextPage}
          disabled={!hasMore || loading}
          className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
            !hasMore || loading
              ? "text-gray-500 cursor-not-allowed"
              : "text-blue-400 hover:bg-blue-400/10"
          }`}
        >
          <span>{loading ? "Loading..." : "Next →"}</span>
        </button>
      </div>
    </>
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

// Dynamic Form Component
interface DynamicFormProps {
  formData: ProductionEntry | null;
  handleSubmit: (data: ProductionFormData) => void;
  loading: boolean;
  role: UserRole;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  formData,
  handleSubmit,
  loading,
  role,
}) => {
  const [localFormData, setLocalFormData] = useState<ProductionFormData>({
    temperature_degF: formData ? formData.temperature_degF.toString() : "",
    pressure_psi: formData ? formData.pressure_psi.toString() : "",
    bsw_percent: formData ? formData.bsw_percent.toString() : "",
    gross_volume_bbl: formData ? formData.gross_volume_bbl.toString() : "",
  });

  const handleInputChange = (
    key: keyof ProductionFormData,
    value: string
  ): void => {
    setLocalFormData({ ...localFormData, [key]: value });
  };

  const handleSubmitLocal = (): void => {
    handleSubmit(localFormData);
  };

  const isValid = Object.values(localFormData).every(
    (value) => value.trim() !== ""
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FORM_FIELDS.map((field) => (
          <FormField
            key={field.id}
            field={field}
            value={localFormData[field.key]}
            onChange={handleInputChange}
            disabled={loading || role === "jv_partner"}
          />
        ))}
      </div>

      {/* Current Values Preview */}
      <div
        className={`p-4 ${COLORS.background.glass} rounded-xl ${COLORS.border.light} border`}
      >
        <h4 className={`text-sm font-medium ${COLORS.text.primary} mb-3`}>
          Preview Values:
        </h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {FORM_FIELDS.map((field) => (
            <div key={field.id} className="flex justify-between">
              <span className={COLORS.text.muted}>{field.label}:</span>
              <span className={COLORS.text.secondary}>
                {localFormData[field.key] || "Not set"}{" "}
                {localFormData[field.key] && field.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSubmitLocal}
          disabled={loading || !isValid}
          className={`flex-1 bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} text-white py-3 px-4 rounded-xl font-medium hover:${COLORS.primary.blue[700]} hover:${COLORS.primary.purple[700]} transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <span>
              {formData && role !== "jv_partner"
                ? "Update Entry"
                : formData && role === "jv_partner"
                ? "Approve Entry"
                : "Save Entry"}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

// Main Production Dashboard Component
const ProductionDashboard: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("data");
  const [productionData, setProductionData] = useState<ProductionEntry[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalProductionData, setTotalProductionData] = useState<
    ProductionEntry[]
  >([]);
  const [lastVisible, setLastVisible] = useState<Timestamp | null>(null);
  const [firstVisible, setFirstVisible] = useState<Timestamp | null>(null);
  const [firstVisibleStack, setFirstVisibleStack] = useState<Timestamp[]>([]); // For "Previous"
  const [pageStack, setPageStack] = useState<
    { cursor: Timestamp | null; isFirst: boolean }[]
  >([{ cursor: null, isFirst: true }]); // Stack to track page cursors
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [hasPrevious, setHasPrevious] = useState<boolean>(false);
  const [filteredData, setFilteredData] = useState<ProductionEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<ProductionEntry | null>(
    null
  );
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

  // Load data on component mount
  useEffect(() => {
    if (userData?.company) {
      loadProductionData("reset");
    }
    if (userData?.role !== "jv_coordinator") {
      setFilters((prev) => ({
        ...prev,
        partner: userData?.company || "",
      }));
    }
  }, [userData]);

  // Filter data when filters or data change

  useEffect(() => {
    loadProductionData("reset");
  }, [filters.startDate, filters.endDate, userData?.company]);

  const calculations = useProductionCalculations(
    filteredData,
    totalProductionData
  );

  const loadProductionData = async (
    direction: "next" | "previous" | "reset" = "reset"
  ) => {
    setLoading(true);
    try {
      const partnerId =
        userData?.role === "jv_coordinator" ? undefined : userData?.company;
      const start = filters.startDate ? new Date(filters.startDate) : undefined;
      const end = filters.endDate ? new Date(filters.endDate) : undefined;

      let cursor: Timestamp | null = null;

      if (direction === "next") {
        cursor = lastVisible;
      } else if (direction === "previous") {
        cursor = firstVisible;
      }
      // For reset, cursor stays null
      console.log(partnerId, "aprrenerID");
      const result = await firebaseService.getProductionEntries(
        partnerId,
        start,
        end,
        10,
        cursor ?? undefined,
        direction === "reset" ? "next" : direction
      );

      setProductionData(result.data);
      setTotal(result.total);
      setFilteredData(result.data);
      setLastVisible(result.lastVisible);
      setFirstVisible(result.firstVisible);

      // Update page tracking
      if (direction === "reset") {
        setPageStack([{ cursor: null, isFirst: true }]);
        setCurrentPageIndex(0);
        setHasPrevious(false);
      } else if (direction === "next") {
        const newPageIndex = currentPageIndex + 1;
        const newPageStack = [...pageStack];
        if (newPageIndex >= pageStack.length) {
          newPageStack.push({ cursor: result.firstVisible, isFirst: false });
        }
        setPageStack(newPageStack);
        setCurrentPageIndex(newPageIndex);
        setHasPrevious(newPageIndex > 0);
      } else if (direction === "previous") {
        const newPageIndex = Math.max(0, currentPageIndex - 1);
        setCurrentPageIndex(newPageIndex);
        setHasPrevious(newPageIndex > 0);
      }

      // Update hasMore based on whether we got a full page
      setHasMore(result.data.length === 10);
    } catch (error) {
      console.error("Error loading production data:", error);
    } finally {
      setLoading(false);
    }
  };

  const goToNextPage = () => {
    if (hasMore && !loading && lastVisible) {
      loadProductionData("next");
    }
  };

  const goToPreviousPage = () => {
    if (hasPrevious && !loading && currentPageIndex > 0) {
      loadProductionData("previous");
    }
  };

  // Form handling
  const handleSubmit = async (data: ProductionFormData): Promise<void> => {
    // if (!userData?.permissions.includes(permissionsList.canCreateProd)) {
    //   alert("You are not authorized to perform this operation");
    //   return;
    // }
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
          pressure_psi: parseFloat(data.pressure_psi),
          isApproved: userData?.role === "jv_partner",
          ...(userData?.role !== "jv_partner" && { edited_by: auth.uid || "" }),
        };
        await firebaseService.updateProductionEntry(
          editingEntry.id,
          updateData
        );
      } else {
        const submissionData = {
          partner: userData.company,
          gross_volume_bbl: parseFloat(data.gross_volume_bbl),
          bsw_percent: parseFloat(data.bsw_percent),
          temperature_degF: parseFloat(data.temperature_degF),
          pressure_psi: parseFloat(data.pressure_psi),
          timestamp: new Date(),
          created_by: auth.uid || "",
          isApproved: false,
        };
        await firebaseService.createProductionEntry(submissionData);
      }

      handleCloseForm();
      await loadProductionData();
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
        await loadProductionData();
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
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Filters */}
          <div
            className={`p-6 ${COLORS.background.overlay} border-b border-white/10`}
          >
            <DateFilters filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Action Buttons */}
          <ActionButtons
            role={userData?.role as string}
            onAddEntry={() => setShowForm(true)}
            onDownloadReport={handleDownloadReport}
            entriesCount={{
              filtered: filteredData.length,
              total: total,
            }}
          />
        </div>

        {/* Tab Content */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <SummaryCard
                title="Total Volume"
                value={calculations.totalVolume.toFixed(1)}
                color="blue"
                unit=" BBL"
                icon={BarChart3}
                trend={{ value: 12.5, isPositive: true }}
              />
              <SummaryCard
                title="Avg BSW"
                value={calculations.averageBSW.toFixed(2)}
                color="green"
                unit="%"
                icon={Droplets}
                trend={{ value: 2.1, isPositive: false }}
              />
              <SummaryCard
                title="Avg Temperature"
                value={calculations.averageTemperature}
                color="orange"
                unit="°F"
                icon={Thermometer}
              />
              <SummaryCard
                title="Total Entries"
                value={filteredData.length}
                color="purple"
                icon={Database}
                trend={{ value: 8.2, isPositive: true }}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Production Chart */}
              <div className="space-y-3">
                <ProductionChart
                  data={calculations.chartData}
                  title="Daily Production Volume"
                />
              </div>

              {/* Partner Distribution */}
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
            </div>
          </div>
        )}

        {activeTab === "data" && (
          <div
            className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-2xl overflow-hidden`}
          >
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <Table className={`w-5 h-5 ${COLORS.primary.blue[400]}`} />
                <h3 className={`text-lg font-semibold ${COLORS.text.primary}`}>
                  Production Data Table
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs ${COLORS.background.glassHover} ${COLORS.text.secondary}`}
                >
                  {filteredData.length} entries
                </span>
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
              goToPreviousPage={goToPreviousPage}
              hasPrevious={hasPrevious}
              hasMore={hasMore}
              goToNextPage={goToNextPage}
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
      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={
          editingEntry && userData?.role !== "jv_partner"
            ? "Edit Production Entry"
            : editingEntry && userData?.role === "jv_partner"
            ? "Approve Production Data"
            : "Add Production Entry"
        }
      >
        <DynamicForm
          formData={editingEntry}
          handleSubmit={handleSubmit}
          loading={loading}
          role={userData?.role as UserRole}
        />
      </Modal>
    </div>
  );
};

export default ProductionDashboard;
