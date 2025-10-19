import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { COLORS } from '../../../../component/Home';

interface ProductionFiltersProps {
  selectedMonth: {
    year: number;
    month: number;
  };
  onMonthChange: (direction: 'prev' | 'next') => void;
  isCurrentOrFutureMonth: boolean;
}

/**
 * ProductionFilters Component
 * Provides month navigation controls for filtering production data
 */
export const ProductionFilters: React.FC<ProductionFiltersProps> = ({
  selectedMonth,
  onMonthChange,
  isCurrentOrFutureMonth,
}) => {
  const monthName = new Date(
    selectedMonth.year,
    selectedMonth.month - 1
  ).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={() => onMonthChange('prev')}
        aria-label="Previous month"
        className={`p-2 rounded-xl ${COLORS.background.glass} hover:${COLORS.background.glassHover} transition-colors ${COLORS.border.light} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
      >
        <ChevronLeft className={`w-5 h-5 ${COLORS.text.primary}`} aria-hidden="true" />
      </button>

      <div className="flex items-center space-x-2">
        <Calendar className={`w-6 h-6 ${COLORS.primary.blue[400]}`} aria-hidden="true" />
        <span className={`text-lg font-medium ${COLORS.text.primary} text-center min-w-[180px]`}>
          {monthName}
        </span>
      </div>

      <button
        onClick={() => onMonthChange('next')}
        disabled={isCurrentOrFutureMonth}
        aria-label="Next month"
        className={`p-2 rounded-xl ${COLORS.background.glass} hover:${COLORS.background.glassHover} transition-colors ${COLORS.border.light} border disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500`}
      >
        <ChevronRight className={`w-5 h-5 ${COLORS.text.primary}`} aria-hidden="true" />
      </button>
    </div>
  );
};
