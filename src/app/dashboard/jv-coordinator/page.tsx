// src/app/dashboard/jv-coordinator/page.tsx
'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../../../hook/useUser';
import { firebaseService } from '../../../../lib/firebase-service';
import { TerminalReceipt, ReconciliationRun, CreateTerminalReceiptData } from '../../../../types';
import LoadingSpinner from '../../../../component/LoadingSpinner';
import SummaryCard from '../../../../component/SummaryCard';
import Modal from '../../../../component/Modal';
import { formatDateForInput } from '../../../../utils/date';

export default function JVCoordinatorDashboard() {
  const { auth, data: userData, loading: userLoading } = useUser();
  const router = useRouter();
  const [terminalReceipts, setTerminalReceipts] = useState<TerminalReceipt[]>([]);
  const [reconciliationRuns, setReconciliationRuns] = useState<ReconciliationRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTerminalForm, setShowTerminalForm] = useState(false);
  const [showReconcileForm, setShowReconcileForm] = useState(false);
  const [terminalFormData, setTerminalFormData] = useState({
    initial_volume_bbl: '',
    final_volume_bbl: '',
    temperature_degF: '',
    timestamp: formatDateForInput(new Date()),
  });
  //  Default to current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
    const [reconcileDateRange, setReconcileDateRange] = useState({
      startDate: formatDateForInput(firstDayOfMonth),
      endDate: formatDateForInput(lastDayOfMonth),
    });
  const [reconcileDate, setReconcileDate] = useState(formatDateForInput(new Date()));

  useEffect(() => {
    if (!userLoading && !auth) {
      router.push('/onboarding/login');
      return;
    }

    // if (userData?.role !== 'jv_coordinator' && userData?.role !== 'admin') {
    //   router.push('/dashboard');
    //   return;
    // }

    loadDashboardData();
  }, [userLoading, auth, userData, router]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [receipts, runs] = await Promise.all([
        firebaseService.getTerminalReceipts(undefined, undefined, 10),
        firebaseService.getReconciliationRuns(undefined, undefined, 10)
      ]);
      setTerminalReceipts(receipts);
      setReconciliationRuns(runs);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminalSubmit = async () => {
    setLoading(true);
    try {
      const submissionData: CreateTerminalReceiptData = {
        initial_volume_bbl: parseFloat(terminalFormData.initial_volume_bbl),
        final_volume_bbl: parseFloat(terminalFormData.final_volume_bbl),
        temperature_degF: parseFloat(terminalFormData.temperature_degF),
        timestamp: new Date(terminalFormData.timestamp),
        created_by: auth.uid,
      };

      await firebaseService.createTerminalReceipt(submissionData);
      setShowTerminalForm(false);
      setTerminalFormData({
        initial_volume_bbl: '',
        final_volume_bbl: '',
        temperature_degF: '',
        timestamp: formatDateForInput(new Date()),
      });
      await loadDashboardData();
    } catch (error) {
      console.error('Error saving terminal receipt:', error);
      alert('Error saving terminal receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async () => {
    setLoading(true);
    try {
        const existingCheck = await firebaseService.checkExistingReconciliation(
                new Date(reconcileDateRange.startDate),
                new Date(reconcileDateRange.endDate)
              );
        if (existingCheck.exists) {
        alert(existingCheck.message);
        setLoading(false);
        return;
      }
  
      const reconciliationId = await firebaseService.triggerReconciliation(
              new Date(reconcileDateRange.startDate),
              new Date(reconcileDateRange.endDate),
              auth.uid
            );

      setShowReconcileForm(false);
      await loadDashboardData();
      alert('Reconciliation completed successfully!');
    } catch (error) {
      console.error('Error triggering reconciliation:', error);
      alert('Error running reconciliation. Please check that production entries and terminal receipts exist for the selected date.');
    } finally {
      setLoading(false);
    }
  };

  const todaysReceipts = terminalReceipts.filter(receipt => {
    const today = new Date();
    const receiptDate = new Date(receipt.timestamp);
    return receiptDate.toDateString() === today.toDateString();
  });

  const thisWeekRuns = reconciliationRuns.filter(run => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(run.created_at) >= weekAgo;
  });

  if (userLoading) {
    return <LoadingSpinner fullScreen message="Loading user data..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            JV Coordinator Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome, {userData?.email} - Manage terminal receipts and reconciliations
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <SummaryCard
            title="Today's Receipts"
            value={todaysReceipts.length}
            color="blue"
          />
          <SummaryCard
            title="This Week's Runs"
            value={thisWeekRuns.length}
            color="green"
          />
          <SummaryCard
            title="Total Receipts"
            value={terminalReceipts.length}
            color="orange"
          />
          <SummaryCard
            title="Total Runs"
            value={reconciliationRuns.length}
            color="purple"
          />
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Record Terminal Receipt</h3>
            <p className="text-gray-600 mb-4">
              Enter terminal measurement data for allocation calculations.
            </p>
            <button
              onClick={() => setShowTerminalForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Add Terminal Receipt
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Trigger Reconciliation</h3>
            <p className="text-gray-600 mb-4">
              Run daily reconciliation to calculate partner allocations.
            </p>
            <button
              onClick={() => setShowReconcileForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              Run Reconciliation
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Terminal Receipts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Recent Terminal Receipts</h3>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <LoadingSpinner message="Loading receipts..." />
                </div>
              ) : terminalReceipts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No terminal receipts recorded yet.
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Final Volume
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Temperature
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {terminalReceipts.slice(0, 5).map((receipt) => (
                      <tr key={receipt.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(receipt.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {receipt.final_volume_bbl.toLocaleString()} BBL
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {receipt.temperature_degF}°F
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Recent Reconciliation Runs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Recent Reconciliation Runs</h3>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <LoadingSpinner message="Loading reconciliation runs..." />
                </div>
              ) : reconciliationRuns.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No reconciliation runs yet.
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Terminal Volume
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reconciliationRuns.slice(0, 5).map((run) => (
                      <tr key={run.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(run.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {run.total_terminal_volume.toLocaleString()} BBL
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {run.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Receipt Form Modal */}
      <Modal
        isOpen={showTerminalForm}
        onClose={() => setShowTerminalForm(false)}
        title="Add Terminal Receipt"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={terminalFormData.timestamp}
              onChange={(e) => setTerminalFormData(prev => ({ ...prev, timestamp: e.target.value }))}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Volume (BBL)
            </label>
            <input
              type="number"
              step="0.01"
              value={terminalFormData.initial_volume_bbl}
              onChange={(e) => setTerminalFormData(prev => ({ ...prev, initial_volume_bbl: e.target.value }))}
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Enter initial volume"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Final Volume (BBL)
            </label>
            <input
              type="number"
              step="0.01"
              value={terminalFormData.final_volume_bbl}
              onChange={(e) => setTerminalFormData(prev => ({ ...prev, final_volume_bbl: e.target.value }))}
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Enter final volume"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temperature (°F)
            </label>
            <input
              type="number"
              step="0.1"
              value={terminalFormData.temperature_degF}
              onChange={(e) => setTerminalFormData(prev => ({ ...prev, temperature_degF: e.target.value }))}
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Enter temperature"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleTerminalSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:bg-blue-300"
            >
              {loading ? 'Saving...' : 'Save Receipt'}
            </button>
            <button
              onClick={() => setShowTerminalForm(false)}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Reconciliation Form Modal */}
      <Modal
        isOpen={showReconcileForm}
        onClose={() => setShowReconcileForm(false)}
        title="Trigger Reconciliation"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Production Date
            </label>
            <input
              type="date"
              value={reconcileDate}
              onChange={(e) => setReconcileDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="bg-yellow-50 p-4 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Ensure that production entries and terminal receipts 
              exist for the selected date before running reconciliation.
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleReconcile}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition disabled:bg-green-300"
            >
              {loading ? 'Processing...' : 'Run Reconciliation'}
            </button>
            <button
              onClick={() => setShowReconcileForm(false)}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}