"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type AppToastDetail = { message: string; title?: string; kind?: "info" | "success" | "warning" | "error" };

export default function GlobalErrorToasts() {
  useEffect(() => {
    function onToast(ev: Event) {
      const ce = ev as CustomEvent<AppToastDetail>;
      const d = ce.detail || { message: "" };
      const fn = d.kind === "error" ? toast.error : d.kind === "success" ? toast.success : d.kind === "warning" ? toast.warning : toast.info;
      fn(d.title ? `${d.title}: ${d.message}` : d.message);
    }
    window.addEventListener("app:toast", onToast as EventListener);
    return () => window.removeEventListener("app:toast", onToast as EventListener);
  }, []);
  return null;
}


