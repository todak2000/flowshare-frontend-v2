// components/ProgressBar.tsx
import React from "react";

interface ProgressBarProps {
  progress: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => (
  <div className="mt-4">
    <div className="flex justify-between text-sm text-slate-600 mb-1">
      <span>Progress</span>
      <span>{Math.round(progress)}%</span>
    </div>
    <div className="w-full bg-slate-200 rounded-full h-2">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);