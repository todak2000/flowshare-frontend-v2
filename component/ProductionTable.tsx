/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Edit, Trash2, Database } from 'lucide-react';
import { ProductionEntry } from '../types';
import { DataTable } from './tables/DataTable';

interface ProductionTableProps {
  data: ProductionEntry[];
  loading: boolean;
  canEdit: boolean;
  onEdit: (entry: ProductionEntry) => void;
  onDelete: (id: string) => void;
}

const ProductionTable: React.FC<ProductionTableProps> = ({
  data,
  loading,
  canEdit,
  onEdit,
  onDelete
}) => {
  const formatDate = (timestamp: Date | string): string => {
    return timestamp instanceof Date
      ? timestamp.toLocaleDateString()
      : new Date(timestamp).toLocaleDateString();
  };

  const columns: any[] = [
    {
      key: "timestamp",
      label: "Date",
      sortable: true,
      render: (val: Date | string) => formatDate(val),
      width: "15%",
    },
    {
      key: "gross_volume_bbl",
      label: "Volume (BBL)",
      sortable: true,
      render: (val: number) => val.toLocaleString(),
      width: "18%",
    },
    {
      key: "bsw_percent",
      label: "BSW %",
      sortable: true,
      render: (val: number) => `${val}%`,
      width: "15%",
    },
    {
      key: "temperature_degF",
      label: "Temp (°F)",
      sortable: true,
      render: (val: number) => `${val}°F`,
      width: "15%",
    },
    {
      key: "api_gravity",
      label: "API Gravity (°API)",
      sortable: true,
      render: (val: number) => `${val} PSI`,
      width: "20%",
    },
  ];

  if (canEdit) {
    columns.push({
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_: any, entry: ProductionEntry) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(entry);
            }}
            aria-label={`Edit entry from ${formatDate(entry.timestamp)}`}
            className="text-blue-400 hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
          >
            <Edit size={18} aria-hidden="true" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(entry.id);
            }}
            aria-label={`Delete entry from ${formatDate(entry.timestamp)}`}
            className="text-red-400 hover:text-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        </div>
      ),
      width: "17%",
    });
  }

  return (
    <div className="bg-white/10 rounded-xl border border-white/10 overflow-hidden">
      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        emptyMessage="No production entries found"
        emptyIcon={<Database className="w-16 h-16 text-gray-400 opacity-50 mx-auto" />}
        aria-label="Production entries showing date, volume, BSW percentage, temperature, and API gravity"
      />
    </div>
  );
};

export default ProductionTable;
