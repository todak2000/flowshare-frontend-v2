import React from 'react';
import { COLORS } from './Home';

interface LoadingSpinnerProps {
  message?: string;
}

 const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Loading...", 
}) => {

  return (
    <div className="flex items-center justify-center space-x-3">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
    <span className={COLORS.text.secondary}>{message}</span>
  </div>
  );
};
export default LoadingSpinner

