import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  // Remove the session cookie by expiring it
  cookieStore.set({
    name: "PHPSESSID",
    value: "",
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    expires: new Date(0),
  });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}


