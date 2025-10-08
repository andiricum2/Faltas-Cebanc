"use client";

import { useSnapshot } from "@/lib/services/snapshotContext";
import { Input } from "@/components/ui/input";
import { loadHoursPerModule, saveHoursPerModule } from "@/lib/services/configRepository";
import { useConfigPage } from "@/lib/hooks";
import { isRetoModule } from "@/lib/utils";
import type { HoursPerModule } from "@/lib/types/snapshot";

export default function ConfigHorarioPage() {
  const { snapshot } = useSnapshot();

  type ModuleId = string;
  const { data: hoursPerModule, save } = useConfigPage<HoursPerModule>(
    loadHoursPerModule,
    saveHoursPerModule
  );

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
                {Object.keys(snapshot?.legend?.modules || {})
                  .filter((m) => !isRetoModule(m, snapshot?.legend?.modules?.[m]))
                  .map((m) => {
                    const label = snapshot?.legend?.modules?.[m] || m;
                    const v = Number.isFinite(hoursPerModule?.[m]) ? hoursPerModule?.[m] : 0;
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
                              const next = { ...hoursPerModule, [m]: Number.isFinite(n) ? n : 0 };
                              save(next);
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
              const next: HoursPerModule = {};
              Object.keys(hoursPerModule || {}).forEach((k) => (next[k] = 0));
              save(next);
            }}
          >
            Poner todo a 0
          </button>
        </div>
      </section>
    </div>
  );
}


