import { NextRequest, NextResponse } from "next/server";
import { loadSnapshot, saveSnapshot, saveTheme } from "@/lib/server/storage";
import { ThemeConfig } from "@/lib/types/theme";

export const dynamic = "force-dynamic";

/**
 * GET /api/faltas/config/theme
 * Load theme configuration
 */
export async function GET() {
  try {
    const snapshot = await loadSnapshot();
    return NextResponse.json({ theme: snapshot.theme || { mode: "system", preset: "default" } });
  } catch (error) {
    console.error("Failed to load theme config:", error);
    return NextResponse.json({ theme: { mode: "system", preset: "default" } }, { status: 200 });
  }
}

/**
 * POST /api/faltas/config/theme
 * Save theme configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { theme } = body as { theme: ThemeConfig };

    if (!theme) {
      return NextResponse.json({ error: "Theme configuration required" }, { status: 400 });
    }

    // Save theme separately and update snapshot
    await saveTheme(theme);
    
    const snapshot = await loadSnapshot();
    snapshot.theme = theme;
    await saveSnapshot(snapshot);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to save theme config:", error);
    return NextResponse.json({ error: "Failed to save theme configuration" }, { status: 500 });
  }
}

