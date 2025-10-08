"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLogin } from "@/lib/hooks";
import { LoadingState } from "@/components/ui/loading-state";
import { logUserAction } from "@/lib/logging/appLogger";
import type { Role } from "@/lib/types/faltas";
import { roles } from "@/lib/utils/constants";

export default function LoginPage() {
  const [role, setRole] = useState<Role>("E");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const { loading, error, success, login, autoLogin, clearError } = useLogin({
    onSuccess: () => {
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
    await login({ role, username, password }, remember);
  };

  // Auto-login con credenciales recordadas
  useEffect(() => {
    autoLogin();
  }, [autoLogin]);

  return (
    <LoadingState loading={loading} error={error}>
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
            <Button type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </LoadingState>
  );
}


