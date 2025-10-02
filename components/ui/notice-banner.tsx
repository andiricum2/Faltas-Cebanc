"use client";

import React from "react";
import { Notice, fetchNotices } from "@/lib/services/notices";
import { Button } from "@/components/ui/button";
import { AlertCircle, Info, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { openExternalUrl } from "@/lib/utils/externalLinks";

function IconFor({ icon, severity }: { icon?: string; severity?: string }) {
  const className = "h-4 w-4";
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

function classesFor(severity?: string): string {
  switch (severity) {
    case "info":
      return "border bg-blue-50 text-blue-900";
    case "success":
      return "border bg-emerald-50 text-emerald-900";
    case "error":
      return "border bg-red-50 text-red-900";
    case "warning":
    default:
      return "border bg-amber-50 text-amber-900";
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
    <div className="space-y-2 mb-4">
      {visible.map((n) => (
        <div key={n.id} className={`rounded-md px-3 py-2 text-sm ${classesFor(n.severity)}`}>
          <div className="flex items-start gap-2">
            <div className="mt-0.5"><IconFor icon={n.icon} severity={n.severity} /></div>
            <div className="flex-1">
              <div className="font-medium">{n.title}</div>
              <div className="text-sm opacity-90">{n.description}</div>
              {n.action?.url && n.action?.label ? (
                <div className="mt-2">
                  <Button size="sm" onClick={() => openExternalUrl(n.action!.url)}>
                    {n.action!.label}
                    <ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              ) : null}
            </div>
            <button className="opacity-70 hover:opacity-100 text-xs" onClick={() => onDismiss(n.id)} aria-label="Cerrar aviso">
              Cerrar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}


