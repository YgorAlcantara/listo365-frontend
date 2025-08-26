import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { CartMenu } from "@/components/cart/CartMenu";
import { isAuthed, clearToken } from "@/services/auth";
import { Menu, X } from "lucide-react";

function LogoSvg(props: React.SVGProps<SVGSVGElement>) {
  // Marca Listo365 em SVG (paleta: emerald #059669, orange #ea580c)
  return (
    <svg viewBox="0 0 140 32" aria-hidden="true" {...props}>
      <g>
        <circle cx="16" cy="16" r="14" fill="#059669" />
        <path
          d="M10.5 16.2l3.4 3.6 7.2-9.2"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
      <text
        x="36"
        y="21"
        fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto"
        fontWeight="700"
        fontSize="16"
        fill="#0f172a"
      >
        Listo
      </text>
      <text
        x="78"
        y="21"
        fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto"
        fontWeight="700"
        fontSize="16"
        fill="#ea580c"
      >
        365
      </text>
    </svg>
  );
}

export function Header() {
  const nav = useNavigate();
  const authed = isAuthed();
  const [open, setOpen] = useState(false);

  function logout() {
    clearToken();
    nav("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link
          to="/"
          className="flex items-center gap-2"
          aria-label="Listo365 home"
        >
          <LogoSvg className="h-8 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm hover:text-emerald-700">
            Products
          </Link>

          {authed ? (
            <>
              <Link to="/admin" className="text-sm hover:text-emerald-700">
                Admin
              </Link>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:underline"
                aria-label="Logout"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/admin/login" className="text-sm hover:text-emerald-700">
              Admin
            </Link>
          )}

          <CartMenu />
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-3 md:hidden">
          <CartMenu />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="inline-flex items-center justify-center rounded-lg border p-2"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="md:hidden">
          <div className="mx-auto max-w-7xl px-4 pb-3">
            <nav className="space-y-1 rounded-2xl border bg-white p-3">
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm hover:bg-emerald-50"
              >
                Products
              </Link>
              {authed ? (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-emerald-50"
                  >
                    Admin
                  </Link>
                  <button
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/admin/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm hover:bg-emerald-50"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
