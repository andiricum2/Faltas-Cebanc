import { NextRequest, NextResponse } from "next/server";
import { logApiError, logApiSuccess } from "@/lib/logging/appLogger";
import { loadHoursPerModule, saveHoursPerModule, loadRetoTargets, saveRetoTargets } from "@/lib/services/configService";
import { getAppConfig, saveAppConfig } from "@/lib/services/apiClient";

// Endpoint unificado para configuración
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    
    let data;
    switch (type) {
      case 'app':
        data = await getAppConfig();
        break;
      case 'hours':
        data = await loadHoursPerModule();
        break;
      case 'retos':
        data = await loadRetoTargets();
        break;
      default:
        return NextResponse.json({ error: "Tipo de configuración no válido" }, { status: 400 });
    }
    
    logApiSuccess('/api/faltas/config', { type });
    return NextResponse.json(data);
  } catch (error) {
    logApiError('/api/faltas/config', error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const body = await req.json();
    
    switch (type) {
      case 'app':
        await saveAppConfig(body);
        break;
      case 'hours':
        await saveHoursPerModule(body);
        break;
      case 'retos':
        await saveRetoTargets(body);
        break;
      default:
        return NextResponse.json({ error: "Tipo de configuración no válido" }, { status: 400 });
    }
    
    logApiSuccess('/api/faltas/config', { type, action: 'save' });
    return NextResponse.json({ success: true });
  } catch (error) {
    logApiError('/api/faltas/config', error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
