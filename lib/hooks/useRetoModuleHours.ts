"use client";

import { useConfigWithSync } from "./useConfigWithSync";
import { loadRetoModuleHours, saveRetoModuleHours } from "@/lib/services/configRepository";

export type RetoModuleHours = Record<string, Record<string, number>>;

export function useRetoModuleHours() {
  return useConfigWithSync<RetoModuleHours>(loadRetoModuleHours, saveRetoModuleHours, []);
}
