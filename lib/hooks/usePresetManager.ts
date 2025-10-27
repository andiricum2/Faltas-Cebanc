/**
 * Custom hook for managing theme presets
 */

import { useState, useCallback } from "react";
import { useTheme } from "./useTheme";
import { useTranslations } from "next-intl";

export interface PresetFormData {
  name: string;
  description: string;
}

export function usePresetManager() {
  const { 
    config,
    getAllPresets, 
    deleteCustomPreset, 
    saveCurrentAsPreset,
    updatePreset,
  } = useTheme();

  const t = useTranslations();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<PresetFormData>({
    name: "",
    description: "",
  });

  const allPresets = getAllPresets();

  const handleCreatePreset = useCallback(async () => {
    if (!formData.name.trim()) return;
    
    await saveCurrentAsPreset(
      formData.name.trim(),
      formData.description.trim() || t('theme.presets.custom')
    );
    
    setFormData({ name: "", description: "" });
    setShowCreateForm(false);
  }, [formData, saveCurrentAsPreset, t]);

  const handleDeletePreset = useCallback(async (presetId: string) => {
    if (confirm(t('theme.presets.delete.confirm'))) {
      await deleteCustomPreset(presetId);
    }
  }, [deleteCustomPreset, t]);

  const handleSelectPreset = useCallback(async (presetId: string) => {
    await updatePreset(presetId);
  }, [updatePreset]);

  const updateFormField = useCallback((field: keyof PresetFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleCreateForm = useCallback(() => {
    setShowCreateForm(prev => !prev);
    if (showCreateForm) {
      // Reset form when closing
      setFormData({ name: "", description: "" });
    }
  }, [showCreateForm]);

  return {
    // State
    allPresets,
    showCreateForm,
    formData,
    activePresetId: config.preset,
    
    // Actions
    handleCreatePreset,
    handleDeletePreset,
    handleSelectPreset,
    updateFormField,
    toggleCreateForm,
  };
}


