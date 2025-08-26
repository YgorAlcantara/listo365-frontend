import { useEffect, useState } from "react";
import {
  getToken as _get,
  setToken as _set,
  clearToken as _clear,
} from "@/services/auth";

type AuthState = {
  token: string | null;
  save: (token: string) => void;
  clear: () => void;
  isAuthed: boolean;
};

/**
 * useAuth
 * - Lê/escreve o token no localStorage via services/auth
 * - Sincroniza entre abas (storage event)
 * - Exponde flags/utilitários simples
 */
export function useAuth(): AuthState {
  const [token, setTokenState] = useState<string | null>(null);

  // boot: carrega token atual
  useEffect(() => {
    setTokenState(_get() || null);
  }, []);

  // sync entre abas
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "listo365.token") {
        setTokenState(_get() || null);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const save = (t: string) => {
    _set(t);
    setTokenState(t);
  };

  const clear = () => {
    _clear();
    setTokenState(null);
  };

  return { token, save, clear, isAuthed: !!token };
}
