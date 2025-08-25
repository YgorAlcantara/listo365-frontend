import { useEffect, useState } from "react";
import { api } from "@/services/api";
import type { Product, ProductVariant, ProductVisibility } from "@/types";
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
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";

type Form = {
  name: string;
  description: string;
  price: string; // baseline
  stock: string;
  active: boolean;
  sortOrder: number;
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
  sortOrder: number;
  active: boolean;
  sku?: string;
};

type ShowFilter = "active" | "archived" | "all";

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
      price: false, // padrão: oculto
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
  const [show, setShow] = useState<ShowFilter>("active");

  function parseImages(text: string) {
    return text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function refresh() {
    try {
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

  function startEdit(p: Product) {
    setEditing(p.id);
    const parentId = p.category?.parent?.id || "";
    const catId = p.category?.id || "";
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price ?? "0"),
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
      (p.variants || []).map<VariantForm>((v) => ({
        id: v.id,
        name: v.name,
        price: String(v.price),
        stock: String(v.stock),
        sortOrder: v.sortOrder ?? 0,
        active: !!v.active,
        sku: v.sku || "",
      }))
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
      {
        name: "",
        price: "",
        stock: "0",
        sortOrder: (v.length + 1) * 10,
        active: true,
      },
    ]);
  }
  function rmVariant(idx: number) {
    setVariants((v) => v.filter((_, i) => i !== idx));
  }

  async function save() {
    const priceNum = parseFloat(String(form.price).replace(",", "."));
    if (Number.isNaN(priceNum) || priceNum < 0) {
      toast.error("Baseline price must be >= 0.");
      return;
    }
    const stockNum = parseInt(String(form.stock || "0"), 10);
    if (!(stockNum >= 0)) {
      toast.error("Stock must be 0 or more.");
      return;
    }
    const imgs = parseImages(form.imagesText);
    const variantsPayload = variants
      .map((v) => ({
        ...(v.id ? { id: v.id } : {}),
        name: v.name.trim(),
        price: parseFloat(String(v.price).replace(",", ".")),
        stock: parseInt(String(v.stock || "0"), 10) || 0,
        sortOrder: v.sortOrder || 0,
        active: !!v.active,
        sku: v.sku?.trim() || undefined,
      }))
      .filter((v) => v.name && (v.price ?? 0) >= 0);

    setLoading(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: priceNum,
        stock: stockNum,
        active: !!form.active,
        sortOrder: form.sortOrder,
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

      if (editing) {
        await api.put(`/products/${editing}`, payload);
        toast.success("Product updated");
      } else {
        await api.post("/products", payload);
        toast.success("Product created");
      }

      cancelEdit();
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

  const visible = list.filter((p) =>
    show === "all" ? true : show === "active" ? p.active : !p.active
  );

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
          <div className="rounded-2xl border p-3 space-y-2">
            <div className="text-sm font-semibold mb-1">
              Visibility (public site)
            </div>
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

          {/* Variantes */}
          <div className="rounded-2xl border p-4 space-y-3">
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

            {variants.map((v, i) => (
              <div
                key={i}
                className="grid gap-2 md:grid-cols-[1fr_140px_120px_120px_110px_100px]"
              >
                <input
                  className="rounded border px-3 py-2 text-sm"
                  placeholder="Name (e.g., 1 gal / 32 oz)"
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
                  placeholder="Price"
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
                  placeholder="Stock"
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
                <input
                  className="rounded border px-3 py-2 text-sm"
                  placeholder="Sort"
                  value={v.sortOrder}
                  onChange={(e) =>
                    setVariants((a) =>
                      a.map((x, idx) =>
                        idx === i
                          ? { ...x, sortOrder: Number(e.target.value) || 0 }
                          : x
                      )
                    )
                  }
                />
                <input
                  className="rounded border px-3 py-2 text-sm"
                  placeholder="SKU (optional)"
                  value={v.sku || ""}
                  onChange={(e) =>
                    setVariants((a) =>
                      a.map((x, idx) =>
                        idx === i ? { ...x, sku: e.target.value } : x
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
                    title="Remove variant"
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

      {/* Tabela */}
      <div className="overflow-auto rounded-2xl border bg-white">
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
                      title="Move up"
                    >
                      <FontAwesomeIcon icon={faArrowUp} />
                    </button>
                    <button
                      onClick={() => move(p.id, +1)}
                      className="rounded border px-2 py-1"
                      title="Move down"
                    >
                      <FontAwesomeIcon icon={faArrowDown} />
                    </button>
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
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-2">
                    <span>${Number(p.price ?? 0).toFixed(2)}</span>
                    <span
                      className="text-neutral-400"
                      title={
                        p.visibility?.price === false
                          ? "Hidden on site"
                          : "Visible on site"
                      }
                    >
                      <FontAwesomeIcon
                        icon={
                          p.visibility?.price === false ? faEyeSlash : faEye
                        }
                      />
                    </span>
                  </span>
                </td>
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
                        title="Archive"
                      >
                        <FontAwesomeIcon icon={faBoxArchive} /> Archive
                      </button>
                    ) : (
                      <button
                        onClick={() => unarchive(p.id)}
                        className="rounded border px-2 py-1"
                        title="Unarchive"
                      >
                        <FontAwesomeIcon icon={faBoxOpen} /> Unarchive
                      </button>
                    )}
                    <button
                      onClick={() => hardDelete(p.id, p.name)}
                      className="rounded border px-2 py-1 text-red-600"
                      title="Delete permanently"
                    >
                      <FontAwesomeIcon icon={faTrashCan} /> Delete
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
    </div>
  );
}
