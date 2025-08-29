// src/pages/admin/Categories.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { toast } from "react-hot-toast";

type Cat = {
  id: string;
  name: string;
  slug: string;
  children?: Cat[];
};

export default function Categories() {
  const [loading, setLoading] = useState(true);
  const [cats, setCats] = useState<Cat[]>([]);
  const [busy, setBusy] = useState<
    null | "seed" | "create-parent" | "create-sub"
  >(null);

  // inline create (parent)
  const [parentName, setParentName] = useState("");
  // inline create (sub)
  const [subParentId, setSubParentId] = useState<string>("");
  const [subName, setSubName] = useState("");

  async function load() {
    setLoading(true);
    try {
      const r = await api.get<Cat[]>("/categories");
      setCats(r.data || []);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.error || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const flatParents = useMemo(
    () => cats.map((c) => ({ id: c.id, name: c.name })),
    [cats]
  );

  async function seedDefaults() {
    try {
      setBusy("seed");
      await api.post("/categories/seed");
      toast.success("Default tree created");
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.error || "Failed to seed categories");
    } finally {
      setBusy(null);
    }
  }

  async function createParent() {
    const name = parentName.trim();
    if (!name) return;
    try {
      setBusy("create-parent");
      await api.post("/categories", { name });
      setParentName("");
      toast.success("Parent category created");
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.error || "Failed to create category");
    } finally {
      setBusy(null);
    }
  }

  async function createSub() {
    const name = subName.trim();
    const parentId = subParentId || "";
    if (!name || !parentId) return;
    try {
      setBusy("create-sub");
      await api.post("/categories", { name, parentId });
      setSubName("");
      setSubParentId("");
      toast.success("Subcategory created");
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.error || "Failed to create subcategory");
    } finally {
      setBusy(null);
    }
  }

  // 🔸 Altura unificada (40px)
  const controlHeight = "h-10";

  // Inputs & select — mesma altura que os botões
  const inputCls =
    `${controlHeight} w-56 rounded-lg border border-neutral-300 px-3 ` +
    "text-sm text-neutral-900 placeholder:text-neutral-400 " +
    "focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30";

  // Botões “slim”, mesma altura dos inputs
  const btnBase = `inline-flex items-center justify-center ${controlHeight} rounded-lg px-2 text-xs font-semibold disabled:opacity-60`;
  const btnPrimary = `${btnBase} bg-orange-600 text-white hover:bg-orange-700`;
  const btnOutline = `${btnBase} border border-orange-300 bg-white text-orange-700 hover:bg-orange-50`;
  const btnGhost = `${btnBase} border border-neutral-300 bg-white hover:bg-neutral-50`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-bold text-neutral-900"></h1>

        <div className="flex flex-col gap-2 sm:flex-row">
          {/* Create parent */}
          <div className="flex items-center gap-2">
            <input
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="New parent name"
              className={inputCls}
              disabled={busy !== null}
            />
            <button
              onClick={createParent}
              disabled={!parentName.trim() || busy !== null}
              className={btnPrimary}
            >
              {busy === "create-parent" ? "Creating…" : "Add parent"}
            </button>
          </div>

          {/* Create sub */}
          <div className="flex items-center gap-2">
            <select
              value={subParentId}
              onChange={(e) => setSubParentId(e.target.value)}
              className={inputCls}
              disabled={busy !== null || flatParents.length === 0}
            >
              <option value="">Parent…</option>
              {flatParents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <input
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              placeholder="New subcategory name"
              className={inputCls}
              disabled={busy !== null}
            />

            <button
              onClick={createSub}
              disabled={!subParentId || !subName.trim() || busy !== null}
              className={btnOutline}
            >
              {busy === "create-sub" ? "Creating…" : "Add subcategory"}
            </button>
          </div>

          {/* Seed defaults */}
          <button
            onClick={seedDefaults}
            disabled={busy !== null}
            className={btnGhost}
          >
            {busy === "seed" ? "Seeding…" : "Seed defaults"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50">
            <tr className="text-left text-neutral-700">
              <th className="px-3 py-2 font-medium">Parent</th>
              <th className="px-3 py-2 font-medium">Slug</th>
              <th className="px-3 py-2 font-medium">Subcategories</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-3 py-6 text-neutral-500" colSpan={3}>
                  Loading…
                </td>
              </tr>
            )}

            {!loading && cats.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-neutral-500" colSpan={3}>
                  No categories yet.
                </td>
              </tr>
            )}

            {!loading &&
              cats.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-3 py-3 align-top">
                    <div className="font-medium text-neutral-900">{c.name}</div>
                  </td>
                  <td className="px-3 py-3 align-top text-xs text-neutral-600">
                    {c.slug}
                  </td>
                  <td className="px-3 py-3 align-top">
                    {c.children && c.children.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {c.children.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-200"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
