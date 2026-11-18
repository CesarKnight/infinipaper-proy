export const primitives = {
  paper: "#FAF6EE",
  paperRaised: "#FFFFFF",
  paperSunken: "#F3ECDD",
  ink: "#1B1633",
  muted: "#5B5575",
  border: "#E6DECF",
  indigo: "#4B2EA3",
  indigoSoft: "#E9E2FA",
  coral: "#FF6B57",
  night: "#0C052C",
  surface: "#291054",
  surface2: "#3B2A6E",
  white: "#FFFFFF",
  mist: "#C9B6E6",
  violet: "#A98BFF",
  amber: "#FFB84D",
  success: "#1F7A4D",
  warning: "#B45309",
  danger: "#B3261E",
};

export const colors = {
  light: {
    background: primitives.paper,
    foreground: primitives.ink,
    card: primitives.paperRaised,
    cardForeground: primitives.ink,
    muted: primitives.paperSunken,
    mutedForeground: primitives.muted,
    primary: primitives.indigo,
    primaryForeground: primitives.white,
    secondary: primitives.indigoSoft,
    secondaryForeground: primitives.indigo,
    accent: primitives.coral,
    accentForeground: primitives.ink,
    border: primitives.border,
    danger: primitives.danger,
    success: primitives.success,
    warning: primitives.warning,
  },
  dark: {
    background: primitives.night,
    foreground: primitives.white,
    card: primitives.surface,
    cardForeground: primitives.white,
    muted: primitives.surface2,
    mutedForeground: primitives.mist,
    primary: primitives.violet,
    primaryForeground: primitives.night,
    secondary: primitives.surface2,
    secondaryForeground: primitives.white,
    accent: primitives.amber,
    accentForeground: primitives.night,
    border: primitives.surface2,
    danger: "#FF8A80",
    success: "#6EE7B7",
    warning: primitives.amber,
  },
} as const;

export type ThemeColors = (typeof colors)["light"] | (typeof colors)["dark"];
export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const gradients = {
  light: ["#FAF6EE", "#F3ECDD", "#FFFFFF"] as const,
  dark: ["#0C052C", "#291054", "#1E0B46"] as const,
};

export const fonts = {
  regular: "Inter",
  medium: "InterMedium",
  semibold: "InterSemiBold",
  heading: "Fraunces",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 22,
  pill: 999,
};
