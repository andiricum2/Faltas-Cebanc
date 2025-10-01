"use client";

import React from "react";
import { toast } from "sonner";
import pkg from "@/package.json";

type ReleaseInfo = {
  version: string;
  url: string;
};

function parseVersion(input: string | null | undefined): string {
  if (!input) return "0.0.0";
  return input.trim().replace(/^v/i, "");
}

function compareSemver(a: string, b: string): number {
  const pa = parseVersion(a).split(".").map((n) => parseInt(n || "0", 10));
  const pb = parseVersion(b).split(".").map((n) => parseInt(n || "0", 10));
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}

async function fetchLatestRelease(): Promise<ReleaseInfo | null> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/andiricum2/Faltas-Cebanc/releases/latest",
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const tag = (data?.tag_name as string) || (data?.name as string) || "";
    const url = (data?.html_url as string) ||
      "https://github.com/andiricum2/Faltas-Cebanc/releases";
    const version = parseVersion(tag);
    if (!version) return null;
    return { version, url };
  } catch {
    return null;
  }
}

export default function AutoUpdate() {
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const latest = await fetchLatestRelease();
      if (cancelled || !latest) return;

      const current = parseVersion(pkg.version as string);
      if (compareSemver(latest.version, current) > 0) {
        const detail = { version: latest.version, url: latest.url } as ReleaseInfo;
        window.dispatchEvent(
          new CustomEvent<ReleaseInfo>("faltas:update-available", { detail })
        );
        toast.info(
          `Nueva versión disponible (${latest.version}). Descárgala e instálala.`,
          {
            action: {
              label: "Descargar…",
              onClick: () => {
                window.open(latest.url, "_blank", "noopener,noreferrer");
              },
            },
          }
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}


