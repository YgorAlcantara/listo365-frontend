import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { toast } from "react-hot-toast";

type Cat = { id: string; name: string; children?: Cat[] };

type Props = {
  parentId?: string;
  subcategoryId?: string;
  onChangeParent: (id?: string) => void;
  onChangeSub: (id?: string) => void;
};

export default function CategoryPicker({
  parentId,
  subcategoryId,
  onChangeParent,
  onChangeSub,
}: Props) {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<"parent" | "child" | null>(null);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState<"seed" | "create" | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get<Cat[]>("/categories");
      setCats(r.data || []);
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.error || "Failed to load categories";
      toast.error(msg);
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        toast.error("Unauthorized. Please log in again.");
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 800);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const children = useMemo(
    () => cats.find((c) => c.id === parentId)?.children ?? [],
    [cats, parentId]
  );

  async function seedDefaults() {
    setBusy("seed");
    try {
      await api.post("/categories/seed");
      await load();
      toast.success("Default categories created!");
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.error || "Failed to seed categories";
      toast.error(msg);
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        toast.error("Unauthorized. Please log in again.");
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 800);
      }
    } finally {
      setBusy(null);
    }
  }

  async function createCategory() {
    const name = newName.trim();
    if (!name) return;

    setBusy("create");
    try {
      const payload: any = { name };
      if (creating === "child") {
        if (!parentId) {
          toast.error("Pick a parent first.");
          setBusy(null);
          return;
        }
        payload.parentId = parentId;
      }

      await api.post("/categories", payload);
      setNewName("");
      setCreating(null);
      await load();
      toast.success("Category created");
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.error || "Failed to create category";
      toast.error(msg);
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        toast.error("Unauthorized. Please log in again.");
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 800);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="w-40 text-sm font-medium">Parent Category</label>
        <select
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
          value={parentId || ""}
          onChange={(e) => {
            const val = e.target.value || undefined;
            onChangeParent(val);
            onChangeSub(undefined); // reset sub ao trocar pai
          }}
          disabled={loading || busy !== null}
        >
          <option value="">— Select —</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setCreating("parent");
            setNewName("");
          }}
          className="rounded border px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-50"
          disabled={loading || busy !== null}
        >
          {busy === "create" && creating === "parent"
            ? "Creating…"
            : "New parent"}
        </button>
        <button
          type="button"
          onClick={seedDefaults}
          className="rounded border px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-50"
          disabled={loading || busy !== null}
        >
          {busy === "seed" ? "Seeding…" : "Seed defaults"}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="w-40 text-sm font-medium">Subcategory</label>
        <select
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
          value={subcategoryId || ""}
          onChange={(e) => onChangeSub(e.target.value || undefined)}
          disabled={!parentId || loading || busy !== null}
        >
          <option value="">— Select —</option>
          {children.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setCreating("child");
            setNewName("");
          }}
          className="rounded border px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-50"
          disabled={!parentId || loading || busy !== null}
        >
          {busy === "create" && creating === "child" ? "Creating…" : "New sub"}
        </button>
      </div>

      {creating && (
        <div className="flex items-center gap-2">
          <label className="w-40 text-sm font-medium">
            {creating === "parent" ? "New parent name" : "New sub name"}
          </label>
          <input
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={
              creating === "parent"
                ? "e.g., Floor Care"
                : "e.g., Floor Finishes"
            }
            disabled={busy !== null}
          />
          <button
            type="button"
            onClick={createCategory}
            className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            disabled={!newName.trim() || busy !== "create"}
          >
            {busy === "create" ? "Creating…" : "Create"}
          </button>
          <button
            type="button"
            onClick={() => setCreating(null)}
            className="rounded border px-3 py-2 text-xs disabled:opacity-60"
            disabled={busy !== null}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
