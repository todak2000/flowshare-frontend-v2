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
  Key,
  Eye,
  EyeOff,
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

const ProductionDataGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<GenerationStats | null>(null);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>(
    {}
  );

  const canGenerateData = false;
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
        // "Update Field Parameters",
      ],
    },
    {
      email: "Qwert@gmail.com",
      password: "Qwerty123",
      role: "JV Coordinator",
      description: "Joint venture coordination and data reconcilliation",
      permissions: [
        "Initiate/View reconcilliation data",
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
        "View reconcilliation data",
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
      "Test Oil and Gas": { min: 18000, max: 25000, variance: 0.2 },
      TUPNI: { min: 16000, max: 29000, variance: 0.15 },
      ACE: { min: 40000, max: 55000, variance: 0.25 },
      WINDY: { min: 32000, max: 68000, variance: 0.18 },
    };

    type PartnerKey = keyof typeof partnerRanges;

    const range = (
      partnerRanges as Record<
        PartnerKey,
        { min: number; max: number; variance: number }
      >
    )[partner as PartnerKey] ?? { min: 18000, max: 70000, variance: 0.2 };

    const { min, max, variance } = range;
    const baseVolume = min + random(seed) * (max - min);
    const seasonalFactor = 1 + 0.1 * Math.sin((dayOfYear / 365) * 2 * Math.PI);
    const dailyVariation = 1 + (random(seed + 1) - 0.5) * variance;
    const grossVolume = Math.round(
      baseVolume * seasonalFactor * dailyVariation
    );

    const bswBase = 2 + random(seed + 2) * 6;
    const bsw = Math.round((bswBase + (grossVolume / 1000) * 0.5) * 100) / 100;

    const tempBase = 70 + 10 * Math.sin((dayOfYear / 365) * 2 * Math.PI);
    const temperature =
      Math.round((tempBase + (random(seed + 3) - 0.5) * 10) * 10) / 10;

    const apiBase = 30 + random(seed + 4) * 7;
    const apiGravity =
      Math.round((apiBase + (random(seed + 5) - 0.5) * 3) * 10) / 10;

    // Use the selected account's email as created_by if available
    const createdBy = "test_user_system";

    return {
      partner,
      gross_volume_bbl: grossVolume,
      bsw_percent: Math.max(0.1, Math.min(15, bsw)),
      temperature_degF: Math.max(50, Math.min(90, temperature)),
      api_gravity: Math.max(25, Math.min(36, apiGravity)),
      timestamp: date,
      created_by: createdBy,
    };
  };

  const generateMonthData = (
    year: number,
    month: number
  ): ProductionEntryy[] => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthData: ProductionEntryy[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      partners.forEach((partner) => {
        monthData.push(generateRealisticData(partner, date));
      });
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

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const months: MonthInfo[] = [];
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(currentYear, currentMonth - i, 1);
        months.push({
          year: targetDate.getFullYear(),
          month: targetDate.getMonth(),
          name: targetDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
        });
      }

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

          {/* Demo Accounts Grid */}

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

        {/* Control Panel */}
        <Card className="mb-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Partners */}
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

            {/* Scope */}
            <div className="flex items-start space-x-3">
              <Calendar className="text-green-500 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-slate-700 mb-2">
                  Data Scope
                </h3>
                <div className="text-sm text-slate-600 space-y-1">
                  <div>• Current + previous 6 months</div>
                  <div>• Daily entries per partner</div>
                  <div>• ~840 entries</div>
                  <div>• Realistic oil metrics</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={generateProductionData}
              disabled={isGenerating || !canGenerateData}
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
          </div>

          {isGenerating && <ProgressBar progress={progress} />}
        </Card>

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
              Generation Logs
            </h3>
            <LogViewer logs={logs} />
          </Card>
        )}

        {/* Warning */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-amber-500 mt-0.5" size={20} />
            <div>
              <h4 className="font-medium text-amber-800 mb-1">
                Testing Environment Notice
              </h4>
              <p className="text-sm text-amber-700">
                This tool generates test data for development and testing
                purposes. Use the demo accounts above to test different user
                roles and permissions. Ensure you&apos;re connected to your test
                database before running.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionDataGenerator;
