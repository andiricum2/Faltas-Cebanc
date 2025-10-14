"use client";

import pkg from "@/package.json";

export type VersionPolicy = {
  minimumVersion?: string; // If set, any version < minimum is blocked
  deprecatedVersions?: string[]; // Explicit versions blocked
  message?: string; // Optional message to display
  learnMoreUrl?: string; // Optional URL for more info/downloads
};

function normalizeVersion(input: string | undefined | null): string {
  if (!input) return "0.0.0";
  return input.trim().replace(/^v/i, "");
}

export function compareSemver(a: string, b: string): number {
  const pa = normalizeVersion(a).split(".").map((n) => parseInt(n || "0", 10));
  const pb = normalizeVersion(b).split(".").map((n) => parseInt(n || "0", 10));
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}

export async function fetchVersionPolicy(): Promise<VersionPolicy | null> {
  try {
    const res = await fetch("/api/version-policy", { cache: "no-store" as any });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.policy as VersionPolicy) ?? null;
  } catch {
    return null;
  }
}

export function shouldBlockByPolicy(policy: VersionPolicy | null | undefined): {
  blocked: boolean;
  reason: string;
} {
  const current = normalizeVersion(pkg.version as string);
  if (!policy) return { blocked: false, reason: "no-policy" };

  const min = policy.minimumVersion && normalizeVersion(policy.minimumVersion);
  if (min && compareSemver(current, min) < 0) {
    return { blocked: true, reason: `version-minima:${min}` };
  }

  const list = Array.isArray(policy.deprecatedVersions)
    ? policy.deprecatedVersions.map(normalizeVersion)
    : [];
  if (list.includes(current)) {
    return { blocked: true, reason: "version-bloqueada" };
  }

  return { blocked: false, reason: "ok" };
}


