"use client";

import { request } from "@/lib/http/client";
import { ThemeConfig } from "@/lib/types/theme";

const LS_KEY = "app.theme";

/**
 * Theme repository - manages loading and saving theme configuration
 * Server-first with localStorage fallback
 */

export async function loadThemeConfig(): Promise<ThemeConfig> {
  // Try server first
  try {
    const data = await request<{ theme?: ThemeConfig }>("/api/faltas/config/theme");
    if (data?.theme) {
      return data.theme;
    }
  } catch {
    // Server failed, try localStorage
  }

  // Try localStorage
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // localStorage failed
  }

  // Return default
  return {
    mode: "system",
    preset: "default",
  };
}

export async function saveThemeConfig(theme: ThemeConfig): Promise<void> {
  // Save to localStorage immediately
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(theme));
  } catch {
    // Ignore localStorage errors
  }

  // Try to save to server
  try {
    await request<{ ok: true }>("/api/faltas/config/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme }),
    });
  } catch {
    // Ignore server errors
  }
}

