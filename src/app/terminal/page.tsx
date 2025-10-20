/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/terminal/page.tsx
'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../../hook/useUser';
import { TerminalReceipt, CreateTerminalReceiptData } from '../../../types';
import LoadingSpinner from '../../../component/LoadingSpinner';
import SummaryCard from '../../../component/SummaryCard';
import { Modal } from '../../../component/Modal';
import TerminalReceiptTable from '../../../component/TerminalReceiptTable';
import { Database, BarChart3, Thermometer } from 'lucide-react';
import {
  useTerminalReceiptStats,
  useCreateTerminalReceipt,
  useUpdateTerminalReceipt,
  useDeleteTerminalReceipt,
} from '../../../lib/queries/useTerminalReceipts';
import { ErrorBoundary } from '../../../component/ErrorBoundary';

export default function TerminalReceiptPage() {
  const { auth, loading: userLoading } = useUser();
  const router = useRouter();

  // React Query hooks
  const { data: stats, receipts, isLoading: receiptsLoading } = useTerminalReceiptStats();
  const createMutation = useCreateTerminalReceipt();
  const updateMutation = useUpdateTerminalReceipt();
  const deleteMutation = useDeleteTerminalReceipt();

  const [showForm, setShowForm] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<TerminalReceipt | null>(null);
  const currentDate = new Date();
  const [formData, setFormData] = useState({
    initial_volume_bbl: '',
    final_volume_bbl: '',
    temperature_degF: '',
    month: currentDate.getMonth(), // 0-11 (January is 0)
    year: currentDate.getFullYear(),
  });

  useEffect(() => {
    if (!userLoading && !auth) {
      router.push('/onboarding/login');
      return;
    }
  }, [userLoading, auth, router]);

  const terminalReceipts = receipts || [];
  const loading = receiptsLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  // Convert month and year to last day of month at 23:59:59
  const getLastDayOfMonth = (month: number, year: number): Date => {
    // Create date for first day of next month, then subtract 1 millisecond
    const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return lastDay;
  };

  const handleSubmit = async () => {
    try {
      // Convert month/year to last day of month at 23:59:59
      const timestamp = getLastDayOfMonth(formData.month, formData.year);

      const submissionData: CreateTerminalReceiptData = {
        initial_volume_bbl: parseFloat(formData.initial_volume_bbl),
        final_volume_bbl: parseFloat(formData.final_volume_bbl),
        temperature_degF: parseFloat(formData.temperature_degF),
        timestamp: timestamp,
        created_by: auth.uid,
      };

      if (editingReceipt) {
        await updateMutation.mutateAsync({
          id: editingReceipt.id,
          data: submissionData,
        });
      } else {
        await createMutation.mutateAsync(submissionData);
      }

      handleCloseForm();
    } catch (error: any) {
      console.error('Error saving terminal receipt:', error);
      // Show the actual error message from the service
      // This will include helpful info about reconciliation failures
      alert(error.message || 'Error saving terminal receipt. Please try again.');
    }
  };

  const handleEdit = (receipt: TerminalReceipt) => {
    setEditingReceipt(receipt);
    const receiptDate = new Date(receipt.timestamp);
    setFormData({
      initial_volume_bbl: receipt.initial_volume_bbl.toString(),
      final_volume_bbl: receipt.final_volume_bbl.toString(),
      temperature_degF: receipt.temperature_degF.toString(),
      month: receiptDate.getMonth(),
      year: receiptDate.getFullYear(),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this terminal receipt?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting receipt:', error);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingReceipt(null);
    const currentDate = new Date();
    setFormData({
      initial_volume_bbl: '',
      final_volume_bbl: '',
      temperature_degF: '',
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
    });
  };

  const totalVolume = stats?.totalVolume || 0;
  const averageTemperature = stats?.averageTemperature || 0;

  if (userLoading) {
    return <LoadingSpinner  message="Loading user data..." />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Terminal Receipt Management
          </h1>
          <p className="text-gray-600">
            Record and manage terminal measurement data for allocation calculations
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SummaryCard
            title="Total Receipts"
            value={stats?.totalReceipts || 0}
            color="blue"
            icon={Database}
          />
          <SummaryCard
            title="Total Volume"
            value={totalVolume}
            color="green"
            unit=" BBL"
            icon={BarChart3}
          />
          <SummaryCard
            title="Avg Temperature"
            value={averageTemperature.toFixed(1)}
            color="orange"
            unit="°F"
            icon={Thermometer}
          />
        </div>

        {/* Action Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Terminal Receipts</h3>
              <p className="text-sm text-gray-600">
                Manage terminal measurement records
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Add Terminal Receipt
            </button>
          </div>
        </div>

        {/* Terminal Receipts Table */}
        <TerminalReceiptTable
          data={terminalReceipts}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editingReceipt ? 'Edit Terminal Receipt' : 'Add Terminal Receipt'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                value={formData.month}
                onChange={(e) => setFormData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>January</option>
                <option value={1}>February</option>
                <option value={2}>March</option>
                <option value={3}>April</option>
                <option value={4}>May</option>
                <option value={5}>June</option>
                <option value={6}>July</option>
                <option value={7}>August</option>
                <option value={8}>September</option>
                <option value={9}>October</option>
                <option value={10}>November</option>
                <option value={11}>December</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter year"
                min="2020"
                max="2100"
              />
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-600">
              <strong>ℹ️ Note:</strong> Terminal receipt will be recorded for the last day of {
                new Date(formData.year, formData.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              } at 11:59 PM
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Volume (BBL)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.initial_volume_bbl}
              onChange={(e) => setFormData(prev => ({ ...prev, initial_volume_bbl: e.target.value }))}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter initial volume"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Final Volume (BBL) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.final_volume_bbl}
              onChange={(e) => setFormData(prev => ({ ...prev, final_volume_bbl: e.target.value }))}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter final volume"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temperature (°F) *
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.temperature_degF}
              onChange={(e) => setFormData(prev => ({ ...prev, temperature_degF: e.target.value }))}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter temperature"
              required
            />
          </div>
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Final volume will be used for allocation calculations. 
              Ensure accuracy as this affects all partner allocations.
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.final_volume_bbl || !formData.temperature_degF}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : editingReceipt ? 'Update Receipt' : 'Save Receipt'}
            </button>
            <button
              onClick={handleCloseForm}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
    </ErrorBoundary>
  );
}