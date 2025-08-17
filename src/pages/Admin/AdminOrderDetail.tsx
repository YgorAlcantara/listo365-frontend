// src/pages/Admin/AdminOrderDetail.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { toast } from "react-hot-toast";

type Order = any; // simplificado para manter curto (o objeto é o mesmo da listagem)

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
      const r = await api.get(`/orders/${id}`);
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

  async function setStatus(newStatus: string) {
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
        <div className="rounded-xl border bg-white p-4">
          {loading ? "Loading…" : "Order not found"}
        </div>
      </div>
    );
  }

  const qty =
    o.items?.reduce((acc: number, it: any) => acc + it.quantity, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order {o.id}</h1>
        <div className="flex gap-2">
          <Link to="/admin/orders" className="rounded border px-3 py-2 text-sm">
            Back
          </Link>
          <button
            className="rounded border px-3 py-2 text-sm"
            onClick={() => navigate(0)}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-4 space-y-2">
          <h2 className="text-lg font-semibold">Customer</h2>
          <div className="text-sm">
            <div>
              <b>Name:</b> {o.customer?.name}
            </div>
            <div>
              <b>Email:</b> {o.customer?.email}
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
            <b>Recurrence:</b> {o.recurrence || "—"}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 space-y-2">
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
                onClick={() => setStatus(s)}
                className={`rounded border px-3 py-2 text-sm ${
                  o.status === s
                    ? "bg-neutral-200 font-semibold"
                    : "hover:bg-neutral-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="text-sm mt-2">
            <b>Created:</b> {new Date(o.createdAt).toLocaleString()}
          </div>
          <div className="text-sm">
            <b>Items:</b> {qty}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">Items</h2>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-3 py-2 text-left">Product</th>
                <th className="px-3 py-2 text-left">Quantity</th>
                <th className="px-3 py-2 text-left">Unit Price</th>
              </tr>
            </thead>
            <tbody>
              {o.items.map((it: any) => (
                <tr key={it.id} className="border-t">
                  <td className="px-3 py-2">
                    {it.product?.name || it.productId}
                  </td>
                  <td className="px-3 py-2">{it.quantity}</td>
                  <td className="px-3 py-2">
                    ${Number(it.unitPrice).toFixed(2)}
                  </td>
                </tr>
              ))}
              {o.items.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-neutral-500" colSpan={3}>
                    No items.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 space-y-3">
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
