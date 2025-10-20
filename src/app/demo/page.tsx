/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  Play,
  Users,
  Calendar,
  AlertCircle,
  LogIn,
  User,
  Eye,
  EyeOff,
  Trash2,
  Lock,
  Database,
  Calendar as CalendarIcon,
} from "lucide-react";
import { firebaseService } from "../../../lib/firebase-service";
import { GenerationStats, Log, MonthInfo } from "../../../types";
import { Card } from "../../../component/demo/Card";
import { Button } from "../../../component/demo/Button";
import { ProgressBar } from "../../../component/demo/ProgressBar";
import { StatGrid } from "../../../component/demo/StatGrid";
import { LogViewer } from "../../../component/demo/LogViewer";
import { COLORS } from "../../../component/Home";
import { useRouter } from "next/navigation";

export interface ProductionEntryy {
  id?: string;
  hash?: string;
  partner: string;
  gross_volume_bbl: number;
  bsw_percent: number;
  temperature_degF: number;
  api_gravity: number;
  timestamp: Date;
  created_by: string;
  created_at?: Date;
  updated_at?: Date;
}

interface DemoAccount {
  email: string;
  password: string;
  role: string;
  description: string;
  permissions: string[];
}

type DateRangePreset = "current_month" | "last_month" | "last_3_months" | "last_6_months" | "custom";

const ProductionDataGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<GenerationStats | null>(null);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});

  // Date range controls
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("last_3_months");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Admin controls
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const ADMIN_PASSWORD = "FlowShare2024!"; // Admin password for database clearing
  const partners = ["Test Oil and Gas", "TUPNI", "ACE", "WINDY"];

  const demoAccounts: DemoAccount[] = [
    {
      email: "fo@test.com",
      password: "Qwerty@12345",
      role: "Field Operator",
      description: "Daily operations, data entry, basic reporting",
      permissions: [
        "View Production Data",
        "Enter Daily Reports",
      ],
    },
    {
      email: "Qwert@gmail.com",
      password: "Qwerty123",
      role: "JV Coordinator",
      description: "Joint venture coordination and data reconciliation",
      permissions: [
        "Initiate/View reconciliation data",
        "Issue terminal receipt",
        "Update Production Data for Partner",
      ],
    },
    {
      email: "jvp@test.com",
      password: "Qwerty@12345",
      role: "JV Partner",
      description: "Partner access, limited to own data and reports",
      permissions: [
        "View Own Production Data",
        "View reconciliation data",
        "Approve updated Production data",
      ],
    },
  ];

  const addLog = (
    message: string,
    type: "info" | "success" | "error" = "info"
  ) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { message, type, timestamp }]);
  };

  const togglePasswordVisibility = (email: string) => {
    setShowPassword((prev) => ({
      ...prev,
      [email]: !prev[email],
    }));
  };

  // Calculate date range based on preset
  const getDateRange = (): { start: Date; end: Date; months: MonthInfo[] } => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let startDate: Date;
    let endDate: Date = new Date(currentYear, currentMonth + 1, 0); // Last day of current month

    if (dateRangePreset === "custom") {
      if (!customStartDate || !customEndDate) {
        throw new Error("Please select both start and end dates for custom range");
      }
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      switch (dateRangePreset) {
        case "current_month":
          startDate = new Date(currentYear, currentMonth, 1);
          break;
        case "last_month":
          startDate = new Date(currentYear, currentMonth - 1, 1);
          endDate = new Date(currentYear, currentMonth, 0);
          break;
        case "last_3_months":
          startDate = new Date(currentYear, currentMonth - 2, 1);
          break;
        case "last_6_months":
          startDate = new Date(currentYear, currentMonth - 5, 1);
          break;
        default:
          startDate = new Date(currentYear, currentMonth - 2, 1);
      }
    }

    // Generate months array
    const months: MonthInfo[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      months.push({
        year: current.getFullYear(),
        month: current.getMonth(),
        name: current.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
      });
      current.setMonth(current.getMonth() + 1);
    }

    return { start: startDate, end: endDate, months };
  };

  const generateRealisticData = (
    partner: string,
    date: Date
  ): ProductionEntryy => {
    const partnerId = partner.charCodeAt(0) + partner.length;
    const dayOfYear = Math.floor(
      (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const seed = partnerId * dayOfYear;

    const random = (s: number) =>
      Math.sin(s) * 10000 - Math.floor(Math.sin(s) * 10000);

    const partnerRanges = {
      "Test Oil and Gas": { min: 20000, max: 30000, variance: 0.15 },
      TUPNI: { min: 18000, max: 28000, variance: 0.12 },
      ACE: { min: 35000, max: 50000, variance: 0.18 },
      WINDY: { min: 30000, max: 45000, variance: 0.15 },
    };

    type PartnerKey = keyof typeof partnerRanges;

    const range = (
      partnerRanges as Record<
        PartnerKey,
        { min: number; max: number; variance: number }
      >
    )[partner as PartnerKey] ?? { min: 20000, max: 40000, variance: 0.15 };

    const { min, max, variance } = range;

    const baseVolume = min + Math.abs(random(seed)) * (max - min);
    const seasonalFactor = 1 + 0.05 * Math.sin((dayOfYear / 365) * 2 * Math.PI);
    const dailyVariation = 1 + (random(seed + 1) - 0.5) * variance;

    const grossVolume = Math.max(
      min * 0.8,
      Math.min(
        max * 1.2,
        Math.round(baseVolume * seasonalFactor * dailyVariation)
      )
    );

    const bswBase = 8 + Math.abs(random(seed + 2)) * 7;
    const volumeBSWFactor = Math.min(
      3,
      ((grossVolume - min) / (max - min)) * 2
    );
    const dailyBSWVariation = (random(seed + 10) - 0.5) * 2;
    const rawBSW = bswBase + volumeBSWFactor + dailyBSWVariation;
    const bsw = Math.max(5, Math.min(18, Math.round(rawBSW * 100) / 100));

    const tempBase = 75 + 8 * Math.sin((dayOfYear / 365) * 2 * Math.PI);
    const dailyTempVariation = (random(seed + 3) - 0.5) * 10;
    const rawTemp = tempBase + dailyTempVariation;
    const temperature = Math.max(
      60,
      Math.min(95, Math.round(rawTemp * 10) / 10)
    );

    const partnerAPIRanges = {
      "Test Oil and Gas": { base: 32, variation: 3 },
      TUPNI: { base: 30, variation: 2.5 },
      ACE: { base: 34, variation: 3 },
      WINDY: { base: 33, variation: 2.5 },
    };

    const apiRange = (
      partnerAPIRanges as Record<
        PartnerKey,
        { base: number; variation: number }
      >
    )[partner as PartnerKey] ?? { base: 32, variation: 3 };

    const apiBase =
      apiRange.base + (random(seed + 4) - 0.5) * apiRange.variation * 2;
    const qualityVariation = (random(seed + 5) - 0.5) * 2;
    const rawAPI = apiBase + qualityVariation;
    const apiGravity = Math.max(25, Math.min(40, Math.round(rawAPI * 10) / 10));

    const createdBy = "demo_system";

    return {
      partner,
      gross_volume_bbl: grossVolume,
      bsw_percent: bsw,
      temperature_degF: temperature,
      api_gravity: apiGravity,
      timestamp: date,
      created_by: createdBy,
    };
  };

  const validateGeneratedEntry = (entry: ProductionEntryy): string[] => {
    const errors: string[] = [];

    if (entry.bsw_percent < 0 || entry.bsw_percent >= 20) {
      errors.push(`BSW ${entry.bsw_percent}% outside acceptable range (0-20%)`);
    }

    if (entry.temperature_degF < 50 || entry.temperature_degF > 100) {
      errors.push(
        `Temperature ${entry.temperature_degF}°F outside operational range (50-100°F)`
      );
    }

    if (entry.api_gravity < 25 || entry.api_gravity > 45) {
      errors.push(
        `API Gravity ${entry.api_gravity}° outside crude oil range (25-45°API)`
      );
    }

    if (entry.gross_volume_bbl < 10000 || entry.gross_volume_bbl > 100000) {
      errors.push(
        `Volume ${entry.gross_volume_bbl.toLocaleString()} bbl outside realistic daily range`
      );
    }

    return errors;
  };

  const generateMonthData = (
    year: number,
    month: number
  ): ProductionEntryy[] => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthData: ProductionEntryy[] = [];
    let validationErrors = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      partners.forEach((partner) => {
        const entry = generateRealisticData(partner, date);

        const errors = validateGeneratedEntry(entry);
        if (errors.length > 0) {
          console.warn(
            `Validation errors for ${partner} on ${date.toDateString()}:`,
            errors
          );
          validationErrors++;
        }

        monthData.push(entry);
      });
    }

    if (validationErrors > 0) {
      console.warn(
        `Month ${
          month + 1
        }/${year}: ${validationErrors} entries had validation warnings`
      );
    }

    return monthData;
  };

  const generateProductionData = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setProgress(0);
    setLogs([]);
    setStats(null);

    try {
      addLog("🚀 Starting production data generation...", "info");
      addLog(`📊 Partners: ${partners.join(", ")}`, "info");

      const { months } = getDateRange();

      addLog(
        `📅 Generating data for ${months.length} months: ${months
          .map((m) => m.name)
          .join(", ")}`,
        "info"
      );

      let totalEntries = 0;
      let successfulEntries = 0;
      let failedEntries = 0;

      for (let monthIndex = 0; monthIndex < months.length; monthIndex++) {
        const { year, month, name } = months[monthIndex];
        addLog(`📝 Generating data for ${name}...`, "info");

        const monthData = generateMonthData(year, month);
        totalEntries += monthData.length;
        addLog(`💾 Saving ${monthData.length} entries for ${name}...`, "info");

        const batchSize = 10;
        for (let i = 0; i < monthData.length; i += batchSize) {
          const batch = monthData.slice(i, i + batchSize);
          const promises = batch.map(async (entry) => {
            try {
              await firebaseService.createProductionEntry(entry);
              return { success: true };
            } catch (error) {
              console.error("Failed to save entry:", error);
              return { success: false };
            }
          });

          const results = await Promise.all(promises);
          successfulEntries += results.filter((r) => r.success).length;
          failedEntries += results.filter((r) => !r.success).length;

          const overallProgress =
            ((monthIndex * 30 * partners.length + i + batch.length) /
              (months.length * 30 * partners.length)) *
            100;
          setProgress(Math.min(overallProgress, 100));
        }

        addLog(
          `✅ Completed ${name} - ${monthData.length} entries saved`,
          "success"
        );
      }

      const finalStats: GenerationStats = {
        totalEntries,
        successfulEntries,
        failedEntries,
        partners: partners.length,
        months: months.length,
        startDate: months[0].name,
        endDate: months[months.length - 1].name,
      };

      setStats(finalStats);
      addLog("🎉 Data generation completed!", "success");
      addLog(
        `📈 Total: ${totalEntries}, Success: ${successfulEntries}, Failed: ${failedEntries}`,
        "info"
      );
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`, "error");
      console.error("Data generation error:", error);
    } finally {
      setIsGenerating(false);
      setProgress(100);
    }
  };

  const clearDatabase = async () => {
    if (adminPassword !== ADMIN_PASSWORD) {
      addLog("❌ Error: Invalid admin password", "error");
      return;
    }

    if (!confirm("⚠️ WARNING: This will permanently delete ALL production entries, terminal receipts, reconciliation runs, and allocation results. This action cannot be undone. Are you sure?")) {
      return;
    }

    setIsClearing(true);
    setLogs([]);

    try {
      addLog("🗑️  Starting database cleanup...", "info");

      // Clear production entries
      addLog("📦 Clearing production entries...", "info");
      await firebaseService.clearCollection("production_entries");
      addLog("✅ Production entries cleared", "success");

      // Clear terminal receipts
      addLog("🧾 Clearing terminal receipts...", "info");
      await firebaseService.clearCollection("terminal_receipts");
      addLog("✅ Terminal receipts cleared", "success");

      // Clear reconciliation runs
      addLog("🔄 Clearing reconciliation runs...", "info");
      await firebaseService.clearCollection("reconciliation_runs");
      addLog("✅ Reconciliation runs cleared", "success");

      // Clear allocation results
      addLog("📊 Clearing allocation results...", "info");
      await firebaseService.clearCollection("allocation_results");
      addLog("✅ Allocation results cleared", "success");

      addLog("🎉 Database cleanup completed successfully!", "success");
      setAdminPassword("");
      setShowAdminPanel(false);
    } catch (error: any) {
      addLog(`❌ Error during cleanup: ${error.message}`, "error");
      console.error("Database cleanup error:", error);
    } finally {
      setIsClearing(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setStats(null);
    setProgress(0);
  };

  const router = useRouter();

  return (
    <div
      className={`min-h-screen pt-[96px] ${COLORS.background.gradient} from-slate-50 to-slate-100 p-6`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Demo Accounts Section */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center">
              <LogIn className="mr-2 text-blue-500" size={20} />
              Demo Account Access
            </h3>
            <p className={COLORS.text.secondary}>
              Ready to login?{" "}
              <button
                onClick={() => router.push("/onboarding/login")}
                className={`${COLORS.primary.blue[400]} hover:text-purple-400 cursor-pointer font-medium hover:underline transition-colors`}
              >
                Get started here
              </button>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {demoAccounts.map((account, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 transition-all cursor-pointer ${"border-blue-500 bg-blue-50 hover:border-slate-300 "}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-800">
                    {account.role}
                  </h4>
                  <User className="text-slate-400" size={16} />
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 w-12">Email:</span>
                    <span className="text-sm font-mono text-slate-700">
                      {account.email}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 w-12">Pass:</span>
                    <span className="text-sm font-mono text-slate-700 flex-1">
                      {showPassword[account.email]
                        ? account.password
                        : "••••••••"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePasswordVisibility(account.email);
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {showPassword[account.email] ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-3">
                  {account.description}
                </p>

                <div className="space-y-1">
                  <div className="text-xs font-medium text-slate-700">
                    Permissions:
                  </div>
                  {account.permissions.map((permission, i) => (
                    <div
                      key={i}
                      className="text-xs text-slate-600 flex items-center"
                    >
                      <div className="w-1 h-1 bg-slate-400 rounded-full mr-2"></div>
                      {permission}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Date Range Selection */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center mb-4">
            <CalendarIcon className="mr-2 text-purple-500" size={20} />
            Data Generation Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Date Range
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { value: "current_month", label: "Current Month" },
                  { value: "last_month", label: "Last Month" },
                  { value: "last_3_months", label: "Last 3 Months" },
                  { value: "last_6_months", label: "Last 6 Months" },
                  { value: "custom", label: "Custom Range" },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setDateRangePreset(preset.value as DateRangePreset)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      dateRangePreset === preset.value
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {dateRangePreset === "custom" && (
              <div className="grid md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Control Panel */}
        <Card className="mb-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-start space-x-3">
              <Users className="text-blue-500 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-slate-700 mb-2">
                  Test Partners
                </h3>
                <div className="space-y-1">
                  {partners.map((partner, i) => (
                    <div
                      key={i}
                      className="text-sm text-slate-600 bg-slate-50 px-2 py-1 rounded"
                    >
                      {partner}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="text-green-500 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-slate-700 mb-2">
                  Data Scope
                </h3>
                <div className="text-sm text-slate-600 space-y-1">
                  <div>• Selected date range</div>
                  <div>• Daily entries per partner</div>
                  <div>• ~{partners.length * 30} entries/month</div>
                  <div>• Realistic oil metrics</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={generateProductionData}
              disabled={isGenerating}
              loading={isGenerating}
              icon={<Play size={20} />}
            >
              {isGenerating ? "Generating..." : "Generate Data"}
            </Button>
            <Button
              onClick={clearLogs}
              disabled={isGenerating}
              variant="secondary"
            >
              Clear Logs
            </Button>
            <Button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              disabled={isGenerating || isClearing}
              variant="secondary"
              icon={<Database size={20} />}
            >
              {showAdminPanel ? "Hide" : "Show"} Admin Controls
            </Button>
          </div>

          {isGenerating && <ProgressBar progress={progress} />}
        </Card>

        {/* Admin Panel */}
        {showAdminPanel && (
          <Card className="mb-6 border-2 border-red-300 bg-red-50">
            <div className="flex items-center space-x-2 mb-4">
              <Lock className="text-red-600" size={20} />
              <h3 className="text-lg font-semibold text-red-800">
                Admin Database Controls
              </h3>
            </div>

            <div className="bg-white p-4 rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Admin Password
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type={showAdminPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  <button
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="text-slate-400 hover:text-slate-600 p-2"
                  >
                    {showAdminPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
      
              </div>

              <Button
                onClick={clearDatabase}
                disabled={!adminPassword || isClearing}
                loading={isClearing}
                icon={<Trash2 size={20} />}
                variant="danger"
              >
                {isClearing ? "Clearing Database..." : "Clear All Database Collections"}
              </Button>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="text-amber-600 mt-0.5" size={16} />
                  <div className="text-xs text-amber-800">
                    <strong>Warning:</strong> This action will permanently delete all:
                    <ul className="list-disc ml-4 mt-1">
                      <li>Production entries</li>
                      <li>Terminal receipts</li>
                      <li>Reconciliation runs</li>
                      <li>Allocation results</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Stats */}
        {stats && (
          <Card className="mb-6">
            <StatGrid stats={stats} />
          </Card>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Operation Logs
            </h3>
            <LogViewer logs={logs} />
          </Card>
        )}

        {/* Info Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-blue-500 mt-0.5" size={20} />
            <div>
              <h4 className="font-medium text-blue-800 mb-1">
                Demo Environment Notice
              </h4>
              <p className="text-sm text-blue-700">
                This tool generates realistic test data for demonstration and testing
                purposes. Use the demo accounts above to test different user
                roles and permissions. Select your desired date range and click
                &quot;Generate Data&quot; to populate the database.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionDataGenerator;
