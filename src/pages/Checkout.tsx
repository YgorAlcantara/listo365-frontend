import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { money } from "@/utils/money";
import { publicApi } from "@/services/api";

export default function Checkout() {
  const { items, increment, decrement, remove } = useCart();

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
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const el = formRef.current;
    if (el && !el.checkValidity()) {
      el.reportValidity();
      return;
    }

    if (items.length === 0) {
      alert("Your bag is empty.");
      return;
    }

    setSending(true);
    setSentOk(false);

    try {
      const payload = {
        customer: {
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          marketingOptIn: false,
          company: form.company || null,
        },
        address: {
          line1: form.line1,
          line2: form.line2 || null,
          district: form.district || null,
          city: form.city,
          state: form.state || null,
          postalCode: form.postalCode, // obrigatório agora
          country: "US",
        },
        items: items.map((it) => {
          const [pid, vid] = String(it.id).split("::");
          return {
            productId: pid,
            quantity: Number.isFinite(it.quantity) ? it.quantity ?? 1 : 1,
            unitPrice: typeof it.price === "number" ? it.price : undefined,
            variantId: it.variantId || vid || null,
            variantName: it.variantName || null,
          };
        }),
        note: form.note || null,
      };

      await publicApi.post("/orders", payload);

      for (const it of items) remove(it.id);

      setSentOk(true);
      setForm({
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
    } catch (err) {
      console.error("send order failed", err);
      alert("We couldn’t send your request. Please try again in a moment.");
    } finally {
      setSending(false);
    }
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

      <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
        {/* Review */}
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
                  const qty = Number.isFinite(it.quantity)
                    ? it.quantity ?? 0
                    : 0;
                  const lineTotal =
                    typeof it.price === "number"
                      ? money.format(it.price * qty)
                      : "—";

                  return (
                    <li
                      key={it.id}
                      className="grid gap-3 rounded-xl border p-2 sm:grid-cols-[64px,1fr,auto]"
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

                      {/* Info + controls */}
                      <div className="min-w-0">
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

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1">
                            <button
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-neutral-50"
                              onClick={() => decrement(it.id)}
                              aria-label="Decrease"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <div className="w-8 text-center text-sm font-medium">
                              {qty}
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
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-red-50"
                            onClick={() => remove(it.id)}
                            aria-label="Remove"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </div>

                      {/* Line total */}
                      <div className="justify-self-end text-right text-sm font-semibold text-neutral-900 sm:self-center">
                        {lineTotal}
                      </div>
                    </li>
                  );
                })}
              </ul>

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
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Contact Info</h2>
            {sentOk && (
              <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Sent! We’ll contact you shortly.
              </span>
            )}
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="space-y-4"
            noValidate
          >
            {/* Contact */}
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">
                  Full name <span className="text-red-600">*</span>
                </label>
                <input
                  required
                  minLength={2}
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
                  minLength={2}
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
                    Postal code <span className="text-red-600">*</span>
                  </label>
                  <input
                    required
                    // US ZIP 5 ou ZIP+4; altere se precisar de outro país
                    pattern="^\d{5}(-\d{4})?$"
                    title="Enter a valid 5-digit ZIP code (or ZIP+4)"
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
                disabled={sending}
                className="inline-flex w-full items-center justify-center rounded-xl border border-orange-600 bg-white px-4 py-2.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 disabled:opacity-60"
              >
                {sending ? "Sending…" : "Send request"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}