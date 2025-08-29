// src/pages/admin/Login.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { setToken } from "@/services/auth";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

// Opcional: usa o mesmo logo do Header
import logo from "@/assets/Icon/Listo/LiconW.png";
const logoSrc = (import.meta as any).env?.VITE_LOGO_URL || logo;

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
    <div className="min-h-[80vh] w-full bg-neutral-50">
      {/* Top bar com "Back to store" */}
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to store
        </Link>
      </div>

      {/* Container do card */}
      <div className="mx-auto grid max-w-sm place-items-center px-4 pb-16">
        {/* Logo */}
        <div className="mb-4">
          <img
            src={logoSrc}
            alt="Listo365"
            className="h-16 w-auto select-none"
            draggable={false}
          />
        </div>

        <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-1 text-center text-xl font-semibold tracking-tight text-neutral-900">
            Sign in
          </div>
          <p className="mb-5 text-center text-xs text-neutral-500">
            Use your staff credentials to access the dashboard.
          </p>

          {err && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {err}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                inputMode="email"
                className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                aria-invalid={!!err}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute inset-y-0 right-2 inline-flex items-center rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
                  aria-label={showPass ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPass ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              className={[
                "w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition",
                "bg-orange-600 hover:bg-orange-700 disabled:opacity-60",
              ].join(" ")}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-neutral-500">
            Access restricted to authorized staff.
          </p>
        </div>
      </div>
    </div>
  );
}
