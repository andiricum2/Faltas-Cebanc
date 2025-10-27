/**
 * Card component for displaying a theme preset
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { ThemePreset } from "@/lib/types/theme";
import { useTranslations } from "next-intl";

interface PresetCardProps {
  preset: ThemePreset;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function PresetCard({ preset, isActive, onSelect, onDelete }: PresetCardProps) {
  const t = useTranslations();
  
  // Use translations for system presets, original name/description for custom presets
  const displayName = preset.isCustom 
    ? preset.name 
    : t(`theme.presets.system.${preset.id}.name` as any);
  
  const displayDescription = preset.isCustom 
    ? preset.description 
    : t(`theme.presets.system.${preset.id}.description` as any);
  
  return (
    <div className="relative group">
      <button
        onClick={() => onSelect(preset.id)}
        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
          isActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
      >
        <div className="flex items-start justify-between mb-1">
          <div className="font-semibold">{displayName}</div>
          {preset.isCustom && (
            <Badge variant="outline" className="text-xs">
              {t('theme.presets.custom')}
            </Badge>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground mb-3">{displayDescription}</div>
        
        <div className="flex gap-2">
          <div
            className="w-6 h-6 rounded border border-border"
            style={{ background: preset.light.primary }}
            title="Primary Light"
          />
          <div
            className="w-6 h-6 rounded border border-border"
            style={{ background: preset.dark.primary }}
            title="Primary Dark"
          />
        </div>
      </button>
      
      {/* Delete button for custom presets */}
      {preset.isCustom && onDelete && (
        <Button
          size="sm"
          variant="destructive"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(preset.id);
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}


