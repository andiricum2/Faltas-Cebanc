import { NextRequest } from "next/server";
import { getCookieDni, getUserDataDir, ensureDir, writeJsonFile, readJsonFile } from "@/lib/server/storage";

export async function POST(req: NextRequest) {
  const dni = await getCookieDni();
  if (!dni) return new Response(JSON.stringify({ ok: false, errorMessage: "DNI not set" }), { status: 400 });
  
  try {
    const body = await req.json();
    const weekSchedule = body.weekSchedule;
    
    if (!weekSchedule || !Array.isArray(weekSchedule)) {
      return new Response(JSON.stringify({ ok: false, errorMessage: "Invalid weekSchedule" }), { status: 400 });
    }
    
    const baseDir = getUserDataDir(dni);
    await ensureDir(baseDir);
    const filePath = `${baseDir}/weekSchedule.json`;
    await writeJsonFile(filePath, weekSchedule);
    
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
    const filePath = `${baseDir}/weekSchedule.json`;
    const weekSchedule = await readJsonFile<(string | null)[][]>(filePath);
    
    return new Response(JSON.stringify({ ok: true, weekSchedule }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, errorMessage: "Config not found" }), { status: 404 });
  }
}

