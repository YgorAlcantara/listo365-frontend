const KEY = "listo365.token";

export function getToken(): string {
  return localStorage.getItem(KEY) || "";
}
export function setToken(t: string) {
  localStorage.setItem(KEY, t);
}
export function clearToken() {
  localStorage.removeItem(KEY);
}
export function isAuthed() {
  return !!getToken();
}
