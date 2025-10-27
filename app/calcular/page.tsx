"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useSnapshot } from "@/lib/services/snapshotContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import type { CalculationPlanEntry as ApiCalculationPlanEntry } from "@/lib/services/apiClient";
import { useCalculationPlan } from "@/lib/services/calculationsHooks";
import { isRetoModule } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { useTranslations } from "next-intl";
import type { SnapshotData, CalculationsData, ModuleMeta, PlannerEntry } from "@/lib/types/snapshot";

export default function CalcularPage() {
	const { snapshot, loading, error } = useSnapshot();
  const t = useTranslations();
  
  // GET de cálculos eliminado; solo planificación vía POST
  const calculations = useMemo((): CalculationsData => {
    const snapshotData = snapshot as SnapshotData;
    const modules = snapshotData?.aggregated?.modules || {};
    const legend = snapshotData?.legend?.modules || {};
    const moduleMeta: ModuleMeta[] = Object.keys(modules).map((code) => {
      const label = legend[code] || code;
      const isReto = isRetoModule(code, label);
      return { code, label, isReto };
    });
    return { moduleMeta };
  }, [snapshot?.aggregated?.modules, snapshot?.legend?.modules]);
  const { planLoading, planResult, submitPlan, setPlanResult } = useCalculationPlan(snapshot?.identity?.dni);


  const [entries, setEntries] = useState<PlannerEntry[]>([]);

  const addEntry = useCallback(() => {
    setEntries((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        kind: "abs",
        code: calculations?.moduleMeta?.find((m: ModuleMeta) => !m.isReto)?.code || calculations?.moduleMeta?.[0]?.code,
        amount: 1
      }
    ]);
  }, [calculations]);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter(e => e.id !== id));
  }, []);

  const updateEntry = useCallback((id: string, next: Partial<PlannerEntry>) => {
    setEntries((prev) => prev.map(e => e.id === id ? { ...e, ...next } : e));
  }, []);

  const moduleOptions = useMemo(() => calculations?.moduleMeta?.filter((m: ModuleMeta) => !m.isReto) || [], [calculations]);
  const retoOptions = useMemo(() => calculations?.moduleMeta?.filter((m: ModuleMeta) => m.isReto) || [], [calculations]);

  const sortedModuleOptions = useMemo(() => {
    return [...moduleOptions].sort((a, b) => (a.label || "").localeCompare(b.label || ""));
  }, [calculations?.moduleMeta]);
  const sortedRetoOptions = useMemo(() => {
    return [...retoOptions].sort((a, b) => (a.label || "").localeCompare(b.label || ""));
  }, [calculations?.moduleMeta]);

  const entriesApiPayload: ApiCalculationPlanEntry[] = useMemo(() => {
    return entries.map(e => {
      const code = e.code || moduleOptions[0]?.code || retoOptions[0]?.code;
      const isReto = !!retoOptions.find((r: ModuleMeta) => r.code === code);
      return {
        kind: e.kind,
        scope: isReto ? "reto" : "module",
        code,
        hours: Math.max(0, Number(e.amount) || 0)
      };
    });
  }, [entries, calculations?.moduleMeta]);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(async () => {
      if (!snapshot?.identity?.dni) return;
      if (entriesApiPayload.length === 0) { setPlanResult(null); return; }
      try {
        const res = await submitPlan(entriesApiPayload);
        if (!cancelled) setPlanResult(res);
      } catch (err) {
        console.error("Error posting calculation plan:", err);
        if (!cancelled) setPlanResult(null);
      } finally {
        // loading handled inside useCalculationPlan
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [snapshot?.identity?.dni, entriesApiPayload]);

	return (
		<LoadingState loading={loading} error={error}>
			<div className="space-y-6">
			<h1 className="text-2xl font-semibold tracking-tight">{t('navigation.calculate')}</h1>
			<>
					<div className="rounded-md border bg-amber-50 text-amber-900 px-3 py-2 text-sm">
						{t('calculate.warning')}
					</div>
					{/* Se ha simplificado la página: solo se muestra la simulación de futuro */}

          <Card>
            <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
                <button className="inline-flex items-center px-3 py-2 rounded border bg-background hover:bg-muted" onClick={addEntry}>
                  {t('common.add')}
                </button>

                <button
                  className="inline-flex items-center px-3 py-2 rounded border bg-background hover:bg-muted ml-auto"
                  onClick={() => setEntries([])}
                  disabled={entries.length === 0}
                  title={t('calculate.clear')}
                >
                  <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                  {t('calculate.clear')}
                </button>

                <button
                  className="inline-flex items-center px-3 py-2 rounded border bg-background hover:bg-muted"
                  onClick={() => { /* removed preset */ }}
                  style={{ display: 'none' }}
                >  
                </button>
                
              </div>            
            </CardHeader>
            <CardContent className="space-y-4">


              {entries.length === 0 ? (
                <div className="text-sm text-muted-foreground">{t('calculate.addEntries')}</div>
              ) : (
                <div className="overflow-auto">
                  <table className="w-full text-sm min-w-[680px]">
                    <thead>
                      <tr>
                        <th className="text-left p-2">{t('calculate.type')}</th>
                        <th className="text-left p-2">{t('calculate.challengeModule')}</th>
                        <th className="text-left p-2">{t('calculate.amount')}</th>
                        <th className="text-left p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e) => {
                        return (
                          <tr key={e.id} className="border-t">
                            <td className="p-2">
                              <Select value={e.kind} onChange={(ev) => updateEntry(e.id, { kind: (ev.target.value as "abs"|"att") })}>
                                <option value="abs">{t('calculate.absence')}</option>
                                <option value="att">{t('calculate.attendance')}</option>
                              </Select>
                            </td>
                            <td className="p-2">
                              <Select value={e.code || ""} onChange={(ev) => updateEntry(e.id, { code: ev.target.value })}>
                                {sortedRetoOptions.length > 0 ? (
                  <optgroup label={t('calculate.challenges')}>
                    {sortedRetoOptions.map((m: any) => (
                                      <option key={`${e.id}-reto-${m.code}`} value={m.code}>{m.label}</option>
                                    ))}
                                  </optgroup>
                                ) : null}
                                {sortedModuleOptions.length > 0 ? (
                                  <optgroup label={t('calculate.modules')}>
                    {sortedModuleOptions.map((m: any) => (
                                      <option key={`${e.id}-mod-${m.code}`} value={m.code}>{m.label}</option>
                                    ))}
                                  </optgroup>
                                ) : null}
                              </Select>
                            </td>
                            <td className="p-2">
                              <Input type="number" min={0} step={1} value={e.amount} onChange={(ev) => updateEntry(e.id, { amount: Number(ev.target.value) })} />
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-3">
                                <button className="text-destructive hover:underline" onClick={() => removeEntry(e.id)}>{t('common.remove')}</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Resultados */}
              {planLoading ? (
                <div className="text-sm text-muted-foreground">{t('calculate.calculating')}</div>
              ) : planResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded bg-muted px-3 py-2">
                      <div className="text-muted-foreground">{t('calculate.generalCurrent')}</div>
                      <div className="text-xl font-semibold">{planResult.general.base.percent}%</div>
                      <div className="text-xs text-muted-foreground">{t('calculate.sessions', { count: planResult.general.base.totalSessions })} · {t('calculate.absences', { count: planResult.general.base.totalAbsences })}</div>
                    </div>
                    <div className="rounded bg-muted px-3 py-2">
                      <div className="text-muted-foreground">{t('calculate.generalProjected')}</div>
                      <div className="text-xl font-semibold">{planResult.general.projected.percent}%</div>
                      <div className="text-xs text-muted-foreground">{t('calculate.sessions', { count: planResult.general.projected.totalSessions })} · {t('calculate.absences', { count: planResult.general.projected.totalAbsences })}</div>
                    </div>
                    <div className="rounded bg-muted px-3 py-2">
                      <div className="text-muted-foreground">{t('calculate.variation')}</div>
                      <div className={`text-xl font-semibold ${planResult.general.delta.percent > 0 ? "text-destructive" : "text-chart-1"}`}>
                        {planResult.general.delta.percent >= 0 ? "+" : ""}{planResult.general.delta.percent.toFixed(2)}%
                      </div>
                      <div className="text-xs text-muted-foreground">{t('calculate.sessionDiff', { count: planResult.general.delta.sessions })} · {t('calculate.absenceDiff', { count: planResult.general.delta.absences })}</div>
                    </div>
                  </div>

                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left p-1">{t('calculate.module')}</th>
                          <th className="text-left p-1">{t('calculate.currentPercent')}</th>
                          <th className="text-left p-1">{t('calculate.projectedPercent')}</th>
                          <th className="text-left p-1">{t('calculate.differencePercent')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {planResult.byModule.map((row: any) => (
                          <tr key={`plan-row-${row.code}`} className="border-t">
                            <td className="p-1 whitespace-nowrap">{row.label}</td>
                            <td className="p-1">{row.base.percent}%</td>
                            <td className="p-1">{row.projected.percent}%</td>
                            <td className={`p-1 ${row.delta.percent > 0 ? "text-destructive" : "text-chart-1"}`}>{row.delta.percent.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
				</>
			</div>
		</LoadingState>
	);
}
