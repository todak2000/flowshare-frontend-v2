// src/app/terminal/page.tsx
'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../../hook/useUser';
import { firebaseService } from '../../../lib/firebase-service';
import { TerminalReceipt, CreateTerminalReceiptData } from '../../../types';
import LoadingSpinner from '../../../component/LoadingSpinner';
import SummaryCard from '../../../component/SummaryCard';
import { formatDateForInput } from '../../../utils/date';
import { Modal } from '../../../component/Modal';

export default function TerminalReceiptPage() {
  const { auth, data: userData, loading: userLoading } = useUser();
  const router = useRouter();
  const [terminalReceipts, setTerminalReceipts] = useState<TerminalReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<TerminalReceipt | null>(null);
  const [formData, setFormData] = useState({
    initial_volume_bbl: '',
    final_volume_bbl: '',
    temperature_degF: '',
    timestamp: formatDateForInput(new Date()),
  });

  useEffect(() => {
    if (!userLoading && !auth) {
      router.push('/onboarding/login');
      return;
    }

    loadTerminalReceipts();
  }, [userLoading, auth, userData, router]);

  const loadTerminalReceipts = async () => {
    setLoading(true);
    try {
      const receipts = await firebaseService.getTerminalReceipts();
      setTerminalReceipts(receipts);
    } catch (error) {
      console.error('Error loading terminal receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const submissionData: CreateTerminalReceiptData = {
        initial_volume_bbl: parseFloat(formData.initial_volume_bbl),
        final_volume_bbl: parseFloat(formData.final_volume_bbl),
        temperature_degF: parseFloat(formData.temperature_degF),
        timestamp: new Date(formData.timestamp),
        created_by: auth.uid,
      };

      if (editingReceipt) {
        await firebaseService.updateTerminalReceipt(editingReceipt.id, submissionData);
      } else {
        await firebaseService.createTerminalReceipt(submissionData);
      }

      handleCloseForm();
      await loadTerminalReceipts();
    } catch (error) {
      console.error('Error saving terminal receipt:', error);
      alert('Error saving terminal receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (receipt: TerminalReceipt) => {
    setEditingReceipt(receipt);
    setFormData({
      initial_volume_bbl: receipt.initial_volume_bbl.toString(),
      final_volume_bbl: receipt.final_volume_bbl.toString(),
      temperature_degF: receipt.temperature_degF.toString(),
      timestamp: formatDateForInput(new Date(receipt.timestamp)),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this terminal receipt?')) {
      try {
        await firebaseService.deleteTerminalReceipt(id);
        await loadTerminalReceipts();
      } catch (error) {
        console.error('Error deleting receipt:', error);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingReceipt(null);
    setFormData({
      initial_volume_bbl: '',
      final_volume_bbl: '',
      temperature_degF: '',
      timestamp: formatDateForInput(new Date()),
    });
  };

  const totalVolume = terminalReceipts.reduce((sum, receipt) => sum + receipt.final_volume_bbl, 0);
  const averageTemperature = terminalReceipts.length > 0 
    ? terminalReceipts.reduce((sum, receipt) => sum + receipt.temperature_degF, 0) / terminalReceipts.length 
    : 0;

  if (userLoading) {
    return <LoadingSpinner  message="Loading user data..." />;
  }

  return (
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
            value={terminalReceipts.length}
            color="blue"
          />
          <SummaryCard
            title="Total Volume"
            value={totalVolume}
            color="green"
            unit=" BBL"
          />
          <SummaryCard
            title="Avg Temperature"
            value={averageTemperature.toFixed(1)}
            color="orange"
            unit="°F"
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <LoadingSpinner message="Loading terminal receipts..." />
              </div>
            ) : terminalReceipts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No terminal receipts recorded yet.
                <div className="mt-2">
                  <button
                    onClick={() => setShowForm(true)}
                    className="text-blue-600 hover:underline"
                  >
                    Add your first terminal receipt
                  </button>
                </div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Initial Volume (BBL)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Final Volume (BBL)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Temperature (°F)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {terminalReceipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(receipt.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receipt.initial_volume_bbl.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {receipt.final_volume_bbl.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {receipt.temperature_degF}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {receipt.created_by.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(receipt)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(receipt.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editingReceipt ? 'Edit Terminal Receipt' : 'Add Terminal Receipt'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.timestamp}
              onChange={(e) => setFormData(prev => ({ ...prev, timestamp: e.target.value }))}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
  );
}