import { NextRequest } from "next/server";
import { loadProcessedSnapshot } from "@/lib/server/snapshot";
import { getCookieDni } from "@/lib/server/storage";

export async function GET(req: NextRequest) {
  const dni = await getCookieDni();
  if (!dni) return new Response(JSON.stringify({ ok: false, errorMessage: "DNI not set" }), { status: 400 });
  
  try {
    const finalSnapshot = await loadProcessedSnapshot(dni);
    return new Response(JSON.stringify(finalSnapshot), { 
      status: 200, 
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } 
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, errorMessage: "Snapshot not found" }), { status: 404 });
  }
}
