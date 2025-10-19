'use client';

import React from 'react';

/**
 * SkipLinks Component
 * Provides keyboard navigation shortcuts for screen reader users
 * Allows users to skip to main content, navigation, or footer
 */
export const SkipLinks: React.FC = () => {
  return (
    <div className="skip-links">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to navigation
      </a>
    </div>
  );
};
