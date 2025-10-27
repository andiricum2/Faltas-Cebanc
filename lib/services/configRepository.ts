"use client";

import { request } from "@/lib/http/client";

const LS_KEYS = {
  retoTargets: "calcular.retoTargets",
  hoursPerModule: "config.hoursPerModule",
  retoModuleHours: "config.retoModuleHours",
  weekSchedule: "config.weekSchedule",
} as const;

// Server-first with localStorage fallback repository for config

export async function loadRetoTargets(): Promise<Record<string, Record<string, boolean>>> {
  try {
    const data = await request<{ retoTargets?: Record<string, Record<string, boolean>> }>(
      "/api/faltas/config/retoTargets"
    );
    return data?.retoTargets || {};
  } catch {}
  try {
    const raw = localStorage.getItem(LS_KEYS.retoTargets);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function loadHoursPerModule(): Promise<Record<string, number>> {
  try {
    const data = await request<{ hoursPerModule?: Record<string, number> }>(
      "/api/faltas/config/hoursPerModule"
    );
    return data?.hoursPerModule || {};
  } catch {}
  try {
    const raw = localStorage.getItem(LS_KEYS.hoursPerModule);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveRetoTargets(retoTargets: Record<string, Record<string, boolean>>): Promise<void> {
  localStorage.setItem(LS_KEYS.retoTargets, JSON.stringify(retoTargets));
  try {
    await request<{ ok: true }>("/api/faltas/config/retoTargets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ retoTargets })
    });
  } catch {}
}

export async function saveHoursPerModule(hoursPerModule: Record<string, number>): Promise<void> {
  localStorage.setItem(LS_KEYS.hoursPerModule, JSON.stringify(hoursPerModule));
  try {
    await request<{ ok: true }>("/api/faltas/config/hoursPerModule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hoursPerModule })
    });
  } catch {}
}

export async function loadRetoModuleHours(): Promise<Record<string, Record<string, number>>> {
  try {
    const data = await request<{ retoModuleHours?: Record<string, Record<string, number>> }>(
      "/api/faltas/config/retoModuleHours"
    );
    return data?.retoModuleHours || {};
  } catch {}
  try {
    const raw = localStorage.getItem(LS_KEYS.retoModuleHours);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveRetoModuleHours(retoModuleHours: Record<string, Record<string, number>>): Promise<void> {
  localStorage.setItem(LS_KEYS.retoModuleHours, JSON.stringify(retoModuleHours));
  try {
    await request<{ ok: true }>("/api/faltas/config/retoModuleHours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ retoModuleHours })
    });
  } catch {}
}

export async function loadWeekSchedule(): Promise<(string | null)[][]> {
  try {
    const data = await request<{ weekSchedule?: (string | null)[][] }>(
      "/api/faltas/config/weekSchedule"
    );
    return data?.weekSchedule || createEmptySchedule();
  } catch {}
  try {
    const raw = localStorage.getItem(LS_KEYS.weekSchedule);
    return raw ? JSON.parse(raw) : createEmptySchedule();
  } catch {
    return createEmptySchedule();
  }
}

export async function saveWeekSchedule(weekSchedule: (string | null)[][]): Promise<void> {
  localStorage.setItem(LS_KEYS.weekSchedule, JSON.stringify(weekSchedule));
  try {
    await request<{ ok: true }>("/api/faltas/config/weekSchedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekSchedule })
    });
  } catch {}
}

function createEmptySchedule(): (string | null)[][] {
  // 6 hours x 5 days
  return Array.from({ length: 6 }, () => Array.from({ length: 5 }, () => null));
}


