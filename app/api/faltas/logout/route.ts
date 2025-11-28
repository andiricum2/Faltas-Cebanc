import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const isSecure = req.nextUrl.protocol === "https:";
  // Remove the session cookie by expiring it
  cookieStore.set({
    name: "PHPSESSID",
    value: "",
    path: "/",
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    expires: new Date(0),
  });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}


