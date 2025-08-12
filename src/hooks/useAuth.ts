import { useEffect, useState } from 'react';

const TOKEN_KEY = 'listo365.token';

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY));
  }, []);

  const save = (t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };

  const clear = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  return { token, save, clear };
}
