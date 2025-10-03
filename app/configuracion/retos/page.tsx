"use client";

import React from "react";
import { useSnapshot } from "@/lib/services/snapshotContext";
import { Input } from "@/components/ui/input";
import { loadRetoTargets, saveRetoTargets } from "@/lib/services/configService";

export default function ConfigRetosPage() {
  const { snapshot, loading } = useSnapshot();

  const moduleKeys = React.useMemo(() => Object.keys(snapshot?.aggregated?.modules || {}), [snapshot]);
  const isRetoModule = React.useCallback((code: string) => {
    const label = snapshot?.legend?.modules?.[code] || code;
    return /(?<![A-Za-z0-9])\d[A-Za-z]{2}\d(?![A-Za-z0-9])/i.test(`${code} ${label}`);
  }, [snapshot]);
  const nonRetoModules = React.useMemo(() => moduleKeys.filter((m) => !isRetoModule(m)), [moduleKeys, isRetoModule]);
  const retos = React.useMemo(() => snapshot?.retos || [], [snapshot]);

  const [retoTargets, setRetoTargets] = React.useState<Record<string, Record<string, boolean>>>({});

  React.useEffect(() => {
    const loadConfig = async () => {
      const targets = await loadRetoTargets();
      setRetoTargets(targets);
    };
    loadConfig();
  }, []);

  const persistTargets = React.useCallback(async (next: Record<string, Record<string, boolean>>) => {
    setRetoTargets(next);
    await saveRetoTargets(next);
  }, []);

  if (!snapshot) {
    return <div className="text-sm text-muted-foreground">{loading ? "Cargando datos..." : "Sin datos. Ve a Vista general y sincroniza."}</div>;
  }

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
                        <td className="p-2 whitespace-nowrap">{snapshot.legend?.modules?.[m] || m}</td>
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={!!(retoTargets[r.id]?.[m])}
                            onChange={(e) => {
                              const next = { ...retoTargets, [r.id]: { ...(retoTargets[r.id] || {}), [m]: e.target.checked } };
                              persistTargets(next);
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


