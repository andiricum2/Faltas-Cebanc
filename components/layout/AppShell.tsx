"use client";

import { useState, useCallback, useEffect } from "react";
import { ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { RefreshCcw, LogOut, LayoutDashboard, LineChart, CalendarDays, Calculator, Layers } from "lucide-react";
import { useSnapshot } from "@/lib/services/snapshotContext";
import { saveRememberedCredentials } from "@/lib/services/credentials";
import { toast } from "sonner";
import { SlidersHorizontal } from "lucide-react";
import pkg from "@/package.json";
import { Download, Github } from "lucide-react";
import { openExternalUrl } from "@/lib/utils";
import NoticeBanner from "@/components/ui/notice-banner";
import { SnapshotRequired } from "@/components/ui/loading-state";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { syncNow, loading, error, snapshot } = useSnapshot();
  const [loggingOut, setLoggingOut] = useState<boolean>(false);
  const [updateInfo, setUpdateInfo] = useState<{ version: string; url: string } | null>(null);
  const isLogin = pathname === "/login";
  const isHome = pathname === "/";
  const isDashboard = pathname?.startsWith("/dashboard");
  const isTendencias = pathname?.startsWith("/tendencias");
  const isSemanal = pathname?.startsWith("/semanal");
  const isModulos = pathname?.startsWith("/modulos");
  const isCalcular = pathname?.startsWith("/calcular");
  const isConfiguracion = pathname?.startsWith("/configuracion");
  
  // Páginas que requieren snapshot para funcionar
  const requiresSnapshot = isDashboard || isTendencias || isSemanal || isModulos || isCalcular || 
    (isConfiguracion && pathname !== "/configuracion");
  
  const onSync = useCallback(async () => { await syncNow(); }, [syncNow]);
  const onLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/faltas/logout", { method: "POST" });
      try { await saveRememberedCredentials(null); } catch {}
      // Hard redirect to root to clear client state
      window.location.href = "/";
    } finally {
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    if (error) { toast.error(error); }
  }, [error]);

  // Listen for update availability from AutoUpdate
  useEffect(() => {
    const onUpdate = (e: Event) => {
      const custom = e as CustomEvent<{ version: string; url: string }>;
      setUpdateInfo(custom.detail);
    };
    window.addEventListener("faltas:update-available", onUpdate as EventListener);
    return () => {
      window.removeEventListener("faltas:update-available", onUpdate as EventListener);
    };
  }, []);

  if (isLogin || isHome) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="hidden md:flex sticky top-0 h-screen flex-col border-r bg-sidebar overflow-y-auto">
        <div className="h-14 px-4 flex items-center gap-2 border-b">
          <Image src="/logo.png" alt="Logo" width={24} height={24} />
          <span className="font-semibold">Faltas</span>
        </div>
        <nav className="p-2 text-sm">
          <NavItem href="/dashboard" active={isDashboard} label="Vista general" icon={LayoutDashboard} />
          <NavItem href="/tendencias" active={isTendencias} label="Tendencias" icon={LineChart} />
          <NavItem href="/semanal" active={isSemanal} label="Semanal" icon={CalendarDays} />
          <NavItem href="/modulos" active={isModulos} label="Módulos" icon={Layers} />
          <NavItem href="/calcular" active={isCalcular} label="Calcular" icon={Calculator} />
          <NavItem href="/configuracion" label="Configuración" icon={SlidersHorizontal} />
        </nav>
        
        <div className="mt-auto p-3 border-t space-y-2">

        {updateInfo ? (
            <div className="pt-2 mt-auto sticky bottom-0">
              <div className="rounded-md border bg-sidebar-accent/50 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <div className="text-sm font-medium">Actualización disponible</div>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => openExternalUrl(updateInfo.url)}
                  className="w-full justify-center"
                >
                <div className="text-xs justify-center text-white">
                  Descargar v{updateInfo.version}
                </div>
                </Button>
              </div>
            </div>
          ) : null}


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
            <Button onClick={onLogout} disabled={loggingOut} variant="outline" size="sm" className="col-span-1 w-full justify-center" aria-label="Cerrar sesión" title="Cerrar sesión">
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
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="ml-1">v{pkg.version}</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openExternalUrl('https://github.com/andiricum2/Faltas-Cebanc/')}
            >
              <Github className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
      <main className="min-h-screen">
        <header className="h-14 border-b flex items-center px-4 md:hidden">
          <span className="font-semibold">Faltas</span>
        </header>
        <div className="p-4 md:p-6 max-w-6xl mx-auto w-full">
          <NoticeBanner />
          {requiresSnapshot && !snapshot ? (
            <SnapshotRequired loading={loading} />
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ href, label, active, icon: Icon }: { href: string; label: string; active?: boolean; icon?: ComponentType<{ className?: string }> }) {
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



