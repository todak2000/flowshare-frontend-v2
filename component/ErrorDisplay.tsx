/**
 * ErrorDisplay Component
 * User-friendly error display with actionable feedback
 */
import React from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, LogIn } from 'lucide-react';
import { getErrorConfig } from '../constants/errors';
import { COLORS } from './Home';

interface ErrorDisplayProps {
  error: Error | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
}) => {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  const errorConfig = getErrorConfig(errorObj);

  const handleAction = () => {
    if (errorConfig.action === 'Retry' && onRetry) {
      onRetry();
    } else if (errorConfig.action === 'Go Back') {
      window.history.back();
    } else if (errorConfig.action === 'Log In') {
      window.location.href = '/onboarding/login';
    } else if (onDismiss) {
      onDismiss();
    }
  };

  const getActionIcon = () => {
    switch (errorConfig.action) {
      case 'Retry':
        return <RefreshCw className="w-4 h-4" />;
      case 'Go Back':
        return <ArrowLeft className="w-4 h-4" />;
      case 'Log In':
        return <LogIn className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`p-6 bg-red-500/10 border border-red-500/20 rounded-xl ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-4">
        {/* Error Icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
        </div>

        {/* Error Content */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            {errorConfig.title}
          </h3>
          <p className="text-sm text-red-300 mb-4">
            {errorConfig.message}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleAction}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all text-sm font-medium text-white"
            >
              {getActionIcon()}
              {errorConfig.action}
            </button>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`px-4 py-2 rounded-lg ${COLORS.background.glassHover} hover:bg-white/15 transition-colors text-sm font-medium ${COLORS.text.primary}`}
              >
                Dismiss
              </button>
            )}
          </div>

          {/* Technical Details (collapsed by default) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="text-xs text-red-400/60 cursor-pointer hover:text-red-400">
                Technical Details
              </summary>
              <pre className="mt-2 p-3 bg-black/20 rounded text-xs text-red-300 overflow-auto">
                {errorObj.message}
                {'\n\n'}
                {errorObj.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * InlineError Component
 * Compact error display for inline use (forms, cards, etc.)
 */
interface InlineErrorProps {
  message: string;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div
      className={`flex items-center gap-2 text-sm text-red-400 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};
