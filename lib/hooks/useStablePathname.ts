"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * usePathname puede devolver undefined en algunos entornos (p.ej. Tauri + Linux).
 * Este hook garantiza tener siempre un pathname estable, usando window.location como fallback.
 */
export function useStablePathname() {
  const nextPathname = usePathname();
  const [stablePath, setStablePath] = useState<string | null>(() => {
    if (nextPathname) return nextPathname;
    if (typeof window !== "undefined") return window.location.pathname;
    return null;
  });

  useEffect(() => {
    if (nextPathname) {
      setStablePath(nextPathname);
      return;
    }
    if (typeof window === "undefined") return;

    const updateFromWindow = () => {
      const current = window.location.pathname;
      setStablePath((prev) => (prev === current ? prev : current));
    };

    updateFromWindow();
    window.addEventListener("popstate", updateFromWindow);
    window.addEventListener("hashchange", updateFromWindow);

    // Fallback extra para navegaciones internas en entornos nativos.
    const intervalId = setInterval(updateFromWindow, 500);

    return () => {
      window.removeEventListener("popstate", updateFromWindow);
      window.removeEventListener("hashchange", updateFromWindow);
      clearInterval(intervalId);
    };
  }, [nextPathname]);

  return stablePath;
}


