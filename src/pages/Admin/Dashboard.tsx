import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { toast } from "react-hot-toast";
import CategoryPicker from "@/components/admin/CategoryPicker";
import type { Product, Variant } from "@/types";
import {
  parseVariantsFromPackageSize,
  variantsToPackageSizeJson,
} from "@/utils/product";
import { fmtMoneyUSD, toNumberOrNull } from "@/utils/money";

import {
  FaEye,
  FaEyeSlash,
  FaEdit,
  FaArchive,
  FaBoxOpen,
  FaTrash,
  FaArrowUp,
  FaArrowDown,
  FaTag,
  FaPlus,
} from "react-icons/fa";

type ShowFilter = "active" | "archived" | "all";

type Form = {
  name: string;
  description: string;
  price: string; // preço base (fallback)
  stock: string;
  active: boolean;
  sortOrder: number;
  packageSize?: string;
  pdfUrl?: string;
  imageUrl?: string;
  categoryParentId?: string;
  categoryId?: string;
  imagesText: string;

  // Variantes (tamanho + preço)
  useVariants: boolean;
  variants: Variant[];

  // Visibilidade (mapeia para flags do backend)
  visiblePrice?: boolean;
  visiblePackageSize?: boolean;
  visiblePdf?: boolean;
  visibleImages?: boolean;
  visibleDescription?: boolean;
};

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
    useVariants: false,
    variants: [],
    visiblePrice: true,
    visiblePackageSize: true,
    visiblePdf: true,
    visibleImages: true,
    visibleDescription: true,
  };

  const [list, setList] = useState<Product[]>([]);
  const [form, setForm] = useState<Form>({ ...empty });
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // filtros/visão
  const [show, setShow] = useState<ShowFilter>("active");

  // modal de sale
  const [sale, setSale] = useState(() => ({
    productId: null as string | null,
    title: "Sale",
    mode: "percent" as "percent" | "price",
    percentOff: "10",
    priceOff: "",
    startsAt: defaultStartLocal(),
    endsAt: defaultEndLocal(),
    saving: false,
  }));

  function defaultStartLocal() {
    const d = new Date(Date.now() + 5 * 60 * 1000); // +5 min
    return toLocalInputValue(d);
  }
  function defaultEndLocal() {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 dias
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
      const p = await api.get<Product[]>("/products?sort=sortOrder&all=1");
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
    const priceNum = toNumberOrNull(String(form.price).replace(",", "."));
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
        price: form.useVariants
          ? toNumberOrNull(form.variants[0]?.price) ?? priceNum ?? 0
          : priceNum ?? 0,
        stock: stockNum,
        active: !!form.active,
        packageSize: form.useVariants
          ? variantsToPackageSizeJson(
              form.variants
                .map((v) => ({
                  label: v.label.trim(),
                  price: toNumberOrNull(v.price),
                }))
                .filter((v) => v.label)
            )
          : form.packageSize?.trim() || undefined,
        pdfUrl: form.pdfUrl?.trim() || undefined,
        imageUrl: form.imageUrl?.trim() || undefined,
        categoryId: form.categoryId || undefined,

        visiblePrice: form.visiblePrice,
        visiblePackageSize: form.visiblePackageSize,
        visiblePdf: form.visiblePdf,
        visibleImages: form.visibleImages,
        visibleDescription: form.visibleDescription,
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

    const variants = parseVariantsFromPackageSize(p.packageSize);
    const useVariants = variants.length > 0;

    // flags (aceita backend direto ou p.visibility)
    const flags = getFlags(p);

    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price ?? ""),
      stock: String(p.stock ?? "0"),
      active: p.active,
      sortOrder: p.sortOrder,
      packageSize: p.packageSize || "",
      pdfUrl: p.pdfUrl || "",
      imageUrl: p.imageUrl || "",
      categoryParentId: parentId,
      categoryId: catId,
      imagesText: (p.images || []).join("\n"),

      useVariants,
      variants: variants.length ? variants : [],

      visiblePrice: flags.visiblePrice,
      visiblePackageSize: flags.visiblePackageSize,
      visiblePdf: flags.visiblePdf,
      visibleImages: flags.visibleImages,
      visibleDescription: flags.visibleDescription,
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

  // ---------- helpers p/ flags ----------
  function getFlags(p: Product) {
    const a = p as any;
    return {
      visiblePrice: a.visiblePrice ?? p.visibility?.price ?? true,
      visiblePackageSize:
        a.visiblePackageSize ?? p.visibility?.packageSize ?? true,
      visiblePdf: a.visiblePdf ?? p.visibility?.pdf ?? true,
      visibleImages: a.visibleImages ?? p.visibility?.images ?? true,
      visibleDescription:
        a.visibleDescription ?? p.visibility?.description ?? true,
    };
  }

  async function toggleFlag(
    p: Product,
    key:
      | "visiblePrice"
      | "visiblePackageSize"
      | "visiblePdf"
      | "visibleImages"
      | "visibleDescription"
  ) {
    const current = getFlags(p)[key];
    const next = !current;

    // 1ª tentativa: PATCH parcial (se existir)
    try {
      await api.patch(`/products/${p.id}`, { [key]: next });
      await refresh();
      return;
    } catch {
      // fallback para PUT com payload mínimo (sem mexer em images)
      try {
        const payload: any = {
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          active: p.active,
          sortOrder: p.sortOrder,
          pdfUrl: p.pdfUrl ?? undefined,
          imageUrl: p.imageUrl ?? undefined,
          packageSize: p.packageSize ?? undefined,
          [key]: next,
        };
        await api.put(`/products/${p.id}`, payload);
        await refresh();
      } catch (e: any) {
        console.error(e);
        toast.error("Failed to toggle visibility");
      }
    }
  }

  // filtra na UI (já buscamos all=1)
  const visibleRows = useMemo(() => {
    return list.filter((p) => {
      if (show === "all") return true;
      if (show === "active") return p.active;
      return !p.active;
    });
  }, [list, show]);

  // preço para listagem (considera variantes)
  function priceSummary(p: Product) {
    const vs = parseVariantsFromPackageSize(p.packageSize);
    const prices = vs
      .map((v) => toNumberOrNull(v.price))
      .filter((n): n is number => n !== null);
    if (prices.length === 0) {
      // sem preço nas variantes → usa p.price? senão “Request a quote”
      return toNumberOrNull(p.price) != null
        ? fmtMoneyUSD(p.price)
        : "Request a quote";
    }
    const min = Math.min(...prices);
    return `from ${fmtMoneyUSD(min)}`;
  }

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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {editing ? "Edit product" : "New product"}
          </h2>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm({ ...empty });
              }}
              className="rounded border px-3 py-1.5 text-sm"
              disabled={loading}
            >
              New
            </button>
          )}
        </div>

        {/* visibilidades com FA */}
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["Price", "visiblePrice"],
              ["Package size", "visiblePackageSize"],
              ["PDF", "visiblePdf"],
              ["Images", "visibleImages"],
              ["Description", "visibleDescription"],
            ] as const
          ).map(([label, key]) => {
            const on = !!form[key];
            return (
              <button
                type="button"
                key={key}
                onClick={() => setForm((v) => ({ ...v, [key]: !on }))}
                className={`inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm ${
                  on ? "bg-white" : "bg-neutral-100"
                }`}
                title={`${label}: ${on ? "visible" : "hidden"}`}
              >
                {on ? <FaEye /> : <FaEyeSlash />}
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* toggle de variantes */}
        <div className="flex items-center gap-2 pt-1">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.useVariants}
              onChange={(e) =>
                setForm((v) => ({ ...v, useVariants: e.target.checked }))
              }
            />
            <span className="text-sm">Use variants (size & price)</span>
          </label>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          className="space-y-4"
        >
          {/* Variantes ou modo simples */}
          {form.useVariants ? (
            <div className="rounded border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Variants</h3>
                <button
                  type="button"
                  onClick={() =>
                    setForm((v) => ({
                      ...v,
                      variants: [...v.variants, { label: "", price: null }],
                    }))
                  }
                  className="inline-flex items-center gap-2 rounded border px-2 py-1 text-sm hover:bg-neutral-50"
                >
                  <FaPlus /> Add size
                </button>
              </div>

              {form.variants.length === 0 && (
                <div className="text-sm text-neutral-500">No variants yet.</div>
              )}

              {form.variants.map((vr, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_160px_auto]"
                >
                  <input
                    className="rounded border px-3 py-2 text-sm"
                    placeholder="Size label (e.g., 1 gal)"
                    value={vr.label}
                    onChange={(e) =>
                      setForm((v) => {
                        const next = [...v.variants];
                        next[idx] = { ...next[idx], label: e.target.value };
                        return { ...v, variants: next };
                      })
                    }
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    className="rounded border px-3 py-2 text-sm"
                    placeholder="Price (USD) or leave empty"
                    value={vr.price ?? ""}
                    onChange={(e) =>
                      setForm((v) => {
                        const val = e.target.value;
                        const num =
                          val === ""
                            ? null
                            : toNumberOrNull(val.replace(",", "."));
                        const next = [...v.variants];
                        next[idx] = { ...next[idx], price: num };
                        return { ...v, variants: next };
                      })
                    }
                  />
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded border px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={() =>
                      setForm((v) => ({
                        ...v,
                        variants: v.variants.filter((_, i) => i !== idx),
                      }))
                    }
                    title="Remove"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}

              <p className="text-[11px] text-neutral-500">
                Se o preço da variante ficar vazio, o cliente poderá adicionar
                ao carrinho como <i>“price on request”</i>.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Price (USD) *
                </label>
                <input
                  required
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="e.g., 19.99"
                  value={form.price}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, price: e.target.value }))
                  }
                  disabled={loading}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Package size
                </label>
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="e.g., 1 gal | 5 gal"
                  value={form.packageSize}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, packageSize: e.target.value }))
                  }
                  disabled={loading}
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  Você pode digitar múltiplos tamanhos separados por “|”.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Name *</label>
              <input
                required
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="Product name"
                value={form.name}
                onChange={(e) =>
                  setForm((v) => ({ ...v, name: e.target.value }))
                }
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Stock *</label>
              <input
                required
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="e.g., 12"
                value={form.stock}
                onChange={(e) =>
                  setForm((v) => ({ ...v, stock: e.target.value }))
                }
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                PDF URL (datasheet)
              </label>
              <input
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="/catalog/slug/datasheet.pdf or https://..."
                value={form.pdfUrl}
                onChange={(e) =>
                  setForm((v) => ({ ...v, pdfUrl: e.target.value }))
                }
                disabled={loading}
              />
              <p className="mt-1 text-[11px] text-neutral-500">
                Aceita caminhos relativos (<code>/catalog/…</code>) ou http(s).
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Legacy cover image (optional)
              </label>
              <input
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="/catalog/slug/1.jpg or https://..."
                value={form.imageUrl}
                onChange={(e) =>
                  setForm((v) => ({ ...v, imageUrl: e.target.value }))
                }
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Description *
              </label>
              <textarea
                required
                rows={3}
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="Short description"
                value={form.description}
                onChange={(e) =>
                  setForm((v) => ({ ...v, description: e.target.value }))
                }
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Images (one URL per line)
              </label>
              <textarea
                rows={4}
                className="w-full rounded border px-3 py-2 text-sm font-mono"
                placeholder={`/catalog/slug/1.jpg
/catalog/slug/2.jpg
/catalog/slug/3.jpg
/catalog/slug/4.jpg`}
                value={form.imagesText}
                onChange={(e) =>
                  setForm((v) => ({ ...v, imagesText: e.target.value }))
                }
                disabled={loading}
              />
              <p className="mt-1 text-[11px] text-neutral-500">
                A primeira imagem vira a capa. Também aceita URLs http(s).
              </p>
            </div>

            {/* Categorias */}
            <div className="md:col-span-2">
              <CategoryPicker
                parentId={form.categoryParentId}
                subcategoryId={form.categoryId}
                onChangeParent={(id) =>
                  setForm((v) => ({
                    ...v,
                    categoryParentId: id,
                    categoryId: undefined,
                  }))
                }
                onChangeSub={(id) => setForm((v) => ({ ...v, categoryId: id }))}
              />
            </div>

            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((v) => ({ ...v, active: e.target.checked }))
                }
                disabled={loading}
              />
              <span className="text-sm">Active</span>
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {editing
                ? loading
                  ? "Saving…"
                  : "Save changes"
                : loading
                ? "Creating…"
                : "Create"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm({ ...empty });
                }}
                className="rounded border px-4 py-2 text-sm"
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tabela */}
      <div className="overflow-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-3 py-2 text-left">Order</th>
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-left">Price</th>
              <th className="px-3 py-2 text-left">Stock</th>
              <th className="px-3 py-2 text-left">Visibility</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((p) => {
              const flags = getFlags(p);
              return (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => move(p.id, -1)}
                        className="rounded border px-2 py-1"
                        title="Move up"
                      >
                        <FaArrowUp />
                      </button>
                      <button
                        onClick={() => move(p.id, +1)}
                        className="rounded border px-2 py-1"
                        title="Move down"
                      >
                        <FaArrowDown />
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
                        {p.category.parent
                          ? `${p.category.parent.name} › `
                          : ""}
                        {p.category.name}
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{priceSummary(p)}</td>
                  <td className="px-3 py-2">{p.stock}</td>

                  {/* VISIBILITY INLINE */}
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2 text-neutral-700">
                      <button
                        className="rounded border px-2 py-1"
                        title={`Price: ${
                          flags.visiblePrice ? "visible" : "hidden"
                        }`}
                        onClick={() => toggleFlag(p, "visiblePrice")}
                      >
                        {flags.visiblePrice ? <FaEye /> : <FaEyeSlash />}
                      </button>
                      <button
                        className="rounded border px-2 py-1"
                        title={`Package size: ${
                          flags.visiblePackageSize ? "visible" : "hidden"
                        }`}
                        onClick={() => toggleFlag(p, "visiblePackageSize")}
                      >
                        {flags.visiblePackageSize ? <FaEye /> : <FaEyeSlash />}
                      </button>
                      <button
                        className="rounded border px-2 py-1"
                        title={`PDF: ${
                          flags.visiblePdf ? "visible" : "hidden"
                        }`}
                        onClick={() => toggleFlag(p, "visiblePdf")}
                      >
                        {flags.visiblePdf ? <FaEye /> : <FaEyeSlash />}
                      </button>
                      <button
                        className="rounded border px-2 py-1"
                        title={`Images: ${
                          flags.visibleImages ? "visible" : "hidden"
                        }`}
                        onClick={() => toggleFlag(p, "visibleImages")}
                      >
                        {flags.visibleImages ? <FaEye /> : <FaEyeSlash />}
                      </button>
                      <button
                        className="rounded border px-2 py-1"
                        title={`Description: ${
                          flags.visibleDescription ? "visible" : "hidden"
                        }`}
                        onClick={() => toggleFlag(p, "visibleDescription")}
                      >
                        {flags.visibleDescription ? <FaEye /> : <FaEyeSlash />}
                      </button>
                    </div>
                  </td>

                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => startEdit(p)}
                        className="inline-flex items-center gap-1 rounded border px-2 py-1"
                        title="Edit"
                      >
                        <FaEdit /> Edit
                      </button>

                      {p.active ? (
                        <button
                          onClick={() => archive(p.id)}
                          className="inline-flex items-center gap-1 rounded border px-2 py-1"
                          title="Archive"
                        >
                          <FaArchive /> Archive
                        </button>
                      ) : (
                        <button
                          onClick={() => unarchive(p.id)}
                          className="inline-flex items-center gap-1 rounded border px-2 py-1"
                          title="Unarchive"
                        >
                          <FaBoxOpen /> Unarchive
                        </button>
                      )}

                      <button
                        onClick={() => openSale(p)}
                        className="inline-flex items-center gap-1 rounded border px-2 py-1"
                        title="Schedule sale"
                      >
                        <FaTag /> Sale
                      </button>

                      <button
                        onClick={() => hardDelete(p.id, p.name)}
                        className="inline-flex items-center gap-1 rounded border px-2 py-1 text-red-600"
                        title="Delete permanently"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {visibleRows.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-neutral-500" colSpan={7}>
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Sale */}
      {sale.productId && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Schedule sale</h3>
              <button
                onClick={closeSale}
                className="rounded px-2 py-1 text-sm hover:bg-neutral-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Title</label>
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={sale.title}
                  onChange={(e) =>
                    setSale((s) => ({ ...s, title: e.target.value }))
                  }
                />
              </div>

              <div className="flex gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={sale.mode === "percent"}
                    onChange={() =>
                      setSale((s) => ({ ...s, mode: "percent" as const }))
                    }
                  />
                  Percent off
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={sale.mode === "price"}
                    onChange={() =>
                      setSale((s) => ({ ...s, mode: "price" as const }))
                    }
                  />
                  Price off (USD)
                </label>
              </div>

              {sale.mode === "percent" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Percent *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    step={1}
                    className="w-full rounded border px-3 py-2 text-sm"
                    value={sale.percentOff}
                    onChange={(e) =>
                      setSale((s) => ({ ...s, percentOff: e.target.value }))
                    }
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Price off (USD) *
                  </label>
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    className="w-full rounded border px-3 py-2 text-sm"
                    value={sale.priceOff}
                    onChange={(e) =>
                      setSale((s) => ({ ...s, priceOff: e.target.value }))
                    }
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Starts at *
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded border px-3 py-2 text-sm"
                    value={sale.startsAt}
                    onChange={(e) =>
                      setSale((s) => ({ ...s, startsAt: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Ends at *
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded border px-3 py-2 text-sm"
                    value={sale.endsAt}
                    onChange={(e) =>
                      setSale((s) => ({ ...s, endsAt: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={saveSale}
                  disabled={sale.saving}
                  className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {sale.saving ? "Scheduling…" : "Schedule"}
                </button>
                <button
                  onClick={closeSale}
                  className="rounded border px-4 py-2 text-sm"
                  disabled={sale.saving}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
