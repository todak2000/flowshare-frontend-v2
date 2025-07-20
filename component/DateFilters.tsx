import React from 'react';
import { Filters } from '../types';

interface DateFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

const DateFilters: React.FC<DateFiltersProps> = ({ 
  filters, 
  onFiltersChange 
}) => {
  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const getDateInputClass = (hasValue: boolean) => 
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      hasValue
        ? "text-blue-600 border-blue-500 border-2 font-medium"
        : "border-gray-300 text-gray-900"
    }`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Start Date
        </label>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => handleDateChange('startDate', e.target.value)}
          className={getDateInputClass(!!filters.startDate)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          End Date
        </label>
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => handleDateChange('endDate', e.target.value)}
          className={getDateInputClass(!!filters.endDate)}
        />
      </div>
    </div>
  );
};
export default DateFilters