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
import type { Role } from "@/lib/types/faltas";
import { roles } from "@/lib/utils";

export default function LoginPage() {
  const [role, setRole] = useState<Role>("E");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [autoLogging, setAutoLogging] = useState<boolean>(false);

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
      <div className="min-h-screen w-full flex items-center justify-center p-6">
        <div className="w-full max-w-xs flex flex-col items-center gap-6">
          <img
            src="/logo.png"
            alt="Faltas"
            className="h-16 w-16 animate-pulse"
          />
          <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
            <div className="h-full bg-gray-900 indeterminate-bar" />
          </div>
          <p className="text-gray-600 text-sm">Iniciando sesión...</p>
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
      <div className="min-h-screen w-full flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Acceso Faltas</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label>Rol</Label>
              <Select value={role} onChange={(e) => setRole(e.target.value as Role)} required>
                {roles.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Usuario</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Contraseña</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Recordar usuario y contraseña
          </label>

            {error && <div className="text-red-600 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">Login correcto</div>}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
  );
}


