import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { setToken } from "@/services/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const _email = email.trim().toLowerCase();
    const _password = password.trim();
    if (!_email || !_password) {
      setErr("Please fill in your email and password.");
      return;
    }

    try {
      setLoading(true);
      const r = await api.post("/auth/login", {
        email: _email,
        password: _password,
      });
      setToken(r.data.token);
      navigate("/admin", { replace: true });
    } catch (error: any) {
      setErr(error?.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-sm place-items-center px-4">
      <div className="w-full rounded-2xl border bg-white p-6 shadow-sm">
        {/* Brand */}
        <div className="mb-4 flex items-center gap-2">
          <svg
            className="h-6 w-6 text-emerald-600"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm0 3.5a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 12 5.5ZM16.5 18h-9a1 1 0 0 1 0-2h3V11H8a1 1 0 0 1 0-2h4a1 1 0 0 1 1 1v6h3.5a1 1 0 0 1 0 2Z" />
          </svg>
          <div className="text-xl font-semibold tracking-tight">
            <span className="text-emerald-600">Listo</span>365 Admin
          </div>
        </div>

        <h1 className="mb-4 text-lg font-semibold">Sign in</h1>

        {err && (
          <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              aria-invalid={!!err}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <div className="flex">
              <input
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                className="w-full rounded-l-lg border px-3 py-2 text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="rounded-r-lg border border-l-0 px-3 text-sm text-neutral-600 hover:bg-neutral-50"
                aria-label={showPass ? "Hide password" : "Show password"}
                disabled={loading}
              >
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-3 text-center text-xs text-neutral-500">
          Access restricted to authorized staff.
        </p>
      </div>
    </div>
  );
}
