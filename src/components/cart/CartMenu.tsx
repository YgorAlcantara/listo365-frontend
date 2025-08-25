import { useCart } from "./CartProvider";
import { useEffect, useRef, useState } from "react";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/services/api";
import { fmtMoneyUSD } from "@/utils/money";
import { z } from "zod";

const usDigits = (raw: unknown) => String(raw ?? "").replace(/\D/g, "");
const PhoneDigits = z
  .string()
  .transform(usDigits)
  .refine(
    (d) =>
      d.length === 0 ||
      d.length === 10 ||
      (d.length === 11 && d.startsWith("1")),
    "Enter a valid US phone number (10 digits, e.g., 8135551234, or 1 + 10 digits)."
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

export function CartMenu() {
  const { items, count, total, inc, dec, remove, clear } = useCart();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [form, setForm] = useState<Form>({
    name: "",
    email: "",
    phone: "",
    note: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const disabled = status !== "idle";

  function setField<K extends keyof Form>(k: K, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  }

  // gera nota complementar com variantes e itens que precisam de cotação
  function buildExtraNote(): string {
    const needs = items.filter((i) => i.needsQuote);
    const withVar = items.filter((i) => i.variant);
    const lines: string[] = [];

    if (withVar.length) {
      lines.push("Variants:");
      withVar.forEach((i) =>
        lines.push(
          `- ${i.name}${i.variant ? ` (size: ${i.variant})` : ""} x${
            i.quantity
          }`
        )
      );
    }
    if (needs.length) {
      lines.push("Items requiring quote (price TBD):");
      needs.forEach((i) =>
        lines.push(
          `- ${i.name}${i.variant ? ` (${i.variant})` : ""} x${i.quantity}`
        )
      );
    }
    return lines.join("\n");
  }

  async function sendRequest() {
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
      const extra = buildExtraNote();
      const finalNote =
        [parsed.data.note?.trim(), extra.trim()].filter(Boolean).join("\n\n") ||
        undefined;

      await api.post("/orders", {
        customerName: parsed.data.name,
        customerEmail: parsed.data.email,
        customerPhone: parsed.data.phone || undefined,
        note: finalNote,
        items: items.map((i) => ({
          productId: i.id,
          quantity: i.quantity,
          unitPrice: i.price ?? 0, // backend espera número; 0 quando for cotação
        })),
      });

      clear();
      setForm({ name: "", email: "", phone: "", note: "" });
      setStatus("sent");
      setTimeout(() => {
        setStatus("idle");
        setOpen(false);
      }, 1200);
    } catch (e) {
      console.error(e);
      setStatus("idle");
    }
  }

  const quoteCount = items.filter((i) => i.needsQuote).length;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex items-center justify-center rounded-lg border px-3 py-2 hover:border-emerald-500"
        aria-label="Open cart"
      >
        <ShoppingBag className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-semibold text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[380px] overflow-hidden rounded-2xl border bg-white shadow-xl">
          <div className="max-h-[70vh] divide-y overflow-auto">
            {/* items */}
            <div className="p-3">
              <h3 className="mb-2 text-sm font-semibold">Your Cart</h3>
              {items.length === 0 ? (
                <p className="text-sm text-neutral-500">Your cart is empty.</p>
              ) : (
                <ul className="space-y-3">
                  {items.map((i) => (
                    <li
                      key={`${i.id}-${i.variant ?? ""}`}
                      className="flex items-center gap-3"
                    >
                      <div
                        className="h-14 w-14 flex-shrink-0 rounded-lg bg-neutral-100"
                        style={{
                          backgroundImage: `url(${i.imageUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {i.name}
                        </div>
                        {i.variant && (
                          <div className="text-[11px] text-neutral-500">
                            Size: {i.variant}
                          </div>
                        )}
                        <div className="text-xs text-neutral-500">
                          {i.needsQuote
                            ? "Price TBD"
                            : `${fmtMoneyUSD(i.price)} each`}
                        </div>
                        <div className="mt-1 inline-flex items-center gap-2">
                          <button
                            onClick={() => !disabled && dec(i.id, 1, i.variant)}
                            disabled={disabled}
                            className="rounded border px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-50"
                            aria-label="Decrease"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm tabular-nums">
                            {i.quantity}
                          </span>
                          <button
                            onClick={() => !disabled && inc(i.id, 1, i.variant)}
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
                          {i.needsQuote
                            ? "—"
                            : fmtMoneyUSD(i.quantity * (i.price ?? 0))}
                        </div>
                        <button
                          onClick={() => !disabled && remove(i.id, i.variant)}
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

            {/* summary */}
            <div className="px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Subtotal</span>
                <span className="text-sm font-bold">{fmtMoneyUSD(total)}</span>
              </div>
              {quoteCount > 0 && (
                <div className="mt-1 text-[11px] text-amber-700">
                  {quoteCount} item(s) require a quote — price will be
                  confirmed.
                </div>
              )}
            </div>

            {/* inline checkout form */}
            <div className="space-y-2 p-3">
              <div className="grid grid-cols-1 gap-2">
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
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.name}
                    </p>
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
                    placeholder="Phone (US: 10 digits, e.g., 8135551234)"
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
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.note}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={sendRequest}
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
                We’ll get back within 20 minutes. Phone is optional.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
