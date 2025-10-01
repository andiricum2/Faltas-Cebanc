import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const dni = cookieStore.get("DNI")?.value;
  if (!dni) return new Response(JSON.stringify({ ok: false, errorMessage: "DNI not set" }), { status: 400 });
  
  try {
    const body = await req.json();
    const hoursPerModule = body.hoursPerModule;
    
    if (!hoursPerModule || typeof hoursPerModule !== "object") {
      return new Response(JSON.stringify({ ok: false, errorMessage: "Invalid hoursPerModule" }), { status: 400 });
    }
    
    const baseBase = process.env.APP_DATA_DIR || process.cwd();
    const baseDir = path.join(baseBase, ".data", dni);
    
    // Asegurar que el directorio existe
    await fs.mkdir(baseDir, { recursive: true });
    
    // Guardar configuración
    const filePath = path.join(baseDir, "hoursPerModule.json");
    await fs.writeFile(filePath, JSON.stringify(hoursPerModule, null, 2), "utf-8");
    
    return new Response(JSON.stringify({ ok: true }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, errorMessage: e.message }), { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const dni = cookieStore.get("DNI")?.value;
  if (!dni) return new Response(JSON.stringify({ ok: false, errorMessage: "DNI not set" }), { status: 400 });
  
  try {
    const baseBase = process.env.APP_DATA_DIR || process.cwd();
    const baseDir = path.join(baseBase, ".data", dni);
    const filePath = path.join(baseDir, "hoursPerModule.json");
    
    const data = await fs.readFile(filePath, "utf-8");
    const hoursPerModule = JSON.parse(data);
    
    return new Response(JSON.stringify({ ok: true, hoursPerModule }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, errorMessage: "Config not found" }), { status: 404 });
  }
}
