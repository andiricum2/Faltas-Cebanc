import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const session = cookieStore.get("PHPSESSID")?.value;
  if (session && session.length > 0) {
    redirect("/dashboard");
  }
  redirect("/login");
}
