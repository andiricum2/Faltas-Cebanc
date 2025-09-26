"use client";

import React from "react";
import { useConfig } from "@/lib/services/configContext";
import { Select } from "@/components/ui/select";

export default function ConfiguracionPage() {
  const { config, setAutoSyncMinutes } = useConfig();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">Preferencias de la aplicación</p>
      </div>

      <section className="space-y-2">
        <div>
          <h2 className="text-sm font-medium">Auto-sync</h2>
          <p className="text-xs text-muted-foreground">Selecciona cada cuánto tiempo sincronizar automáticamente.</p>
        </div>
        <div className="max-w-xs">
          <Select
            aria-label="Auto-sync interval"
            value={String(config.autoSyncMinutes)}
            onChange={(e) => setAutoSyncMinutes(Number(e.target.value) as any)}
          >
            <option value="0">Desactivado</option>
            <option value="5">Cada 5 minutos</option>
            <option value="15">Cada 15 minutos</option>
            <option value="30">Cada 30 minutos</option>
          </Select>
        </div>
      </section>
    </div>
  );
}


