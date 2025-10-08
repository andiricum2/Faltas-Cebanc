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

export function absenceColorClass(code: string | null): string {
  const map: Record<string, string> = {
    F: "bg-red-100 text-red-900 border-red-300",
    J: "bg-emerald-100 text-emerald-900 border-emerald-300",
    C: "bg-teal-100 text-teal-900 border-teal-300",
    E: "bg-purple-100 text-purple-900 border-purple-300",
    R: "bg-amber-100 text-amber-900 border-amber-300",
    H: "bg-slate-200 text-slate-900 border-slate-300",
  };
  return code && map[code] ? map[code] : "";
}

export function moduleColorClass(mod: string | null): string {
  if (!mod) return "bg-white";
  const palette = [
    "bg-blue-200",
    "bg-green-200",
    "bg-yellow-200",
    "bg-pink-200",
    "bg-cyan-200",
    "bg-lime-200",
    "bg-indigo-200",
    "bg-orange-200",
    "bg-fuchsia-200",
    "bg-sky-200",
  ];
  let hash = 0;
  for (let i = 0; i < mod.length; i++) hash = (hash * 31 + mod.charCodeAt(i)) >>> 0;
  const idx = hash % palette.length;
  return palette[idx];
}

