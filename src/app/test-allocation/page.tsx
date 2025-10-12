/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { AllocationEngine } from '../../../lib/allocation-engine';

interface LogEntry {
  message: string;
  type: 'info' | 'header' | 'section' | 'success' | 'error' | 'expected';
  timestamp: string;
}

interface PartnerData {
  partner: string;
  gross_volume_bbl: number;
  bsw_percent: number;
  temperature_degF: number;
  api_gravity: number;
  enabled: boolean;
}

interface TerminalData {
  final_volume_bbl: number;
  api_gravity: number;
}

interface TestResults {
  result: any;
  validation: {
    balanceCheck: boolean;
    terminalMatch: boolean;
    allEfficienciesValid: boolean;
    overallPass: boolean;
  };
  totals: {
    totalGrossInput: number;
    totalAllocated: number;
    totalLoss: number;
  };
}

interface DummyDataSet {
  name: string;
  terminal: TerminalData;
  partners: PartnerData[];
}

const AllocationTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [useCustomData, setUseCustomData] = useState<boolean>(false);

  // State for custom terminal data
  const [terminalData, setTerminalData] = useState<TerminalData>({
    final_volume_bbl: 1281083,
    api_gravity: 45
  });

  // State for partner data (max 5 partners)
  const [partnerData, setPartnerData] = useState<PartnerData[]>([
    {
      partner: "Partner A",
      gross_volume_bbl: 695286,
      bsw_percent: 14.83,
      temperature_degF: 80,
      api_gravity: 33,
      enabled: true
    },
    {
      partner: "Partner B", 
      gross_volume_bbl: 589253,
      bsw_percent: 14.73,
      temperature_degF: 81,
      api_gravity: 32,
      enabled: true
    },
    {
      partner: "Partner C",
      gross_volume_bbl: 450000,
      bsw_percent: 12.5,
      temperature_degF: 75,
      api_gravity: 35,
      enabled: false
    },
    {
      partner: "Partner D",
      gross_volume_bbl: 320000,
      bsw_percent: 15.2,
      temperature_degF: 82,
      api_gravity: 30,
      enabled: false
    },
    {
      partner: "Partner E",
      gross_volume_bbl: 280000,
      bsw_percent: 10.8,
      temperature_degF: 78,
      api_gravity: 38,
      enabled: false
    }
  ]);

  // Dummy data sets
  const dummyDataSets: Record<string, DummyDataSet> = {
    methodology: {
      name: "Methodology Test (Original)",
      terminal: { final_volume_bbl: 950, api_gravity: 32 },
      partners: [
        { partner: "Partner A", gross_volume_bbl: 1000, bsw_percent: 2, temperature_degF: 80, api_gravity: 30, enabled: true },
        { partner: "Partner B", gross_volume_bbl: 800, bsw_percent: 3, temperature_degF: 75, api_gravity: 28, enabled: true }
      ]
    },
    realistic: {
      name: "Realistic Multi-Partner",
      terminal: { final_volume_bbl: 1281083, api_gravity: 45 },
      partners: [
        { partner: "WINDY", gross_volume_bbl: 695286, bsw_percent: 14.83, temperature_degF: 80, api_gravity: 33, enabled: true },
        { partner: "ACE", gross_volume_bbl: 589253, bsw_percent: 14.73, temperature_degF: 81, api_gravity: 32, enabled: true },
        { partner: "Test Oil and Gas", gross_volume_bbl: 450000, bsw_percent: 12.5, temperature_degF: 75, api_gravity: 35, enabled: true }
      ]
    },
    singlePartner: {
      name: "Single Partner Test",
      terminal: { final_volume_bbl: 4012878, api_gravity: 45 },
      partners: [
        { partner: "Test Oil and Gas", gross_volume_bbl: 695286, bsw_percent: 14.83, temperature_degF: 80, api_gravity: 33, enabled: true }
      ]
    },
    maxPartners: {
      name: "5-Partner Maximum",
      terminal: { final_volume_bbl: 2800000, api_gravity: 40 },
      partners: [
        { partner: "Alpha Corp", gross_volume_bbl: 650000, bsw_percent: 15.2, temperature_degF: 79, api_gravity: 32, enabled: true },
        { partner: "Beta Energy", gross_volume_bbl: 580000, bsw_percent: 13.8, temperature_degF: 82, api_gravity: 34, enabled: true },
        { partner: "Gamma Oil", gross_volume_bbl: 520000, bsw_percent: 16.5, temperature_degF: 77, api_gravity: 31, enabled: true },
        { partner: "Delta Resources", gross_volume_bbl: 460000, bsw_percent: 12.1, temperature_degF: 84, api_gravity: 36, enabled: true },
        { partner: "Epsilon Petroleum", gross_volume_bbl: 390000, bsw_percent: 14.3, temperature_degF: 80, api_gravity: 33, enabled: true }
      ]
    }
  };

  const addLog = (message: string, type: LogEntry['type'] = 'info'): void => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const clearLogs = (): void => {
    setLogs([]);
    setTestResults(null);
  };

  const loadDummyData = (dataSet: DummyDataSet): void => {
    setTerminalData(dataSet.terminal);
    // Reset all partners to disabled first
    const resetPartners = partnerData.map(p => ({ ...p, enabled: false }));
    // Update with dummy data
    dataSet.partners.forEach((dummyPartner, index) => {
      if (index < resetPartners.length) {
        resetPartners[index] = { ...dummyPartner };
      }
    });
    setPartnerData(resetPartners);
    addLog(`Loaded dummy data: ${dataSet.name}`, 'info');
  };

  const updatePartnerData = (index: number, field: keyof PartnerData, value: string | number | boolean): void => {
    const updatedData = [...partnerData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setPartnerData(updatedData);
  };

  const updateTerminalData = (field: keyof TerminalData, value: string | number): void => {
    setTerminalData(prev => ({ ...prev, [field]: Number(value) }));
  };

  const togglePartner = (index: number): void => {
    updatePartnerData(index, 'enabled', !partnerData[index].enabled);
  };

  const runAllocationTest = async (): Promise<void> => {
    setIsRunning(true);
    setTestResults(null);
    setLogs([]);

    try {
      addLog("=== DYNAMIC ALLOCATION ENGINE TEST ===", 'header');
      addLog("Initializing AllocationEngine...");

      const engine = new AllocationEngine();

      // Get enabled partners
      const enabledPartners = partnerData.filter(p => p.enabled);
      
      if (enabledPartners.length === 0) {
        throw new Error("At least one partner must be enabled");
      }

      // Prepare test entries
      const testEntries = enabledPartners.map(partner => ({
        partner: partner.partner,
        gross_volume_bbl: Number(partner.gross_volume_bbl),
        bsw_percent: Number(partner.bsw_percent),
        temperature_degF: Number(partner.temperature_degF),
        api_gravity: Number(partner.api_gravity)
      }));

      const testTerminal = {
        id: "test",
        final_volume_bbl: Number(terminalData.final_volume_bbl),
        api_gravity: Number(terminalData.api_gravity),
        timestamp: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        created_by: "test",
        hash: "test",
      };

      // Calculate totals
      const totalGrossInput = testEntries.reduce((sum, entry) => sum + entry.gross_volume_bbl, 0);

      addLog("INPUT DATA:", 'section');
      testEntries.forEach(entry => {
        addLog(`${entry.partner} - Gross: ${entry.gross_volume_bbl.toLocaleString()} bbl, BSW: ${entry.bsw_percent}%, Temp: ${entry.temperature_degF}°F, API: ${entry.api_gravity}°`);
      });
      addLog(`Terminal - Volume: ${testTerminal.final_volume_bbl.toLocaleString()} bbl, API: ${testTerminal.api_gravity}°`);
      addLog(`Total Gross Input: ${totalGrossInput.toLocaleString()} bbl`);
      addLog("");

      addLog("Running allocation calculation...", 'info');
      await new Promise<void>(resolve => setTimeout(resolve, 1000));

      const result = engine.calculateAllocation(testEntries, testTerminal as any);

      addLog("CALCULATED RESULTS:", 'section');
      result.allocation_results.forEach((allocation, index) => {
        addLog(`${allocation.partner} Net Volume: ${allocation.net_volume} bbl`);
      });
      addLog(`Total Net Volume: ${result.total_net_volume} bbl`);
      addLog(`Shrinkage Factor: ${result.shrinkage_factor}%`);
      addLog("");

      addLog("ALLOCATION RESULTS:", 'section');
      result.allocation_results.forEach(allocation => {
        const efficiency = (allocation.allocated_volume / allocation.input_volume * 100).toFixed(1);
        addLog(`${allocation.partner} - Allocated: ${allocation.allocated_volume} bbl (${allocation.percentage}%) - Efficiency: ${efficiency}%`);
      });
      addLog("");

      addLog("VOLUME ANALYSIS:", 'section');
      let totalAllocated = 0;
      let totalLoss = 0;
      result.allocation_results.forEach(allocation => {
        const loss = allocation.input_volume - allocation.allocated_volume;
        totalAllocated += allocation.allocated_volume;
        totalLoss += loss;
        addLog(`${allocation.partner} - Loss: ${loss.toFixed(2)} bbl`);
      });
      addLog(`Total Allocated: ${totalAllocated.toFixed(2)} bbl`);
      addLog(`Total Loss: ${totalLoss.toFixed(2)} bbl`);
      addLog(`Terminal Volume: ${testTerminal.final_volume_bbl.toLocaleString()} bbl`);
      addLog("");

      // Validation
      addLog("VALIDATION CHECKS:", 'section');
      const balanceCheck = Math.abs((totalGrossInput - totalAllocated - totalLoss)) < 1;
      const terminalMatch = Math.abs(totalAllocated - testTerminal.final_volume_bbl) < 1;
      const allEfficienciesValid = result.allocation_results.every(allocation => 
        (allocation.allocated_volume / allocation.input_volume) <= 1.001
      );

      addLog(`Balance Check (Input = Allocated + Loss): ${balanceCheck ? 'PASS' : 'FAIL'}`, balanceCheck ? 'success' : 'error');
      addLog(`Terminal Volume Match: ${terminalMatch ? 'PASS' : 'FAIL'}`, terminalMatch ? 'success' : 'error');
      addLog(`All Efficiencies ≤ 100%: ${allEfficienciesValid ? 'PASS' : 'FAIL'}`, allEfficienciesValid ? 'success' : 'error');

      const overallPass = balanceCheck && terminalMatch && allEfficienciesValid;
      addLog(`OVERALL TEST: ${overallPass ? '✅ PASS' : '❌ FAIL'}`, overallPass ? 'success' : 'error');

      setTestResults({
        result,
        validation: {
          balanceCheck,
          terminalMatch,
          allEfficienciesValid,
          overallPass
        },
        totals: {
          totalGrossInput,
          totalAllocated,
          totalLoss
        }
      });

    } catch (error: any) {
      addLog(`Test failed with error: ${error.message}`, 'error');
      if (error.stack) {
        addLog(`Stack trace: ${error.stack}`, 'error');
      }
    } finally {
      setIsRunning(false);
    }
  };

  const getLogStyle = (type: LogEntry['type']): string => {
    switch (type) {
      case 'header':
        return 'text-blue-600 font-bold text-lg border-b border-blue-200 pb-1 mb-2';
      case 'section':
        return 'text-purple-600 font-semibold mt-3 mb-1';
      case 'success':
        return 'text-green-600 font-medium';
      case 'error':
        return 'text-red-600 font-medium';
      case 'expected':
        return 'text-orange-600 italic';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="min-h-screen mt-[96px] bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Dynamic Allocation Engine Test Console
          </h1>

          {/* Data Source Toggle */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-4 mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useCustomData}
                  onChange={(e) => setUseCustomData(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-medium">Use Custom Data</span>
              </label>
              <span className="text-sm text-gray-600">
                {useCustomData ? 'Configure your own test data below' : 'Use predefined dummy data sets'}
              </span>
            </div>

            {!useCustomData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(dummyDataSets).map(([key, dataSet]) => (
                  <button
                    key={key}
                    onClick={() => loadDummyData(dataSet)}
                    className="p-3 bg-white rounded-lg border hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="font-medium text-sm">{dataSet.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {dataSet.partners.length} partners, {dataSet.terminal.final_volume_bbl.toLocaleString()} bbl
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Terminal Data Configuration */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Terminal Receipt Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Terminal Volume (bbl)</label>
                <input
                  type="number"
                  value={terminalData.final_volume_bbl}
                  onChange={(e) => updateTerminalData('final_volume_bbl', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Terminal API Gravity (°API)</label>
                <input
                  type="number"
                  value={terminalData.api_gravity}
                  onChange={(e) => updateTerminalData('api_gravity', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  min="10"
                  max="45"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Partner Data Configuration */}
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Production Partner Data (Max 5 Partners)</h3>
            <div className="space-y-4">
              {partnerData.map((partner, index) => (
                <div key={index} className={`p-4 border rounded-lg ${partner.enabled ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={partner.enabled}
                        onChange={() => togglePartner(index)}
                        className="w-4 h-4"
                      />
                      <span className="font-medium">Partner {index + 1}</span>
                    </label>
                    <span className={`text-sm px-2 py-1 rounded ${partner.enabled ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                      {partner.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  {partner.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Partner Name</label>
                        <input
                          type="text"
                          value={partner.partner}
                          onChange={(e) => updatePartnerData(index, 'partner', e.target.value)}
                          className="w-full p-2 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Gross Volume (bbl)</label>
                        <input
                          type="number"
                          value={partner.gross_volume_bbl}
                          onChange={(e) => updatePartnerData(index, 'gross_volume_bbl', Number(e.target.value))}
                          className="w-full p-2 border rounded text-sm"
                          min={1}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">BSW (%)</label>
                        <input
                          type="number"
                          value={partner.bsw_percent}
                          onChange={(e) => updatePartnerData(index, 'bsw_percent', Number(e.target.value))}
                          className="w-full p-2 border rounded text-sm"
                          min={0}
                          max={99.99}
                          step={0.01}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Temperature (°F)</label>
                        <input
                          type="number"
                          value={partner.temperature_degF}
                          onChange={(e) => updatePartnerData(index, 'temperature_degF', Number(e.target.value))}
                          className="w-full p-2 border rounded text-sm"
                          min={-50}
                          max={200}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">API Gravity (°API)</label>
                        <input
                          type="number"
                          value={partner.api_gravity}
                          onChange={(e) => updatePartnerData(index, 'api_gravity', Number(e.target.value))}
                          className="w-full p-2 border rounded text-sm"
                          min={10}
                          max={45}
                          step={0.1}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Control Panel */}
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-center">
              <button
                onClick={runAllocationTest}
                disabled={isRunning || partnerData.filter(p => p.enabled).length === 0}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isRunning || partnerData.filter(p => p.enabled).length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isRunning ? 'Running...' : 'Run Allocation Test'}
              </button>

              <button
                onClick={clearLogs}
                disabled={isRunning}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Clear Console
              </button>

              <div className="text-sm text-gray-600">
                Enabled Partners: {partnerData.filter(p => p.enabled).length}/5
              </div>
            </div>
          </div>

          {/* Results Summary */}
          {testResults && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3">Test Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded p-3">
                  <div className="text-sm text-gray-600">Overall Result</div>
                  <div className={`text-lg font-bold ${testResults.validation.overallPass ? 'text-green-600' : 'text-red-600'}`}>
                    {testResults.validation.overallPass ? '✅ PASS' : '❌ FAIL'}
                  </div>
                </div>
                <div className="bg-white rounded p-3">
                  <div className="text-sm text-gray-600">Total Input</div>
                  <div className="text-lg font-semibold">{testResults.totals.totalGrossInput.toLocaleString()} bbl</div>
                </div>
                <div className="bg-white rounded p-3">
                  <div className="text-sm text-gray-600">Total Allocated</div>
                  <div className="text-lg font-semibold">{testResults.totals.totalAllocated.toFixed(0)} bbl</div>
                </div>
                <div className="bg-white rounded p-3">
                  <div className="text-sm text-gray-600">Shrinkage Factor</div>
                  <div className="text-lg font-semibold">{testResults.result.shrinkage_factor}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Console Output */}
          <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-green-400 font-mono text-sm">Console Output</h3>
              <div className="text-green-400 text-xs">
                {logs.length} lines | {isRunning ? 'Running...' : 'Ready'}
              </div>
            </div>

            <div className="font-mono text-sm space-y-1">
              {logs.length === 0 ? (
                <div className="text-gray-500 italic">
                  Console ready. Configure data and click &#34;Run Allocation Test&#34; to begin...
                </div>
              ) : (
                logs.map((log: LogEntry, index: number) => (
                  <div key={index} className="flex">
                    <span className="text-gray-500 text-xs mr-2 flex-shrink-0">
                      {log.timestamp}
                    </span>
                    <span className={getLogStyle(log.type)}>{log.message}</span>
                  </div>
                ))
              )}

              {isRunning && (
                <div className="text-yellow-400 animate-pulse">
                  <span className="mr-2">⏳</span>
                  Processing...
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-gray-500 text-sm">
            Dynamic Allocation Engine Test Console - Real-time testing with custom data
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllocationTestPage;