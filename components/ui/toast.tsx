"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

export type ToastKind = "info" | "success" | "warning" | "error";

export type Toast = {
  id: string;
  title?: string;
  message: string;
  kind?: ToastKind;
  timeoutMs?: number;
};

type ToastContextValue = {
  show: (t: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

function palette(kind: ToastKind | undefined) {
  switch (kind) {
    case "success":
      return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900" };
    case "warning":
      return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900" };
    case "error":
      return { bg: "bg-red-50", border: "border-red-200", text: "text-red-900" };
    case "info":
    default:
      return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900" };
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((t: Omit<Toast, "id">) => {
    const id = String(++idRef.current);
    const item: Toast = { id, kind: "info", timeoutMs: 3500, ...t };
    setToasts((prev) => [...prev, item]);
    if (item.timeoutMs && item.timeoutMs > 0) {
      window.setTimeout(() => remove(id), item.timeoutMs);
    }
  }, [remove]);

  const value = useMemo(() => ({ show }), [show]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setToasts([]);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-3 right-3 z-50 flex flex-col gap-2 w-[min(360px,90vw)]" role="status" aria-live="polite">
        {toasts.map((t) => {
          const p = palette(t.kind);
          return (
            <div key={t.id} className={`rounded-md border ${p.border} ${p.bg} ${p.text} shadow-sm px-3 py-2`}> 
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  {t.title ? <div className="font-semibold leading-5">{t.title}</div> : null}
                  <div className="text-sm leading-5 opacity-90">{t.message}</div>
                </div>
                <button className="p-1 rounded hover:bg-black/5" aria-label="Cerrar aviso" onClick={() => remove(t.id)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}


