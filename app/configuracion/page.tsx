"use client";

import { useSnapshot } from "@/lib/services/snapshotContext";
import { useConfig } from "@/lib/services/configContext";
import { getGroups } from "@/lib/services/apiClient";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { useDataLoader } from "@/lib/hooks";
import { LoadingState } from "@/components/ui/loading-state";
import { useLocaleContext } from "@/lib/hooks/useLocaleContext";
import { useTranslations } from "next-intl";
import type { AutoSyncMinutes } from "@/lib/types/snapshot";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/lib/hooks/useTheme";

export default function ConfiguracionPage() {
  const { config, setAutoSyncMinutes, setSelectedGroup } = useConfig();
  const { config: themeConfig, updateThemeMode } = useTheme();
  const { snapshot, syncNow } = useSnapshot();
  const { locale, setLocale } = useLocaleContext();
  const t = useTranslations();

  const hasData = !!snapshot;
  
  // Usar useDataLoader para cargar grupos
  const { data: groupsData, loading: groupsLoading, error: groupsError } = useDataLoader(
    () => getGroups(),
    []
  );
  
  const groups = groupsData?.groups || [];

  return (
    <LoadingState loading={groupsLoading} error={groupsError}>
      <div className="container mx-auto p-6 max-w-7xl space-y-8">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('configuration.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('configuration.subtitle')}
          </p>
        </div>

        {/* Sync & Data Section */}
        <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-xl">{t('configuration.autoSync.title')}</CardTitle>
                <CardDescription>{t('configuration.autoSync.subtitle')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('configuration.autoSync.interval')}
                </label>
                <Select
                  aria-label="Auto-sync interval"
                  value={String(config.autoSyncMinutes)}
                  onChange={async (e) => {
                    setAutoSyncMinutes(Number(e.target.value) as AutoSyncMinutes);
                    await syncNow().catch(() => {});
                  }}
                  className="w-full"
                >
                  <option value="0">{t('configuration.autoSync.disabled')}</option>
                  <option value="5">{t('configuration.autoSync.every5Minutes')}</option>
                  <option value="15">{t('configuration.autoSync.every15Minutes')}</option>
                  <option value="30">{t('configuration.autoSync.every30Minutes')}</option>
                </Select>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {t('configuration.autoSync.classGroup')}
                </label>
                <Select
                  aria-label="Grupo de clase"
                  value={config.selectedGroup ?? "personalizado"}
                  onChange={async (e) => {
                    const v = e.target.value === "personalizado" ? null : e.target.value;
                    setSelectedGroup(v);
                    await syncNow().catch(() => {});
                  }}
                  className="w-full"
                >
                  <option value="personalizado">{t('configuration.autoSync.custom')}</option>
                  {groups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('configuration.autoSync.groupDescription')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-xl">{t('configuration.appearance.title')}</CardTitle>
                <CardDescription>{t('configuration.appearance.subtitle')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  {t('configuration.appearance.theme')}
                </label>
                <Select
                  aria-label="Tema"
                  value={themeConfig.mode}
                  onChange={(e) => {
                    updateThemeMode(e.target.value as 'light' | 'dark' | 'system');
                  }}
                  className="w-full"
                >
                  <option value="system">{t('configuration.appearance.themeSystem')}</option>
                  <option value="light">{t('configuration.appearance.themeLight')}</option>
                  <option value="dark">{t('configuration.appearance.themeDark')}</option>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('configuration.appearance.themeDescription')}
                </p>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  {t('configuration.appearance.language')}
                </label>
                <Select
                  aria-label="Idioma"
                  value={locale}
                  onChange={(e) => {
                    setLocale(e.target.value as 'es' | 'eu');
                  }}
                  className="w-full"
                >
                  <option value="es">Español</option>
                  <option value="eu">Euskera</option>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('configuration.appearance.languageDescription')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Sections */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{t('configuration.sections.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('configuration.sections.subtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Theme Customization Card */}
            <Link 
              href="/configuracion/tema" 
              className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-6 transition-all duration-300 hover:border-primary hover:shadow-xl hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full transition-all duration-300 group-hover:scale-110" />
              <div className="relative space-y-3">
                <div className="p-3 rounded-xl bg-primary/10 w-fit">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                    Personalización de Tema
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Personaliza los colores y la apariencia de la aplicación
                  </p>
                </div>
                <div className="flex items-center text-primary text-sm font-medium pt-2">
                  Configurar
                  <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {(!config.selectedGroup) ? (
              <>
                {/* Schedule Card */}
                <Link 
                  href="/configuracion/horario" 
                  className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-6 transition-all duration-300 hover:border-primary hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full transition-all duration-300 group-hover:scale-110" />
                  <div className="relative space-y-3">
                    <div className="p-3 rounded-xl bg-blue-500/10 w-fit">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                        {t('configuration.sections.schedule.title')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t('configuration.sections.schedule.description')}
                        {!hasData && <span className="block mt-1 text-xs italic">(requiere datos sincronizados)</span>}
                      </p>
                    </div>
                    <div className="flex items-center text-primary text-sm font-medium pt-2">
                      Configurar
                      <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>

                {/* Challenges Card */}
                <Link 
                  href="/configuracion/retos" 
                  className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-6 transition-all duration-300 hover:border-primary hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-transparent rounded-bl-full transition-all duration-300 group-hover:scale-110" />
                  <div className="relative space-y-3">
                    <div className="p-3 rounded-xl bg-green-500/10 w-fit">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                        {t('configuration.sections.challenges.title')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t('configuration.sections.challenges.description')}
                      </p>
                    </div>
                    <div className="flex items-center text-primary text-sm font-medium pt-2">
                      Configurar
                      <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </>
            ) : (
              <Card className="col-span-full border-2 border-dashed border-muted-foreground/30 bg-muted/30">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-muted-foreground">
                      {t('configuration.sections.usingGroupConfig', { group: config.selectedGroup })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </LoadingState>
  );
}


