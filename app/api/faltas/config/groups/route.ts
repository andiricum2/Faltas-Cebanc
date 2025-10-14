export async function GET() {
  try {
    const repo = "andiricum2/Faltas-Cebanc"; // owner/repo
    const branch = "main";
    const dir = "grupos";

    // Use GitHub REST API to list directory contents
    const apiUrl = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(dir)}?ref=${encodeURIComponent(branch)}`;
    const ghRes = await fetch(apiUrl, {
      headers: {
        "Accept": "application/vnd.github+json",
        "User-Agent": "FaltasCebanc-App"
      }
    });

    if (!ghRes.ok) {
      return new Response(JSON.stringify({ ok: true, groups: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const items: Array<{ name: string; type: string }>|any = await ghRes.json();
    const groups = Array.isArray(items)
      ? items
          .filter((e) => e?.type === "file" && typeof e?.name === "string" && e.name.toLowerCase().endsWith(".json"))
          .map((e) => e.name.replace(/\.json$/i, ""))
      : [];

    return new Response(JSON.stringify({ ok: true, groups }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: true, groups: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
}


