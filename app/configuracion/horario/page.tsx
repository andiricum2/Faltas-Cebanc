"use client";

import React from "react";
import { useSnapshot } from "@/lib/services/snapshotContext";
import { Input } from "@/components/ui/input";
import { loadHoursPerModule, saveHoursPerModule } from "@/lib/services/configService";

export default function ConfigHorarioPage() {
  const { snapshot, loading, syncNow } = useSnapshot();

  type ModuleId = string;
  const [hoursPerModule, setHoursPerModule] = React.useState<Record<ModuleId, number>>({});

  const isRetoModule = React.useCallback((code: string, label: string | undefined) => {
    const text = `${code} ${label || ""}`;
    return /(?<![A-Za-z0-9])\d[A-Za-z]{2}\d(?![A-Za-z0-9])/i.test(text);
  }, []);

  React.useEffect(() => {
    const loadConfig = async () => {
      const hours = await loadHoursPerModule();
      setHoursPerModule(hours);
    };
    loadConfig();
  }, []);

  const saveHours = React.useCallback(async (next: Record<ModuleId, number>) => {
    setHoursPerModule(next);
    await saveHoursPerModule(next);
    try { await syncNow(); } catch {}
  }, []);

  if (!snapshot) {
    return <div className="text-sm text-muted-foreground">{loading ? "Cargando datos..." : "Sin datos. Ve a Vista general y sincroniza."}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Configuración · Horario</h1>

      <section className="space-y-2">
        <div>
          <h2 className="text-sm font-medium">Horario semanal por módulo</h2>
          <p className="text-xs text-muted-foreground">Define las horas semanales de cada módulo. Se usarán para repartir los retos.</p>
        </div>
        <div className="rounded border">
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2">Módulo</th>
                  <th className="text-left p-2">Horas/semana</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(snapshot.legend?.modules || {})
                  .filter((m) => !isRetoModule(m, snapshot.legend?.modules?.[m]))
                  .map((m) => {
                    const label = snapshot.legend?.modules?.[m] || m;
                    const v = Number.isFinite(hoursPerModule[m]) ? (hoursPerModule[m] as number) : 0;
                    return (
                      <tr key={m} className="border-t">
                        <td className="p-2 whitespace-nowrap">{label}</td>
                        <td className="p-2 w-40">
                          <Input
                            type="number"
                            min={0}
                            step={0.5}
                            value={v}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              const next = { ...hoursPerModule, [m]: Number.isFinite(n) ? n : 0 } as Record<ModuleId, number>;
                              saveHours(next);
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded bg-secondary"
            onClick={() => {
              const next: Record<ModuleId, number> = {};
              Object.keys(hoursPerModule).forEach((k) => (next[k] = 0));
              saveHours(next);
            }}
          >
            Poner todo a 0
          </button>
        </div>
      </section>
    </div>
  );
}


