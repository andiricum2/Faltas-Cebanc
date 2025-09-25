"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Role = "A" | "P" | "D" | "E";

async function loginApi(payload: { role: Role; username: string; password: string }) {
  const res = await fetch("/api/faltas/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.errorMessage || "Login failed");
  }
  return await res.json();
}

export default function Home() {
  const [role, setRole] = useState<Role>("E");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      await loginApi({ role, username, password });
      setSuccess(true);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roles: Array<{ key: Role; label: string }> = [
    { key: "E", label: "Estudiante" },
    { key: "P", label: "Profesorado" },
    { key: "D", label: "Dirección" },
    { key: "A", label: "Administrador" },
  ];

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

            {error && <div className="text-red-600 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">Login correcto</div>}
            <Button type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
