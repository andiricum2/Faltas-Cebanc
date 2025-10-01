import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const dni = cookieStore.get("DNI")?.value;
  if (!dni) return new Response(JSON.stringify({ error: "DNI not set" }), { status: 400 });

  try {
    const baseBase = process.env.APP_DATA_DIR || process.cwd();
    const baseDir = path.join(baseBase, ".data", dni);

    // Load legend to detect retos present
    const legendRaw = await fs.readFile(path.join(baseDir, "legend.json"), "utf-8");
    const legend = JSON.parse(legendRaw) as { modules: Record<string, string> };
    const isReto = (code: string, label: string | undefined) => /(?<![A-Za-z0-9])\d[A-Za-z]{2}\d(?![A-Za-z0-9])/i.test(`${code} ${label || ""}`);
    const retos = Object.keys(legend.modules || {}).filter((k) => isReto(k, legend.modules[k]));

    // Load hoursPerModule
    let hoursPerModule: Record<string, number> = {};
    try {
      const hRaw = await fs.readFile(path.join(baseDir, "hoursPerModule.json"), "utf-8");
      hoursPerModule = JSON.parse(hRaw);
    } catch {}

    // Load retoTargets
    let retoTargets: Record<string, Record<string, boolean>> = {};
    try {
      const rRaw = await fs.readFile(path.join(baseDir, "retoTargets.json"), "utf-8");
      retoTargets = JSON.parse(rRaw);
    } catch {}

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


