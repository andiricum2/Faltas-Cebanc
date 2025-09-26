"use client";
import React from "react";

export default function AutoUpdate() {
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ check }, { relaunch }] = await Promise.all([
          import("@tauri-apps/plugin-updater"),
          import("@tauri-apps/plugin-process"),
        ]);
        const update = await check();
        if (!cancelled && update) {
          await update.downloadAndInstall();
          await relaunch();
        }
      } catch (_) {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}


