"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLogin } from "@/lib/hooks";
import { postSync } from "@/lib/services/apiClient";
import { logUserAction } from "@/lib/logging/appLogger";
import { useTranslations } from "next-intl";
import type { Role } from "@/lib/types/faltas";
import { roles } from "@/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";

export default function LoginPage() {
  const [role, setRole] = useState<Role>("E");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [autoLogging, setAutoLogging] = useState<boolean>(false);
  const t = useTranslations();

  const { loading, error, success, login, autoLogin, clearError } = useLogin({
    onSuccess: async () => {
      try { await postSync(); } catch {}
      window.location.href = "/dashboard";
    },
    onError: (error) => {
      console.error("Login error:", error);
    }
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    logUserAction('login_attempt', { role, username });
    try {
      setAutoLogging(false);
      setSubmitting(true);
      await login({ role, username, password }, remember);
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-login con credenciales recordadas
  useEffect(() => {
    // Only attempt auto-login if we're on the login page
    // This prevents duplicate attempts when coming from the main page
    const attemptAutoLogin = async () => {
      try {
        setAutoLogging(true);
        const success = await autoLogin();
        if (!success) {
          setAutoLogging(false);
          return;
        }
      } catch (error) {
        console.warn("Auto-login failed:", error);
      }
    };
    
    attemptAutoLogin();
  }, []);

  // Pantalla de carga para autologin
  if (autoLogging) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center p-6 overflow-hidden bg-background">
        {/* Fondo dinámico */}
        <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" className="text-foreground/10" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
          {/* Líneas animadas sutiles */}
          <g className="opacity-20">
            <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="0.5" className="text-foreground">
              <animate attributeName="x2" values="0;100%" dur="6s" repeatCount="indefinite" />
              <animate attributeName="y2" values="0;100%" dur="6s" repeatCount="indefinite" />
            </line>
            <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="0.5" className="text-foreground">
              <animate attributeName="x2" values="100%;0" dur="7s" repeatCount="indefinite" />
              <animate attributeName="y2" values="0;100%" dur="7s" repeatCount="indefinite" />
            </line>
          </g>
        </svg>

        <div className="relative w-full max-w-xs flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
          <img
            src="/logo.png"
            alt="Faltas"
            className="h-16 w-16 drop-shadow-sm animate-bounce"
          />
          <div className="w-full h-2 bg-muted rounded overflow-hidden shadow-inner">
            <div className="h-full bg-foreground indeterminate-bar" />
          </div>
          <p className="text-muted-foreground text-sm">{t('login.loggingIn')}</p>
        </div>
        <style jsx>{`
          @keyframes indeterminateLogin {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(100%); }
          }
          .indeterminate-bar {
            width: 40%;
            animation: indeterminateLogin 1.2s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
      <div className="relative min-h-screen w-full flex items-center justify-center p-6 overflow-hidden bg-background">
        {/* Fondo dinámico: puntos y conexiones */}
        <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" className="text-foreground/10" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
          <g className="opacity-20">
            <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="0.5" className="text-foreground">
              <animate attributeName="x2" values="0;100%" dur="8s" repeatCount="indefinite" />
              <animate attributeName="y2" values="0;100%" dur="8s" repeatCount="indefinite" />
            </line>
            <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="0.5" className="text-foreground">
              <animate attributeName="x2" values="100%;0" dur="9s" repeatCount="indefinite" />
              <animate attributeName="y2" values="0;100%" dur="9s" repeatCount="indefinite" />
            </line>
          </g>
        </svg>

        <Card className="relative w-full max-w-md border shadow-xl backdrop-blur-sm bg-card/95 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CardHeader className="space-y-2">
            <div className="w-full flex items-center justify-center">
              <img src="/logo.png" alt="Faltas" className="h-12 w-12" />
            </div>
            <CardTitle className="text-center tracking-tight">{t('login.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              {(error || success) && (
                <div aria-live="polite" role="status" className="space-y-0.5">
                  {error ? (
                    <div className="rounded-lg bg-destructive/10 text-destructive border border-destructive/30 px-3 py-2.5 text-sm shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-1.5 rounded-full bg-destructive/60" />
                        <XCircle className="h-4.5 w-4.5" />
                        <div className="flex-1">{t('login.loginError')}</div>
                      </div>
                    </div>
                  ) : null}
                  {success ? (
                    <div className="rounded-lg bg-chart-1/10 text-chart-1 border border-chart-1/30 px-3 py-2.5 text-sm shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-1.5 rounded-full bg-chart-1/60" />
                        <CheckCircle className="h-4.5 w-4.5" />
                        <div className="flex-1">{t('login.loginSuccess')}</div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
              <div className="grid grid-cols-1 gap-2">
                <Label>{t('login.role')}</Label>
                <Select value={role} onChange={(e) => setRole(e.target.value as Role)} required>
                  {roles.map((r) => (
                    <option key={r.key} value={r.key}>
                      {t(r.labelKey)}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label>{t('login.username')}</Label>
                <Input placeholder={t('login.username')} value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label>{t('login.password')}</Label>
                <div className="relative">
                  <Input
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded border bg-muted/70 hover:bg-muted transition"
                    aria-label={showPassword ? t('common.hide') : t('common.show')}
                  >
                    {showPassword ? t('common.hide') : t('common.show')}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm select-none">
                <input type="checkbox" className="accent-primary" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                {t('login.rememberMe')}
              </label>

              <Button type="submit" disabled={submitting} className="transition-transform hover:translate-y-[-1px] active:translate-y-[0]">
                {submitting ? t('login.loggingIn') : t('login.loginButton')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
  );
}


