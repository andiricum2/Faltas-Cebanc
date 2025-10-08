import { NextRequest } from "next/server";
import { getCookieDni, getUserDataDir, readJsonFileOptional, ensureDir, writeJsonFile } from "@/lib/server/storage";

type AppConfig = {
  autoSyncMinutes?: number;
  selectedGroup?: string | null;
};

export async function GET(req: NextRequest) {
  const dni = await getCookieDni();
  if (!dni) return new Response(JSON.stringify({ ok: false, errorMessage: "DNI not set" }), { status: 400 });

  const baseDir = getUserDataDir(dni);
  const filePath = `${baseDir}/appConfig.json`;
  const config = (await readJsonFileOptional<AppConfig>(filePath)) || {};
  return new Response(JSON.stringify({ ok: true, config }), { status: 200, headers: { "Content-Type": "application/json" } });
}

export async function POST(req: NextRequest) {
  const dni = await getCookieDni();
  if (!dni) return new Response(JSON.stringify({ ok: false, errorMessage: "DNI not set" }), { status: 400 });

  try {
    const body = await req.json();
    const config: AppConfig = body?.config || {};

    const next: AppConfig = {};
    if (typeof config.autoSyncMinutes === "number") next.autoSyncMinutes = config.autoSyncMinutes;
    if (typeof config.selectedGroup === "string" || config.selectedGroup === null) next.selectedGroup = config.selectedGroup;

    const baseDir = getUserDataDir(dni);
    await ensureDir(baseDir);
    const filePath = `${baseDir}/appConfig.json`;
    await writeJsonFile(filePath, next);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, errorMessage: e?.message || "Failed to save" }), { status: 500 });
  }
}
