import React from "react";
import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  hint?: string;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card className="group overflow-hidden relative transition-shadow hover:shadow-md">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-amber-400 to-red-400 opacity-30" />
      <CardContent className="p-4 sm:p-5 bg-gradient-to-br from-muted/40 to-transparent">
        <div className="text-xs text-muted-foreground flex items-center gap-2">{label}</div>
        <div className="mt-1 text-2xl font-semibold flex items-center gap-2 tracking-tight">{value}</div>
        {hint ? <div className="text-[11px] text-muted-foreground mt-2">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}


