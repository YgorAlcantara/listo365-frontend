import { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';

type Cat = { id: string; name: string; children?: Cat[] };

type Props = {
  parentId?: string;
  subcategoryId?: string;
  onChangeParent: (id?: string) => void;
  onChangeSub: (id?: string) => void;
};

export default function CategoryPicker({ parentId, subcategoryId, onChangeParent, onChangeSub }: Props) {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<'parent'|'child'|null>(null);
  const [newName, setNewName] = useState('');

  async function load() {
    setLoading(true);
    try {
      const r = await api.get<Cat[]>('/categories');
      setCats(r.data);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const children = useMemo(() => cats.find(c => c.id === parentId)?.children ?? [], [cats, parentId]);

  async function seedDefaults() {
    await api.post('/categories/seed');
    await load();
  }

  async function createCategory() {
    if (!newName.trim()) return;
    const payload: any = { name: newName.trim() };
    if (creating === 'child') {
      if (!parentId) return;
      payload.parentId = parentId;
    }
    await api.post('/categories', payload);
    setNewName('');
    setCreating(null);
    await load();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="w-40 text-sm font-medium">Parent Category</label>
        <select
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
          value={parentId || ''}
          onChange={e => { onChangeParent(e.target.value || undefined); onChangeSub(undefined); }}
          disabled={loading}
        >
          <option value="">— Select —</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button
          type="button"
          onClick={() => { setCreating('parent'); setNewName(''); }}
          className="rounded border px-2 py-1 text-xs hover:bg-neutral-50"
        >
          New parent
        </button>
        <button
          type="button"
          onClick={seedDefaults}
          className="rounded border px-2 py-1 text-xs hover:bg-neutral-50"
        >
          Seed defaults
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="w-40 text-sm font-medium">Subcategory</label>
        <select
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
          value={subcategoryId || ''}
          onChange={e => onChangeSub(e.target.value || undefined)}
          disabled={!parentId || loading}
        >
          <option value="">— Select —</option>
          {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button
          type="button"
          onClick={() => { setCreating('child'); setNewName(''); }}
          className="rounded border px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-50"
          disabled={!parentId}
        >
          New sub
        </button>
      </div>

      {creating && (
        <div className="flex items-center gap-2">
          <label className="w-40 text-sm font-medium">{creating === 'parent' ? 'New parent name' : 'New sub name'}</label>
          <input
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={creating === 'parent' ? 'e.g., Floor Care' : 'e.g., Floor Finishes'}
          />
          <button type="button" onClick={createCategory} className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Create</button>
          <button type="button" onClick={() => setCreating(null)} className="rounded border px-3 py-2 text-xs">Cancel</button>
        </div>
      )}
    </div>
  );
}
