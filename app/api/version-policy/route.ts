import { NextResponse } from "next/server";

/**
 * Fetches remote version policy from GitHub and returns it to the client.
 * The policy defines deprecated (blocked) versions and optional minimum version.
 */
export async function GET() {
  const sources: string[] = [
    // Raw GitHub (preferred for stable JSON fetch without CORS HTML)
    "https://raw.githubusercontent.com/andiricum2/Faltas-Cebanc/main/version-policy.json",
    // Fallback to repo file via jsdelivr
    "https://cdn.jsdelivr.net/gh/andiricum2/Faltas-Cebanc@main/version-policy.json",
  ];

  for (const url of sources) {
    try {
      const res = await fetch(url, { cache: "no-store" as any });
      if (!res.ok) continue;
      const policy = await res.json();
      return NextResponse.json({ policy }, { status: 200 });
    } catch (_) {
      // continue
    }
  }

  return NextResponse.json({ policy: null }, { status: 200 });
}


