/**
 * Component for selecting theme mode (light/dark/system)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/hooks/useTheme";
import { ThemeMode } from "@/lib/types/theme";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";

export function ThemeModeSelector() {
  const { config, updateThemeMode } = useTheme();
  const t = useTranslations();

  const MODE_OPTIONS: { value: ThemeMode; icon: typeof Sun }[] = [
    { value: "light", icon: Sun },
    { value: "dark", icon: Moon },
    { value: "system", icon: Monitor },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('theme.mode.title')}</CardTitle>
        <CardDescription>{t('theme.mode.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          {MODE_OPTIONS.map(({ value, icon: Icon }) => (
            <Button
              key={value}
              variant={config.mode === value ? "default" : "outline"}
              onClick={() => updateThemeMode(value)}
              className="flex-1"
            >
              <Icon className="w-4 h-4 mr-2" />
              {t(`theme.mode.${value}`)}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


