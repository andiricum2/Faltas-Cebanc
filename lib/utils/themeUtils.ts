/**
 * Utilities for theme management and color validation
 * 
 * This module provides functions for validating and describing OKLCH colors.
 */

/**
 * Validates if a string is a valid OKLCH color
 * 
 * @param color - The color string to validate
 * @returns true if the color is valid OKLCH format, false otherwise
 * 
 * @example
 * isValidOKLCH('oklch(0.5 0.2 180)') // true
 * isValidOKLCH('oklch(1 0 0 / 50%)') // true
 * isValidOKLCH('rgb(255, 0, 0)') // false
 * 
 * Format: oklch(lightness chroma hue / alpha)
 * - lightness: 0-1
 * - chroma: 0-0.5 (typically 0-0.4)
 * - hue: 0-360
 * - alpha: optional, 0-1 or 0-100%
 */
export function isValidOKLCH(color: string): boolean {
  if (!color || typeof color !== 'string') return false;
  
  // Remove extra whitespace
  const normalized = color.trim();
  
  // Basic OKLCH format check
  const oklchRegex = /^oklch\(\s*[\d.]+\s+[\d.]+\s+[\d.]+(?:\s*\/\s*(?:[\d.]+%?))?\s*\)$/;
  
  if (!oklchRegex.test(normalized)) return false;
  
  // Extract values
  const match = normalized.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/);
  if (!match) return false;
  
  const [, l, c, h, a] = match;
  
  // Validate ranges
  const lightness = parseFloat(l);
  const chroma = parseFloat(c);
  const hue = parseFloat(h);
  
  // Lightness: 0-1
  if (lightness < 0 || lightness > 1) return false;
  
  // Chroma: 0-0.4 (typically)
  if (chroma < 0 || chroma > 0.5) return false;
  
  // Hue: 0-360
  if (hue < 0 || hue > 360) return false;
  
  // Alpha if present
  if (a) {
    const alpha = a.endsWith('%') ? parseFloat(a) / 100 : parseFloat(a);
    if (alpha < 0 || alpha > 1) return false;
  }
  
  return true;
}

/**
 * Color description structure
 */
export interface ColorDescription {
  lightness: 'veryDark' | 'dark' | 'medium' | 'light' | 'veryLight';
  chroma: 'neutral' | 'muted' | 'saturated' | 'vivid';
  hue: 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'purple' | 'gray';
}

/**
 * Gets a structured description of a color based on its OKLCH values
 * Returns translation keys that can be used with the i18n system
 * 
 * @param color - OKLCH color string
 * @returns Object with lightness, chroma, and hue keys
 * 
 * @example
 * describeOKLCHColor('oklch(0.5 0.2 250)') 
 * // { lightness: 'medium', chroma: 'saturated', hue: 'blue' }
 */
export function describeOKLCHColor(color: string): ColorDescription | null {
  try {
    const match = color.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
    if (!match) return null;
    
    const [, l, c, h] = match;
    const lightness = parseFloat(l);
    const chroma = parseFloat(c);
    const hue = parseFloat(h);
    
    // Lightness description
    let lightnessKey: ColorDescription['lightness'];
    if (lightness < 0.3) lightnessKey = 'veryDark';
    else if (lightness < 0.5) lightnessKey = 'dark';
    else if (lightness < 0.7) lightnessKey = 'medium';
    else if (lightness < 0.9) lightnessKey = 'light';
    else lightnessKey = 'veryLight';
    
    // Chroma description
    let chromaKey: ColorDescription['chroma'];
    if (chroma < 0.05) chromaKey = 'neutral';
    else if (chroma < 0.15) chromaKey = 'muted';
    else if (chroma < 0.25) chromaKey = 'saturated';
    else chromaKey = 'vivid';
    
    // Hue description
    let hueKey: ColorDescription['hue'];
    if (chroma < 0.05) {
      hueKey = 'gray';
    } else {
      if (hue < 30) hueKey = 'red';
      else if (hue < 60) hueKey = 'orange';
      else if (hue < 90) hueKey = 'yellow';
      else if (hue < 150) hueKey = 'green';
      else if (hue < 210) hueKey = 'cyan';
      else if (hue < 270) hueKey = 'blue';
      else if (hue < 330) hueKey = 'purple';
      else hueKey = 'red';
    }
    
    return {
      lightness: lightnessKey,
      chroma: chromaKey,
      hue: hueKey
    };
  } catch {
    return null;
  }
}

