/* eslint-disable react/no-unescaped-entities */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  BarChart3,
  TrendingUp,
  Droplets,
  Thermometer,
  Gauge,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Activity,
  Database,
} from "lucide-react";
import { useUser } from "../../../../hook/useUser";
import { firebaseService } from "../../../../lib/firebase-service";
import { permissionsList } from "../../../../constants";
import LoadingSpinner from "../../../../component/LoadingSpinner";
import { Modal } from "../../../../component/Modal";
import { COLORS } from "../../../../component/Home";
import { ProductionFormData } from "../../../../component/formField";
import { CreateProductionEntryData, ProductionEntry } from "../../../../types";

interface FormFieldConfig {
  id: string;
  key: keyof ProductionFormData;
  label: string;
  unit: string;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
}

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

// Main Dashboard Component
const FieldOperatorDashboard: React.FC = () => {
  const router = useRouter();
  const { auth, data: userData, loading: userLoading } = useUser();
  const [productionData, setProductionData] = useState<ProductionEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formData, setFormData] = useState<ProductionFormData>({
    temperature_degF: "",
    pressure_psi: "",
    bsw_percent: "",
    gross_volume_bbl: "",
  });

  useEffect(() => {
    if (!userLoading && !auth) {
      router.push("/onboarding/login");
      return;
    }
    if (userData?.company) {
      loadTodaysData();
    }
  }, [userLoading, auth, userData, router]);

  const loadTodaysData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const data = await firebaseService.getProductionEntries(
        userData?.company,
        startOfDay,
        endOfDay
      );
      setProductionData(data);
    } catch (error) {
      console.error("Error loading production data:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (
    key: keyof ProductionFormData,
    value: string
  ): void => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!userData?.permissions.includes(permissionsList.canCreateProd)) {
      alert("You are not authorized to perform this operation");
      return;
    }

    setLoading(true);
    try {
      const submissionData: CreateProductionEntryData = {
        partner: userData.company,
        gross_volume_bbl: parseFloat(formData.gross_volume_bbl),
        bsw_percent: parseFloat(formData.bsw_percent),
        temperature_degF: parseFloat(formData.temperature_degF),
        pressure_psi: parseFloat(formData.pressure_psi),
        timestamp: new Date(),
        created_by: auth.uid,
      };

      await firebaseService.createProductionEntry(submissionData);
      setShowForm(false);
      setFormData({
        temperature_degF: "",
        pressure_psi: "",
        bsw_percent: "",
        gross_volume_bbl: "",
      });
      await loadTodaysData();
    } catch (error) {
      console.error("Error saving production entry:", error);
      alert("Error saving production data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const todaysTotal = productionData.reduce(
    (sum, entry) => sum + entry.gross_volume_bbl,
    0
  );
  const averageBSW =
    productionData.length > 0
      ? productionData.reduce((sum, entry) => sum + entry.bsw_percent, 0) /
        productionData.length
      : 0;
  const averageTemp =
    productionData.length > 0
      ? productionData.reduce((sum, entry) => sum + entry.temperature_degF, 0) /
        productionData.length
      : 0;

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
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className={`${COLORS.text.secondary} flex flex-col`}>
                <span>Welcome, {userData?.email}</span>
                <span>{userData?.company}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Alert for no data */}
        {productionData.length === 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 mb-8 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="text-yellow-400 font-medium">
                  No production data today
                </p>
                <p className="text-yellow-300/80 text-sm">
                  You haven't entered today's production data for your field
                  yet.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {productionData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <SummaryCard
              title="Today's Production"
              value={todaysTotal.toFixed(1)}
              unit=" BBL"
              color="blue"
              icon={BarChart3}
              trend={{ value: 12.5, isPositive: true }}
            />
            <SummaryCard
              title="Entries Today"
              value={productionData.length}
              color="green"
              icon={Database}
              trend={{ value: 8.2, isPositive: true }}
            />
            <SummaryCard
              title="Average BSW"
              value={averageBSW.toFixed(2)}
              unit="%"
              color="orange"
              icon={Droplets}
              trend={{ value: 2.1, isPositive: false }}
            />
            <SummaryCard
              title="Avg Temperature"
              value={averageTemp.toFixed(1)}
              unit="°F"
              color="purple"
              icon={Thermometer}
            />
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <ActionCard
            title="Enter Production Data"
            description="Record your daily production measurements to ensure accurate allocation and maintain data integrity."
            buttonText="Add Production Entry"
            icon={Plus}
            onClick={() => setShowForm(true)}
            variant="primary"
          />
          <ActionCard
            title="View Historical Data"
            description="Review your past production entries, analyze trends, and track performance over time."
            buttonText="View Production History"
            icon={Calendar}
            onClick={() => router.push("/production")}
            variant="secondary"
          />
        </div>

        {/* Today's Entries Table */}
        {productionData.length > 0 && (
          <div
            className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-2xl overflow-hidden`}
          >
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <Clock className={`w-5 h-5 ${COLORS.primary.blue[400]}`} />
                <h3 className={`text-lg font-semibold ${COLORS.text.primary}`}>
                  Today's Entries
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs ${COLORS.background.glassHover} ${COLORS.text.secondary}`}
                >
                  {productionData.length} entries
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <LoadingSpinner message="Loading today's data..." />
                </div>
              ) : (
                <table className="w-full">
                  <thead className={`${COLORS.background.overlay}`}>
                    <tr>
                      {[
                        "Time",
                        "Volume (BBL)",
                        "BSW (%)",
                        "Temperature (°F)",
                        "Pressure (PSI)",
                        "Status",
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
                    {productionData.map((entry) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm ${COLORS.text.primary}`}
                        >
                          {new Date(entry.timestamp).toLocaleTimeString()}
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
                          <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add Production Entry"
      >
        <div className="space-y-6">
          {FORM_FIELDS.map((field) => (
            <FormField
              key={field.id}
              field={field}
              value={formData[field.key]}
              onChange={handleInputChange}
              disabled={loading}
            />
          ))}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`flex-1 bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} text-white py-3 px-4 rounded-xl font-medium hover:${COLORS.primary.blue[700]} hover:${COLORS.primary.purple[700]} transition-all duration-300 disabled:opacity-50`}
            >
              {loading ? <LoadingSpinner message="Saving..." /> : "Save Entry"}
            </button>
            <button
              onClick={() => setShowForm(false)}
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

export default FieldOperatorDashboard;