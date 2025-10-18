/**
 * Format AI analysis text from Markdown to React components
 * Handles bold text, bullet points, headers, and line breaks
 */

import React from 'react';

export function formatAiAnalysis(text: string): React.ReactNode[] {
  if (!text) return [];

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) {
      elements.push(<br key={`br-${key++}`} />);
      return;
    }

    // Handle headers (## Header or **Header:** at start of line)
    if (trimmedLine.startsWith('##')) {
      const headerText = trimmedLine.replace(/^##\s*/, '').replace(/\*\*/g, '');
      elements.push(
        <h3 key={`h3-${key++}`} className="text-lg font-bold text-yellow-300 mt-4 mb-2">
          {headerText}
        </h3>
      );
      return;
    }

    // Handle bold headers at start of line (e.g., **Data Quality Score:**)
    if (trimmedLine.match(/^\*\*[^*]+:\*\*/)) {
      const headerText = trimmedLine.replace(/\*\*/g, '');
      elements.push(
        <p key={`header-${key++}`} className="font-bold text-yellow-300 mt-3 mb-1">
          {headerText}
        </p>
      );
      return;
    }

    // Handle bullet points (lines starting with * or -)
    if (trimmedLine.match(/^[\*\-]\s+/)) {
      const bulletText = trimmedLine.replace(/^[\*\-]\s+/, '');
      const formattedText = formatInlineMarkdown(bulletText);
      elements.push(
        <li key={`li-${key++}`} className="ml-6 mb-1 list-disc text-gray-300">
          {formattedText}
        </li>
      );
      return;
    }

    // Handle numbered lists (lines starting with 1., 2., etc.)
    if (trimmedLine.match(/^\d+\.\s+/)) {
      const listText = trimmedLine.replace(/^\d+\.\s+/, '');
      const formattedText = formatInlineMarkdown(listText);
      elements.push(
        <li key={`oli-${key++}`} className="ml-6 mb-1 list-decimal text-gray-300">
          {formattedText}
        </li>
      );
      return;
    }

    // Handle risk level specifically
    if (trimmedLine.startsWith('**Risk Level:')) {
      const riskText = trimmedLine.replace(/\*\*/g, '');
      const [label, level] = riskText.split(':').map(s => s.trim());
      const riskColor = level === 'HIGH' ? 'text-red-400' : level === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400';
      elements.push(
        <p key={`risk-${key++}`} className="font-bold mt-3">
          <span className="text-yellow-300">{label}:</span>{' '}
          <span className={riskColor}>{level}</span>
        </p>
      );
      return;
    }

    // Regular paragraph with inline markdown
    const formattedText = formatInlineMarkdown(trimmedLine);
    elements.push(
      <p key={`p-${key++}`} className="mb-2 text-gray-300">
        {formattedText}
      </p>
    );
  });

  return elements;
}

/**
 * Format inline markdown (bold, italic) within a line of text
 */
function formatInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let currentText = text;
  let key = 0;

  // Match bold text (**text**)
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(currentText)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(currentText.substring(lastIndex, match.index));
    }

    // Add bold text
    parts.push(
      <strong key={`bold-${key++}`} className="font-semibold text-white">
        {match[1]}
      </strong>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < currentText.length) {
    parts.push(currentText.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
