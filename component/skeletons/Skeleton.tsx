/**
 * Skeleton Loading Components
 * Provides visual feedback during data loading
 */
import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Base Skeleton component
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-white/10';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width || undefined,
    height: height || undefined,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      aria-label="Loading..."
      role="status"
    />
  );
};

/**
 * SummaryCard Skeleton
 */
export const SummaryCardSkeleton = () => (
  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
    <div className="w-12 h-12 bg-white/10 rounded-xl mb-4 animate-pulse" />
    <Skeleton className="h-4 w-20 mb-2" variant="text" />
    <Skeleton className="h-8 w-32" variant="text" />
  </div>
);

/**
 * Table Skeleton
 */
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-2" role="status" aria-label="Loading table data">
    {/* Header */}
    <div className="h-12 bg-white/10 rounded-lg animate-pulse" />

    {/* Rows */}
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
    ))}
  </div>
);

/**
 * Chart Skeleton
 */
export const ChartSkeleton = () => (
  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
    <Skeleton className="h-6 w-40 mb-6" variant="text" />

    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-3 flex-1" variant="text" />
          <Skeleton className="h-3 w-12" variant="text" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * Production Entry Card Skeleton
 */
export const ProductionCardSkeleton = () => (
  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <Skeleton className="h-5 w-32 mb-2" variant="text" />
        <Skeleton className="h-4 w-24" variant="text" />
      </div>
      <Skeleton className="w-16 h-6" variant="rectangular" />
    </div>

    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <Skeleton className="h-3 w-20 mb-2" variant="text" />
        <Skeleton className="h-5 w-28" variant="text" />
      </div>
      <div>
        <Skeleton className="h-3 w-20 mb-2" variant="text" />
        <Skeleton className="h-5 w-24" variant="text" />
      </div>
    </div>

    <div className="flex gap-2">
      <Skeleton className="h-8 w-20" variant="rectangular" />
      <Skeleton className="h-8 w-20" variant="rectangular" />
    </div>
  </div>
);

/**
 * Modal Skeleton
 */
export const ModalSkeleton = () => (
  <div className="bg-gray-800/95 backdrop-blur-xl rounded-2xl p-6 border border-gray-700">
    <div className="flex items-center justify-between mb-6">
      <Skeleton className="h-6 w-48" variant="text" />
      <Skeleton className="w-6 h-6" variant="circular" />
    </div>

    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <Skeleton className="h-4 w-24 mb-2" variant="text" />
          <Skeleton className="h-10 w-full" variant="rectangular" />
        </div>
      ))}
    </div>

    <div className="flex justify-end gap-3 mt-6">
      <Skeleton className="h-10 w-24" variant="rectangular" />
      <Skeleton className="h-10 w-24" variant="rectangular" />
    </div>
  </div>
);

/**
 * Page Skeleton (Full page loading)
 */
export const PageSkeleton = () => (
  <div className="min-h-screen p-8">
    {/* Header */}
    <div className="mb-8">
      <Skeleton className="h-8 w-64 mb-2" variant="text" />
      <Skeleton className="h-4 w-96" variant="text" />
    </div>

    {/* Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <SummaryCardSkeleton />
      <SummaryCardSkeleton />
      <SummaryCardSkeleton />
    </div>

    {/* Chart */}
    <div className="mb-8">
      <ChartSkeleton />
    </div>

    {/* Table */}
    <TableSkeleton />
  </div>
);

/**
 * List Item Skeleton
 */
export const ListItemSkeleton = () => (
  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
    <Skeleton className="w-12 h-12" variant="circular" />
    <div className="flex-1">
      <Skeleton className="h-4 w-full max-w-xs mb-2" variant="text" />
      <Skeleton className="h-3 w-full max-w-sm" variant="text" />
    </div>
    <Skeleton className="w-20 h-8" variant="rectangular" />
  </div>
);
