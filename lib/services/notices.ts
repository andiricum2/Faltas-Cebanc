"use client";

export type NoticeAction = {
  label: string;
  url: string;
};

export type Notice = {
  id: string;
  title: string;
  description: string;
  icon?: string;
  severity?: "info" | "warning" | "error" | "success";
  startDate?: string;
  endDate?: string;
  action?: NoticeAction;
};

export async function fetchNotices(): Promise<Notice[]> {
  try {
    const res = await fetch("/api/notices", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.notices) ? (data.notices as Notice[]) : [];
  } catch {
    return [];
  }
}


