"use client";
import type { Role } from "@/lib/types/faltas";

export type StoredCreds = { role: Role; username: string; password: string };

function obfuscate(text: string): string {
  const key = 0x5a;
  const bytes = Array.from(new TextEncoder().encode(text)).map((b) => b ^ key);
  return btoa(String.fromCharCode(...bytes));
}

function deobfuscate(data: string): string {
  const key = 0x5a;
  const bytes = atob(data)
    .split("")
    .map((c) => c.charCodeAt(0) ^ key);
  return new TextDecoder().decode(new Uint8Array(bytes));
}

const WEB_KEY = "faltas.rememberedCreds";

export async function saveRememberedCredentials(creds: StoredCreds | null): Promise<void> {
  if (typeof window === "undefined") return;
  if (creds === null) {
    try {
      localStorage.removeItem(WEB_KEY);
    } catch {}
    return;
  }

  const toStore = obfuscate(JSON.stringify(creds));
  try {
    localStorage.setItem(WEB_KEY, toStore);
  } catch {}
}

export async function loadRememberedCredentials(): Promise<StoredCreds | null> {
  if (typeof window === "undefined") return null;
  let encoded: string | null = null;

  try {
    encoded = localStorage.getItem(WEB_KEY);
  } catch {
    encoded = null;
  }

  if (!encoded) return null;
  try {
    const raw = deobfuscate(encoded);
    const parsed = JSON.parse(raw) as StoredCreds;
    if (
      parsed &&
      (parsed.role === "A" || parsed.role === "P" || parsed.role === "D" || parsed.role === "E") &&
      typeof parsed.username === "string" &&
      typeof parsed.password === "string"
    ) {
      return parsed;
    }
  } catch {}
  return null;
}


