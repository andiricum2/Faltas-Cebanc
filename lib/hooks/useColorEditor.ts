/**
 * Custom hook for managing color editing state and validation
 */

import { useState, useCallback } from "react";
import { useTheme } from "./useTheme";
import { ThemeColors } from "@/lib/types/theme";
import { isValidOKLCH } from "@/lib/utils/themeUtils";

export function useColorEditor(initialMode: "light" | "dark" = "light") {
  const { updateCustomColors, getActiveColors } = useTheme();
  const [editMode, setEditMode] = useState<"light" | "dark">(initialMode);
  const [colorErrors, setColorErrors] = useState<Record<string, boolean>>({});

  const activeColors = getActiveColors(editMode);

  const handleColorChange = useCallback((key: keyof ThemeColors, value: string) => {
    const isValid = isValidOKLCH(value);
    
    setColorErrors(prev => ({
      ...prev,
      [`${editMode}-${key}`]: !isValid
    }));
    
    if (isValid) {
      updateCustomColors(editMode, { [key]: value });
    }
  }, [editMode, updateCustomColors]);

  const switchEditMode = useCallback((mode: "light" | "dark") => {
    setEditMode(mode);
  }, []);

  const getColorError = useCallback((key: keyof ThemeColors): boolean => {
    return colorErrors[`${editMode}-${key}`] || false;
  }, [editMode, colorErrors]);

  const clearErrors = useCallback(() => {
    setColorErrors({});
  }, []);

  return {
    // State
    editMode,
    activeColors,
    
    // Actions
    handleColorChange,
    switchEditMode,
    getColorError,
    clearErrors,
  };
}


