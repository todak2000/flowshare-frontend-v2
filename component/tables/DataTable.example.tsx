/**
 * DataTable Usage Examples
 *
 * This file demonstrates how to use the generic DataTable component
 * across different use cases in the FlowShare application.
 */

import { DataTable } from "./DataTable";
import { Database } from "lucide-react";

// Example 1: Production Entries Table
interface ProductionEntry {
  id: string;
  timestamp: Date;
  partner: string;
  gross_volume_bbl: number;
  net_volume_bbl: number;
  api_gravity: number;
  temperature_degF: number;
}

export const ProductionEntriesExample = ({ entries }: { entries: ProductionEntry[] }) => {
  return (
    <DataTable
      data={entries}
      columns={[
        {
          key: "timestamp",
          label: "Date",
          sortable: true,
          render: (val) => new Date(val).toLocaleDateString(),
        },
        {
          key: "partner",
          label: "Partner",
          sortable: true,
        },
        {
          key: "gross_volume_bbl",
          label: "Gross Volume (BBL)",
          sortable: true,
          render: (val) => val.toLocaleString(),
        },
        {
          key: "net_volume_bbl",
          label: "Net Volume (BBL)",
          sortable: true,
          render: (val) => val.toLocaleString(),
        },
        {
          key: "api_gravity",
          label: "API Gravity",
          sortable: true,
          render: (val) => val.toFixed(2),
        },
        {
          key: "temperature_degF",
          label: "Temperature (°F)",
          sortable: true,
          render: (val) => val.toFixed(1),
        },
      ]}
      onRowClick={(entry) => console.log("View entry:", entry)}
      emptyMessage="No production entries found"
      emptyIcon={<Database className="w-16 h-16 text-gray-400 opacity-50" />}
      aria-label="Production entries table"
    />
  );
};

// Example 2: Terminal Receipts Table
interface TerminalReceipt {
  id: string;
  date: Date;
  terminal: string;
  volume_bbl: number;
  ticket_number: string;
  status: "pending" | "confirmed" | "rejected";
}

export const TerminalReceiptsExample = ({ receipts }: { receipts: TerminalReceipt[] }) => {
  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-500/20 text-yellow-400",
      confirmed: "bg-green-500/20 text-green-400",
      rejected: "bg-red-500/20 text-red-400",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[status as keyof typeof colors]}`}>
        {status}
      </span>
    );
  };

  return (
    <DataTable
      data={receipts}
      columns={[
        {
          key: "date",
          label: "Date",
          sortable: true,
          render: (val) => new Date(val).toLocaleDateString(),
        },
        {
          key: "terminal",
          label: "Terminal",
          sortable: true,
        },
        {
          key: "ticket_number",
          label: "Ticket #",
          sortable: true,
        },
        {
          key: "volume_bbl",
          label: "Volume (BBL)",
          sortable: true,
          render: (val) => val.toLocaleString(),
        },
        {
          key: "status",
          label: "Status",
          sortable: true,
          render: (val) => getStatusBadge(val),
        },
      ]}
      emptyMessage="No terminal receipts found"
      aria-label="Terminal receipts table"
    />
  );
};

// Example 3: Allocation Results Table
interface AllocationResult {
  id: string;
  partner: string;
  input_volume: number;
  allocated_volume: number;
  percentage: number;
  efficiency: number;
}

export const AllocationResultsExample = ({ results }: { results: AllocationResult[] }) => {
  return (
    <DataTable
      data={results}
      columns={[
        {
          key: "partner",
          label: "Partner",
          sortable: true,
          width: "25%",
        },
        {
          key: "input_volume",
          label: "Input Volume",
          sortable: true,
          render: (val) => `${val.toLocaleString()} bbl`,
        },
        {
          key: "allocated_volume",
          label: "Allocated Volume",
          sortable: true,
          render: (val) => `${val.toLocaleString()} bbl`,
        },
        {
          key: "percentage",
          label: "Share",
          sortable: true,
          render: (val) => `${val.toFixed(2)}%`,
        },
        {
          key: "efficiency",
          label: "Efficiency",
          sortable: true,
          render: (val) => {
            const color = val >= 95 ? "text-green-400" : val >= 90 ? "text-yellow-400" : "text-red-400";
            return <span className={color}>{val.toFixed(1)}%</span>;
          },
        },
      ]}
      emptyMessage="No allocation results available"
      aria-label="Allocation results table"
    />
  );
};

// Example 4: Simple User Table (without row click)
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const UsersTableExample = ({ users }: { users: User[] }) => {
  return (
    <DataTable
      data={users}
      columns={[
        { key: "name", label: "Name", sortable: true },
        { key: "email", label: "Email", sortable: true },
        { key: "role", label: "Role", sortable: true },
      ]}
      emptyMessage="No users found"
      aria-label="Users table"
    />
  );
};

// Example 5: With Loading State
export const LoadingTableExample = () => {
  return (
    <DataTable
      data={[]}
      columns={[
        { key: "name", label: "Name" },
        { key: "value", label: "Value" },
      ]}
      loading={true}
      aria-label="Loading data table"
    />
  );
};
