import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { loadProcessedSnapshot } from "@/lib/server/snapshot";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const dni = cookieStore.get("DNI")?.value;
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
