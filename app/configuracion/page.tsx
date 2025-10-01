"use client";

import React from "react";
import { useConfig } from "@/lib/services/configContext";
import { useSnapshot } from "@/lib/services/snapshotContext";
import { Select } from "@/components/ui/select";
import Link from "next/link";

export default function ConfiguracionPage() {
  const { config, setAutoSyncMinutes } = useConfig();
  const { snapshot } = useSnapshot();

  const hasData = !!snapshot;

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

      <section className="space-y-2">
        <div>
          <h2 className="text-sm font-medium">Secciones</h2>
          <p className="text-xs text-muted-foreground">Elige qué deseas configurar.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link href="/configuracion/horario" className="rounded border p-3 hover:bg-muted">
            <div className="font-medium mb-1">Horario</div>
            <div className="text-xs text-muted-foreground">Define las horas semanales por módulo. {hasData ? "" : "(requiere datos sincronizados)"}</div>
          </Link>
          <Link href="/configuracion/retos" className="rounded border p-3 hover:bg-muted">
            <div className="font-medium mb-1">Retos</div>
            <div className="text-xs text-muted-foreground">Asigna módulos a cada reto y establece horas de reto.</div>
          </Link>
        </div>
      </section>
    </div>
  );
}


