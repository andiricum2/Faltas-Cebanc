import { NextRequest, NextResponse } from "next/server";
import type { StudentSnapshot } from "@/lib/types/faltas";
import { loadProcessedSnapshot } from "@/lib/server/snapshot";
import { sumarFaltas, calcPercent } from "@/lib/utils/calculations";
import { computePlanProjection, type CalculationPlanEntry, type CalculatePlanResponse } from "@/lib/server/calculateUtils";
import { logApiError, logApiSuccess } from "@/lib/logging/appLogger";

// Removed GET endpoint; this route now only supports POST for planning

// Types moved to lib/server/calculateUtils

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dni: string | undefined = body?.dni;
    const entries: CalculationPlanEntry[] = Array.isArray(body?.entries) ? body.entries : [];

    if (!dni) {
      return NextResponse.json({ error: "DNI requerido" }, { status: 400 });
    }

    const snapshot: StudentSnapshot = await loadProcessedSnapshot(dni);
    const response = computePlanProjection(snapshot, entries);
    logApiSuccess('/api/faltas/calculate', { dni, entriesCount: entries.length });
    return NextResponse.json(response);
  } catch (error) {
    logApiError('/api/faltas/calculate', error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
