import { useEffect, useState } from "react";
import {
  getToken as _get,
  setToken as _set,
  clearToken as _clear,
} from "@/services/auth";

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => setTokenState(_get()), []);

  const save = (t: string) => {
    _set(t);
    setTokenState(t);
  };
  const clear = () => {
    _clear();
    setTokenState(null);
  };

  return { token, save, clear };
}
