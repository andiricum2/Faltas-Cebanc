"use client";

import React from "react";
import { Notice, fetchNotices } from "@/lib/services/notices";
import { Button } from "@/components/ui/button";
import { AlertCircle, Info, CheckCircle, XCircle, ExternalLink, X } from "lucide-react";
import { openExternalUrl } from "@/lib/utils/externalLinks";

function IconFor({ icon, severity }: { icon?: string; severity?: string }) {
  const className = "h-4.5 w-4.5";
  if (icon === "info") return <Info className={className} />;
  if (icon === "success") return <CheckCircle className={className} />;
  if (icon === "error") return <XCircle className={className} />;
  if (icon === "warning") return <AlertCircle className={className} />;
  // Fallback by severity
  if (severity === "info") return <Info className={className} />;
  if (severity === "success") return <CheckCircle className={className} />;
  if (severity === "error") return <XCircle className={className} />;
  return <AlertCircle className={className} />;
}

function palette(severity?: string): { bg: string; text: string; border: string; accent: string } {
  switch (severity) {
    case "info":
      return { bg: "bg-blue-50", text: "text-blue-900", border: "border-blue-200", accent: "bg-blue-400" };
    case "success":
      return { bg: "bg-emerald-50", text: "text-emerald-900", border: "border-emerald-200", accent: "bg-emerald-400" };
    case "error":
      return { bg: "bg-red-50", text: "text-red-900", border: "border-red-200", accent: "bg-red-400" };
    case "warning":
    default:
      return { bg: "bg-amber-50", text: "text-amber-900", border: "border-amber-200", accent: "bg-amber-400" };
  }
}

export default function NoticeBanner() {
  const [notices, setNotices] = React.useState<Notice[]>([]);
  const [dismissed, setDismissed] = React.useState<Record<string, boolean>>({});

  // Load dismissal state from localStorage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("faltas:dismissed-notices");
      if (raw) setDismissed(JSON.parse(raw));
    } catch {}
  }, []);

  React.useEffect(() => {
    (async () => {
      const data = await fetchNotices();
      setNotices(data);
    })();
  }, []);

  const onDismiss = (id: string) => {
    setDismissed((prev) => {
      const next = { ...prev, [id]: true };
      try { localStorage.setItem("faltas:dismissed-notices", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const visible = notices.filter((n) => !dismissed[n.id]);
  if (visible.length === 0) return null;

  return (
    <div className="space-y-3 mb-3" aria-live="polite" role="status">
      {visible.map((n) => {
        const p = palette(n.severity);
        return (
          <div
            key={n.id}
            className={`rounded-lg ${p.bg} ${p.text} border ${p.border} px-3 py-2.5 text-sm shadow-sm transition-colors`}
          >
            <div className="flex items-center gap-3">
              <div className={`h-7 w-1.5 rounded-full ${p.accent}`} />
              <div><IconFor icon={n.icon} severity={n.severity}/></div>
              <div className="flex-1">
                <div className="text-base font-semibold leading-6">{n.title}</div>
                <div className="text-sm leading-6 opacity-90">{n.description}</div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {n.action?.url && n.action?.label ? (
                  <Button size="sm" onClick={() => openExternalUrl(n.action!.url)} className="shrink-0 h-8 px-3">
                    {n.action!.label}
                    <ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </Button>
                ) : null}
                <button
                  className="p-1 rounded opacity-70 hover:opacity-100 hover:bg-black/5"
                  onClick={() => onDismiss(n.id)}
                  aria-label="Cerrar aviso"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


