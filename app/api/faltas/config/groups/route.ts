import fs from "node:fs/promises";
import path from "node:path";

export async function GET() {
  try {
    const baseBase = process.env.APP_DATA_DIR || process.cwd();
    // grupos lives at project root (process.cwd)/grupos
    const groupsDir = path.join(baseBase, "grupos");
    const entries = await fs.readdir(groupsDir, { withFileTypes: true });
    const groups = entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".json"))
      .map((e) => e.name.replace(/\.json$/i, ""));
    return new Response(JSON.stringify({ ok: true, groups }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: true, groups: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
}


