import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { ensureDir, getUserDataDir, requireCookieDni } from "@/lib/server/storage";

type IncomingLog = {
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
};

export async function POST(req: NextRequest) {
  try {
    const dni = await requireCookieDni();
    if (!dni) return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as { logs?: IncomingLog[] } | null;
    const logs = Array.isArray(body?.logs) ? body!.logs! : [];
    if (logs.length === 0) return NextResponse.json({ ok: true });

    const dir = path.join(getUserDataDir(dni), "logs");
    await ensureDir(dir);

    const day = new Date().toISOString().slice(0, 10);
    const file = path.join(dir, `${day}.ndjson`);

    const lines = logs
      .map((l) =>
        JSON.stringify({
          ...l,
          // normalize timestamp
          timestamp: new Date(l.timestamp || Date.now()).toISOString(),
        })
      )
      .join("\n");

    await fs.appendFile(file, lines + "\n", "utf-8");

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}


