import { useState } from 'react';
import { formatDateForInput } from '../utils/date';

interface DateFilter {
  startDate: string;
  endDate: string;
}

/**
 * Custom hook for managing date range filters
 * @param defaultDaysBack - Number of days to go back from today for the default start date
 * @returns Object with dateFilter state and update functions
 */
export function useDateFilter(defaultDaysBack: number = 30) {
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    startDate: formatDateForInput(
      new Date(Date.now() - defaultDaysBack * 24 * 60 * 60 * 1000)
    ),
    endDate: formatDateForInput(new Date()),
  });

  const updateStartDate = (date: string) => {
    setDateFilter((prev) => ({ ...prev, startDate: date }));
  };

  const updateEndDate = (date: string) => {
    setDateFilter((prev) => ({ ...prev, endDate: date }));
  };

  const resetToDefault = () => {
    setDateFilter({
      startDate: formatDateForInput(
        new Date(Date.now() - defaultDaysBack * 24 * 60 * 60 * 1000)
      ),
      endDate: formatDateForInput(new Date()),
    });
  };

  return {
    dateFilter,
    updateStartDate,
    updateEndDate,
    resetToDefault,
    setDateFilter,
  };
}
