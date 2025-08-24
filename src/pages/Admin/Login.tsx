import { useState } from "react";
import { api } from "@/services/api";
import { setToken } from "@/services/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("admin@listo365.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      const r = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      setToken(r.data.token);
      navigate("/admin"); // entra no Admin
    } catch (err: any) {
      alert(err?.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Admin Login</h1>
      <form onSubmit={onSubmit} className="space-y-2">
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
        />
        <button
          disabled={loading}
          className="w-full rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
