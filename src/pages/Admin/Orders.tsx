import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/services/api";
import { money } from "@/utils/money";
import type { OrderInquiry, OrderItem, OrderStatus, Page } from "@/types";
import { toast } from "react-hot-toast";

const STATUSES: Array<"ALL" | OrderStatus> = [
  "ALL",
  "RECEIVED",
  "IN_PROGRESS",
  "COMPLETED",
  "REFUSED",
  "CANCELLED",
];

function statusBadge(s: OrderStatus) {
  const base = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
  switch (s) {
    case "RECEIVED":
      return `${base} bg-orange-100 text-orange-700`;
    case "IN_PROGRESS":
      return `${base} bg-amber-100 text-amber-700`;
    case "COMPLETED":
      return `${base} bg-emerald-100 text-emerald-700`;
    case "REFUSED":
      return `${base} bg-rose-100 text-rose-700`;
    case "CANCELLED":
      return `${base} bg-neutral-200 text-neutral-700`;
  }
}

function fmtDate(s?: string) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

function asNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function sumItems(items: OrderItem[]) {
  return items.reduce((acc, it) => acc + it.quantity * asNumber(it.unitPrice), 0);
}

export default function AdminOrders() {
  const [tab, setTab] = useState<"ALL" | OrderStatus>("ALL");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Page<OrderInquiry>>({
    total: 0,
    page: 1,
    pageSize,
    rows: [],
  });

  const reqIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrderInquiry | null>(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(data.total / pageSize)),
    [data.total, pageSize]
  );

  async function fetchList({ keepPage = false }: { keepPage?: boolean } = {}) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const myId = ++reqIdRef.current;

    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (q.trim()) params.q = q.trim();
      if (tab !== "ALL") params.status = tab;

      const r = await api.get<Page<OrderInquiry>>("/orders", {
        params,
        signal: controller.signal as any,
      });

      if (myId === reqIdRef.current) {
        setData(r.data);
      }
    } catch (e: any) {
      if (e?.name === "CanceledError" || e?.message === "canceled") return;
      console.error(e);
      toast.error(e?.response?.data?.error || "Failed to load orders");
    } finally {
      if (myId === reqIdRef.current) setLoading(false);
    }
  }

  async function fetchDetail(id: string) {
    try {
      const r = await api.get<OrderInquiry>(`/orders/${id}`);
      setDetail(r.data);
      setNote(r.data.note || "");
      setAdminNote(r.data.adminNote || "");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.error || "Failed to load order");
    }
  }

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page]);

  useEffect(() => {
    if (openId) fetchDetail(openId);
    else setDetail(null);
  }, [openId]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchList();
  }

  async function changeStatus(next: OrderStatus) {
    if (!detail) return;

    if (next === "COMPLETED") {
      const ok = confirm(
        "Mark this order as COMPLETED?\nThis will decrement product stock based on item quantities."
      );
      if (!ok) return;
    }
    if (detail.status === "COMPLETED" && next !== "COMPLETED") {
      const ok = confirm(
        "You are leaving COMPLETED status.\nThis will add back item quantities to product stock. Continue?"
      );
      if (!ok) return;
    }

    setSaving(true);

    const prev = detail.status;
    setDetail({ ...detail, status: next });
    setData((d) => ({
      ...d,
      rows: d.rows.map((o) => (o.id === detail.id ? { ...o, status: next } : o)),
    }));

    try {
      await api.patch(`/orders/${detail.id}/status`, { status: next });
      toast.success(`Status changed to ${next.replace("_", " ")}`);
      await Promise.all([fetchDetail(detail.id), fetchList({ keepPage: true })]);
    } catch (e: any) {
      setDetail((d) => (d ? { ...d, status: prev } : d));
      setData((d) => ({
        ...d,
        rows: d.rows.map((o) => (o.id === detail.id ? { ...o, status: prev } : o)),
      }));
      console.error(e);
      toast.error(e?.response?.data?.error || "Failed to change status");
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    if (!detail) return;
    setSaving(true);
    try {
      await api.patch(`/orders/${detail.id}/note`, { note, adminNote });
      toast.success("Notes saved");
      await Promise.all([fetchDetail(detail.id), fetchList({ keepPage: true })]);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.error || "Failed to save notes");
    } finally {
      setSaving(false);
    }
  }

  async function downloadCsv() {
    try {
      const res = await api.get(`/orders/export/csv`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "orders.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to export CSV");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Admin — Orders</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchList({ keepPage: true })}
            className="rounded border px-3 py-2 text-sm hover:bg-neutral-50"
            disabled={loading}
            title="Refresh list"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            onClick={downloadCsv}
            className="rounded bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800"
          >
            Export orders (CSV)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setTab(s);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1 text-sm border ${
              tab === s ? "bg-black text-white border-black" : "bg-white hover:bg-neutral-50"
            }`}
          >
            {s === "ALL" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={onSearch} className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by id, customer, email, phone…"
          className="w-96 max-w-full rounded-lg border px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
        <button
          className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Loading…" : "Search"}
        </button>
      </form>

      {/* Table */}
      <div className="overflow-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-3 py-2 text-left">Created</th>
              <th className="px-3 py-2 text-left">Customer</th>
              <th className="px-3 py-2 text-left">Items</th>
              <th className="px-3 py-2 text-left">Total (snapshot)</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((o) => (
              <tr key={o.id} className="border-t align-top">
                <td className="px-3 py-2 whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                <td className="px-3 py-2">
                  <div className="font-medium">{o.customer?.name || "—"}</div>
                  <div className="mt-0.5 grid gap-0.5 text-xs text-neutral-600">
                    <span>{o.customer?.email || "—"}</span>
                    <span>{o.customer?.phone || "—"}</span>
                    {o.address ? (
                      <span className="text-[11px] text-neutral-500">
                        {[o.address.city || "", o.address.state || "", o.address.country || ""]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    ) : (
                      <span className="text-[11px] text-neutral-400">—</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">{o.items.length}</td>
                <td className="px-3 py-2">{money.format(sumItems(o.items))}</td>
                <td className="px-3 py-2">
                  <span className={statusBadge(o.status)}>{o.status.replace("_", " ")}</span>
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => setOpenId(o.id)}
                    className="rounded border px-2 py-1 hover:bg-neutral-50"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {data.rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-neutral-500" colSpan={6}>
                  {loading ? "Loading…" : "No orders found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-2">
        <button
          className="rounded border px-3 py-1 text-sm disabled:opacity-50"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <div className="text-sm">
          Page <b>{data.page}</b> of <b>{totalPages}</b> — {data.total} orders
        </div>
        <button
          className="rounded border px-3 py-1 text-sm disabled:opacity-50"
          disabled={page >= totalPages || loading}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>

      {/* Drawer */}
      {openId && detail && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setOpenId(null)} />
          <div className="w-full max-w-xl overflow-auto bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Order {detail.id}</h3>
              <button onClick={() => setOpenId(null)} className="rounded border px-2 py-1 text-sm">
                Close
              </button>
            </div>

            <div className="mt-2 text-xs text-neutral-500">{fmtDate(detail.createdAt)}</div>
            <div className="mt-2">
              {detail.status && (
                <span className={statusBadge(detail.status)}>
                  {detail.status.replace("_", " ")}
                </span>
              )}
            </div>

            {/* Customer */}
            <div className="mt-4 rounded-2xl border bg-white p-3">
              <h4 className="mb-2 font-medium">Customer</h4>
              <div className="text-sm">
                <div>
                  <b>Name:</b> {detail.customer?.name || "—"}
                </div>
                <div>
                  <b>Email:</b> {detail.customer?.email || "—"}
                </div>
                <div>
                  <b>Phone:</b> {detail.customer?.phone || "—"}
                </div>
                <div>
                  <b>Marketing opt-in:</b>{" "}
                  {detail.customer?.marketingOptIn ? "Yes" : "No"}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="mt-4 rounded-2xl border bg-white p-3">
              <h4 className="mb-2 font-medium">Address</h4>
              {detail.address ? (
                <div className="text-sm">
                  <div>{detail.address.line1}</div>
                  {detail.address.line2 && <div>{detail.address.line2}</div>}
                  <div>
                    {detail.address.city}
                    {detail.address.state ? `, ${detail.address.state}` : ""}{" "}
                    {detail.address.postalCode || ""}
                  </div>
                  <div>{detail.address.country}</div>
                </div>
              ) : (
                <div className="text-sm text-neutral-500">—</div>
              )}
            </div>

            {/* Items */}
            <div className="mt-4 rounded-2xl border bg-white p-3">
              <h4 className="mb-2 font-medium">Items</h4>
              <div className="space-y-2">
                {detail.items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">
                        {it.product?.name || it.productId}
                      </div>
                      <div className="text-xs text-neutral-500">
                        Qty: {it.quantity} · Unit: {money.format(asNumber(it.unitPrice))}
                      </div>
                    </div>
                    <div className="font-medium">
                      {money.format(it.quantity * asNumber(it.unitPrice))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t pt-2 text-right font-semibold">
                Total: {money.format(sumItems(detail.items))}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4 space-y-3 rounded-2xl border bg-white p-3">
              <h4 className="font-medium">Notes</h4>
              <div>
                <label className="mb-1 block text-sm">Customer note</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full rounded border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Admin note</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  className="w-full rounded border px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveNotes}
                  disabled={saving}
                  className="rounded bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save notes"}
                </button>
              </div>
            </div>

            {/* Status actions */}
            <div className="mt-4 rounded-2xl border bg-white p-3">
              <h4 className="mb-2 font-medium">Change status</h4>
              <div className="flex flex-wrap gap-2">
                {(["RECEIVED", "IN_PROGRESS", "COMPLETED", "REFUSED", "CANCELLED"] as OrderStatus[]).map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => changeStatus(s)}
                      disabled={saving || detail.status === s}
                      className={`rounded px-3 py-2 text-sm border disabled:opacity-50 ${
                        detail.status === s ? "bg-neutral-200" : "hover:bg-neutral-50"
                      }`}
                    >
                      {s.replace("_", " ")}
                    </button>
                  )
                )}
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                Completing an order decreases product stock by item quantities.
                Leaving COMPLETED restores stock.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}