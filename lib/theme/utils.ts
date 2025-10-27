/**
 * Theme utility functions
 */

/**
 * Formats a camelCase key to a human-readable label
 * @example formatColorLabel("primaryForeground") => "Primary Foreground"
 */
export function formatColorLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Generates a unique preset ID
 */
export function generatePresetId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Checks if a preset is a system preset (not custom)
 */
export function isSystemPreset(presetId: string): boolean {
  return !presetId.startsWith("custom-");
}

/**
 * Validates preset name
 */
export function isValidPresetName(name: string): boolean {
  return name.trim().length >= 3 && name.trim().length <= 50;
}


