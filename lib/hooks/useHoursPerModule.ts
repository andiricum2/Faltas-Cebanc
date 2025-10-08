"use client";

import { useConfigWithSync } from "./useConfigWithSync";
import { loadHoursPerModule, saveHoursPerModule } from "@/lib/services/configRepository";

export type HoursPerModule = Record<string, number>;

export function useHoursPerModule() {
  return useConfigWithSync<HoursPerModule>(loadHoursPerModule, saveHoursPerModule, []);
}


