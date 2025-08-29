// src/components/Header.tsx
import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { CartMenu } from "@/components/cart/CartMenu";
import { useAuth } from "@/hooks/useAuth";

// SVG local (você já apontou pra pasta assets/logo)
import logo from "@/assets/logo/Lst365Logo4.png";
import AccentBar from "./ui/AccentBar";
// Ou use uma URL do .env se preferir CDN
const logoSrc = (import.meta as any).env?.VITE_LOGO_URL || logo;

const COLORS = {
  bg: "bg-black",
  text: "text-white",
  subtext: "text-neutral-300",
  hairline: "border-neutral-800",
  accentFrom: "from-red-600",
  accentTo: "to-orange-500",
};

const nav = [
  { to: "/", label: "Products" },
  { to: "/checkout", label: "Checkout" },
];

export function Header() {
  const { isAuthed } = useAuth();
  const adminLink = isAuthed ? "/admin" : "/admin/login";
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const close = () => setOpen(false);

  return (
    <header
      className={[
        "sticky top-0 z-50",
        COLORS.bg,
        "backdrop-blur supports-[backdrop-filter]:bg-black/90",
        "border-b",
        COLORS.hairline,
      ].join(" ")}
    >
      <div className="mx-auto flex h-32 lg:h-36 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-3"
          aria-label="Listo365 Cleaning Solutions"
          onClick={close}
        >
          <img
            src={logoSrc}
            alt="Listo365 Cleaning Solutions"
            className="h-14 md:h-20 lg:h-24 w-auto"
            draggable={false}
          />
        </Link>

        {/* Navegação desktop */}
        <nav className="hidden items-center gap-6 md:flex">
          {nav.map((item) => (
            <NavItem key={item.to} to={item.to} label={item.label} />
          ))}

          {/* Admin */}
          <NavItem to={adminLink} label="Admin" />

          {/* Cart - ícone branco + hover laranja */}
          <div className="ml-1">
            <CartMenu
              buttonClassName="text-white hover:bg-orange-500/15 focus-visible:ring-orange-500/60"
              iconClassName="text-white"
            />
          </div>
        </nav>

        {/* Mobile: cart + hambúrguer */}
        <div className="flex items-center gap-2 md:hidden">
          <CartMenu
            buttonClassName="text-white hover:bg-orange-500/15 focus-visible:ring-orange-500/60"
            iconClassName="text-white"
          />
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={[
              "inline-flex items-center justify-center rounded-lg p-2",
              "text-white/90 hover:text-white hover:bg-white/10",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60",
            ].join(" ")}
          >
            {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>
      </div>

      {/* Drawer mobile */}
      <div
        className={[
          "md:hidden border-t",
          COLORS.hairline,
          open ? "max-h-[60vh] opacity-100" : "max-h-0 opacity-0",
          "overflow-hidden transition-all duration-300 ease-out",
          COLORS.bg,
          COLORS.text,
        ].join(" ")}
      >
        <div className="px-4 py-3">
          <MobileItem
            to="/"
            label="Products"
            onClick={close}
            active={pathname === "/"}
          />
          <MobileItem
            to="/checkout"
            label="Checkout"
            onClick={close}
            active={pathname === "/checkout"}
          />
          <MobileItem
            to={adminLink}
            label="Admin"
            onClick={close}
            active={pathname.startsWith("/admin")}
          />
        </div>
      </div>
    </header>
  );
}

/* ---------- subcomponents ---------- */

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "group relative inline-flex items-center text-sm font-medium tracking-wide",
          isActive ? "text-white" : "text-white/80 hover:text-white",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 rounded",
          "px-1 py-1.5",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <span className="px-1">{label}</span>
          <span
            className={[
              "pointer-events-none absolute -bottom-0.5 left-1 right-1 h-[2px]",
              "origin-left scale-x-0 transition-transform duration-300",
              "rounded-full bg-gradient-to-r",
              COLORS.accentFrom,
              COLORS.accentTo,
              "group-hover:scale-x-100",
              isActive ? "scale-x-100" : "",
            ].join(" ")}
          />
        </>
      )}
    </NavLink>
  );
}

function MobileItem({
  to,
  label,
  onClick,
  active,
}: {
  to: string;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={[
        "flex items-center justify-between rounded-lg px-3 py-3",
        active ? "bg-white/10 text-white" : "text-white/90 hover:bg-white/5",
      ].join(" ")}
    >
      <span className="text-sm font-medium">{label}</span>
      <span
        className={[
          "ml-3 h-[2px] w-10 rounded-full bg-gradient-to-r",
          COLORS.accentFrom,
          COLORS.accentTo,
          active ? "opacity-100" : "opacity-40",
        ].join(" ")}
      />
    </Link>
  );
}
