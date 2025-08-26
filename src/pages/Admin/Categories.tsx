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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex items-center gap-2">
            <input
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="New parent name"
              className="w-56 rounded-lg border px-3 py-2 text-sm"
              disabled={busy !== null}
            />
            <button
              onClick={createParent}
              disabled={!parentName.trim() || busy !== null}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy === "create-parent" ? "Creating…" : "Add parent"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={subParentId}
              onChange={(e) => setSubParentId(e.target.value)}
              className="w-56 rounded-lg border px-3 py-2 text-sm"
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
              className="w-56 rounded-lg border px-3 py-2 text-sm"
              disabled={busy !== null}
            />
            <button
              onClick={createSub}
              disabled={!subParentId || !subName.trim() || busy !== null}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-60"
            >
              {busy === "create-sub" ? "Creating…" : "Add subcategory"}
            </button>
          </div>

          <button
            onClick={seedDefaults}
            disabled={busy !== null}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-60"
          >
            {busy === "seed" ? "Seeding…" : "Seed defaults"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-2xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-3 py-2 text-left">Parent</th>
              <th className="px-3 py-2 text-left">Slug</th>
              <th className="px-3 py-2 text-left">Subcategories</th>
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
                <tr key={c.id} className="border-t align-top">
                  <td className="px-3 py-3">
                    <div className="font-medium">{c.name}</div>
                  </td>
                  <td className="px-3 py-3 text-xs text-neutral-600">
                    {c.slug}
                  </td>
                  <td className="px-3 py-3">
                    {c.children && c.children.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {c.children.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200"
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
