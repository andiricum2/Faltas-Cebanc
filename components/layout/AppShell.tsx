"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { RefreshCcw, LogOut, LayoutDashboard, LineChart, CalendarDays } from "lucide-react";
import { useSnapshot } from "@/lib/services/snapshotContext";
import { toast } from "sonner";
import { SlidersHorizontal } from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { syncNow, loading, error } = useSnapshot();
  const [loggingOut, setLoggingOut] = React.useState<boolean>(false);
  const isLogin = pathname === "/login";
  const isDashboard = pathname === "/" || pathname?.startsWith("/dashboard");
  const isTendencias = pathname?.startsWith("/tendencias");
  const isSemanal = pathname?.startsWith("/semanal");
  const onSync = React.useCallback(async () => { await syncNow(); }, [syncNow]);
  const onLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/faltas/logout", { method: "POST" });
      // Hard redirect to root to clear client state
      window.location.href = "/";
    } finally {
      setLoggingOut(false);
    }
  };

  React.useEffect(() => {
    if (error) { toast.error(error); }
  }, [error]);
  if (isLogin) {
    return (
      <main className="min-h-screen">
        <div className="p-4 md:p-6 max-w-6xl mx-auto w-full">{children}</div>
      </main>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="hidden md:flex flex-col border-r bg-sidebar">
        <div className="h-14 px-4 flex items-center gap-2 border-b">
          <Image src="/logo.png" alt="Logo" width={24} height={24} />
          <span className="font-semibold">Faltas</span>
        </div>
        <nav className="p-2 text-sm">
          <NavItem href="/dashboard" active={isDashboard} label="Vista general" icon={LayoutDashboard} />
          <NavItem href="/tendencias" active={isTendencias} label="Tendencias" icon={LineChart} />
          <NavItem href="/semanal" active={isSemanal} label="Semanal" icon={CalendarDays} />
          <NavItem href="/configuracion" label="Configuración" icon={SlidersHorizontal} />
        </nav>
        <div className="mt-auto p-3 border-t space-y-2">
          <div className="grid grid-cols-4 gap-2">
            <Button onClick={onSync} disabled={loading} variant="outline" size="sm" className="col-span-3 w-full justify-center" aria-label="Sincronizar">
            {loading ? (
              <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : (
              <RefreshCcw className="mr-2 h-4 w-4" />
            )}
            {loading ? "Sincronizando..." : "Sincronizar Datos"}
            </Button>
            <Button onClick={onLogout} disabled={loggingOut} variant="outline" size="icon" className="col-span-1 w-full justify-center" aria-label="Cerrar sesión" title="Cerrar sesión">
              {loggingOut ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">v0.1.0</div>
        </div>
      </aside>
      <main className="min-h-screen">
        <header className="h-14 border-b flex items-center px-4 md:hidden">
          <span className="font-semibold">Faltas</span>
        </header>
        <div className="p-4 md:p-6 max-w-6xl mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}

function NavItem({ href, label, active, icon: Icon }: { href: string; label: string; active?: boolean; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <Link
      href={href}
      className={`block rounded px-3 py-2 hover:bg-sidebar-accent ${active ? "bg-sidebar-accent" : ""}`}
    >
      <span className="flex items-center gap-2">
        {Icon ? <Icon className="h-4 w-4" /> : null}
        <span>{label}</span>
      </span>
    </Link>
  );
}


