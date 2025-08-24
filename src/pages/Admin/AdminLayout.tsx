import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { clearToken } from "@/services/auth";
import { api } from "@/services/api";

type Me = { id: string; email: string; name: string; role: string };

export default function AdminLayout() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(null);

  // carrega /auth/me só pra exibir e ter fallback se o token estiver inválido
  useEffect(() => {
    api
      .get("/auth/me")
      .then((r) => setMe(r.data))
      .catch(() => {
        clearToken();
        navigate("/admin/login", { replace: true });
      });
  }, [navigate]);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `block rounded px-3 py-2 text-sm ${
      isActive ? "bg-neutral-200 font-semibold" : "hover:bg-neutral-100"
    }`;

  function logout() {
    clearToken();
    navigate("/"); // volta p/ site público
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="rounded border px-2 py-1 text-sm"
              title="Voltar ao site"
            >
              ← Site
            </button>
            <div className="text-lg font-semibold">Admin</div>
          </div>

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

          <div className="flex items-center gap-3">
            {me && (
              <span className="hidden text-xs text-neutral-600 md:inline">
                {me.email} · {me.role}
              </span>
            )}
            <button
              onClick={logout}
              className="rounded bg-black px-2 py-1 text-xs text-white"
              title="Sair do Admin"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="hidden rounded-xl border bg-white p-3 md:block">
          <nav className="space-y-1">
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
        </aside>

        {/* Conteúdo */}
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
