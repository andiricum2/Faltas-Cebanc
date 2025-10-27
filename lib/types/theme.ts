/**
 * Theme configuration types
 * 
 * This file defines all TypeScript types and interfaces for the theme system.
 */

/**
 * Available theme modes
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Complete set of theme colors using OKLCH format
 * All values must follow the pattern: oklch(lightness chroma hue) or oklch(lightness chroma hue / alpha)
 */
export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  border: string;
  input: string;
  ring: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  // Absence types colors
  absenceF: string; // Falta
  absenceFText: string;
  absenceJ: string; // Justificada
  absenceJText: string;
  absenceC: string; // Compensada
  absenceCText: string;
  absenceE: string; // Expulsión
  absenceEText: string;
  absenceR: string; // Retraso
  absenceRText: string;
  absenceH: string; // Huelga
  absenceHText: string;
  // Module colors palette (10 colors for variety)
  module1: string;
  module2: string;
  module3: string;
  module4: string;
  module5: string;
  module6: string;
  module7: string;
  module8: string;
  module9: string;
  module10: string;
}

/**
 * User's theme configuration
 */
export interface ThemeConfig {
  /** Current theme mode (light/dark/system) */
  mode: ThemeMode;
  /** Custom color overrides for light mode */
  customLight?: Partial<ThemeColors>;
  /** Custom color overrides for dark mode */
  customDark?: Partial<ThemeColors>;
  /** ID of the active preset */
  preset?: string;
  /** User-created custom presets */
  customPresets?: ThemePreset[];
}

/**
 * Theme preset definition
 */
export interface ThemePreset {
  /** Unique identifier for the preset */
  id: string;
  /** Display name of the preset */
  name: string;
  /** Brief description of the preset */
  description: string;
  /** Color definitions for light mode */
  light: ThemeColors;
  /** Color definitions for dark mode */
  dark: ThemeColors;
  /** Whether this is a user-created preset (vs. system preset) */
  isCustom?: boolean;
}

export const DEFAULT_LIGHT_COLORS: ThemeColors = {
  background: 'oklch(1 0 0)',
  foreground: 'oklch(0.145 0 0)',
  card: 'oklch(1 0 0)',
  cardForeground: 'oklch(0.145 0 0)',
  popover: 'oklch(1 0 0)',
  popoverForeground: 'oklch(0.145 0 0)',
  primary: 'oklch(0.205 0 0)',
  primaryForeground: 'oklch(0.985 0 0)',
  secondary: 'oklch(0.97 0 0)',
  secondaryForeground: 'oklch(0.205 0 0)',
  muted: 'oklch(0.97 0 0)',
  mutedForeground: 'oklch(0.556 0 0)',
  accent: 'oklch(0.97 0 0)',
  accentForeground: 'oklch(0.205 0 0)',
  destructive: 'oklch(0.577 0.245 27.325)',
  border: 'oklch(0.922 0 0)',
  input: 'oklch(0.922 0 0)',
  ring: 'oklch(0.708 0 0)',
  chart1: 'oklch(0.646 0.222 41.116)',
  chart2: 'oklch(0.6 0.118 184.704)',
  chart3: 'oklch(0.398 0.07 227.392)',
  chart4: 'oklch(0.828 0.189 84.429)',
  chart5: 'oklch(0.769 0.188 70.08)',
  sidebar: 'oklch(0.985 0 0)',
  sidebarForeground: 'oklch(0.145 0 0)',
  sidebarPrimary: 'oklch(0.205 0 0)',
  sidebarPrimaryForeground: 'oklch(0.985 0 0)',
  sidebarAccent: 'oklch(0.97 0 0)',
  sidebarAccentForeground: 'oklch(0.205 0 0)',
  sidebarBorder: 'oklch(0.922 0 0)',
  sidebarRing: 'oklch(0.708 0 0)',
  // Absence types (matching original colors)
  absenceF: 'oklch(0.95 0.1 15)', // Red light (Falta)
  absenceFText: 'oklch(0.3 0.15 15)', // Red dark
  absenceJ: 'oklch(0.92 0.12 155)', // Emerald light (Justificada)
  absenceJText: 'oklch(0.25 0.12 155)', // Emerald dark
  absenceC: 'oklch(0.92 0.1 180)', // Teal light (Compensada)
  absenceCText: 'oklch(0.25 0.1 180)', // Teal dark
  absenceE: 'oklch(0.92 0.12 300)', // Purple light (Expulsión)
  absenceEText: 'oklch(0.25 0.12 300)', // Purple dark
  absenceR: 'oklch(0.92 0.12 70)', // Amber light (Retraso)
  absenceRText: 'oklch(0.25 0.12 70)', // Amber dark
  absenceH: 'oklch(0.9 0 0)', // Slate light (Huelga)
  absenceHText: 'oklch(0.2 0 0)', // Slate dark
  // Module colors (vibrant palette)
  module1: 'oklch(0.75 0.15 250)', // Blue
  module2: 'oklch(0.75 0.15 145)', // Green
  module3: 'oklch(0.80 0.15 85)', // Yellow
  module4: 'oklch(0.75 0.15 350)', // Pink
  module5: 'oklch(0.75 0.15 200)', // Cyan
  module6: 'oklch(0.75 0.15 130)', // Lime
  module7: 'oklch(0.70 0.15 270)', // Indigo
  module8: 'oklch(0.75 0.15 50)', // Orange
  module9: 'oklch(0.72 0.18 320)', // Fuchsia
  module10: 'oklch(0.77 0.14 220)', // Sky
};

export const DEFAULT_DARK_COLORS: ThemeColors = {
  background: 'oklch(0.22 0 0)',
  foreground: 'oklch(0.985 0 0)',
  card: 'oklch(0.26 0 0)',
  cardForeground: 'oklch(0.985 0 0)',
  popover: 'oklch(0.26 0 0)',
  popoverForeground: 'oklch(0.985 0 0)',
  primary: 'oklch(0.922 0 0)',
  primaryForeground: 'oklch(0.205 0 0)',
  secondary: 'oklch(0.3 0 0)',
  secondaryForeground: 'oklch(0.985 0 0)',
  muted: 'oklch(0.3 0 0)',
  mutedForeground: 'oklch(0.708 0 0)',
  accent: 'oklch(0.3 0 0)',
  accentForeground: 'oklch(0.985 0 0)',
  destructive: 'oklch(0.704 0.191 22.216)',
  border: 'oklch(1 0 0 / 10%)',
  input: 'oklch(1 0 0 / 15%)',
  ring: 'oklch(0.556 0 0)',
  chart1: 'oklch(0.488 0.243 264.376)',
  chart2: 'oklch(0.696 0.17 162.48)',
  chart3: 'oklch(0.769 0.188 70.08)',
  chart4: 'oklch(0.627 0.265 303.9)',
  chart5: 'oklch(0.645 0.246 16.439)',
  sidebar: 'oklch(0.26 0 0)',
  sidebarForeground: 'oklch(0.985 0 0)',
  sidebarPrimary: 'oklch(0.488 0.243 264.376)',
  sidebarPrimaryForeground: 'oklch(0.985 0 0)',
  sidebarAccent: 'oklch(0.3 0 0)',
  sidebarAccentForeground: 'oklch(0.985 0 0)',
  sidebarBorder: 'oklch(1 0 0 / 10%)',
  sidebarRing: 'oklch(0.556 0 0)',
  // Absence types (darker theme)
  absenceF: 'oklch(0.35 0.12 15)', // Red (Falta)
  absenceFText: 'oklch(0.85 0.08 15)', // Red light
  absenceJ: 'oklch(0.35 0.12 155)', // Emerald (Justificada)
  absenceJText: 'oklch(0.85 0.08 155)', // Emerald light
  absenceC: 'oklch(0.35 0.1 180)', // Teal (Compensada)
  absenceCText: 'oklch(0.85 0.08 180)', // Teal light
  absenceE: 'oklch(0.35 0.12 300)', // Purple (Expulsión)
  absenceEText: 'oklch(0.85 0.08 300)', // Purple light
  absenceR: 'oklch(0.35 0.12 70)', // Amber (Retraso)
  absenceRText: 'oklch(0.85 0.08 70)', // Amber light
  absenceH: 'oklch(0.35 0 0)', // Slate (Huelga)
  absenceHText: 'oklch(0.85 0 0)', // Slate light
  // Module colors (darker but still vibrant)
  module1: 'oklch(0.55 0.18 250)', // Blue
  module2: 'oklch(0.55 0.18 145)', // Green
  module3: 'oklch(0.60 0.18 85)', // Yellow
  module4: 'oklch(0.55 0.18 350)', // Pink
  module5: 'oklch(0.55 0.18 200)', // Cyan
  module6: 'oklch(0.55 0.18 130)', // Lime
  module7: 'oklch(0.50 0.18 270)', // Indigo
  module8: 'oklch(0.55 0.18 50)', // Orange
  module9: 'oklch(0.52 0.20 320)', // Fuchsia
  module10: 'oklch(0.57 0.16 220)', // Sky
};

// Theme presets
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'The default neutral theme',
    light: DEFAULT_LIGHT_COLORS,
    dark: DEFAULT_DARK_COLORS,
  },
  {
    id: 'blue',
    name: 'Blue',
    description: 'A professional blue theme',
    light: {
      ...DEFAULT_LIGHT_COLORS,
      primary: 'oklch(0.5 0.17 250)',
      primaryForeground: 'oklch(0.985 0 0)',
      sidebarPrimary: 'oklch(0.5 0.17 250)',
      chart1: 'oklch(0.6 0.2 250)',
      chart2: 'oklch(0.65 0.15 220)',
      chart3: 'oklch(0.55 0.18 270)',
    },
    dark: {
      ...DEFAULT_DARK_COLORS,
      primary: 'oklch(0.65 0.2 250)',
      sidebarPrimary: 'oklch(0.65 0.2 250)',
      chart1: 'oklch(0.65 0.22 250)',
      chart2: 'oklch(0.7 0.17 220)',
      chart3: 'oklch(0.6 0.2 270)',
    },
  },
  {
    id: 'green',
    name: 'Green',
    description: 'A fresh green theme',
    light: {
      ...DEFAULT_LIGHT_COLORS,
      primary: 'oklch(0.5 0.15 145)',
      primaryForeground: 'oklch(0.985 0 0)',
      sidebarPrimary: 'oklch(0.5 0.15 145)',
      chart1: 'oklch(0.6 0.18 145)',
      chart2: 'oklch(0.65 0.14 120)',
      chart3: 'oklch(0.55 0.16 170)',
    },
    dark: {
      ...DEFAULT_DARK_COLORS,
      primary: 'oklch(0.65 0.18 145)',
      sidebarPrimary: 'oklch(0.65 0.18 145)',
      chart1: 'oklch(0.65 0.2 145)',
      chart2: 'oklch(0.7 0.16 120)',
      chart3: 'oklch(0.6 0.18 170)',
    },
  },
  {
    id: 'purple',
    name: 'Purple',
    description: 'A creative purple theme',
    light: {
      ...DEFAULT_LIGHT_COLORS,
      primary: 'oklch(0.5 0.18 300)',
      primaryForeground: 'oklch(0.985 0 0)',
      sidebarPrimary: 'oklch(0.5 0.18 300)',
      chart1: 'oklch(0.6 0.2 300)',
      chart2: 'oklch(0.65 0.16 280)',
      chart3: 'oklch(0.55 0.19 320)',
    },
    dark: {
      ...DEFAULT_DARK_COLORS,
      primary: 'oklch(0.65 0.2 300)',
      sidebarPrimary: 'oklch(0.65 0.2 300)',
      chart1: 'oklch(0.65 0.22 300)',
      chart2: 'oklch(0.7 0.18 280)',
      chart3: 'oklch(0.6 0.21 320)',
    },
  },
  {
    id: 'orange',
    name: 'Orange',
    description: 'A warm orange theme',
    light: {
      ...DEFAULT_LIGHT_COLORS,
      primary: 'oklch(0.55 0.16 45)',
      primaryForeground: 'oklch(0.985 0 0)',
      sidebarPrimary: 'oklch(0.55 0.16 45)',
      chart1: 'oklch(0.65 0.18 45)',
      chart2: 'oklch(0.7 0.15 30)',
      chart3: 'oklch(0.6 0.17 60)',
    },
    dark: {
      ...DEFAULT_DARK_COLORS,
      primary: 'oklch(0.7 0.18 45)',
      sidebarPrimary: 'oklch(0.7 0.18 45)',
      chart1: 'oklch(0.7 0.2 45)',
      chart2: 'oklch(0.75 0.17 30)',
      chart3: 'oklch(0.65 0.19 60)',
    },
  },
];

