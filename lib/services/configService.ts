"use client";

// Servicio para manejar configuración en el servidor
export async function loadRetoTargets(): Promise<Record<string, Record<string, boolean>>> {
  try {
    const res = await fetch("/api/faltas/config/retoTargets");
    if (res.ok) {
      const data = await res.json();
      return data.retoTargets || {};
    }
  } catch {}
  // Fallback a localStorage
  try {
    const raw = localStorage.getItem("calcular.retoTargets");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function loadHoursPerModule(): Promise<Record<string, number>> {
  try {
    const res = await fetch("/api/faltas/config/hoursPerModule");
    if (res.ok) {
      const data = await res.json();
      return data.hoursPerModule || {};
    }
  } catch {}
  // Fallback a localStorage
  try {
    const raw = localStorage.getItem("config.hoursPerModule");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveRetoTargets(retoTargets: Record<string, Record<string, boolean>>): Promise<void> {
  // Guardar en localStorage inmediatamente
  localStorage.setItem("calcular.retoTargets", JSON.stringify(retoTargets));
  
  // Guardar en servidor
  try {
    await fetch("/api/faltas/config/retoTargets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ retoTargets })
    });
  } catch {
    // Si falla el servidor, al menos tenemos localStorage
  }
}

export async function saveHoursPerModule(hoursPerModule: Record<string, number>): Promise<void> {
  // Guardar en localStorage inmediatamente
  localStorage.setItem("config.hoursPerModule", JSON.stringify(hoursPerModule));
  
  // Guardar en servidor
  try {
    await fetch("/api/faltas/config/hoursPerModule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hoursPerModule })
    });
  } catch {
    // Si falla el servidor, al menos tenemos localStorage
  }
}

