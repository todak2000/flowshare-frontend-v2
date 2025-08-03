// components/LogViewer.tsx
import React from "react";
import { Log } from "../../types";

interface LogViewerProps {
  logs: Log[];
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs }) => (
  <div className="bg-slate-900 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-xs">
    {logs.map((log, index) => (
      <div
        key={index}
        className="flex items-start space-x-3 mb-2 last:mb-0 text-slate-300"
      >
        <span className="text-slate-400 w-16">{log.timestamp}</span>
        <span
          className={
            log.type === "error"
              ? "text-red-400"
              : log.type === "success"
              ? "text-green-400"
              : "text-slate-300"
          }
        >
          {log.message}
        </span>
      </div>
    ))}
  </div>
);
