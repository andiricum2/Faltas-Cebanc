import { NextRequest } from "next/server";
import { getCookieDni, getUserDataDir, ensureDir, writeJsonFile, readJsonFile } from "@/lib/server/storage";

export async function POST(req: NextRequest) {
  const dni = await getCookieDni();
  if (!dni) return new Response(JSON.stringify({ ok: false, errorMessage: "DNI not set" }), { status: 400 });
  
  try {
    const body = await req.json();
    const retoModuleHours = body.retoModuleHours;
    
    if (!retoModuleHours || typeof retoModuleHours !== "object") {
      return new Response(JSON.stringify({ ok: false, errorMessage: "Invalid retoModuleHours" }), { status: 400 });
    }
    
    const baseDir = getUserDataDir(dni);
    await ensureDir(baseDir);
    const filePath = `${baseDir}/retoModuleHours.json`;
    await writeJsonFile(filePath, retoModuleHours);
    
    return new Response(JSON.stringify({ ok: true }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, errorMessage: e.message }), { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const dni = await getCookieDni();
  if (!dni) return new Response(JSON.stringify({ ok: false, errorMessage: "DNI not set" }), { status: 400 });
  
  try {
    const baseDir = getUserDataDir(dni);
    const filePath = `${baseDir}/retoModuleHours.json`;
    const retoModuleHours = await readJsonFile(filePath);
    
    return new Response(JSON.stringify({ retoModuleHours }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ retoModuleHours: {} }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}
