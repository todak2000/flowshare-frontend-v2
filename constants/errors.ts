/**
 * Error Messages Catalog
 * Centralized, user-friendly error messages for consistent UX
 */

export interface ErrorConfig {
  title: string;
  message: string;
  action: string;
}

export const ERROR_MESSAGES = {
  NETWORK_ERROR: {
    title: 'Connection Problem',
    message: 'We couldn\'t reach the server. Please check your internet connection and try again.',
    action: 'Retry',
  },
  AUTH_EXPIRED: {
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again to continue.',
    action: 'Log In',
  },
  VALIDATION_ERROR: {
    title: 'Invalid Data',
    message: 'Please check the form for errors and try again.',
    action: 'Fix Errors',
  },
  PERMISSION_DENIED: {
    title: 'Access Denied',
    message: 'You don\'t have permission to perform this action.',
    action: 'Go Back',
  },
  DATA_NOT_FOUND: {
    title: 'Not Found',
    message: 'The data you\'re looking for doesn\'t exist or has been deleted.',
    action: 'Go Back',
  },
  SERVER_ERROR: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Our team has been notified. Please try again later.',
    action: 'Retry',
  },
  TIMEOUT_ERROR: {
    title: 'Request Timeout',
    message: 'The request took too long to complete. Please try again.',
    action: 'Retry',
  },
  FIRESTORE_ERROR: {
    title: 'Database Error',
    message: 'We couldn\'t access the database. Please try again in a moment.',
    action: 'Retry',
  },
  AGENT_ERROR: {
    title: 'Agent Service Error',
    message: 'The AI agent service is temporarily unavailable. Please try again later.',
    action: 'Retry',
  },
  UNKNOWN_ERROR: {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    action: 'Retry',
  },
} as const;

export type ErrorType = keyof typeof ERROR_MESSAGES;

/**
 * Get error configuration from Error object
 * Maps specific error types to user-friendly messages
 */
export function getErrorConfig(error: Error): ErrorConfig {
  const message = error.message.toLowerCase();

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  // Auth errors
  if (message.includes('auth') || message.includes('unauthorized') || message.includes('session')) {
    return ERROR_MESSAGES.AUTH_EXPIRED;
  }

  // Permission errors
  if (message.includes('permission') || message.includes('forbidden') || message.includes('access denied')) {
    return ERROR_MESSAGES.PERMISSION_DENIED;
  }

  // Validation errors
  if (message.includes('invalid') || message.includes('validation') || message.includes('required')) {
    return ERROR_MESSAGES.VALIDATION_ERROR;
  }

  // Not found errors
  if (message.includes('not found') || message.includes('404') || message.includes('doesn\'t exist')) {
    return ERROR_MESSAGES.DATA_NOT_FOUND;
  }

  // Server errors
  if (message.includes('500') || message.includes('server error') || message.includes('internal')) {
    return ERROR_MESSAGES.SERVER_ERROR;
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }

  // Firestore errors
  if (message.includes('firestore') || message.includes('firebase')) {
    return ERROR_MESSAGES.FIRESTORE_ERROR;
  }

  // Agent errors
  if (message.includes('agent') || message.includes('ai service')) {
    return ERROR_MESSAGES.AGENT_ERROR;
  }

  // Default to unknown error
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}
