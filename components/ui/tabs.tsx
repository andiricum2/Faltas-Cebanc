"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (v: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

export function Tabs(props: { defaultValue: string; className?: string; children: React.ReactNode }) {
  const [value, setValue] = React.useState(props.defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={props.className}>{props.children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList(props: { className?: string; children: React.ReactNode }) {
  return (
    <div role="tablist" className={cn("inline-flex rounded-md border bg-muted p-1", props.className)}>
      {props.children}
    </div>
  );
}

export function TabsTrigger(props: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) return null;
  const isActive = ctx.value === props.value;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => ctx.setValue(props.value)}
      className={cn(
        "px-3 py-1.5 text-sm rounded-md transition-colors",
        isActive ? "bg-background shadow" : "text-muted-foreground hover:text-foreground",
        props.className
      )}
    >
      {props.children}
    </button>
  );
}

export function TabsContent(props: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) return null;
  if (ctx.value !== props.value) return null;
  return <div className={props.className}>{props.children}</div>;
}


