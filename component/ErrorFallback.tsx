'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ErrorFallbackProps {
  error?: Error | null;
  resetError?: () => void;
  title?: string;
  message?: string;
  showHomeButton?: boolean;
}

/**
 * Customizable Error Fallback Component
 * Displays a user-friendly error message with actions
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  title = 'Something went wrong',
  message,
  showHomeButton = true,
}) => {
  const router = useRouter();

  const defaultMessage = error?.message || 'An unexpected error occurred. Please try again.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-400" aria-hidden="true" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-3">{title}</h1>

          {/* Error Message */}
          <p className="text-gray-300 mb-6 leading-relaxed">
            {message || defaultMessage}
          </p>

          {/* Error Details (in development) */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 mb-2">
                Technical Details
              </summary>
              <div className="bg-black/30 rounded-lg p-4 text-xs text-gray-300 overflow-auto max-h-40">
                <div className="font-mono">
                  <div className="text-red-400 font-semibold mb-2">{error.name}</div>
                  <div className="mb-2">{error.message}</div>
                  {error.stack && (
                    <pre className="text-gray-400 text-xs overflow-x-auto">
                      {error.stack}
                    </pre>
                  )}
                </div>
              </div>
            </details>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {resetError && (
              <button
                onClick={resetError}
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Try again"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            )}

            {showHomeButton && (
              <button
                onClick={() => router.push('/')}
                className="flex-1 flex items-center justify-center space-x-2 bg-white/10 text-white py-3 px-4 rounded-xl font-medium hover:bg-white/20 transition-all duration-300 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Go to home page"
              >
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Data Loading Error Fallback
 * Specific fallback for data fetching errors
 */
export const DataErrorFallback: React.FC<{
  error?: Error | null;
  retry?: () => void;
  entityName?: string;
}> = ({ error, retry, entityName = 'data' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-400" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        Failed to load {entityName}
      </h3>
      <p className="text-gray-300 mb-4 max-w-md">
        {error?.message || `There was a problem loading ${entityName}. Please try again.`}
      </p>
      {retry && (
        <button
          onClick={retry}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};

export default ErrorFallback;
