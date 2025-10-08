"use client";

import { useConfigWithSync } from "./useConfigWithSync";
import { loadRetoTargets, saveRetoTargets } from "@/lib/services/configRepository";

export type RetoTargets = Record<string, Record<string, boolean>>;

export function useRetoTargets() {
  return useConfigWithSync<RetoTargets>(loadRetoTargets, saveRetoTargets, []);
}


