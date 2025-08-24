import { useEffect, useState } from "react";
import { api } from "@/services/api";
import EmptyState from "@/components/EmptyState";

type Category = {
  id: string;
  name: string;
  slug: string;
  parent?: Category | null;
};

export default function Categories() {
  const [loading, setLoading] = useState(true);
  const [cats, setCats] = useState<Category[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/categories");
        setCats(r.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-sm text-neutral-500">Loading…</div>;

  if (!cats.length)
    return (
      <EmptyState
        title="No categories yet"
        subtitle="Products can be created without categories. You can add them later."
      />
    );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Categories</h1>
      <div className="overflow-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Slug</th>
              <th className="px-3 py-2 text-left">Parent</th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-3 py-2">{c.name}</td>
                <td className="px-3 py-2 text-xs text-neutral-600">{c.slug}</td>
                <td className="px-3 py-2 text-xs">
                  {c.parent ? c.parent.name : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
