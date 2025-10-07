import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { name: string } }) {
  try {
    const baseBase = process.env.APP_DATA_DIR || process.cwd();
    const groupsDir = path.join(baseBase, "grupos");
    const filePath = path.join(groupsDir, `${params.name}.json`);
    const raw = await fs.readFile(filePath, "utf-8");
    const json = JSON.parse(raw);
    return new Response(JSON.stringify({ ok: true, group: json }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, errorMessage: "Group not found" }), { status: 404 });
  }
}


