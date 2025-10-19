/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, memo } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  "aria-label": string;
}

function DataTableComponent<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  loading = false,
  emptyMessage = "No data available",
  emptyIcon,
  "aria-label": ariaLabel,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (key: keyof T | string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const getNestedValue = (obj: any, path: string): any => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  };

  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const aVal = getNestedValue(a, sortKey as string);
        const bVal = getNestedValue(b, sortKey as string);

        // Handle null/undefined values
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        // Handle numbers
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }

        // Handle strings and dates
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();

        if (aStr < bStr) return sortDirection === "asc" ? -1 : 1;
        if (aStr > bStr) return sortDirection === "asc" ? 1 : -1;
        return 0;
      })
    : data;

  if (loading) {
    return (
      <div className="text-center py-8" role="status" aria-live="polite">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        <span className="sr-only">Loading data...</span>
        <p className="text-gray-400 mt-2">Loading...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8" role="status">
        {emptyIcon && <div className="mx-auto mb-4">{emptyIcon}</div>}
        <p className="text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" aria-label={ariaLabel}>
        <thead className="bg-white/5">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                style={{ width: column.width }}
              >
                {column.sortable ? (
                  <button
                    onClick={() => handleSort(column.key)}
                    className="flex items-center gap-2 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    aria-label={`Sort by ${column.label}`}
                    aria-sort={
                      sortKey === column.key
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <span>{column.label}</span>
                    {sortKey === column.key && (
                      <span aria-hidden="true">
                        {sortDirection === "asc" ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )}
                      </span>
                    )}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {sortedData.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={`hover:bg-white/5 transition-colors ${
                onRowClick ? "cursor-pointer" : ""
              }`}
              role={onRowClick ? "button" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
            >
              {columns.map((column) => {
                const value = getNestedValue(row, column.key as string);
                return (
                  <td key={String(column.key)} className="px-6 py-4 text-sm text-white">
                    {column.render ? column.render(value, row) : String(value || "")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Memoized version with custom comparison
export const DataTable = memo(DataTableComponent, (prevProps, nextProps) => {
  // Compare primitive props
  if (
    prevProps.loading !== nextProps.loading ||
    prevProps.emptyMessage !== nextProps.emptyMessage ||
    prevProps["aria-label"] !== nextProps["aria-label"] ||
    prevProps.onRowClick !== nextProps.onRowClick ||
    prevProps.emptyIcon !== nextProps.emptyIcon
  ) {
    return false;
  }

  // Compare data array length and items
  if (prevProps.data.length !== nextProps.data.length) {
    return false;
  }

  // Deep compare data items by id (shallow comparison is sufficient for most cases)
  for (let i = 0; i < prevProps.data.length; i++) {
    if (prevProps.data[i].id !== nextProps.data[i].id) {
      return false;
    }
  }

  // Compare columns array
  if (prevProps.columns.length !== nextProps.columns.length) {
    return false;
  }

  for (let i = 0; i < prevProps.columns.length; i++) {
    const prevCol = prevProps.columns[i];
    const nextCol = nextProps.columns[i];

    if (
      prevCol.key !== nextCol.key ||
      prevCol.label !== nextCol.label ||
      prevCol.sortable !== nextCol.sortable ||
      prevCol.width !== nextCol.width ||
      prevCol.render !== nextCol.render
    ) {
      return false;
    }
  }

  return true;
}) as typeof DataTableComponent;
