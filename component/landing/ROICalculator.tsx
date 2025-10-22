"use client";
import React, { useState, useMemo } from "react";
import { COLORS } from "../../constants/ui";
import { Section, SectionHeader } from "../ui";
import { Calculator, TrendingUp } from "lucide-react";

interface ROIInputs {
  jvPartners: number;
  reconciliationDays: number;
  hourlyCost: number;
  disputesPerYear: number;
}

export const ROICalculator: React.FC<{ onScheduleDemo: () => void }> = ({
  onScheduleDemo,
}) => {
  const [inputs, setInputs] = useState<ROIInputs>({
    jvPartners: 4,
    reconciliationDays: 3,
    hourlyCost: 75,
    disputesPerYear: 12,
  });

  const updateInput = (field: keyof ROIInputs, value: number) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  // Calculate ROI
  const roi = useMemo(() => {
    const hoursPerDay = 8;
    const monthsPerYear = 12;

    // Time savings calculation
    const currentMonthlyHours = inputs.reconciliationDays * hoursPerDay;
    const flowshareMonthlyHours = 4; // 4 hours with FlowShare
    const hoursSavedPerMonth = currentMonthlyHours - flowshareMonthlyHours;
    const annualTimeSavings = hoursSavedPerMonth * monthsPerYear;
    const annualCostSavings = annualTimeSavings * inputs.hourlyCost;

    // Dispute reduction value (estimate $5000 per dispute)
    const disputeCostPerIncident = 5000;
    const disputeReductionRate = 0.94; // 94% reduction
    const disputeSavings =
      inputs.disputesPerYear * disputeCostPerIncident * disputeReductionRate;

    // Total annual ROI
    const totalAnnualROI = annualCostSavings + disputeSavings;

    // FlowShare cost estimate (placeholder - adjust based on actual pricing)
    const annualFlowShareCost = 24000; // $2000/month
    const netAnnualROI = totalAnnualROI - annualFlowShareCost;
    const paybackMonths = annualFlowShareCost / (totalAnnualROI / 12);

    return {
      hoursSavedPerMonth,
      annualTimeSavings,
      annualCostSavings,
      disputeSavings,
      totalAnnualROI,
      netAnnualROI,
      paybackMonths: Math.max(0.1, paybackMonths),
    };
  }, [inputs]);

  return (
    <Section id="roi-calculator" background="gradient" maxWidth="lg">
      <SectionHeader
        title="Calculate Your Savings"
        highlightedWord="Savings"
        subtitle="See how much time and money FlowShare can save your operation"
      />

      <div
        className={`${COLORS.background.glass} backdrop-blur-sm ${COLORS.border.light} rounded-2xl p-8 md:p-12`}
      >
        <div className="grid md:grid-cols-2 gap-12">
          {/* Left: Inputs */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <Calculator
                className={`w-6 h-6 ${COLORS.primary.blue[400]}`}
              />
              <h3 className="text-xl font-semibold">Your Current Situation</h3>
            </div>

            {/* Number of JV Partners */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Number of JV Partners
              </label>
              <input
                type="range"
                min="2"
                max="20"
                value={inputs.jvPartners}
                onChange={(e) =>
                  updateInput("jvPartners", parseInt(e.target.value))
                }
                className="w-full"
              />
              <div className="flex justify-between text-sm mt-1">
                <span className={COLORS.text.muted}>2</span>
                <span className="font-semibold text-lg">
                  {inputs.jvPartners}
                </span>
                <span className={COLORS.text.muted}>20</span>
              </div>
            </div>

            {/* Reconciliation Time */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Monthly Reconciliation Time (days)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={inputs.reconciliationDays}
                onChange={(e) =>
                  updateInput("reconciliationDays", parseInt(e.target.value))
                }
                className="w-full"
              />
              <div className="flex justify-between text-sm mt-1">
                <span className={COLORS.text.muted}>1 day</span>
                <span className="font-semibold text-lg">
                  {inputs.reconciliationDays} days
                </span>
                <span className={COLORS.text.muted}>10 days</span>
              </div>
            </div>

            {/* Hourly Cost */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Average Hourly Cost of Your Team ($)
              </label>
              <input
                type="number"
                min="50"
                max="200"
                step="5"
                value={inputs.hourlyCost}
                onChange={(e) =>
                  updateInput("hourlyCost", parseInt(e.target.value))
                }
                className={`w-full px-4 py-2 rounded-lg ${COLORS.background.glass} ${COLORS.border.light} focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            {/* Disputes Per Year */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Allocation Disputes Per Year
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={inputs.disputesPerYear}
                onChange={(e) =>
                  updateInput("disputesPerYear", parseInt(e.target.value))
                }
                className="w-full"
              />
              <div className="flex justify-between text-sm mt-1">
                <span className={COLORS.text.muted}>0</span>
                <span className="font-semibold text-lg">
                  {inputs.disputesPerYear}
                </span>
                <span className={COLORS.text.muted}>50</span>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div
            className={`bg-gradient-to-br ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} rounded-xl p-8 text-white`}
          >
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="w-6 h-6" />
              <h3 className="text-xl font-semibold">Your Projected Savings</h3>
            </div>

            <div className="space-y-6">
              {/* Time Saved */}
              <div className="border-b border-white/20 pb-4">
                <p className="text-white/80 text-sm mb-1">
                  Time Saved Per Month
                </p>
                <p className="text-3xl font-bold">
                  {roi.hoursSavedPerMonth.toFixed(0)} hours
                </p>
              </div>

              {/* Annual Cost Savings */}
              <div className="border-b border-white/20 pb-4">
                <p className="text-white/80 text-sm mb-1">
                  Annual Labor Cost Savings
                </p>
                <p className="text-3xl font-bold">
                  ${roi.annualCostSavings.toLocaleString()}
                </p>
              </div>

              {/* Dispute Reduction Value */}
              <div className="border-b border-white/20 pb-4">
                <p className="text-white/80 text-sm mb-1">
                  Dispute Reduction Value
                </p>
                <p className="text-3xl font-bold">
                  ${roi.disputeSavings.toLocaleString()}
                </p>
              </div>

              {/* Total Annual ROI */}
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-white/80 text-sm mb-1">Total Annual ROI</p>
                <p className="text-4xl font-bold">
                  ${roi.totalAnnualROI.toLocaleString()}
                </p>
              </div>

              {/* Payback Period */}
              <div className="text-center pt-4">
                <p className="text-white/80 text-sm mb-1">Payback Period</p>
                <p className="text-2xl font-bold">
                  {roi.paybackMonths.toFixed(1)} months
                </p>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={onScheduleDemo}
              className="w-full mt-8 bg-white text-blue-600 font-semibold py-4 px-6 rounded-full hover:bg-gray-100 transition-all transform hover:scale-105"
            >
              Schedule Demo to Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className={`text-center text-sm ${COLORS.text.muted} mt-6`}>
        * Calculations are estimates based on industry averages. Actual savings
        may vary based on your specific operations.
      </p>
    </Section>
  );
};
