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

export default function ConfiguracionPage() {
  const { config, setAutoSyncMinutes, setSelectedGroup, setTheme } = useConfig();
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
      <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t('configuration.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('configuration.subtitle')}</p>
      </div>

      <section className="space-y-2">
        <div>
          <h2 className="text-sm font-medium">{t('configuration.autoSync.title')}</h2>
          <p className="text-xs text-muted-foreground">{t('configuration.autoSync.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
          <div>
            <div className="text-xs font-medium mb-1">{t('configuration.autoSync.interval')}</div>
            <Select
              aria-label="Auto-sync interval"
              value={String(config.autoSyncMinutes)}
              onChange={async (e) => {
                setAutoSyncMinutes(Number(e.target.value) as AutoSyncMinutes);
                await syncNow().catch(() => {});
              }}
            >
              <option value="0">{t('configuration.autoSync.disabled')}</option>
              <option value="5">{t('configuration.autoSync.every5Minutes')}</option>
              <option value="15">{t('configuration.autoSync.every15Minutes')}</option>
              <option value="30">{t('configuration.autoSync.every30Minutes')}</option>
            </Select>
          </div>
          <div>
            <div className="text-xs font-medium mb-1">{t('configuration.autoSync.classGroup')}</div>
            <Select
              aria-label="Grupo de clase"
              value={config.selectedGroup ?? "personalizado"}
              onChange={async (e) => {
                const v = e.target.value === "personalizado" ? null : e.target.value;
                setSelectedGroup(v);
                await syncNow().catch(() => {});
              }}
            >
              <option value="personalizado">{t('configuration.autoSync.custom')}</option>
              {groups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{t('configuration.autoSync.groupDescription')}</p>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <div>
          <h2 className="text-sm font-medium">{t('configuration.appearance.title')}</h2>
          <p className="text-xs text-muted-foreground">{t('configuration.appearance.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
          <div>
            <div className="text-xs font-medium mb-1">{t('configuration.appearance.theme')}</div>
            <Select
              aria-label="Tema"
              value={config.theme}
              onChange={(e) => {
                setTheme(e.target.value as 'light' | 'dark' | 'system');
              }}
            >
              <option value="system">{t('configuration.appearance.themeSystem')}</option>
              <option value="light">{t('configuration.appearance.themeLight')}</option>
              <option value="dark">{t('configuration.appearance.themeDark')}</option>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{t('configuration.appearance.themeDescription')}</p>
          </div>
          <div>
            <div className="text-xs font-medium mb-1">{t('configuration.appearance.language')}</div>
            <Select
              aria-label="Idioma"
              value={locale}
              onChange={(e) => {
                setLocale(e.target.value as 'es' | 'eu');
              }}
            >
              <option value="es">Español</option>
              <option value="eu">Euskera</option>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{t('configuration.appearance.languageDescription')}</p>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <div>
          <h2 className="text-sm font-medium">{t('configuration.sections.title')}</h2>
          <p className="text-xs text-muted-foreground">{t('configuration.sections.subtitle')}</p>
        </div>
        {(!config.selectedGroup) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link href="/configuracion/horario" className="rounded border p-3 hover:bg-muted">
              <div className="font-medium mb-1">{t('configuration.sections.schedule.title')}</div>
              <div className="text-xs text-muted-foreground">{t('configuration.sections.schedule.description')}. {hasData ? "" : "(requiere datos sincronizados)"}</div>
            </Link>
            <Link href="/configuracion/retos" className="rounded border p-3 hover:bg-muted">
              <div className="font-medium mb-1">{t('configuration.sections.challenges.title')}</div>
              <div className="text-xs text-muted-foreground">{t('configuration.sections.challenges.description')}</div>
            </Link>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">{t('configuration.sections.usingGroupConfig', { group: config.selectedGroup })}</div>
        )}
      </section>
      </div>
    </LoadingState>
  );
}


