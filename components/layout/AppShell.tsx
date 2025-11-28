"use client";

import { useState, useCallback, useEffect } from "react";
import { ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { RefreshCcw, LogOut, LayoutDashboard, LineChart, CalendarDays, Calculator, Layers, Clock } from "lucide-react";
import { useSnapshot } from "@/lib/services/snapshotContext";
import { saveRememberedCredentials } from "@/lib/services/credentials";
import { toast } from "sonner";
import { SlidersHorizontal } from "lucide-react";
import pkg from "@/package.json";
import { Download, Github } from "lucide-react";
import { openExternalUrl } from "@/lib/utils";
import NoticeBanner from "@/components/ui/notice-banner";
import { SnapshotRequired } from "@/components/ui/loading-state";
import { useTranslations } from "next-intl";
import { useStablePathname } from "@/lib/hooks/useStablePathname";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useStablePathname();
  const { syncNow, loading, error, snapshot } = useSnapshot();
  const [loggingOut, setLoggingOut] = useState<boolean>(false);
  const [updateInfo, setUpdateInfo] = useState<{ version: string; url: string } | null>(null);
  const t = useTranslations();
  const currentPath = pathname ?? "";
  
  const isLogin = currentPath === "/login";
  const isHome = currentPath === "/";
  const isDashboard = currentPath.startsWith("/dashboard");
  const isTendencias = currentPath.startsWith("/tendencias");
  const isSemanal = currentPath.startsWith("/semanal");
  const isHorario = currentPath.startsWith("/horario");
  const isModulos = currentPath.startsWith("/modulos");
  const isCalcular = currentPath.startsWith("/calcular");
  const isConfiguracion = currentPath.startsWith("/configuracion");
  
  // Páginas que requieren snapshot para funcionar
  const requiresSnapshot = isDashboard || isTendencias || isSemanal || isHorario || isModulos || isCalcular || 
    (isConfiguracion && currentPath !== "/configuracion");
  
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
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="hidden md:flex sticky top-0 h-screen flex-col border-r bg-gradient-to-b from-sidebar to-sidebar/95 overflow-y-auto shadow-sm">
        {/* Header with Logo */}
        <div className="px-3 py-3 border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg">
            <div className="p-1.5 rounded-md bg-primary/10 ring-1 ring-primary/20">
              <Image src="/logo.png" alt="Logo" width={24} height={24} />
            </div>
            <span className="font-bold text-md tracking-tight">Faltas</span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-1">
            <div className="px-3 py-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('navigation.navigation')}
              </h2>
            </div>
            <NavItem href="/dashboard" active={isDashboard} label={t('navigation.dashboard')} icon={LayoutDashboard} />
            <NavItem href="/tendencias" active={isTendencias} label={t('navigation.trends')} icon={LineChart} />
            <NavItem href="/semanal" active={isSemanal} label={t('navigation.weekly')} icon={CalendarDays} />
            <NavItem href="/horario" active={isHorario} label={t('navigation.schedule')} icon={Clock} />
            <NavItem href="/modulos" active={isModulos} label={t('navigation.modules')} icon={Layers} />
            <NavItem href="/calcular" active={isCalcular} label={t('navigation.calculate')} icon={Calculator} />
            
            {/* Divider */}
            <div className="my-3 mx-3 border-t border-border/50" />
            
            <NavItem href="/configuracion" active={isConfiguracion} label={t('navigation.configuration')} icon={SlidersHorizontal} />
          </div>
        </div>
        
        {/* Bottom Actions Section */}
        <div className="mt-auto border-t border-border/50 bg-card/30 backdrop-blur-sm">
          {/* Update Notice */}
          {updateInfo ? (
            <div className="p-3">
              <div className="relative overflow-hidden rounded-lg border-2 border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5 p-3 shadow-lg">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 rounded-full blur-2xl" />
                <div className="relative space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/20">
                      <Download className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="text-xs font-semibold text-foreground">
                      {t('version.updateRequired')}
                    </div>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => openExternalUrl(updateInfo.url)}
                    className="w-full justify-center text-xs font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    {t('version.downloadUpdate')} v{updateInfo.version}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Actions */}
          <div className="p-3 space-y-2">
            <div className="px-2 pb-1">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('navigation.actions')}
              </h2>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={onSync} 
                disabled={loading} 
                variant="outline" 
                size="sm" 
                className="flex-1 justify-center font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all" 
                aria-label={t('common.sync')}
              >
                {loading ? (
                  <svg className="mr-1.5 h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                ) : (
                  <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                )}
                <span className="text-xs">{loading ? t('common.syncing') : t('common.sync')}</span>
              </Button>
              <Button 
                onClick={onLogout} 
                disabled={loggingOut} 
                variant="outline" 
                size="sm" 
                className="px-3 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all" 
                aria-label={t('common.logout')} 
                title={t('common.logout')}
              >
                {loggingOut ? (
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                ) : (
                  <LogOut className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between">
            <div className="text-[10px] text-muted-foreground font-medium">
              v{pkg.version}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openExternalUrl('https://github.com/andiricum2/Faltas-Cebanc/')}
              className="h-7 w-7 p-0 hover:bg-muted/80 transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>
      <main className="min-h-screen bg-background">
        {/* Mobile Header */}
        <header className="border-b bg-gradient-to-r from-card to-card/95 flex items-center px-4 py-3 md:hidden backdrop-blur-sm sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-primary/10 ring-1 ring-primary/20">
              <Image src="/logo.png" alt="Logo" width={16} height={16} />
            </div>
            <span className="font-bold text-sm tracking-tight">Faltas Cebanc</span>
          </div>
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
      className={`
        group relative flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm
        transition-all duration-200 ease-in-out
        ${active 
          ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }
      `}
    >
      {/* Active indicator */}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
      )}
      
      {/* Icon with background */}
      <div className={`
        p-1.5 rounded-md transition-all duration-200
        ${active 
          ? "bg-primary/20 text-primary" 
          : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        }
      `}>
        {Icon ? <Icon className="h-4 w-4" /> : null}
      </div>
      
      {/* Label */}
      <span className="flex-1">{label}</span>
      
      {/* Arrow indicator on hover/active */}
      {active && (
        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </Link>
  );
}



