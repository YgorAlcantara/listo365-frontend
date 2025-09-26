// src/components/cart/CartMenu.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { ShoppingBag, Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "./CartProvider";
import { money } from "@/utils/money";

type Props = {
  buttonClassName?: string;
  iconClassName?: string;
};

export function CartMenu({ buttonClassName, iconClassName }: Props) {
  const { items, subtotal, increment, decrement, remove } = useCart();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // fecha ao clicar fora
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const count = useMemo(
    () =>
      items.reduce(
        (acc, it) => acc + (Number.isFinite(it.quantity) ? it.quantity : 0),
        0
      ),
    [items]
  );
  const hasItems = count > 0;

  // subtotal numérico (ignora cotação)
  const numericSubtotal = useMemo(
    () =>
      items.reduce((sum, it) => {
        if (typeof it.price === "number") {
          const q = Number.isFinite(it.quantity) ? it.quantity : 0;
          return sum + it.price * q;
        }
        return sum;
      }, 0),
    [items]
  );
  const hasAnyNumeric = useMemo(
    () => items.some((it) => typeof it.price === "number"),
    [items]
  );
  const subtotalDisplay = hasAnyNumeric ? money.format(numericSubtotal) : "—";
  const showNote = !hasAnyNumeric && subtotal === 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={[
          "relative inline-flex items-center justify-center rounded-lg p-2 transition",
          "hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60",
          buttonClassName || "",
        ].join(" ")}
        aria-label="Open bag"
        aria-expanded={open}
      >
        <ShoppingBag
          className={["h-6 w-6", iconClassName || "text-white"].join(" ")}
        />
        {hasItems && (
          <span
            className={[
              "absolute -right-1 -top-1 min-w-[18px] rounded-full px-1.5",
              "bg-orange-600 text-white text-[11px] leading-5 text-center",
              "ring-2 ring-black",
            ].join(" ")}
          >
            {count}
          </span>
        )}
      </button>

      {/* Painel */}
      <div
        className={[
          "absolute mt-2 origin-top rounded-2xl border bg-white shadow-xl transition z-50",
          open
            ? "scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0",
          "w-[360px] right-0", // desktop
          "sm:right-0 sm:w-[360px]", // tablet/desktop mantém dropdown
          "max-sm:fixed max-sm:inset-x-0 max-sm:top-16 max-sm:mx-4 max-sm:w-auto", // mobile ocupa largura útil
        ].join(" ")}
      >
        <div className="max-h-[70vh] overflow-auto p-3">
          <h3 className="px-2 pb-2 text-sm font-semibold text-neutral-800">
            Your bag
          </h3>

          {!hasItems && (
            <div className="px-2 py-8 text-center text-sm text-neutral-500">
              Your bag is empty.
            </div>
          )}

          {hasItems && (
            <ul className="space-y-3">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center gap-3 rounded-xl border p-2"
                >
                  <div className="h-14 w-14 overflow-hidden rounded-lg bg-neutral-100 flex-shrink-0">
                    {it.imageUrl ? (
                      <img
                        src={it.imageUrl}
                        alt={it.name}
                        className="h-full w-full object-contain"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-neutral-900">
                      {it.name}
                    </div>
                    {it.variantName && (
                      <div className="text-xs text-neutral-500">
                        {it.variantName}
                      </div>
                    )}
                    <div className="mt-0.5 text-xs font-medium">
                      {typeof it.price === "number" ? (
                        money.format(it.price)
                      ) : (
                        <span className="text-orange-600">Quote</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-neutral-50"
                      onClick={() => decrement(it.id)}
                      aria-label="Decrease"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="w-8 text-center text-sm font-medium">
                      {it.quantity}
                    </div>
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-neutral-50"
                      onClick={() => increment(it.id)}
                      aria-label="Increase"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-red-50"
                    onClick={() => remove(it.id)}
                    aria-label="Remove"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">Subtotal</span>
            <span className="font-semibold text-neutral-900">
              {subtotalDisplay}
            </span>
          </div>
          {showNote && (
            <p className="mt-1 text-[11px] text-neutral-500">
              * Quote-only items are not included in the subtotal.
            </p>
          )}

          <div className="mt-3">
            <Link
              to="/checkout"
              onClick={() => setOpen(false)}
              className={[
                "inline-flex w-full items-center justify-center rounded-xl",
                "border border-orange-600 bg-white px-4 py-2.5 text-sm font-semibold text-orange-600",
                "hover:bg-orange-50 transition",
              ].join(" ")}
            >
              Go to checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
