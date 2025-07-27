import React from "react";
import { Plus, Download } from "lucide-react";

interface ActionButtonsProps {
  role: string;
  onAddEntry: () => void;
  onDownloadReport: () => void;
  entriesCount: { filtered: number; total: number };
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  role,
  onAddEntry,
  onDownloadReport,
  entriesCount,
}) => (
  <div className="p-6 flex justify-between items-center">
    <div className="flex gap-3">
      {role === "field_operator" ? (
        <button
          onClick={onAddEntry}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Add Entry
        </button>
      ) : (
        ""
      )}
      {role !== "field_operator" ? (
        <button
          onClick={onDownloadReport}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Download size={20} />
          Download Report
        </button>
      ) : (
        ""
      )}
    </div>
    <div className="text-sm text-gray-600">
      Showing {entriesCount.filtered} of {entriesCount.total} entries
    </div>
  </div>
);
