import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const dni = cookieStore.get("DNI")?.value;
  if (!dni) return new Response(JSON.stringify({ ok: false, errorMessage: "DNI not set" }), { status: 400 });
  try {
    const baseBase = process.env.APP_DATA_DIR || process.cwd();
    const baseDir = path.join(baseBase, ".data", dni);
    const file = path.join(baseDir, "snapshot.json");
    const data = await fs.readFile(file, "utf-8");
    return new Response(data, { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, errorMessage: "Snapshot not found" }), { status: 404 });
  }
}


