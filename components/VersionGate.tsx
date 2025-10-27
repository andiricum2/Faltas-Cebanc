"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchVersionPolicy, shouldBlockByPolicy, VersionPolicy } from "@/lib/services/versionPolicy";
import { openExternalUrl } from "@/lib/utils";

export default function VersionGate() {
  const [policy, setPolicy] = useState<VersionPolicy | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [reason, setReason] = useState("ok");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await fetchVersionPolicy();
      if (cancelled) return;
      setPolicy(p);
      const res = shouldBlockByPolicy(p);
      setBlocked(res.blocked);
      setReason(res.reason);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!blocked) return null;

  const message = policy?.message || "Esta versión ha sido descontinuada. Debes actualizar para continuar.";
  const url = policy?.learnMoreUrl || "https://github.com/andiricum2/Faltas-Cebanc/releases";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-xl bg-card border border-border p-5 shadow-xl">
        <div className="text-lg font-semibold mb-1 text-card-foreground">Actualización requerida</div>
        <div className="text-sm text-muted-foreground mb-3">{message}</div>
        <div className="text-xs text-muted-foreground/70 mb-4">Motivo: {reason}</div>
        <div className="flex gap-3 justify-end">
          <Button onClick={() => openExternalUrl(url)} className="px-3 cursor-pointer">Descargar actualización</Button>
        </div>
      </div>
    </div>
  );
}


