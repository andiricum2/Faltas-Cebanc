/**
 * Input component for editing OKLCH colors
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { describeOKLCHColor } from "@/lib/utils/themeUtils";
import { ThemeColors } from "@/lib/types/theme";
import { useTranslations } from "next-intl";

interface ColorInputProps {
  colorKey: keyof ThemeColors;
  value: string;
  hasError: boolean;
  onChange: (key: keyof ThemeColors, value: string) => void;
}

export function ColorInput({ colorKey, value, hasError, onChange }: ColorInputProps) {
  const t = useTranslations();
  const colorDesc = describeOKLCHColor(value);
  
  // Build translated color description in natural order: hue + chroma + lightness
  // Capitalize first letter of the entire description
  const buildDescription = (desc: typeof colorDesc) => {
    if (!desc) return t('theme.colors.description.unknown');
    const description = `${t(`theme.colors.description.hue.${desc.hue}`)} ${t(`theme.colors.description.chroma.${desc.chroma}`)} ${t(`theme.colors.description.lightness.${desc.lightness}`)}`;
    return description.charAt(0).toUpperCase() + description.slice(1);
  };
  
  const colorDescription = buildDescription(colorDesc);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={`color-${colorKey}`} className="text-sm">
          {t(`theme.colors.labels.${colorKey}` as any)}
        </Label>
        {hasError && (
          <Badge variant="destructive" className="text-xs">
            {t('theme.colors.invalid')}
          </Badge>
        )}
      </div>
      
      <div className="flex gap-2">
        {/* Color Preview Swatch */}
        <div
          className="w-10 h-10 rounded border border-border flex-shrink-0 relative group"
          style={{ background: value }}
          title={colorDescription}
        >
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg border">
            {colorDescription}
          </div>
        </div>
        
        {/* Color Value Input */}
        <Input
          id={`color-${colorKey}`}
          value={value}
          onChange={(e) => onChange(colorKey, e.target.value)}
          className={`${hasError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          placeholder={t('theme.colors.placeholder')}
        />
      </div>
      
      {/* Color Description */}
      {!hasError && (
        <p className="text-xs text-muted-foreground">{colorDescription}</p>
      )}
    </div>
  );
}


