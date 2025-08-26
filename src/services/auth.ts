// src/services/auth.ts
// Simple token storage for admin auth (JWT)

const KEY = "listo365.token";

/** Return the saved JWT (or empty string if absent). */
export function getToken(): string {
  return localStorage.getItem(KEY) || "";
}

/** Save JWT */
export function setToken(t: string) {
  localStorage.setItem(KEY, t);
}

/** Remove JWT */
export function clearToken() {
  localStorage.removeItem(KEY);
}

/** Convenience boolean */
export function isAuthed(): boolean {
  return !!getToken();
}
