'use client';

import React from 'react';

/**
 * LiveRegion Component
 * Announces dynamic content updates to screen readers using ARIA live regions
 *
 * @component
 * @example
 * ```tsx
 * // For status messages (polite)
 * <LiveRegion message="Form submitted successfully" />
 *
 * // For urgent alerts (assertive)
 * <LiveRegion
 *   message="Error: Connection lost"
 *   politeness="assertive"
 * />
 * ```
 */

interface LiveRegionProps {
  /** The message to announce to screen readers */
  message: string;
  /**
   * How urgently the message should be announced:
   * - 'polite': Wait for screen reader to finish current task (default)
   * - 'assertive': Interrupt screen reader immediately
   */
  politeness?: 'polite' | 'assertive';
  /**
   * Whether to read entire region when changed (true)
   * or only changed parts (false)
   */
  atomic?: boolean;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  politeness = 'polite',
  atomic = true,
}) => {
  // Don't render anything if there's no message
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {message}
    </div>
  );
};

/**
 * StatusMessage Component
 * Convenience wrapper for polite status messages
 */
export const StatusMessage: React.FC<{ message: string }> = ({ message }) => (
  <LiveRegion message={message} politeness="polite" />
);

/**
 * AlertMessage Component
 * Convenience wrapper for assertive/urgent alerts
 */
export const AlertMessage: React.FC<{ message: string }> = ({ message }) => (
  <LiveRegion message={message} politeness="assertive" />
);
