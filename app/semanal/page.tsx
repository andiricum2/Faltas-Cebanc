"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildSelectedWeek } from "@/lib/services/snapshotService";
import { useSnapshot } from "@/lib/services/snapshotContext";

export default function SemanalPage() {
  const { snapshot } = useSnapshot();
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number | null>(null);

  const selectedWeek = useMemo(() => snapshot ? buildSelectedWeek(snapshot, selectedWeekIdx, "all", "all") : null, [snapshot, selectedWeekIdx]);

  if (!snapshot) return <div className="text-muted-foreground">Cargando...</div>;

  return (
    <div className="w-full space-y-6">
      <CardHeader className="p-0">
        <CardTitle>Semanal</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex items-center gap-2 mb-3">
          <select className="border rounded px-2 py-1 text-sm" value={selectedWeekIdx ?? (snapshot.weeks.length - 1)} onChange={(e)=>setSelectedWeekIdx(Number(e.target.value))}>
            {snapshot.weeks.map((w, idx)=> (
              <option key={w.weekStartISO} value={idx}>{w.weekStartISO} → {w.weekEndISO}</option>
            ))}
          </select>
        </div>

        {selectedWeek && (
          <div className="mt-2">
            <div className="font-semibold mb-2">Detalle semanal ({selectedWeek.weekStartISO} → {selectedWeek.weekEndISO})</div>
            <div className="overflow-auto">
              <table className="w-full text-sm border">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Hora</th>
                    {selectedWeek.daysISO.map((d)=> (
                      <th key={d} className="border px-2 py-1">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1,2,3,4,5,6].map((h)=> (
                    <tr key={h}>
                      <td className="border px-2 py-1 text-center font-medium">{h}</td>
                      {selectedWeek.daysISO.map((d, idx)=> {
                        const cell = selectedWeek.sessions.find((s)=> s.hour === h && s.weekday === (idx+1));
                        return <td key={d+"-"+h} className="border px-2 py-1 truncate" title={cell?.cssClass || undefined}>{cell?.title || "-"}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </div>
  );
}


