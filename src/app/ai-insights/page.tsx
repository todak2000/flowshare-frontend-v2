/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Brain,
  Activity,
  Zap,
  ChevronRight,
  Lightbulb,
  Calendar,
  CalendarRange
} from 'lucide-react';
import { COLORS } from '../../../component/Home';
import { useUser } from '../../../hook/useUser';
import { geminiService } from '../../../lib/gemini-service';
import { firebaseService } from '../../../lib/firebase-service';
import LoadingSpinner from '../../../component/LoadingSpinner';

interface Anomaly {
  entry_id: string;
  partner: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  value: number;
  expected_range: string;
  explanation: string;
  action: string;
}

interface Prediction {
  partner: string;
  predicted_volume: number;
  confidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

type DateRangePreset = 'current_month' | 'last_month' | 'last_2_months' | 'last_6_months' | 'last_year' | 'ytd' | 'custom';

interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

export default function AIInsights() {
  const { data: userData, loading: userLoading } = useUser();
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [insights, setInsights] = useState<string>('');
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'query' | 'anomalies' | 'predictions' | 'insights'>('query');
  const [productionData, setProductionData] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('current_month');
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    lastDayOfMonth.setHours(23, 59, 59, 999);
    return {
      startDate: firstDayOfMonth,
      endDate: lastDayOfMonth,
      label: 'Current Month'
    };
  });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Helper function to calculate date ranges
  const calculateDateRange = (preset: DateRangePreset): DateRange => {
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    let startDate: Date;
    let label: string;

    switch (preset) {
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        label = 'Current Month';
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate.setMonth(now.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        label = 'Last Month';
        break;
      case 'last_2_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        label = 'Last 2 Months';
        break;
      case 'last_6_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        label = 'Last 6 Months';
        break;
      case 'last_year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        label = 'Last 12 Months';
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        label = 'Year to Date';
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        label = 'Custom Range';
    }

    return { startDate, endDate, label };
  };

  const handlePresetChange = (preset: DateRangePreset) => {
    setSelectedPreset(preset);
    if (preset === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
      setDateRange(calculateDateRange(preset));
    }
  };

  const handleCustomDateChange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);
    setDateRange({
      startDate,
      endDate,
      label: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
    });
  };

  // Load production data on mount and when date range changes
  useEffect(() => {
    if (userData?.company) {
      loadProductionData();
    }
  }, [userData, dateRange]);

  const loadProductionData = async () => {
    try {
      const partnerId = userData?.role === 'jv_coordinator' ? undefined : userData?.company;

      const result = await firebaseService.getAllProductionEntriesForPeriod(
        partnerId,
        dateRange.startDate,
        dateRange.endDate
      );
      console.log(result, 'production data for period:', dateRange.label);
      setProductionData(result);
    } catch (error) {
      console.error('Error loading production data:', error);
    }
  };

  // Auto-load anomalies when data is available
  useEffect(() => {
    if (productionData.length > 0 && anomalies.length === 0) {
      detectAnomalies();
    }
  }, [productionData]);

  const askAI = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      // Prepare context from production data
      const context = {
        total_entries: productionData.length,
        partners: [...new Set(productionData.map(e => e.partner))],
        date_range: {
          start: productionData[0]?.timestamp,
          end: productionData[productionData.length - 1]?.timestamp
        },
        summary: {
          total_volume: productionData.reduce((sum, e) => sum + e.gross_volume_bbl, 0),
          avg_bsw: productionData.reduce((sum, e) => sum + e.bsw_percent, 0) / productionData.length,
          avg_temp: productionData.reduce((sum, e) => sum + e.temperature_degF, 0) / productionData.length
        },
        recent_entries: productionData.slice(0, 10)
      };

      const result = await geminiService.naturalLanguageQuery(query, context);
      setAnswer(result);
    } catch (error) {
      console.error('AI query failed:', error);
      setAnswer('Sorry, I could not process your query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const detectAnomalies = async () => {
    setLoading(true);
    try {
      const result = await geminiService.detectAnomalies(productionData);
      setAnomalies(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Anomaly detection failed:', error);
      setAnomalies([]);
    } finally {
      setLoading(false);
    }
  };

  const generatePredictions = async () => {
    setLoading(true);
    try {
      const result = await geminiService.predictAllocation(productionData);
      setPredictions(result);
    } catch (error) {
      console.error('Prediction failed:', error);
      setPredictions(null);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    setLoading(true);
    try {
      const allocationData = {
        production_entries: productionData.length,
        partners: [...new Set(productionData.map(e => e.partner))],
        total_volume: productionData.reduce((sum, e) => sum + e.gross_volume_bbl, 0),
        data_quality_score: 95,
        period: dateRange.label
      };

      const result = await geminiService.generateInsights(allocationData);
      setInsights(result);
    } catch (error) {
      console.error('Insights generation failed:', error);
      setInsights('Unable to generate insights at this time.');
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className={`min-h-screen ${COLORS.background.gradient} flex flex-col items-center justify-center`}>
        <LoadingSpinner message="Loading AI Insights..." />
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'decreasing':
        return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
      default:
        return <Activity className="w-4 h-4 text-blue-400" />;
    }
  };

  const tabs = [
    { id: 'query' as const, label: 'Ask AI', icon: MessageSquare },
    { id: 'anomalies' as const, label: 'Anomaly Detection', icon: AlertTriangle },
    { id: 'predictions' as const, label: 'Predictions', icon: TrendingUp },
    { id: 'insights' as const, label: 'Strategic Insights', icon: Lightbulb }
  ];

  return (
    <div className={`min-h-screen ${COLORS.background.gradient} pt-20`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} flex items-center justify-center`}>
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${COLORS.text.primary}`}>
                AI-Powered Insights
              </h1>
              <p className={`${COLORS.text.secondary} flex items-center space-x-2`}>
                <Brain className="w-4 h-4" />
                <span>Powered by Google Gemini 1.5 Pro</span>
                <Zap className="w-4 h-4 text-yellow-400" />
              </p>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-2xl p-6 mt-6`}>
            <div className="flex items-center space-x-3 mb-4">
              <CalendarRange className={`w-5 h-5 ${COLORS.primary.blue[400]}`} />
              <h3 className={`text-lg font-semibold ${COLORS.text.primary}`}>
                Analysis Period
              </h3>
            </div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
              {[
                { value: 'current_month' as DateRangePreset, label: 'Current Month' },
                { value: 'last_month' as DateRangePreset, label: 'Last Month' },
                { value: 'last_2_months' as DateRangePreset, label: 'Last 2 Months' },
                { value: 'last_6_months' as DateRangePreset, label: 'Last 6 Months' },
                { value: 'last_year' as DateRangePreset, label: 'Last Year' },
                { value: 'ytd' as DateRangePreset, label: 'Year to Date' },
                { value: 'custom' as DateRangePreset, label: 'Custom Range' }
              ].map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetChange(preset.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    selectedPreset === preset.value
                      ? `bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} text-white shadow-lg`
                      : `${COLORS.background.glass} ${COLORS.text.secondary} hover:${COLORS.text.primary} hover:${COLORS.background.glassHover} ${COLORS.border.light} border`
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Date Picker */}
            {showCustomDatePicker && (
              <div className={`p-4 ${COLORS.background.glass} rounded-xl ${COLORS.border.light} border`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${COLORS.text.primary} mb-2`}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      defaultValue={dateRange.startDate.toISOString().split('T')[0]}
                      onChange={(e) => {
                        const endInput = document.querySelector('input[type="date"]:nth-of-type(2)') as HTMLInputElement;
                        if (endInput?.value) {
                          handleCustomDateChange(e.target.value, endInput.value);
                        }
                      }}
                      className={`w-full px-4 py-2 ${COLORS.background.glass} backdrop-blur-sm ${COLORS.border.light} border rounded-xl ${COLORS.text.primary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${COLORS.text.primary} mb-2`}>
                      End Date
                    </label>
                    <input
                      type="date"
                      defaultValue={dateRange.endDate.toISOString().split('T')[0]}
                      onChange={(e) => {
                        const startInput = document.querySelector('input[type="date"]:first-of-type') as HTMLInputElement;
                        if (startInput?.value) {
                          handleCustomDateChange(startInput.value, e.target.value);
                        }
                      }}
                      className={`w-full px-4 py-2 ${COLORS.background.glass} backdrop-blur-sm ${COLORS.border.light} border rounded-xl ${COLORS.text.primary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Selected Date Range Display */}
            <div className={`mt-4 p-3 ${COLORS.background.glass} rounded-xl flex items-center justify-between`}>
              <div className="flex items-center space-x-2">
                <Calendar className={`w-4 h-4 ${COLORS.primary.blue[400]}`} />
                <span className={`text-sm ${COLORS.text.secondary}`}>Selected Period:</span>
              </div>
              <span className={`text-sm font-medium ${COLORS.text.primary}`}>
                {dateRange.label}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-xl p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${COLORS.text.muted}`}>Data Points</p>
                  <p className={`text-2xl font-bold ${COLORS.text.primary}`}>{productionData.length}</p>
                </div>
                <Activity className={`w-8 h-8 ${COLORS.primary.blue[400]}`} />
              </div>
            </div>

            <div className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-xl p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${COLORS.text.muted}`}>Anomalies Detected</p>
                  <p className={`text-2xl font-bold ${COLORS.text.primary}`}>{anomalies.length}</p>
                </div>
                <AlertTriangle className={`w-8 h-8 text-orange-400`} />
              </div>
            </div>

            <div className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-xl p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${COLORS.text.muted}`}>AI Confidence</p>
                  <p className={`text-2xl font-bold ${COLORS.text.primary}`}>
                    {predictions?.confidence_score || 0}%
                  </p>
                </div>
                <Brain className={`w-8 h-8 ${COLORS.primary.purple[400]}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`${COLORS.background.card} backdrop-blur-xl ${COLORS.border.light} border rounded-2xl mb-6 overflow-hidden`}>
          <div className="p-6 border-b border-white/10">
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
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

          {/* Tab Content */}
          <div className="p-6">
            {/* Natural Language Query Tab */}
            {activeTab === 'query' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                  <MessageSquare className={`w-5 h-5 ${COLORS.primary.blue[400]}`} />
                  <h2 className={`text-xl font-semibold ${COLORS.text.primary}`}>
                    Ask About Your Data
                  </h2>
                </div>

                <div className={`p-4 ${COLORS.background.glass} rounded-xl ${COLORS.border.light} border`}>
                  <p className={`text-sm ${COLORS.text.secondary} mb-3`}>
                    Try asking questions like:
                  </p>
                  <div className="space-y-2">
                    {[
                      "What was the average production last week?",
                      "Which partner had the highest BSW percentage?",
                      "Show me entries with unusual temperature readings",
                      "Compare this month's volume to last month"
                    ].map((example, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuery(example)}
                        className={`text-left text-sm ${COLORS.text.muted} hover:${COLORS.text.primary} hover:${COLORS.background.glassHover} p-2 rounded-lg transition-colors flex items-center space-x-2 w-full`}
                      >
                        <ChevronRight className="w-3 h-3" />
                        <span>{example}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask anything about your production data..."
                  className={`w-full px-4 py-3 ${COLORS.background.glass} backdrop-blur-sm ${COLORS.border.light} border rounded-xl ${COLORS.text.primary} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  onKeyDown={(e) => e.key === 'Enter' && askAI()}
                />

                <button
                  onClick={askAI}
                  disabled={loading || !query.trim()}
                  className={`w-full bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} text-white py-3 px-6 rounded-xl font-medium hover:opacity-90 transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Asking Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Ask Gemini AI</span>
                    </>
                  )}
                </button>

                {answer && (
                  <div className={`p-4 ${COLORS.background.glass} rounded-xl ${COLORS.border.light} border`}>
                    <h3 className={`font-semibold ${COLORS.text.primary} mb-2 flex items-center space-x-2`}>
                      <Brain className="w-4 h-4" />
                      <span>AI Answer:</span>
                    </h3>
                    <div className={`${COLORS.text.secondary} whitespace-pre-wrap`}>
                      
                      <ReactMarkdown>{answer}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Anomaly Detection Tab */}
            {activeTab === 'anomalies' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className={`w-5 h-5 text-orange-400`} />
                    <h2 className={`text-xl font-semibold ${COLORS.text.primary}`}>
                      AI Anomaly Detection
                    </h2>
                  </div>
                  <button
                    onClick={detectAnomalies}
                    disabled={loading}
                    className={`px-4 py-2 bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50`}
                  >
                    {loading ? 'Analyzing...' : 'Run Detection'}
                  </button>
                </div>

                {anomalies.length === 0 ? (
                  <div className={`p-8 text-center ${COLORS.background.glass} rounded-xl`}>
                    <AlertTriangle className={`w-16 h-16 ${COLORS.text.muted} mx-auto mb-4`} />
                    <p className={`text-lg ${COLORS.text.secondary} mb-2`}>
                      {loading ? 'Analyzing data...' : 'No anomalies detected'}
                    </p>
                    <p className={`${COLORS.text.muted}`}>
                      {loading ? 'Please wait...' : 'Your production data looks normal'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {anomalies.map((anomaly, idx) => (
                      <div
                        key={idx}
                        className={`p-4 ${COLORS.background.glass} rounded-xl border ${getSeverityColor(anomaly.severity)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`font-medium ${COLORS.text.primary}`}>
                                {anomaly.type.replace(/_/g, ' ').toUpperCase()}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(anomaly.severity)}`}>
                                {anomaly.severity}
                              </span>
                            </div>
                            <p className={`text-sm ${COLORS.text.muted} mb-1`}>
                              Partner: {anomaly.partner} | Value: {anomaly.value}
                            </p>
                            <p className={`text-sm ${COLORS.text.secondary}`}>
                              {anomaly.explanation}
                            </p>
                          </div>
                        </div>
                        <div className={`mt-3 pt-3 border-t border-white/10`}>
                          <p className={`text-xs ${COLORS.text.muted}`}>
                            <strong>Recommended Action:</strong> {anomaly.action}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Predictions Tab */}
            {activeTab === 'predictions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className={`w-5 h-5 text-green-400}`} />
                    <h2 className={`text-xl font-semibold ${COLORS.text.primary}`}>
                      Predictive Analytics
                    </h2>
                  </div>
                  <button
                    onClick={generatePredictions}
                    disabled={loading}
                    className={`px-4 py-2 bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50`}
                  >
                    {loading ? 'Predicting...' : 'Generate Predictions'}
                  </button>
                </div>

                {!predictions ? (
                  <div className={`p-8 text-center ${COLORS.background.glass} rounded-xl`}>
                    <TrendingUp className={`w-16 h-16 ${COLORS.text.muted} mx-auto mb-4`} />
                    <p className={`text-lg ${COLORS.text.secondary} mb-2`}>
                      AI-powered predictions ready
                    </p>
                    <p className={`${COLORS.text.muted}`}>
                      Click Generate Predictions to see forecasts
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Confidence Score */}
                    <div className={`p-4 ${COLORS.background.glass} rounded-xl ${COLORS.border.light} border`}>
                      <div className="flex items-center justify-between">
                        <span className={`${COLORS.text.secondary}`}>Overall Confidence</span>
                        <span className={`text-2xl font-bold ${COLORS.text.primary}`}>
                          {predictions.confidence_score}%
                        </span>
                      </div>
                    </div>

                    {/* Predictions by Partner */}
                    {predictions.predictions && predictions.predictions.length > 0 && (
                      <div className="space-y-3">
                        {predictions.predictions.map((pred: Prediction, idx: number) => (
                          <div
                            key={idx}
                            className={`p-4 ${COLORS.background.glass} rounded-xl ${COLORS.border.light} border`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className={`font-medium ${COLORS.text.primary}`}>
                                {pred.partner}
                              </span>
                              {getTrendIcon(pred.trend)}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className={`${COLORS.text.muted}`}>Predicted Volume</p>
                                <p className={`font-semibold ${COLORS.text.primary}`}>
                                  {pred.predicted_volume.toLocaleString()} BBL
                                </p>
                              </div>
                              <div>
                                <p className={`${COLORS.text.muted}`}>Confidence</p>
                                <p className={`font-semibold ${COLORS.text.primary}`}>
                                  {pred.confidence}%
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Methodology */}
                    {predictions.methodology && (
                      <div className={`p-4 ${COLORS.background.glass} rounded-xl ${COLORS.border.light} border`}>
                        <h3 className={`font-semibold ${COLORS.text.primary} mb-2`}>
                          Methodology
                        </h3>
                        <p className={`text-sm ${COLORS.text.secondary}`}>
                          {predictions.methodology}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Strategic Insights Tab */}
            {activeTab === 'insights' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Lightbulb className={`w-5 h-5 text-yellow-500`} />
                    <h2 className={`text-xl font-semibold ${COLORS.text.primary}`}>
                      Strategic Insights
                    </h2>
                  </div>
                  <button
                    onClick={generateInsights}
                    disabled={loading}
                    className={`px-4 py-2 bg-gradient-to-r ${COLORS.primary.blue[600]} ${COLORS.primary.purple[600]} text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50`}
                  >
                    {loading ? 'Generating...' : 'Generate Insights'}
                  </button>
                </div>

                {!insights ? (
                  <div className={`p-8 text-center ${COLORS.background.glass} rounded-xl`}>
                    <Lightbulb className={`w-16 h-16 ${COLORS.text.muted} mx-auto mb-4`} />
                    <p className={`text-lg ${COLORS.text.secondary} mb-2`}>
                      AI-generated insights ready
                    </p>
                    <p className={`${COLORS.text.muted}`}>
                      Get strategic recommendations and analysis
                    </p>
                  </div>
                ) : (
                  <div className={`p-6 ${COLORS.background.glass} ${COLORS.text.secondary} rounded-xl ${COLORS.border.light} border prose prose-invert max-w-none markdown-content`}>
                  <ReactMarkdown>{insights}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Powered By Footer */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500/10 rounded-full">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className={`text-sm ${COLORS.text.secondary}`}>
              Powered by Google Gemini 1.5 Pro • Deployed on Cloud Run
            </span>
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
