/**
 * Component for editing theme colors
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useColorEditor } from "@/lib/hooks/useColorEditor";
import { ColorInput } from "./ColorInput";
import { COLOR_CATEGORIES } from "@/lib/theme/constants";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { openExternalUrl } from "@/lib/utils";

export function ColorEditor() {
  const {
    editMode,
    activeColors,
    handleColorChange,
    switchEditMode,
    getColorError,
  } = useColorEditor();

  const t = useTranslations();

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    base: true,
    interactive: true,
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('theme.colors.title')}</CardTitle>
        <CardDescription>
          {t('theme.colors.subtitle')}{" "}
          <a 
            onClick={() => openExternalUrl("https://oklch.com")}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline cursor-pointer"
          >
            {t('theme.colors.learnMore')}
          </a>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Edit Mode Selector */}
        <div className="flex gap-4">
          <Button
            variant={editMode === "light" ? "default" : "outline"}
            onClick={() => switchEditMode("light")}
          >
            {t('theme.colors.editLight')}
          </Button>
          <Button
            variant={editMode === "dark" ? "default" : "outline"}
            onClick={() => switchEditMode("dark")}
          >
            {t('theme.colors.editDark')}
          </Button>
        </div>

        {/* Color Categories */}
        <div className="space-y-4">
          {Object.entries(COLOR_CATEGORIES).map(([categoryKey, colorKeys]) => {
            const isExpanded = expandedCategories[categoryKey];
            const label = t(`theme.colors.categories.${categoryKey}`);
            
            return (
              <div key={categoryKey} className="border rounded-lg">
                <button
                  onClick={() => toggleCategory(categoryKey)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <h3 className="font-semibold text-sm">{label}</h3>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {colorKeys.map((key) => (
                      <ColorInput
                        key={key}
                        colorKey={key}
                        value={activeColors[key]}
                        hasError={getColorError(key)}
                        onChange={handleColorChange}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}


