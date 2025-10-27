/**
 * Theme-related constants
 */

import { ThemeColors } from "@/lib/types/theme";

/**
 * All available color keys for theme customization
 */
export const COLOR_KEYS: Array<keyof ThemeColors> = [
  "background",
  "foreground",
  "card",
  "cardForeground",
  "popover",
  "popoverForeground",
  "primary",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "muted",
  "mutedForeground",
  "accent",
  "accentForeground",
  "destructive",
  "border",
  "input",
  "ring",
  "chart1",
  "chart2",
  "chart3",
  "chart4",
  "chart5",
  "absenceF",
  "absenceFText",
  "absenceJ",
  "absenceJText",
  "absenceC",
  "absenceCText",
  "absenceE",
  "absenceEText",
  "absenceR",
  "absenceRText",
  "absenceH",
  "absenceHText",
  "module1",
  "module2",
  "module3",
  "module4",
  "module5",
  "module6",
  "module7",
  "module8",
  "module9",
  "module10",
];

/**
 * Essential color keys (most commonly customized)
 */
export const ESSENTIAL_COLOR_KEYS: Array<keyof ThemeColors> = [
  "background",
  "foreground",
  "primary",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "accent",
  "accentForeground",
  "destructive",
  "border",
];

/**
 * Color categories for organized display
 */
export const COLOR_CATEGORIES = {
  base: ["background", "foreground"] as const,
  surfaces: ["card", "cardForeground", "popover", "popoverForeground"] as const,
  interactive: ["primary", "primaryForeground", "secondary", "secondaryForeground"] as const,
  states: ["muted", "mutedForeground", "accent", "accentForeground", "destructive"] as const,
  borders: ["border", "input", "ring"] as const,
  charts: ["chart1", "chart2", "chart3", "chart4", "chart5"] as const,
  absences: ["absenceF", "absenceFText", "absenceJ", "absenceJText", "absenceC", "absenceCText", "absenceE", "absenceEText", "absenceR", "absenceRText", "absenceH", "absenceHText"] as const,
  modules: ["module1", "module2", "module3", "module4", "module5", "module6", "module7", "module8", "module9", "module10"] as const,
};



