/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { TerminalReceipt } from '../types';
import { DataTable } from './tables/DataTable';
import { Database } from 'lucide-react';

interface TerminalReceiptTableProps {
  data: TerminalReceipt[];
  loading: boolean;
  onEdit: (receipt: TerminalReceipt) => void;
  onDelete: (id: string) => void;
}

const TerminalReceiptTable: React.FC<TerminalReceiptTableProps> = ({
  data,
  loading,
  onEdit,
  onDelete
}) => {
  const columns: any[] = [
    {
      key: "timestamp",
      label: "Date & Time",
      sortable: true,
      render: (val: Date | string) => new Date(val).toLocaleString(),
      width: "20%",
    },
    {
      key: "initial_volume_bbl",
      label: "Initial Volume (BBL)",
      sortable: true,
      render: (val: number) => val.toLocaleString(),
      width: "18%",
    },
    {
      key: "final_volume_bbl",
      label: "Final Volume (BBL)",
      sortable: true,
      render: (val: number) => (
        <span className="font-medium text-blue-400">{val.toLocaleString()}</span>
      ),
      width: "18%",
    },
    {
      key: "temperature_degF",
      label: "Temperature (°F)",
      sortable: true,
      render: (val: number) => `${val}°F`,
      width: "15%",
    },
    {
      key: "created_by",
      label: "Created By",
      sortable: false,
      render: (val: string) => `${val.substring(0, 8)}...`,
      width: "15%",
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_: any, receipt: TerminalReceipt) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(receipt);
            }}
            className="text-blue-400 hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            aria-label={`Edit receipt from ${new Date(receipt.timestamp).toLocaleDateString()}`}
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(receipt.id);
            }}
            className="text-red-400 hover:text-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
            aria-label={`Delete receipt from ${new Date(receipt.timestamp).toLocaleDateString()}`}
          >
            Delete
          </button>
        </div>
      ),
      width: "14%",
    },
  ];

  return (
    <div className="bg-white/10 rounded-lg border border-white/10 overflow-hidden">
      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        emptyMessage="No terminal receipts recorded yet."
        emptyIcon={<Database className="w-16 h-16 text-gray-400 opacity-50 mx-auto" />}
        aria-label="Terminal receipts table showing date, volumes, temperature, and actions"
      />
    </div>
  );
};

export default TerminalReceiptTable;
