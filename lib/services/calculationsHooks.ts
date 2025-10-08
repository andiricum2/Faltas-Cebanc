"use client";

import { postPlan, type CalculationPlanEntry as ApiCalculationPlanEntry, type CalculatePlanResponse } from "@/lib/services/apiClient";
import { useState, useCallback } from "react";

// Removed useCalculations: only planning via POST is supported

export function useCalculationPlan(dni: string | undefined) {
  const [planLoading, setPlanLoading] = useState(false);
  const [planResult, setPlanResult] = useState<CalculatePlanResponse | null>(null);

  const submitPlan = useCallback(async (entries: ApiCalculationPlanEntry[]) => {
    if (!dni) return null;
    setPlanLoading(true);
    try {
      const res = await postPlan(dni, entries);
      setPlanResult(res);
      return res;
    } finally {
      setPlanLoading(false);
    }
  }, [dni]);

  return { planLoading, planResult, submitPlan, setPlanResult };
}

