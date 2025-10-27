/**
 * Form component for creating new theme presets
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { PresetFormData } from "@/lib/hooks/usePresetManager";
import { useTranslations } from "next-intl";

interface PresetCreateFormProps {
  formData: PresetFormData;
  onFieldChange: (field: keyof PresetFormData, value: string) => void;
  onSubmit: () => void;
  isValid: boolean;
}

export function PresetCreateForm({ 
  formData, 
  onFieldChange, 
  onSubmit,
  isValid 
}: PresetCreateFormProps) {
  const t = useTranslations();
  
  return (
    <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
      <div className="space-y-2">
        <Label htmlFor="preset-name">{t('theme.presets.form.name')}</Label>
        <Input
          id="preset-name"
          value={formData.name}
          onChange={(e) => onFieldChange("name", e.target.value)}
          placeholder={t('theme.presets.form.namePlaceholder')}
          maxLength={50}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="preset-description">{t('theme.presets.form.description')}</Label>
        <Input
          id="preset-description"
          value={formData.description}
          onChange={(e) => onFieldChange("description", e.target.value)}
          placeholder={t('theme.presets.form.descriptionPlaceholder')}
          maxLength={100}
        />
      </div>
      
      <Button 
        onClick={onSubmit}
        disabled={!isValid}
        className="w-full"
      >
        <Save className="w-4 h-4 mr-2" />
        {t('theme.presets.form.saveButton')}
      </Button>
      
      <p className="text-xs text-muted-foreground">
        {t('theme.presets.form.saveDescription')}
      </p>
    </div>
  );
}


