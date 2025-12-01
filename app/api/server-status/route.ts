import { NextResponse } from "next/server";

const TARGET_URL = "https://faltas.cebanc.com";
const TIMEOUT_MS = 5000;

async function pingTarget() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(TARGET_URL, {
      method: "HEAD",
      cache: "no-store",
      redirect: "manual",
      credentials: "omit",
      signal: controller.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET() {
  const isOnline = await pingTarget();
  return NextResponse.json(
    { status: isOnline ? "online" : "offline" },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

