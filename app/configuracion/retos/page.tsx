"use client";

import { useSnapshot } from "@/lib/services/snapshotContext";
import { Input } from "@/components/ui/input";
import { loadRetoTargets, saveRetoTargets } from "@/lib/services/configService";
import { useConfigPage } from "@/lib/hooks";
import { isRetoModule } from "@/lib/utils/calculations";
import { useMemo } from "react";

export default function ConfigRetosPage() {
  const { snapshot } = useSnapshot();

  const moduleKeys = useMemo(() => Object.keys(snapshot?.aggregated?.modules || {}), [snapshot]);
  const nonRetoModules = useMemo(() => 
    moduleKeys.filter((m) => !isRetoModule(m, snapshot?.legend?.modules?.[m])), 
    [moduleKeys, snapshot?.legend?.modules]
  );
  const retos = useMemo(() => snapshot?.retos || [], [snapshot]);

  const { data: retoTargets, save, updateField } = useConfigPage(
    loadRetoTargets,
    saveRetoTargets
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Configuración · Retos</h1>

      <section className="space-y-3">
        {retos.length === 0 ? (
          <div className="text-sm text-muted-foreground">No se han detectado retos en los datos actuales.</div>
        ) : null}
        {retos.map((r) => (
          <div key={r.id} className="border rounded p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{r.label} ({r.id})</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Asignar a módulos</div>
              <div className="rounded border max-h-60 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left p-2">Módulo</th>
                      <th className="text-left p-2 w-24">Asignado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nonRetoModules.map((m) => (
                      <tr key={`${r.id}-${m}`} className="border-t">
                        <td className="p-2 whitespace-nowrap">{snapshot?.legend?.modules?.[m] || m}</td>
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={!!(retoTargets?.[r.id]?.[m])}
                            onChange={(e) => {
                              const next = { ...retoTargets, [r.id]: { ...(retoTargets?.[r.id] || {}), [m]: e.target.checked } };
                              save(next);
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}


