import { NextResponse } from "next/server";

type NoticeAction = {
  label: string;
  url: string;
};

type Notice = {
  id: string;
  title: string;
  description: string;
  icon?: string;
  severity?: "info" | "warning" | "error" | "success";
  startDate?: string; // ISO date
  endDate?: string;   // ISO date
  action?: NoticeAction;
};

function isActive(notice: Notice, now: Date): boolean {
  const startOk = !notice.startDate || new Date(notice.startDate) <= now;
  const endOk = !notice.endDate || now <= new Date(notice.endDate);
  return startOk && endOk;
}

function getNoticesUrl(): string {
  // Allow override via env. Default to the repo raw URL
  const envUrl = process.env.NOTICES_URL;
  if (envUrl && /^https?:\/\//i.test(envUrl)) return envUrl;
  // Default: raw URL to notices.json in repo root
  return "https://raw.githubusercontent.com/andiricum2/Faltas-Cebanc/main/notices.json";
}

export async function GET() {
  const url = getNoticesUrl();
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ notices: [], error: `Upstream ${res.status}` }, { status: 200 });
    }
    const data = await res.json();
    const list: Notice[] = Array.isArray(data) ? data : Array.isArray(data?.notices) ? data.notices : [];
    const now = new Date();
    const safe = list
      .filter((n) => n && typeof n === "object")
      .map((n) => ({
        id: String((n as Notice).id || `${(n as Notice).title}-${(n as Notice).startDate || ""}`),
        title: String((n as Notice).title || ""),
        description: String((n as Notice).description || ""),
        icon: (n as Notice).icon,
        severity: (n as Notice).severity || "warning",
        startDate: (n as Notice).startDate,
        endDate: (n as Notice).endDate,
        action: (n as Notice).action,
      }))
      .filter((n) => n.title && n.description)
      .filter((n) => isActive(n, now));

    return NextResponse.json({ notices: safe }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ notices: [], error: "Failed to fetch notices" }, { status: 200 });
  }
}


