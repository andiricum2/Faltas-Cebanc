export function percentColorClasses(percent: number): { gradient: string; text: string } {
  const gradient = percent < 7 ? 'from-emerald-500 to-teal-600' : percent < 14 ? 'from-amber-500 to-orange-600' : 'from-red-500 to-pink-600';
  const text = percent < 7 ? 'text-emerald-600' : percent < 14 ? 'text-amber-600' : 'text-red-600';
  return { gradient, text };
}

/**
 * Obtiene los colores hexadecimales para porcentajes
 * Útil para gráficos SVG y elementos que necesitan colores exactos
 */
export function getPercentageColors(percentage: number): { startColor: string; endColor: string } {
  if (percentage < 7) {
    return { startColor: "#10B981", endColor: "#0D9488" }; // emerald-500 -> teal-600
  } else if (percentage < 14) {
    return { startColor: "#F59E0B", endColor: "#EA580C" }; // amber-500 -> orange-600
  } else {
    return { startColor: "#EF4444", endColor: "#DB2777" }; // red-500 -> pink-600
  }
}

/**
 * Obtiene la clase CSS completa para gradientes de porcentaje
 * Incluye tanto el gradiente como las clases de texto
 */
export function getPercentageGradientClass(percentage: number): string {
  const { gradient } = percentColorClasses(percentage);
  return `bg-gradient-to-r ${gradient}`;
}

/**
 * Gets inline styles for absence type backgrounds using theme colors
 * @param code - Absence code (F, J, C, E, R, H)
 * @returns Inline style object
 */
export function absenceColorStyle(code: string | null): React.CSSProperties {
  if (!code) return {};
  
  const colorVar = `--absence-${code.toLowerCase()}`;
  const textVar = `--absence-${code.toLowerCase()}-text`;
  
  return {
    backgroundColor: `var(${colorVar})`,
    color: `var(${textVar})`,
    borderColor: `var(${colorVar})`,
  };
}

/**
 * Legacy function for backward compatibility
 * Returns empty string as we now use inline styles
 * @deprecated Use absenceColorStyle instead
 */
export function absenceColorClass(code: string | null): string {
  return "";
}

/**
 * Gets inline style for module color using theme colors
 * @param mod - Module name
 * @returns Inline style object
 */
export function moduleColorStyle(mod: string | null): React.CSSProperties {
  if (!mod) return { backgroundColor: 'var(--background)' };
  
  // Hash module name to consistently select from 10 module colors
  let hash = 0;
  for (let i = 0; i < mod.length; i++) {
    hash = (hash * 31 + mod.charCodeAt(i)) >>> 0;
  }
  const idx = (hash % 10) + 1; // 1-10
  
  return {
    backgroundColor: `var(--module${idx})`,
  };
}

/**
 * Legacy function for backward compatibility
 * Returns empty string as we now use inline styles
 * @deprecated Use moduleColorStyle instead
 */
export function moduleColorClass(mod: string | null): string {
  return "";
}

