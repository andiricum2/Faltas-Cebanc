"use client";

import { request } from "@/lib/http/client";

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
    const data = await request<{ notices?: Notice[] }>("/api/notices", { cache: "no-store" as any });
    return Array.isArray(data?.notices) ? data.notices! : [];
  } catch {
    return [];
  }
}


