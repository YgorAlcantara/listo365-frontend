import { useEffect, useState } from "react";
import { api } from "@/services/api";
import type { Product } from "@/types";
import CategoryPicker from "@/components/admin/CategoryPicker";
import { toast } from "react-hot-toast";

/** ===== helpers de dinheiro seguros ===== */
type MoneyLike = number | string | null | undefined;
function numberish(v: MoneyLike): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
function fmtMoney(v: MoneyLike): string {
  return `$${numberish(v).toFixed(2)}`;
}
/** ====================================== */

type Form = {
  name: string;
  description: string;
  price: string;
  stock: string;
  active: boolean;
  sortOrder: number;
  packageSize?: string;
  pdfUrl?: string;
  imageUrl?: string;
  categoryParentId?: string;
  categoryId?: string;
  imagesText: string;
};

type SaleForm = {
  productId: string | null;
  title: string;
  mode: "percent" | "price";
  percentOff: string;
  priceOff: string;
  startsAt: string;
  endsAt: string;
  saving: boolean;
};

type ShowFilter = "active" | "archived" | "all";

export default function Dashboard() {
  const empty: Form = {
    name: "",
    description: "",
    price: "",
    stock: "0",
    active: true,
    sortOrder: 0,
    packageSize: "",
    pdfUrl: "",
    imageUrl: "",
    categoryParentId: "",
    categoryId: "",
    imagesText: "",
  };

  const [list, setList] = useState<Product[]>([]);
  const [form, setForm] = useState<Form>({ ...empty });
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [show, setShow] = useState<ShowFilter>("active");

  const [sale, setSale] = useState<SaleForm>(() => ({
    productId: null,
    title: "Sale",
    mode: "percent",
    percentOff: "10",
    priceOff: "",
    startsAt: defaultStartLocal(),
    endsAt: defaultEndLocal(),
    saving: false,
  }));

  function defaultStartLocal() {
    const d = new Date(Date.now() + 5 * 60 * 1000);
    return toLocalInputValue(d);
  }
  function defaultEndLocal() {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return toLocalInputValue(d);
  }
  function toLocalInputValue(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  async function refresh() {
    try {
      // ?all=1 -> backend só libera price/flags se for ADMIN (token no header)
      const p = await api.get("/products?sort=sortOrder&all=1");
      setList(p.data);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.error || "Failed to load products");
    }
  }
  useEffect(() => {
    refresh();
  }, []);

  function parseImages(text: string) {
    return text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function save() {
    const priceNum = parseFloat(String(form.price).replace(",", "."));
    if (!(priceNum > 0)) {
      toast.error("Price must be a positive number (USD).");
      return;
    }
    const stockNum = parseInt(String(form.stock || "0"), 10);
    if (!(stockNum >= 0)) {
      toast.error("Stock must be 0 or more.");
      return;
    }
    const imgs = parseImages(form.imagesText);

    setLoading(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: priceNum,
        stock: stockNum,
        active: !!form.active,
        packageSize: form.packageSize?.trim() || undefined,
        pdfUrl: form.pdfUrl?.trim() || undefined,
        imageUrl: form.imageUrl?.trim() || undefined,
        categoryId: form.categoryId || undefined,
      };
      if (imgs.length > 0) payload.images = imgs;

      if (editing) {
        await api.put(`/products/${editing}`, payload);
        toast.success("Product updated");
      } else {
        await api.post("/products", payload);
        toast.success("Product created");
      }

      setForm({ ...empty });
      setEditing(null);
      await refresh();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.error || "Failed to save product");
    } finally {
      setLoading(false);
    }
  }

  async function archive(id: string) {
    try {
      await api.patch(`/products/${id}/archive`, {});
      toast.success("Archived");
      await refresh();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.error || "Failed to archive");
    }
  }
  async function unarchive(id: string) {
    try {
      await api.patch(`/products/${id}/unarchive`, {});
      toast.success("Unarchived");
      await refresh();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.error || "Failed to unarchive");
    }
  }

  async function hardDelete(id: string, name: string) {
    const sure = prompt(
      `Type the product name to confirm hard delete:\n${name}`
    );
    if (sure !== name) return;
    try {
      await api.delete(`/products/${id}/hard`);
      toast.success("Deleted permanently");
      await refresh();
    } catch (e: any) {
      console.error(e);
      const msg =
        e?.response?.status === 409
          ? "Product has related orders. Archive instead."
          : e?.response?.data?.error || "Failed to hard delete";
      toast.error(msg);
    }
  }

  async function move(id: string, dir: -1 | 1) {
    const p = list.find((x) => x.id === id);
    if (!p) return;
    try {
      await api.patch(`/products/${id}/sort-order`, {
        sortOrder: (p.sortOrder || 0) + dir * 10,
      });
      await refresh();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.error || "Failed to reorder");
    }
  }

  function startEdit(p: Product) {
    setEditing(p.id);
    const parentId = p.category?.parent?.id || "";
    const catId = p.category?.id || "";
    setForm({
      name: p.name,
      description: p.description,
      price: String(numberish(p.price) || ""),
      stock: String(p.stock ?? "0"),
      active: p.active,
      sortOrder: p.sortOrder,
      packageSize: p.packageSize || "",
      pdfUrl: p.pdfUrl || "",
      imageUrl: p.imageUrl || "",
      categoryParentId: parentId,
      categoryId: catId,
      imagesText: (p.images || []).join("\n"),
    });
  }

  function openSale(p: Product) {
    setSale({
      productId: p.id,
      title: "Sale",
      mode: "percent",
      percentOff: "10",
      priceOff: "",
      startsAt: defaultStartLocal(),
      endsAt: defaultEndLocal(),
      saving: false,
    });
  }
  function closeSale() {
    setSale((s) => ({ ...s, productId: null }));
  }
  async function saveSale() {
    if (!sale.productId) return;

    if (sale.mode === "percent" && !(parseInt(sale.percentOff, 10) > 0)) {
      toast.error("PercentOff must be >= 1");
      return;
    }
    if (sale.mode === "price" && !(parseFloat(sale.priceOff) > 0)) {
      toast.error("PriceOff must be > 0");
      return;
    }
    const starts = new Date(sale.startsAt);
    const ends = new Date(sale.endsAt);
    if (!(starts < ends)) {
      toast.error("Start must be before end");
      return;
    }

    setSale((s) => ({ ...s, saving: true }));
    try {
      const payload: any = {
        title: sale.title || "Sale",
        startsAt: starts.toISOString(),
        endsAt: ends.toISOString(),
        active: true,
      };
      if (sale.mode === "percent") {
        payload.percentOff = parseInt(sale.percentOff, 10);
      } else {
        payload.priceOff = parseFloat(sale.priceOff);
      }

      await api.put(`/products/${sale.productId}/sale`, payload);
      toast.success("Sale scheduled");
      closeSale();
      await refresh();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.error || "Failed to schedule sale");
    } finally {
      setSale((s) => ({ ...s, saving: false }));
    }
  }

  const visible = list.filter((p) => {
    if (show === "all") return true;
    if (show === "active") return p.active;
    return !p.active;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold">Admin — Products</h1>

        <div className="flex items-center gap-2">
          <label className="text-sm">Show:</label>
          <select
            className="rounded border px-2 py-1 text-sm"
            value={show}
            onChange={(e) => setShow(e.target.value as ShowFilter)}
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold">
          {editing ? "Edit product" : "New product"}
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          className="space-y-4"
        >
          {/* ... form igual ao seu ... */}
          {/* (mantido sem alterações além do submit handler) */}
        </form>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-3 py-2 text-left">Order</th>
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-left">Price</th>
              <th className="px-3 py-2 text-left">Stock</th>
              <th className="px-3 py-2 text-left">Active</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-2">
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => move(p.id, -1)}
                      className="rounded border px-2 py-1"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(p.id, +1)}
                      className="rounded border px-2 py-1"
                    >
                      ↓
                    </button>
                    <span className="ml-2 text-xs text-neutral-500">
                      {p.sortOrder}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-neutral-500 line-clamp-2">
                    {p.description}
                  </div>
                </td>
                <td className="px-3 py-2">
                  {p.category ? (
                    <span className="text-xs">
                      {p.category.parent ? `${p.category.parent.name} › ` : ""}
                      {p.category.name}
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-400">—</span>
                  )}
                </td>
                {/* <- AQUI trocado: sem .toFixed */}
                <td className="px-3 py-2">{fmtMoney(p.price)}</td>
                <td className="px-3 py-2">{p.stock}</td>
                <td className="px-3 py-2">
                  {p.active ? (
                    "Yes"
                  ) : (
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs">
                      Archived
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => startEdit(p)}
                      className="rounded border px-2 py-1"
                    >
                      Edit
                    </button>
                    {p.active ? (
                      <button
                        onClick={() => archive(p.id)}
                        className="rounded border px-2 py-1"
                      >
                        Archive
                      </button>
                    ) : (
                      <button
                        onClick={() => unarchive(p.id)}
                        className="rounded border px-2 py-1"
                      >
                        Unarchive
                      </button>
                    )}
                    <button
                      onClick={() => openSale(p)}
                      className="rounded border px-2 py-1"
                    >
                      Schedule sale
                    </button>
                    <button
                      onClick={() => hardDelete(p.id, p.name)}
                      className="rounded border px-2 py-1 text-red-600"
                    >
                      Delete permanently
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-neutral-500" colSpan={7}>
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Sale (inalterado) */}
      {sale.productId && (
        /* ... seu modal como já está ... */
        <></>
      )}
    </div>
  );
}
