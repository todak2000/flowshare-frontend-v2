import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { ProductionEntry } from '../types';
import LoadingSpinner from './LoadingSpinner';

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

  if (loading) {
    return <LoadingSpinner message="Loading entries..." />;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full" aria-label="Production entries table">
          <caption className="sr-only">
            Production entries showing date, volume, BSW percentage, temperature, and API gravity
          </caption>
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th scope="col" className="text-left p-4 font-semibold text-gray-700">Date</th>
              <th scope="col" className="text-left p-4 font-semibold text-gray-700">Volume (BBL)</th>
              <th scope="col" className="text-left p-4 font-semibold text-gray-700">BSW %</th>
              <th scope="col" className="text-left p-4 font-semibold text-gray-700">Temp (°F)</th>
              <th scope="col" className="text-left p-4 font-semibold text-gray-700">API Gravity (°API)</th>
              {canEdit && (
                <th scope="col" className="text-left p-4 font-semibold text-gray-700">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={canEdit ? 6 : 5}
                  className="text-center py-8 text-gray-500"
                >
                  No production entries found
                </td>
              </tr>
            ) : (
              data.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="p-4 text-gray-900">
                    {formatDate(entry.timestamp)}
                  </td>
                  <td className="p-4 text-gray-900">
                    {entry.gross_volume_bbl.toLocaleString()}
                  </td>
                  <td className="p-4 text-gray-900">{entry.bsw_percent}%</td>
                  <td className="p-4 text-gray-900">{entry.temperature_degF}°F</td>
                  <td className="p-4 text-gray-900">{entry.api_gravity} PSI</td>
                  {canEdit && (
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEdit(entry)}
                          aria-label={`Edit entry from ${formatDate(entry.timestamp)}`}
                          className="text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
                        >
                          <Edit size={18} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => onDelete(entry.id)}
                          aria-label={`Delete entry from ${formatDate(entry.timestamp)}`}
                          className="text-red-600 hover:text-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
                        >
                          <Trash2 size={18} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ProductionTable