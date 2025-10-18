/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
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

  // Simple passcode: "agent123"
  const AGENT_PASSCODE = 'agent123';

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

  // Real-time agent logs from Firestore
  useEffect(() => {
    const logsQuery = query(
      collection(db, 'agent_logs'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AgentLog[];

      setAgentLogs(logs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
              <div className="space-y-2">
                {agentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border-l-2 border-gray-600 pl-4 py-2 hover:bg-gray-700/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-xs">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                          <span className={`font-semibold ${getAgentColor(log.agent_name)}`}>
                            [{log.agent_name}]
                          </span>
                          <span className="text-gray-300">{log.action}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              log.status === 'completed'
                                ? 'bg-green-900 text-green-200'
                                : log.status === 'failed'
                                ? 'bg-red-900 text-red-200'
                                : 'bg-yellow-900 text-yellow-200'
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                        {log.execution_time_ms && (
                          <div className="text-xs text-gray-500 mt-1">
                            Execution time: {log.execution_time_ms.toFixed(2)}ms
                          </div>
                        )}
                        {log.output_data && (
                          <details className="mt-2">
                            <summary className="text-xs text-blue-400 cursor-pointer hover:underline">
                              View details
                            </summary>
                            <pre className="text-xs bg-gray-900 p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(log.output_data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
