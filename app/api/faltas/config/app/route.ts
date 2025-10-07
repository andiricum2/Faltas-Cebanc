import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

type AppConfig = {
  autoSyncMinutes?: number;
  selectedGroup?: string | null;
};

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const dni = cookieStore.get("DNI")?.value;
  if (!dni) return new Response(JSON.stringify({ ok: false, errorMessage: "DNI not set" }), { status: 400 });

  try {
    const baseBase = process.env.APP_DATA_DIR || process.cwd();
    const baseDir = path.join(baseBase, ".data", dni);
    const filePath = path.join(baseDir, "appConfig.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const config: AppConfig = JSON.parse(raw);
    return new Response(JSON.stringify({ ok: true, config }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ ok: true, config: {} }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const dni = cookieStore.get("DNI")?.value;
  if (!dni) return new Response(JSON.stringify({ ok: false, errorMessage: "DNI not set" }), { status: 400 });

  try {
    const body = await req.json();
    const config: AppConfig = body?.config || {};

    const next: AppConfig = {};
    if (typeof config.autoSyncMinutes === "number") next.autoSyncMinutes = config.autoSyncMinutes;
    // allow string or null for selectedGroup
    if (typeof config.selectedGroup === "string" || config.selectedGroup === null) next.selectedGroup = config.selectedGroup;

    const baseBase = process.env.APP_DATA_DIR || process.cwd();
    const baseDir = path.join(baseBase, ".data", dni);
    await fs.mkdir(baseDir, { recursive: true });
    const filePath = path.join(baseDir, "appConfig.json");
    await fs.writeFile(filePath, JSON.stringify(next, null, 2), "utf-8");
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, errorMessage: e?.message || "Failed to save" }), { status: 500 });
  }
}


