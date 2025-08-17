import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `block rounded px-3 py-2 text-sm ${
      isActive ? "bg-neutral-200 font-semibold" : "hover:bg-neutral-100"
    }`;

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="text-lg font-semibold">Admin</div>
          <nav className="hidden gap-2 md:flex">
            <NavLink to="/admin" className={linkCls}>
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
