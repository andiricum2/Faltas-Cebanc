/**
 * Component for previewing theme colors and components
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/hooks/useTheme";
import { useTranslations } from "next-intl";

export function ThemePreview() {
  const { activeMode, getActiveColors } = useTheme();
  const activeColors = getActiveColors(activeMode);
  const t = useTranslations("theme.preview");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Buttons Preview */}
        <div>
          <h3 className="text-sm font-medium mb-3">{t("buttons")}</h3>
          <div className="flex flex-wrap gap-3">
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="secondary">Secondary</Button>
            <Button size="sm" variant="destructive">Destructive</Button>
            <Button size="sm" variant="outline">Outline</Button>
            <Button size="sm" variant="ghost">Ghost</Button>
          </div>
        </div>

        {/* Cards Preview */}
        <div>
          <h3 className="text-sm font-medium mb-3">{t("cards")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t("cardNormal")}</CardTitle>
                <CardDescription className="text-xs">{t("cardNormalDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="text-xs">
                <p className="text-muted-foreground">
                  {t("cardNormalContent")}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t("cardPrimary")}</CardTitle>
                <CardDescription className="text-xs text-primary-foreground/70">
                  {t("cardPrimaryDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs">
                <p className="text-primary-foreground/90">
                  {t("cardPrimaryContent")}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-secondary text-secondary-foreground">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t("cardSecondary")}</CardTitle>
                <CardDescription className="text-xs opacity-70">
                  {t("cardSecondaryDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs">
                <p className="opacity-90">
                  {t("cardSecondaryContent")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Elements */}
        <div>
          <h3 className="text-sm font-medium mb-3">{t("forms")}</h3>
          <div className="space-y-3 max-w-md">
            <Input placeholder={t("textField")} />
            <div className="flex gap-2">
              <Input placeholder={t("field1")} />
              <Input placeholder={t("field2")} />
            </div>
          </div>
        </div>

        {/* Badges */}
        <div>
          <h3 className="text-sm font-medium mb-3">{t("badges")}</h3>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <div className="px-3 py-1 bg-muted text-muted-foreground rounded-md text-sm">
              Muted
            </div>
            <div className="px-3 py-1 bg-accent text-accent-foreground rounded-md text-sm">
              Accent
            </div>
          </div>
        </div>

        {/* Color Swatches */}
        <div>
          <h3 className="text-sm font-medium mb-3">{t("palette")}</h3>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {Object.entries(activeColors).slice(0, 8).map(([name, color]) => (
              <div key={name} className="space-y-1">
                <div 
                  className="w-full h-12 rounded border border-border"
                  style={{ background: color }}
                />
                <p className="text-xs text-muted-foreground truncate" title={name}>
                  {name.replace(/([A-Z])/g, ' $1').trim()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


