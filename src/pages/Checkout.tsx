import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { api } from "@/services/api";
import { money } from "@/utils/money";
import { useCart } from "@/components/cart/CartProvider";
import {
  Plus,
  Minus,
  Trash2,
  Loader2,
  CheckCircle2,
  Info,
  ArrowLeft,
} from "lucide-react";

// ---- Validation (Zod) ----
const digits = (raw: unknown) => String(raw ?? "").replace(/\D/g, "");
const PhoneDigits = z
  .string()
  .transform(digits)
  .refine(
    (d) =>
      d.length === 0 ||
      d.length === 10 ||
      (d.length === 11 && d.startsWith("1")),
    "Enter a valid US phone number (10 digits, or 1 + 10 digits)."
  );

const FormSchema = z.object({
  name: z
    .string()
    .trim()
    .regex(
      /^[\p{L}\s'-]{2,60}$/u,
      "Name must contain only letters (2–60 chars)"
    ),
  email: z.string().email("Invalid email").max(254),
  phone: PhoneDigits.optional(),
  note: z.string().max(300).optional(),
});

type Form = { name: string; email: string; phone: string; note: string };
type Errors = Partial<Record<keyof Form, string>>;

const isPriced = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

export default function Checkout() {
  const { items, total, inc, dec, remove, clear } = useCart();

  const hasUnpriced = useMemo(
    () => items.some((i) => !isPriced(i.price)),
    [items]
  );

  const [form, setForm] = useState<Form>({
    name: "",
    email: "",
    phone: "",
    note: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const disabled = status !== "idle";
  const topRef = useRef<HTMLDivElement>(null);

  function setField<K extends keyof Form>(k: K, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  }

  async function sendOrder() {
    const parsed = FormSchema.safeParse(form);
    if (!parsed.success) {
      const e: Errors = {};
      parsed.error.errors.forEach((err) => {
        const path = err.path[0] as keyof Form;
        e[path] = err.message;
      });
      setErrors(e);
      return;
    }
    if (items.length === 0) {
      setErrors((prev) => ({ ...prev, note: "Your cart is empty." }));
      return;
    }

    try {
      setStatus("sending");

      // Map cart -> API payload (backend expects { customer, items[], note })
      const payloadItems = items.map((i) => {
        const [productId] = i.id.split("::");
        return {
          productId,
          quantity: i.quantity,
          unitPrice: isPriced(i.price) ? i.price : 0,
        };
      });

      await api.post("/orders", {
        customer: {
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone || null,
          marketingOptIn: false,
        },
        address: null,
        items: payloadItems,
        note: parsed.data.note || null,
      });

      clear();
      setForm({ name: "", email: "", phone: "", note: "" });
      setStatus("sent");

      setTimeout(
        () => topRef.current?.scrollTo({ top: 0, behavior: "smooth" }),
        50
      );
      setTimeout(() => setStatus("idle"), 1500);
    } catch (e) {
      console.error(e);
      setStatus("idle");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6" ref={topRef}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue shopping
        </Link>
      </div>

      {status === "sent" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Request sent — we’ll get back within 20 minutes.
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_340px]">
        {/* Items */}
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Items</h2>
          {items.length === 0 ? (
            <p className="text-sm text-neutral-600">
              Your cart is empty.{" "}
              <Link to="/" className="text-emerald-700 underline">
                Browse products
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-3">
                  <div
                    className="h-16 w-16 flex-shrink-0 rounded-lg bg-neutral-100"
                    style={{
                      backgroundImage: `url(${i.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{i.name}</div>
                    <div className="text-xs text-neutral-500">
                      {isPriced(i.price)
                        ? `${money.format(i.price)} each`
                        : "Quote required"}
                    </div>
                    <div className="mt-1 inline-flex items-center gap-2">
                      <button
                        onClick={() => !disabled && dec(i.id)}
                        disabled={disabled}
                        className="rounded border px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-50"
                        aria-label="Decrease"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm tabular-nums">{i.quantity}</span>
                      <button
                        onClick={() => !disabled && inc(i.id)}
                        disabled={disabled}
                        className="rounded border px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-50"
                        aria-label="Increase"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {isPriced(i.price)
                        ? money.format(i.quantity * (i.price ?? 0))
                        : "—"}
                    </div>
                    <button
                      onClick={() => !disabled && remove(i.id)}
                      disabled={disabled}
                      className="mt-1 inline-flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Summary + Contact */}
        <div className="space-y-4">
          <div className="rounded-2xl border bg-white p-4">
            <h2 className="mb-2 text-lg font-semibold">Summary</h2>
            {!hasUnpriced ? (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Subtotal</span>
                <span className="text-sm font-bold">{money.format(total)}</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-xs text-neutral-700">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                Some items require a quote. Subtotal will appear after pricing.
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-4">
            <h2 className="mb-2 text-lg font-semibold">Contact</h2>
            <div className="space-y-2">
              <div>
                <input
                  type="text"
                  inputMode="text"
                  maxLength={60}
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    errors.name ? "border-red-500" : ""
                  }`}
                  placeholder="Name *"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  disabled={disabled}
                />
                {errors.name && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <input
                  type="email"
                  maxLength={254}
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    errors.email ? "border-red-500" : ""
                  }`}
                  placeholder="Email *"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  disabled={disabled}
                />
                {errors.email && (
                  <p className="mt-1 text-[11px] text-red-600">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    errors.phone ? "border-red-500" : ""
                  }`}
                  placeholder="Phone (optional)"
                  value={form.phone}
                  onChange={(e) =>
                    setField(
                      "phone",
                      e.target.value.replace(/\D/g, "").slice(0, 11)
                    )
                  }
                  disabled={disabled}
                />
                {errors.phone && (
                  <p className="mt-1 text-[11px] text-red-600">
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <textarea
                  rows={2}
                  maxLength={300}
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    errors.note ? "border-red-500" : ""
                  }`}
                  placeholder="Notes (optional)"
                  value={form.note}
                  onChange={(e) => setField("note", e.target.value)}
                  disabled={disabled}
                />
                {errors.note && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.note}</p>
                )}
              </div>

              <button
                onClick={sendOrder}
                disabled={disabled || items.length === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {status === "sending" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {status === "sent" && <CheckCircle2 className="h-4 w-4" />}
                {status === "idle" && "Send request"}
                {status === "sending" && "Sending…"}
                {status === "sent" && "Sent!"}
              </button>

              <p className="text-center text-[11px] text-neutral-500">
                We’ll get back within 20 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
