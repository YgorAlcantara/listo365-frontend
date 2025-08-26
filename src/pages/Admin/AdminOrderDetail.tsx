import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { toast } from "react-hot-toast";
import { money } from "@/utils/money";

type Order = {
  id: string;
  status: "RECEIVED" | "IN_PROGRESS" | "COMPLETED" | "REFUSED" | "CANCELLED";
  createdAt: string;
  note?: string | null;
  adminNote?: string | null;
  customer?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  address?: {
    line1: string;
    line2?: string | null;
    city: string;
    state?: string | null;
    postalCode?: string | null;
    country: string;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number | string;
    product?: { id: string; name: string; slug: string } | null;
    productId: string;
  }>;
};

const numberish = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [o, setO] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [adminNote, setAdminNote] = useState("");

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const r = await api.get<Order>(`/orders/${id}`);
      setO(r.data);
      setNote(r.data?.note || "");
      setAdminNote(r.data?.adminNote || "");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.error || "Failed to load order");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function setStatus(newStatus: Order["status"]) {
    if (!id) return;
    try {
      await api.patch(`/orders/${id}/status`, { status: newStatus });
      toast.success("Status updated");
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.error || "Failed to update status");
    }
  }

  async function saveNotes() {
    if (!id) return;
    try {
      await api.patch(`/orders/${id}/note`, { note, adminNote });
      toast.success("Notes saved");
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.error || "Failed to save notes");
    }
  }

  if (!o) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Order</h1>
          <Link to="/admin/orders" className="rounded border px-3 py-2 text-sm">
            Back
          </Link>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          {loading ? "Loading…" : "Order not found"}
        </div>
      </div>
    );
  }

  const qty = o.items?.reduce((acc, it) => acc + it.quantity, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order {o.id}</h1>
        <div className="flex gap-2">
          <Link to="/admin/orders" className="rounded border px-3 py-2 text-sm">
            Back
          </Link>
          <button
            className="rounded border px-3 py-2 text-sm hover:bg-neutral-50"
            onClick={() => navigate(0)}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-2xl border bg-white p-4">
          <h2 className="text-lg font-semibold">Customer</h2>
          <div className="text-sm">
            <div>
              <b>Name:</b> {o.customer?.name || "—"}
            </div>
            <div>
              <b>Email:</b> {o.customer?.email || "—"}
            </div>
            <div>
              <b>Phone:</b> {o.customer?.phone || "—"}
            </div>
          </div>

          <h3 className="mt-3 text-sm font-semibold">Address</h3>
          {o.address ? (
            <div className="text-sm">
              <div>{o.address.line1}</div>
              {o.address.line2 && <div>{o.address.line2}</div>}
              <div>
                {o.address.city}
                {o.address.state ? `, ${o.address.state}` : ""}{" "}
                {o.address.postalCode || ""}
              </div>
              <div>{o.address.country}</div>
            </div>
          ) : (
            <div className="text-sm text-neutral-500">No address</div>
          )}
          <div className="mt-3 text-sm">
            <b>Items:</b> {qty}
          </div>
          <div className="text-sm">
            <b>Created:</b> {new Date(o.createdAt).toLocaleString()}
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border bg-white p-4">
          <h2 className="text-lg font-semibold">Status</h2>
          <div className="flex flex-wrap gap-2">
            {[
              "RECEIVED",
              "IN_PROGRESS",
              "COMPLETED",
              "REFUSED",
              "CANCELLED",
            ].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s as Order["status"])}
                className={`rounded border px-3 py-2 text-sm ${
                  o.status === s
                    ? "bg-emerald-50 text-emerald-800 font-semibold border-emerald-200"
                    : "hover:bg-neutral-50"
                }`}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">Items</h2>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-3 py-2 text-left">Product</th>
                <th className="px-3 py-2 text-left">Quantity</th>
                <th className="px-3 py-2 text-left">Unit Price</th>
                <th className="px-3 py-2 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {o.items.map((it) => {
                const unit = numberish(it.unitPrice);
                return (
                  <tr key={it.id} className="border-t">
                    <td className="px-3 py-2">
                      {it.product?.name || it.productId}
                    </td>
                    <td className="px-3 py-2">{it.quantity}</td>
                    <td className="px-3 py-2">{money.format(unit)}</td>
                    <td className="px-3 py-2">
                      {money.format(unit * it.quantity)}
                    </td>
                  </tr>
                );
              })}
              {o.items.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-neutral-500" colSpan={4}>
                    No items.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border bg-white p-4">
        <h2 className="text-lg font-semibold">Notes</h2>
        <div>
          <label className="mb-1 block text-sm font-medium">Public note</label>
          <textarea
            rows={2}
            className="w-full rounded border px-3 py-2 text-sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Admin note</label>
          <textarea
            rows={2}
            className="w-full rounded border px-3 py-2 text-sm"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
          />
        </div>
        <div>
          <button
            onClick={saveNotes}
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Save notes
          </button>
        </div>
      </div>
    </div>
  );
}
