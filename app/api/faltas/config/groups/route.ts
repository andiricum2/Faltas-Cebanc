export async function GET() {
  try {
    const rawUrl = `https://raw.githubusercontent.com/andiricum2/Faltas-Cebanc/main/grupos/index.json`;
    
    try {
      const rawRes = await fetch(rawUrl, { headers: { "User-Agent": "FaltasCebanc-App" } });
      if (rawRes.ok) {
        const data: any = await rawRes.json();
        const groups = Array.isArray(data)
          ? data.map((g) => String(g).replace(/\.json$/i, ""))
          : Array.isArray(data?.groups)
            ? data.groups.map((g: any) => String(g).replace(/\.json$/i, ""))
            : [];
        if (groups.length > 0) {
          return new Response(JSON.stringify({ ok: true, groups }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
      }
    } catch (_) {
      // ignore and return empty list below
    }
    // Fallback: return empty list
    return new Response(JSON.stringify({ ok: true, groups: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: true, groups: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
}
