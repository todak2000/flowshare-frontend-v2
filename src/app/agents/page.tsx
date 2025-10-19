/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { getAllAgentsStatus, AgentStatus } from '../../../lib/agents-api';

interface AgentLog {
  id: string;
  agent_name: string;
  action: string;
  status: string;
  timestamp: string;
  execution_time_ms?: number;
  input_data?: any;
  output_data?: any;
}

export default function AgentCommandCenter() {
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Simple passcode: "agent123"
  const AGENT_PASSCODE = 'agent123';
  const LOGS_PER_PAGE = 12;

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === AGENT_PASSCODE) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid passcode. Please try again.');
      setPasscode('');
    }
  };

  // Fetch agent statuses
  useEffect(() => {
    const fetchStatuses = async () => {
      const statuses = await getAllAgentsStatus();
      setAgentStatuses(statuses);
    };

    fetchStatuses();
    const interval = setInterval(fetchStatuses, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  // Fetch paginated agent logs from backend
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const COMMUNICATOR_URL = process.env.NEXT_PUBLIC_COMMUNICATOR_AGENT_URL || 'http://localhost:8083';
        const response = await fetch(`${COMMUNICATOR_URL}/agent-logs?page=${currentPage}&page_size=${LOGS_PER_PAGE}`);

        if (!response.ok) {
          throw new Error('Failed to fetch agent logs');
        }

        const data = await response.json();

        if (data.success) {
          setAgentLogs(data.data);
          setTotalPages(data.total_pages);
          setTotalLogs(data.total);
        }
      } catch (error) {
        console.error('Error fetching agent logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    // Refresh every 10 seconds
    const interval = setInterval(fetchLogs, 10000);

    return () => clearInterval(interval);
  }, [currentPage, isAuthenticated]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'completed':
        return 'bg-green-500';
      case 'offline':
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getAgentColor = (agentName: string) => {
    if (agentName.includes('Auditor')) return 'text-blue-400';
    if (agentName.includes('Accountant')) return 'text-purple-400';
    if (agentName.includes('Communicator')) return 'text-green-400';
    return 'text-gray-400';
  };

  // Passcode protection screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Agent Command Center</h1>
            <p className="text-gray-400">Enter passcode to access</p>
          </div>

          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-[1.02]"
            >
              Access Command Center
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            🔐 Passcode required for security
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Agent Command Center</h1>
          <p className="text-gray-400">Real-time monitoring of AI agent workforce</p>
        </div>

        {/* Agent Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {agentStatuses.map((agent) => (
            <div
              key={agent.name}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{agent.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{agent.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`}
                  />
                  <span className="text-sm capitalize">{agent.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Agent Activity Logs */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold">Agent Activity Logs</h2>
            <p className="text-sm text-gray-400 mt-1">
              Live stream of agent operations
            </p>
          </div>

          <div className="p-4 font-mono text-sm">
            {loading ? (
              <div className="text-gray-500">Loading agent logs...</div>
            ) : agentLogs.length === 0 ? (
              <div className="text-gray-500">No agent activity yet</div>
            ) : (
              <div className="space-y-3">
                {agentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-gray-700/20 border border-gray-600/30 rounded-lg p-4 hover:bg-gray-700/40 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-sm ${getAgentColor(log.agent_name)}`}>
                          {log.agent_name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            log.status === 'completed'
                              ? 'bg-green-900/50 text-green-300 border border-green-700'
                              : log.status === 'failed'
                              ? 'bg-red-900/50 text-red-300 border border-red-700'
                              : 'bg-yellow-900/50 text-yellow-300 border border-yellow-700'
                          }`}
                        >
                          {log.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {log.execution_time_ms && (
                        <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                          ⚡ {log.execution_time_ms.toFixed(0)}ms
                        </span>
                      )}
                    </div>

                    {/* Action Description */}
                    <div className="mb-2">
                      <span className="text-gray-300 font-medium">{log.action}</span>
                      {log.output_data?.details && (
                        <div className="text-sm text-gray-400 mt-1">
                          📋 {log.output_data.details}
                        </div>
                      )}
                    </div>

                    {/* Input/Output Details in Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Input Data */}
                      {log.input_data && Object.keys(log.input_data).length > 0 && (
                        <div className="bg-gray-800/50 rounded p-2 border border-gray-700">
                          <div className="text-gray-400 font-semibold mb-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z"/>
                              <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z"/>
                              <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z"/>
                            </svg>
                            INPUT
                          </div>
                          {Object.entries(log.input_data)
                            .filter(([key]) => key !== 'notification_id')
                            .map(([key, value]) => (
                            <div key={key} className="flex justify-between gap-2 py-0.5">
                              <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                              <span className="text-gray-300 font-medium truncate max-w-[200px]" title={String(value)}>
                                {String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Output Data */}
                      {log.output_data && Object.keys(log.output_data).length > 0 && (
                        <div className="bg-gray-800/50 rounded p-2 border border-gray-700">
                          <div className="text-gray-400 font-semibold mb-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            OUTPUT
                          </div>
                          {Object.entries(log.output_data)
                            .filter(([key]) => key !== 'details')
                            .map(([key, value]) => {
                              let displayValue = 'N/A';
                              if (value !== null && value !== undefined) {
                                if (typeof value === 'object') {
                                  displayValue = JSON.stringify(value);
                                } else {
                                  displayValue = String(value);
                                }
                              }
                              return (
                                <div key={key} className="flex justify-between gap-2 py-0.5">
                                  <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                                  <span className="text-gray-300 font-medium truncate max-w-[200px]" title={displayValue}>
                                    {displayValue}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>

                    {/* Error Message if Failed */}
                    {log.status === 'failed' && log.output_data?.error && (
                      <div className="mt-2 bg-red-900/20 border border-red-700/50 rounded p-2 text-xs text-red-300">
                        <span className="font-semibold">Error:</span> {log.output_data.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {!loading && agentLogs.length > 0 && (
            <div className="p-4 border-t border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {((currentPage - 1) * LOGS_PER_PAGE) + 1} to {Math.min(currentPage * LOGS_PER_PAGE, totalLogs)} of {totalLogs} logs
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg text-sm font-medium transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-sm">
                  <span className="text-gray-400">Page</span>
                  <span className="font-semibold text-white">{currentPage}</span>
                  <span className="text-gray-400">of</span>
                  <span className="font-semibold text-white">{totalPages}</span>
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg text-sm font-medium transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
