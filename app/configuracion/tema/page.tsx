/**
 * Theme Configuration Page
 * 
 * This page provides a comprehensive interface for customizing the application's theme.
 * It uses modular components to maintain clean and maintainable code.
 */

"use client";

import {
  ThemeModeSelector,
  PresetSelector,
  ColorEditor,
  ThemePreview,
  ThemeActions,
} from "@/components/theme";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ThemeConfigPage() {
  const t = useTranslations();
  
  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link 
          href="/configuracion"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('theme.title')}
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            {t('theme.subtitle')}
          </p>
        </div>
      </div>

      {/* Theme Mode Selection */}
      <ThemeModeSelector />

      {/* Preset Selection */}
      <PresetSelector />

      {/* Color Editor */}
      <ColorEditor />

      {/* Theme Actions */}
      <ThemeActions />

      {/* Preview */}
      <ThemePreview />
    </div>
  );
}
