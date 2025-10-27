/**
 * Component for theme-related actions (reset, export, import, etc.)
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useTheme } from "@/lib/hooks/useTheme";
import { RotateCcw, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

export function ThemeActions() {
  const { resetToDefaults, config } = useTheme();
  const t = useTranslations();
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleReset = async () => {
    await resetToDefaults();
    setShowResetDialog(false);
  };

  const hasCustomizations = 
    config.mode !== "system" || 
    config.preset !== "default" || 
    config.customLight || 
    config.customDark || 
    (config.customPresets && config.customPresets.length > 0);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('theme.actions.title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button 
            variant="destructive" 
            onClick={() => setShowResetDialog(true)}
            disabled={!hasCustomizations}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('theme.actions.reset')}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent onClose={() => setShowResetDialog(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              {t('theme.actions.resetDialog.title')}
            </DialogTitle>
            <DialogDescription>
              {t('theme.actions.resetDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-4">
            <ul className="space-y-2 text-sm">
              {config.mode !== "system" && (
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-0.5">•</span>
                  <span>{t('theme.actions.resetDialog.items.mode')}</span>
                </li>
              )}
              {config.preset !== "default" && (
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-0.5">•</span>
                  <span>{t('theme.actions.resetDialog.items.preset')}</span>
                </li>
              )}
              {(config.customLight || config.customDark) && (
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-0.5">•</span>
                  <span>{t('theme.actions.resetDialog.items.customColors')}</span>
                </li>
              )}
              {config.customPresets && config.customPresets.length > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-0.5">•</span>
                  <span>{t('theme.actions.resetDialog.items.customPresets')}</span>
                </li>
              )}
            </ul>

            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive font-medium">
                {t('theme.actions.resetDialog.warning')}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowResetDialog(false)}
            >
              {t('theme.actions.resetDialog.cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReset}
            >
              {t('theme.actions.resetDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


