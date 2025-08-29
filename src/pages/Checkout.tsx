// src/pages/Checkout.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { money } from "@/utils/money";

export default function Checkout() {
  const { items, increment, decrement, remove } = useCart();

  // Subtotal só com itens que têm price numérico
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

  // Form (somente UI; mantém seu fluxo atual)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    line1: "",
    line2: "",
    district: "",
    city: "",
    state: "",
    postalCode: "",
    note: "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Mantive o comportamento neutro (não alterei seu fluxo/integração).
    // Se quiser que eu reative o POST /orders com os campos obrigatórios, eu ajusto depois.
    alert("Thanks! We’ll contact you shortly.");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Continue shopping
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-[1.1fr,0.9fr]">
        {/* Review (espelhado com a sacola) */}
        <section className="rounded-2xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Your items</h2>

          {items.length === 0 ? (
            <div className="rounded-xl border bg-neutral-50 p-6 text-sm text-neutral-600">
              Your bag is empty.{" "}
              <Link
                to="/"
                className="text-orange-600 underline decoration-dotted underline-offset-2 hover:text-orange-700"
              >
                Browse products
              </Link>
              .
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {items.map((it) => {
                  const lineTotal =
                    typeof it.price === "number"
                      ? money.format(it.price * (it.quantity ?? 0))
                      : "—";
                  return (
                    <li
                      key={it.id}
                      className="flex items-center gap-3 rounded-xl border p-2"
                    >
                      {/* Thumb */}
                      <div className="h-16 w-16 overflow-hidden rounded-lg bg-neutral-100">
                        {it.imageUrl ? (
                          <img
                            src={it.imageUrl}
                            alt={it.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : null}
                      </div>

                      {/* Info */}
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

                      {/* Qty (espelhado com a sacola) */}
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

                      {/* Remover (lixeira) */}
                      <button
                        className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-red-50"
                        onClick={() => remove(it.id)}
                        aria-label="Remove"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>

                      {/* Line total */}
                      <div className="w-20 text-right text-sm font-semibold text-neutral-900">
                        {lineTotal}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Subtotal (mesma regra da sacola) */}
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Subtotal</span>
                  <span className="font-semibold text-neutral-900">
                    {subtotalDisplay}
                  </span>
                </div>
                {!hasAnyNumeric && (
                  <p className="mt-1 text-[11px] text-neutral-500">
                    * Quote-only items are not included in the subtotal.
                  </p>
                )}
              </div>
            </>
          )}
        </section>

        {/* Form */}
        <section className="rounded-2xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Contact Info</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Contact */}
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">
                  Full name <span className="text-red-600">*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/60"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">
                  Company (optional)
                </label>
                <input
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/60"
                  placeholder="Your company"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/60"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">
                  Phone <span className="text-red-600">*</span>
                </label>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/60"
                  placeholder="(555) 000-0000"
                />
              </div>
            </div>

            {/* Address */}
            <div className="grid gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">
                  Address line 1 <span className="text-red-600">*</span>
                </label>
                <input
                  required
                  value={form.line1}
                  onChange={(e) => update("line1", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/60"
                  placeholder="Street address"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-700">
                    Address line 2 (optional)
                  </label>
                  <input
                    value={form.line2}
                    onChange={(e) => update("line2", e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/60"
                    placeholder="Apartment, suite, etc."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-700">
                    District (optional)
                  </label>
                  <input
                    value={form.district}
                    onChange={(e) => update("district", e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/60"
                    placeholder="Neighborhood"
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-neutral-700">
                    City <span className="text-red-600">*</span>
                  </label>
                  <input
                    required
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/60"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-700">
                    State (optional)
                  </label>
                  <input
                    value={form.state}
                    onChange={(e) => update("state", e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/60"
                    placeholder="State"
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-700">
                    Postal code (optional)
                  </label>
                  <input
                    value={form.postalCode}
                    onChange={(e) => update("postalCode", e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/60"
                    placeholder="ZIP / Postal code"
                  />
                </div>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">
                Additional notes (optional)
              </label>
              <textarea
                value={form.note}
                onChange={(e) => update("note", e.target.value)}
                rows={4}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/60"
                placeholder="Tell us anything we should know about this request."
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-xl border border-orange-600 bg-white px-4 py-2.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
              >
                Send request
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
