import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { FaltasClient } from "@/lib/http/faltasClient";
import { logger } from "@/lib/logging/appLogger";
import { isLoginBody, LoginBody, LoginResult } from "@/lib/types/faltas";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    if (!isLoginBody(body)) {
      return new Response(JSON.stringify({ ok: false, errorMessage: "Bad request" }), { status: 400 });
    }

    const client = new FaltasClient();
    const result: LoginResult = await client.login(body as LoginBody);
    if (!result.ok) {
      const status = result.errorCode === 1 || result.errorCode === 2 || result.errorCode === 3 ? 401 : 403;
      return new Response(JSON.stringify(result), { status });
    }

    // Set cookie for PHPSESSID if present
    if (result.sessionId) {
      const cookieStore = await cookies();
      cookieStore.set({ name: "PHPSESSID", value: result.sessionId, httpOnly: true, secure: true, sameSite: "lax", path: "/" });
    }

    // Do not trigger sync here; the client will call sync after navigation

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error: any) {
    logger.error(`Unhandled error in login`, 'HTTP', { error: String(error?.message || error) });
    return new Response(JSON.stringify({ ok: false, errorMessage: "Internal error" }), { status: 500 });
  }
}


