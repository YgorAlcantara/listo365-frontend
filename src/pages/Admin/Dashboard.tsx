import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import type { Product, ProductVisibility } from "@/types";
import CategoryPicker from "@/components/admin/CategoryPicker";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faPlus,
  faTrash,
  faArrowUp,
  faArrowDown,
  faBoxArchive,
  faBoxOpen,
  faBan,
  faSkullCrossbones,
} from "@fortawesome/free-solid-svg-icons";

type Form = {
  name: string;
  description: string;
  price: string;
  stock: string;
  active: boolean;
  sortOrder: number; // não renderizamos; ordena só pelas setas
  packageSize?: string;
  pdfUrl?: string;
  imageUrl?: string;
  categoryParentId?: string;
  categoryId?: string;
  imagesText: string;
  visibility: ProductVisibility;
};

type VariantForm = {
  id?: string;
  name: string;
  price: string;
  stock: string;
  active: boolean;
  sku?: string;
};

type ActiveFilter = "all" | "active" | "archived";
type StockFilter = "all" | "zero";

type Cat = { id: string; name: string; slug: string; children?: Cat[] };

const CACHE_KEY = "admin.products.v1";

export default function Dashboard() {
  const empty: Form = {
    name: "",
    description: "",
    price: "0",
    stock: "0",
    active: true,
    sortOrder: 0,
    packageSize: "",
    pdfUrl: "",
    imageUrl: "",
    categoryParentId: "",
    categoryId: "",
    imagesText: "",
    visibility: {
      price: false,
      packageSize: true,
      pdf: true,
      images: true,
      description: true,
    },
  };

  const [list, setList] = useState<Product[]>([]);
  const [form, setForm] = useState<Form>({ ...empty });
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // filtros & busca
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [cats, setCats] = useState<Cat[]>([]);
  const [parentFilter, setParentFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  function readCache(): Product[] | null {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return null;
      return parsed as Product[];
    } catch {
      return null;
    }
  }
  function writeCache(items: Product[]) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(items));
    } catch {}
  }

  async function refreshLight() {
    try {
      const p = await api.get<Product[]>("/products?sort=sortOrder&all=1");
      const data = (p.data || []).sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      );
      setList(data);
      writeCache(data);
    } catch (e: any) {
      console.error(e);
    }
  }

  // SWR: mostra cache instantâneo e revalida em bg
  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setList(cached);
      // revalida em background
      refreshLight();
    } else {
      refreshLight();
    }
    api
      .get<Cat[]>("/categories")
      .then((r) => setCats(r.data || []))
      .catch(() => setCats([]));
  }, []);

  function startEdit(p: Product) {
    setEditing(p.id);
    const parentId = p.category?.parent?.id || "";
    const catId = p.category?.id || "";
    setForm({
      name: p.name,
      description: p.description ?? "",
      price: String(typeof p.price === "number" ? p.price : "0"),
      stock: String(p.stock ?? "0"),
      active: p.active,
      sortOrder: p.sortOrder,
      packageSize: p.packageSize || "",
      pdfUrl: p.pdfUrl || "",
      imageUrl: p.imageUrl || "",
      categoryParentId: parentId,
      categoryId: catId,
      imagesText: (p.images || []).join("\n"),
      visibility: {
        price: p.visibility?.price ?? false,
        packageSize: p.visibility?.packageSize ?? true,
        pdf: p.visibility?.pdf ?? true,
        images: p.visibility?.images ?? true,
        description: p.visibility?.description ?? true,
      },
    });
    setVariants(
      Array.isArray((p as any).variants)
        ? (p as any).variants.map((v: any) => ({
            id: v.id,
            name: v.name ?? "",
            price: String(v.price ?? "0"),
            stock: String(v.stock ?? "0"),
            active: !!v.active,
            sku: v.sku || "",
          }))
        : []
    );
  }

  function cancelEdit() {
    setEditing(null);
    setForm({ ...empty });
    setVariants([]);
  }

  function addVariant() {
    setVariants((v) => [
      ...v,
      { name: "", price: "0", stock: "0", active: true },
    ]);
  }
  function rmVariant(idx: number) {
    setVariants((v) => v.filter((_, i) => i !== idx));
  }

  // -------- SALVAR (100% otimista, sem esperar request) --------
  async function save() {
    const priceNum = parseFloat(String(form.price).replace(",", "."));
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      toast.error("Baseline price must be >= 0.");
      return;
    }
    const stockNum = parseInt(String(form.stock || "0"), 10);
    if (!(stockNum >= 0)) {
      toast.error("Stock must be 0 or more.");
      return;
    }
    const imgs = form.imagesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const variantsPayload = variants
      .map((v, i) => {
        const n = Number(String(v.price).replace(",", "."));
        const safePrice = Number.isFinite(n) ? n : 0;
        return {
          ...(v.id ? { id: v.id } : {}),
          name: v.name.trim(),
          price: safePrice,
          stock: parseInt(String(v.stock || "0"), 10) || 0,
          sortOrder: (i + 1) * 10, // auto
          active: !!v.active,
          sku: v.sku?.trim() || undefined,
        };
      })
      .filter((v) => !!v.name);

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
      images: imgs,
      visibility: {
        price: !!form.visibility.price,
        packageSize: !!form.visibility.packageSize,
        pdf: !!form.visibility.pdf,
        images: !!form.visibility.images,
        description: !!form.visibility.description,
      },
      variants: variantsPayload,
    };

    setLoading(true);

    if (editing) {
      const before = list;
      const existing = list.find((x) => x.id === editing)!;
      const optimistic = {
        ...existing,
        ...payload,
        id: existing.id,
        slug: existing.slug,
        category: existing.category,
        sale: existing.sale,
        sortOrder: existing.sortOrder,
      } as Product;

      // aplica instantâneo
      setList((prev) => prev.map((x) => (x.id === editing ? optimistic : x)));
      writeCache(list.map((x) => (x.id === editing ? optimistic : x)));
      // fecha o form na hora
      cancelEdit();

      // dispara request em background; consolida/rollback
      api
        .put<Product>(`/products/${editing}`, payload)
        .then((r) =>
          setList((prev) => prev.map((x) => (x.id === editing ? r.data : x)))
        )
        .catch((e: any) => {
          setList(before);
          writeCache(before);
          toast.error(e?.response?.data?.error || "Failed to save product");
        })
        .finally(() => setLoading(false));
      toast.success("Product updated");
    } else {
      const tempId = `tmp-${Date.now()}`;
      const optimistic = {
        id: tempId,
        name: payload.name,
        description: payload.description,
        price: payload.price,
        stock: payload.stock,
        active: payload.active,
        sortOrder: (list.at(-1)?.sortOrder ?? 0) + 10,
        packageSize: payload.packageSize,
        pdfUrl: payload.pdfUrl,
        imageUrl: payload.imageUrl,
        images: payload.images,
        category: undefined,
        sale: undefined,
        slug: "",
        visibility: payload.visibility,
        variants: payload.variants,
      } as unknown as Product;

      const after = [...list, optimistic].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      );
      setList(after);
      writeCache(after);
      cancelEdit();

      api
        .post<Product>("/products", payload)
        .then((r) =>
          setList((prev) => prev.map((x) => (x.id === tempId ? r.data : x)))
        )
        .catch((e: any) => {
          const revert = list;
          setList(revert);
          writeCache(revert);
          toast.error(e?.response?.data?.error || "Failed to create product");
        })
        .finally(() => setLoading(false));

      toast.success("Product created");
    }
  }

  // -------- ações (100% otimistas, sem refresh) --------
  function moveSort(p: Product, delta: number) {
    const before = list;
    const after = [...list]
      .map((x) =>
        x.id === p.id ? { ...x, sortOrder: (x.sortOrder ?? 0) + delta } : x
      )
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    setList(after);
    writeCache(after);
    api
      .patch(`/products/${p.id}/sort-order`, {
        sortOrder: (p.sortOrder ?? 0) + delta,
      })
      .catch(() => {
        setList(before);
        writeCache(before);
        toast.error("Failed to reorder");
      });
  }

  function archiveProduct(p: Product) {
    const before = list;
    const after = list.map((x) =>
      x.id === p.id ? { ...x, active: false } : x
    );
    setList(after);
    writeCache(after);
    api.patch(`/products/${p.id}/archive`).catch(() => {
      setList(before);
      writeCache(before);
      toast.error("Failed to archive");
    });
  }
  function unarchiveProduct(p: Product) {
    const before = list;
    const after = list.map((x) => (x.id === p.id ? { ...x, active: true } : x));
    setList(after);
    writeCache(after);
    api.patch(`/products/${p.id}/unarchive`).catch(() => {
      setList(before);
      writeCache(before);
      toast.error("Failed to unarchive");
    });
  }
  function deleteProduct(p: Product) {
    if (
      !confirm(
        `Delete "${p.name}"?\n\nIf this product has related orders, it will be archived instead of deleted.`
      )
    )
      return;
    const before = list;
    const after = list.filter((x) => x.id !== p.id);
    setList(after);
    writeCache(after);
    api.delete(`/products/${p.id}`).catch(() => {
      setList(before);
      writeCache(before);
      toast.error("Failed to delete");
    });
  }
  function deleteProductHard(p: Product) {
    if (
      !confirm(
        `PERMANENTLY delete "${p.name}"?\n\nThis cannot be undone. Only works if the product has no related orders.`
      )
    )
      return;
    const before = list;
    const after = list.filter((x) => x.id !== p.id);
    setList(after);
    writeCache(after);
    api.delete(`/products/${p.id}/hard`).catch(() => {
      setList(before);
      writeCache(before);
      toast.error("Failed to hard-delete");
    });
  }

  function toggleActiveHeader() {
    setActiveFilter((f) =>
      f === "all" ? "active" : f === "active" ? "archived" : "all"
    );
  }
  function toggleStockHeader() {
    setStockFilter((f) => (f === "all" ? "zero" : "all")); // só All / 0
  }
  function toggleActiveRow(p: Product) {
    if (p.active) return archiveProduct(p);
    return unarchiveProduct(p);
  }

  const parentOptions = useMemo(
    () =>
      cats
        .map((c) => ({ id: c.id, label: c.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [cats]
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return list.filter((p) => {
      const passSearch = term
        ? (p.name || "").toLowerCase().includes(term)
        : true;
      const passActive =
        activeFilter === "all"
          ? true
          : activeFilter === "active"
          ? p.active
          : !p.active;
      const passStock = stockFilter === "all" ? true : (p.stock ?? 0) === 0;
      const passParent =
        parentFilter === "all"
          ? true
          : p.category?.parent?.id === parentFilter ||
            p.category?.id === parentFilter;
      return passSearch && passActive && passStock && passParent;
    });
  }, [list, search, activeFilter, stockFilter, parentFilter]);

  const smallBtn =
    "inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-neutral-50";
  const chip =
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold"></h1>
      </div>

      {/* Form */}
      <div className="space-y-3 rounded-2xl border bg-white p-4">
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
              <label className="mb-1 block text-sm font-medium">
                Baseline price (USD)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="e.g., 19.99 (can be 0 when using variants)"
                value={form.price}
                onChange={(e) =>
                  setForm((v) => ({ ...v, price: e.target.value }))
                }
                disabled={loading}
              />
              <p className="mt-1 text-[11px] text-neutral-500">
                Used when there are no variants or as a fallback. You can set 0.
              </p>
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
                Package size
              </label>
              <input
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="e.g., 1 gal / 32 oz"
                value={form.packageSize}
                onChange={(e) =>
                  setForm((v) => ({ ...v, packageSize: e.target.value }))
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
                First image becomes the cover.
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

          {/* Visibilidade */}
          <div className="space-y-2 rounded-2xl border p-3">
            <div className="mb-1 text-sm font-semibold">Visibility</div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["price", "Price"],
                  ["packageSize", "Package size"],
                  ["pdf", "PDF"],
                  ["images", "Images"],
                  ["description", "Description"],
                ] as Array<[keyof ProductVisibility, string]>
              ).map(([k, label]) => {
                const on = form.visibility[k];
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() =>
                      setForm((v) => ({
                        ...v,
                        visibility: { ...v.visibility, [k]: !on },
                      }))
                    }
                    className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm hover:bg-neutral-50"
                  >
                    <FontAwesomeIcon icon={on ? faEye : faEyeSlash} />
                    {label}: {on ? "Visible" : "Hidden"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Variantes com títulos (sem sort manual) */}
          <div className="space-y-3 rounded-2xl border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Variants</h3>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm hover:bg-neutral-50"
              >
                <FontAwesomeIcon icon={faPlus} /> Add
              </button>
            </div>

            {variants.length === 0 && (
              <p className="text-sm text-neutral-500">
                No variants. You can sell a single-price product or add options
                here.
              </p>
            )}

            {variants.length > 0 && (
              <div className="grid grid-cols-1 gap-2 text-xs text-neutral-500 md:grid-cols-[1fr_140px_120px_110px]">
                <div>Size / variant</div>
                <div>Price (0 allowed)</div>
                <div>Stock</div>
                <div>Actions</div>
              </div>
            )}

            {variants.map((v, i) => (
              <div
                key={i}
                className="grid gap-2 md:grid-cols-[1fr_140px_120px_110px]"
              >
                <input
                  className="rounded border px-3 py-2 text-sm"
                  placeholder="Size (e.g., 1 gal / 32 oz)"
                  value={v.name}
                  onChange={(e) =>
                    setVariants((a) =>
                      a.map((x, idx) =>
                        idx === i ? { ...x, name: e.target.value } : x
                      )
                    )
                  }
                />
                <input
                  className="rounded border px-3 py-2 text-sm"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min={0}
                  value={v.price}
                  onChange={(e) =>
                    setVariants((a) =>
                      a.map((x, idx) =>
                        idx === i ? { ...x, price: e.target.value } : x
                      )
                    )
                  }
                />
                <input
                  className="rounded border px-3 py-2 text-sm"
                  placeholder="0"
                  type="number"
                  step="1"
                  min={0}
                  value={v.stock}
                  onChange={(e) =>
                    setVariants((a) =>
                      a.map((x, idx) =>
                        idx === i ? { ...x, stock: e.target.value } : x
                      )
                    )
                  }
                />
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={v.active}
                      onChange={(e) =>
                        setVariants((a) =>
                          a.map((x, idx) =>
                            idx === i ? { ...x, active: e.target.checked } : x
                          )
                        )
                      }
                    />
                    Active
                  </label>
                  <button
                    type="button"
                    onClick={() => rmVariant(i)}
                    className="rounded border px-2 py-1 text-sm text-red-600"
                    title="Remove"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
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
                onClick={cancelEdit}
                className="rounded border px-4 py-2 text-sm"
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Toolbar abaixo do form (busca + filtro por categoria pai) */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-white p-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product name…"
          className="w-full max-w-xs rounded border px-3 py-2 text-sm"
        />
        <select
          value={parentFilter}
          onChange={(e) => setParentFilter(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="all">All parent categories</option>
          {parentOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <div className="overflow-auto rounded-2xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-3 py-2 text-left">Order</th>
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-left">Price</th>
              <th className="px-3 py-2 text-left min-w-[110px]">
                <button
                  className="inline-flex items-center gap-2 rounded px-2 py-1 hover:bg-neutral-100"
                  onClick={toggleStockHeader}
                  title="Click to filter: All → 0 → All"
                >
                  Stock
                  <span
                    className={[
                      chip,
                      stockFilter === "all"
                        ? "text-neutral-600 ring-neutral-300 bg-neutral-50"
                        : "text-rose-800 ring-rose-200 bg-rose-50",
                    ].join(" ")}
                  >
                    {stockFilter === "all" ? "All" : "0"}
                  </span>
                </button>
              </th>
              <th className="px-3 py-2 text-left min-w-[130px]">
                <button
                  className="inline-flex items-center gap-2 rounded px-2 py-1 hover:bg-neutral-100"
                  onClick={toggleActiveHeader}
                  title="Click to filter: All → Active → Archived"
                >
                  Active
                  <span
                    className={[
                      chip,
                      activeFilter === "all"
                        ? "text-neutral-600 ring-neutral-300 bg-neutral-50"
                        : activeFilter === "active"
                        ? "text-emerald-800 ring-emerald-200 bg-emerald-50"
                        : "text-neutral-700 ring-neutral-300 bg-neutral-100",
                    ].join(" ")}
                  >
                    {activeFilter === "all"
                      ? "All"
                      : activeFilter === "active"
                      ? "Active"
                      : "Archived"}
                  </span>
                </button>
              </th>
            </tr>
          </thead>

          <tbody>
            {visible.map((p) => (
              <>
                <tr key={p.id} className="border-t align-top">
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveSort(p, -10)}
                        className={smallBtn}
                        title="Move up"
                      >
                        <FontAwesomeIcon icon={faArrowUp} />
                      </button>
                      <button
                        onClick={() => moveSort(p, +10)}
                        className={smallBtn}
                        title="Move down"
                      >
                        <FontAwesomeIcon icon={faArrowDown} />
                      </button>
                    </div>
                  </td>

                  <td className="px-3 py-2">
                    <div className="font-medium">{p.name}</div>
                    <div className="line-clamp-2 text-xs text-neutral-500">
                      {p.description}
                    </div>
                    {Array.isArray((p as any).variants) &&
                      (p as any).variants.length > 0 && (
                        <div className="mt-1 text-xs text-neutral-600">
                          {(p as any).variants.length} variant
                          {(p as any).variants.length > 1 ? "s" : ""}
                        </div>
                      )}
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

                  <td className="px-3 py-2">
                    {p.visibility?.price === false ||
                    typeof p.price !== "number"
                      ? "—"
                      : `$${Number(p.price).toFixed(2)}`}
                  </td>

                  <td className="px-3 py-2">{p.stock}</td>

                  <td className="px-3 py-2">
                    <button
                      className="inline-flex items-center gap-2 rounded px-2 py-1 hover:bg-neutral-50"
                      title={
                        p.active ? "Click to archive" : "Click to unarchive"
                      }
                      onClick={() => toggleActiveRow(p)}
                    >
                      <span
                        className={[
                          "h-2 w-2 rounded-full",
                          p.active ? "bg-emerald-500" : "bg-neutral-400",
                        ].join(" ")}
                      />
                      <span className="text-xs">
                        {p.active ? "Active" : "Archived"}
                      </span>
                    </button>
                  </td>
                </tr>

                {/* ações horizontais */}
                <tr className="bg-neutral-50/60">
                  <td className="p-0" />
                  <td className="px-3 py-2" colSpan={4}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        <Link
                          to={`/product/${encodeURIComponent(p.slug || p.id)}`}
                          target="_blank"
                          className={[
                            smallBtn,
                            "border-orange-600 text-orange-600",
                          ].join(" ")}
                          title="View product"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => startEdit(p)}
                          className={smallBtn}
                          title="Edit"
                        >
                          Edit
                        </button>
                        {p.active ? (
                          <button
                            onClick={() => archiveProduct(p)}
                            className={smallBtn}
                            title="Archive"
                          >
                            <FontAwesomeIcon icon={faBoxArchive} />
                            Archive
                          </button>
                        ) : (
                          <button
                            onClick={() => unarchiveProduct(p)}
                            className={smallBtn}
                            title="Unarchive"
                          >
                            <FontAwesomeIcon icon={faBoxOpen} />
                            Unarchive
                          </button>
                        )}
                        <button
                          onClick={() => deleteProduct(p)}
                          className={[smallBtn, "text-red-600"].join(" ")}
                          title="Delete (archives if in use)"
                        >
                          <FontAwesomeIcon icon={faBan} />
                          Delete
                        </button>
                        <button
                          onClick={() => deleteProductHard(p)}
                          className={[smallBtn, "text-red-700"].join(" ")}
                          title="Delete permanently"
                        >
                          <FontAwesomeIcon icon={faSkullCrossbones} />
                          Delete permanently
                        </button>
                      </div>

                      <span className="text-[11px] text-neutral-500">
                        {p.active ? "Visible in storefront" : "Archived"}
                      </span>
                    </div>
                  </td>
                  <td className="p-0" />
                </tr>
              </>
            ))}

            {visible.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-neutral-500" colSpan={6}>
                  No products found with current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
