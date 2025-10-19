// UI Constants - Single source of truth for colors, sizes, and styling

// Color Design Palette Types
export type ColorShades = Record<string, string>;
export type ColorGroup = Record<string, ColorShades>;
export type ColorPalette = {
  primary: {
    blue: ColorShades;
    purple: ColorShades;
    cyan: ColorShades;
  };
  background: ColorShades;
  text: ColorShades;
  border: ColorShades;
};

// Color Palette
export const COLORS: ColorPalette = {
  primary: {
    blue: {
      50: "from-blue-400",
      600: "from-blue-600",
      700: "from-blue-700",
      500: "bg-blue-500",
      400: "text-blue-400",
    },
    purple: {
      400: "to-purple-400",
      600: "to-purple-600",
      700: "to-purple-700",
    },
    cyan: {
      400: "to-cyan-400",
      500: "bg-cyan-500",
    },
  },
  background: {
    gradient: "bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900",
    overlay: "bg-black/20",
    glass: "bg-white/5",
    glassHover: "bg-white/10",
    card: "bg-white/10",
  },
  text: {
    primary: "text-white",
    secondary: "text-gray-300",
    muted: "text-gray-400",
  },
  border: {
    light: "border-white/10",
    blue: "border-blue-500/30",
    ring: "ring-blue-500/50",
  },
};

// Chart Colors
export const CHART_COLORS: string[] = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // orange
  "#8b5cf6", // purple
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316", // orange-500
  "#a855f7", // purple-500
];

// Card/Modal Sizes
export const CARD_SIZES = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
} as const;

// Common Gradients
export const GRADIENTS = {
  primary: "bg-gradient-to-r from-blue-600 to-purple-600",
  dashboard: "bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900",
  card: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20",
} as const;
