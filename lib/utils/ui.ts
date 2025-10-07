export function percentColorClasses(percent: number): { gradient: string; text: string } {
  const gradient = percent < 7 ? 'from-emerald-500 to-teal-600' : percent < 14 ? 'from-amber-500 to-orange-600' : 'from-red-500 to-pink-600';
  const text = percent < 7 ? 'text-emerald-600' : percent < 14 ? 'text-amber-600' : 'text-red-600';
  return { gradient, text };
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

