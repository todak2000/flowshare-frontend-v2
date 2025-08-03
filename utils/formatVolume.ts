// utils/formatVolume.ts
export interface FormattedVolume {
  value: string; // e.g. "187.9"
  unit: string;  // e.g. "BBL", "MBBL", "MMBBL"
}

export const formatVolume = (value: number): FormattedVolume => {
  if (value < 1000) {
    return {
      value: value.toFixed(1),
      unit: ' BBL',
    };
  } else if (value < 1_000_000) {
    // Convert to thousands -> MBBL (common industry shorthand)
    const inMBBL = value / 1000;
    return {
      value: inMBBL.toFixed(1),
      unit: ' MBBL', // Thousand barrels
    };
  } else {
    // Convert to millions -> MMBBL
    const inMMBBL = value / 1_000_000;
    return {
      value: inMMBBL.toFixed(1),
      unit: ' MMBBL', // Million barrels
    };
  }
};