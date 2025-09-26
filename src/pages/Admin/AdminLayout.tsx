// src/pages/admin/AdminLayout.tsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { clearToken } from "@/services/auth";
import { api } from "@/services/api";
import { ArrowLeft, Menu, X } from "lucide-react";
import logo from "@/assets/Icon/Listo/LiconW.png";

type Me = { id: string; email: string; name: string; role: string };

export default function AdminLayout() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await api.get<Me>("/auth/me");
        if (alive) setMe(r.data);
      } catch {
        clearToken();
        navigate("/admin/login", { replace: true });
      }
    })();
    return () => {
      alive = false;
    };
  }, [navigate]);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    [
      "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isActive
        ? "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200"
        : "text-neutral-700 hover:bg-neutral-100",
    ].join(" ");

  function logout() {
    clearToken();
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Topbar */}
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          {/* Left: back + brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 px-2.5 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-50"
              title="Back to store"
            >
              <ArrowLeft className="h-4 w-4" />
              Store
            </button>

            <div className="ml-1 flex items-center gap-2">
              <img
                src={logo}
                alt="Listo365"
                className="h-6 w-auto select-none"
                draggable={false}
              />
              <div className="text-lg font-semibold tracking-tight text-neutral-900">
                Admin
              </div>
            </div>
          </div>

          {/* Top nav (desktop) */}
          <nav className="hidden gap-2 md:flex">
            <NavLink to="/admin" className={linkCls} end>
              Products
            </NavLink>
            <NavLink to="/admin/orders" className={linkCls}>
              Orders
            </NavLink>
            <NavLink to="/admin/categories" className={linkCls}>
              Categories
            </NavLink>
            <NavLink to="/admin/promotions" className={linkCls}>
              Promotions
            </NavLink>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden rounded-lg p-2 hover:bg-neutral-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* User / actions (desktop only for now) */}
          <div className="hidden md:flex items-center gap-3">
            {me && (
              <span className="text-xs text-neutral-600">
                {me.email} · {me.role}
              </span>
            )}
            <button
              onClick={logout}
              className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-100"
              title="Sign out"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white px-4 py-3 space-y-2">
            <NavLink to="/admin" className={linkCls} end onClick={() => setMobileOpen(false)}>
              Products
            </NavLink>
            <NavLink to="/admin/orders" className={linkCls} onClick={() => setMobileOpen(false)}>
              Orders
            </NavLink>
            <NavLink to="/admin/categories" className={linkCls} onClick={() => setMobileOpen(false)}>
              Categories
            </NavLink>
            <NavLink to="/admin/promotions" className={linkCls} onClick={() => setMobileOpen(false)}>
              Promotions
            </NavLink>
            <button
              onClick={() => {
                setMobileOpen(false);
                logout();
              }}
              className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
            >
              Logout
            </button>
          </div>
        )}
      </header>

      {/* Sem sidebar — só conteúdo */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
