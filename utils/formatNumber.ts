/**
 * Formats a number with thousand separators and fixed decimal places,
 * without any currency symbol.
 *
 * @param {number} number - The number to format
 * @param {number} decimalPlaces - Number of decimal places (default: 2)
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} Formatted string (e.g., "1,234,567.89")
 */
export function formatNumber(n: number, decimalPlaces = 2, locale = "en-US") {
  return n.toLocaleString(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
    useGrouping: true,
  });
}
