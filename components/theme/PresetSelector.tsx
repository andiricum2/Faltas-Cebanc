/**
 * Component for selecting and managing theme presets
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { usePresetManager } from "@/lib/hooks/usePresetManager";
import { PresetCard } from "./PresetCard";
import { PresetCreateForm } from "./PresetCreateForm";
import { useTranslations } from "next-intl";

export function PresetSelector() {
  const {
    allPresets,
    showCreateForm,
    formData,
    activePresetId,
    handleCreatePreset,
    handleDeletePreset,
    handleSelectPreset,
    updateFormField,
    toggleCreateForm,
  } = usePresetManager();

  const t = useTranslations();
  const isFormValid = formData.name.trim().length >= 3;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('theme.presets.title')}</CardTitle>
            <CardDescription>
              {t('theme.presets.description')}
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={toggleCreateForm}
            variant={showCreateForm ? "secondary" : "default"}
          >
            {showCreateForm ? (
              <>
                <X className="w-4 h-4 mr-2" />
                {t('theme.presets.cancelButton')}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                {t('theme.presets.createButton')}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Create Preset Form */}
        {showCreateForm && (
          <PresetCreateForm
            formData={formData}
            onFieldChange={updateFormField}
            onSubmit={handleCreatePreset}
            isValid={isFormValid}
          />
        )}

        {/* Presets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allPresets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isActive={activePresetId === preset.id}
              onSelect={handleSelectPreset}
              onDelete={preset.isCustom ? handleDeletePreset : undefined}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


