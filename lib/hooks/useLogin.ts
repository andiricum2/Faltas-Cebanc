import { loadRememberedCredentials, saveRememberedCredentials } from "@/lib/services/credentials";
import { useState, useCallback } from "react";
import type { Role } from "@/lib/types/faltas";

interface LoginCredentials {
  role: Role;
  username: string;
  password: string;
}

interface UseLoginOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useLogin(options: UseLoginOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loginApi = useCallback(async (payload: LoginCredentials) => {
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
  }, []);

  const login = useCallback(async (
    credentials: LoginCredentials, 
    remember: boolean = true
  ) => {
    setError(null);
    setSuccess(false);
    setLoading(true);
    
    try {
      await loginApi(credentials);
      
      if (remember) {
        await saveRememberedCredentials(credentials);
      } else {
        await saveRememberedCredentials(null);
      }
      
      setSuccess(true);
      options.onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.message || "Error de autenticación";
      setError(errorMessage);
      options.onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loginApi, options]);

  const autoLogin = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const creds = await loadRememberedCredentials();
      if (!creds) {
        setLoading(false);
        return false;
      }
      
      await loginApi(creds);
      setSuccess(true);
      options.onSuccess?.();
      return true;
    } catch (err: any) {
      console.warn("Auto-login failed:", err?.message || err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loginApi, options]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    success,
    login,
    autoLogin,
    clearError,
  };
}
