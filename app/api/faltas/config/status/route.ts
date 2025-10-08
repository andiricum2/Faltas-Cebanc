import type { NextRequest } from "next/server";
import { getCookieDni, getUserDataDir, readJsonFileOptional } from "@/lib/server/storage";

export async function GET(req: NextRequest) {
  const dni = await getCookieDni();
  if (!dni) return new Response(JSON.stringify({ error: "DNI not set" }), { status: 400 });

  try {
    const baseDir = getUserDataDir(dni);
    const legend = (await readJsonFileOptional<{ modules: Record<string, string> }>(`${baseDir}/legend.json`)) || { modules: {} };
    const isReto = (code: string, label: string | undefined) => /(?<![A-Za-z0-9])\d[A-Za-z]{2}\d(?![A-Za-z0-9])/i.test(`${code} ${label || ""}`);
    const retos = Object.keys(legend.modules || {}).filter((k) => isReto(k, legend.modules[k]));

    // Load hoursPerModule
    const hoursPerModule = (await readJsonFileOptional<Record<string, number>>(`${baseDir}/hoursPerModule.json`)) || {};

    // Load retoTargets
    const retoTargets = (await readJsonFileOptional<Record<string, Record<string, boolean>>>(`${baseDir}/retoTargets.json`)) || {};

    const reasons: string[] = [];
    // Horario no configurado si vacío o todos 0
    const hoursKeys = Object.keys(hoursPerModule || {});
    const hoursAllZero = hoursKeys.length > 0 && hoursKeys.every((k) => !Number(hoursPerModule[k]));
    if (hoursKeys.length === 0 || hoursAllZero) {
      reasons.push("Horario sin configurar");
    }

    // Retos sin módulos seleccionados
    if (retos.length > 0) {
      for (const reto of retos) {
        const sel = retoTargets[reto] || {};
        const hasAny = Object.values(sel).some(Boolean);
        if (!hasAny) {
          reasons.push(`Reto sin módulos: ${reto}`);
        }
      }
    }

    const needsConfig = reasons.length > 0;
    return new Response(JSON.stringify({ needsConfig, reasons }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "Config status error" }), { status: 500 });
  }
}


