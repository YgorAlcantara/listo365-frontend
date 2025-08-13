import { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import type { CategoryNode, Product } from '@/types';

type Form = {
  name: string;
  slug?: string;
  description: string;
  price: number;
  imageUrl?: string;     // fallback (opcional)
  stock: number;
  active: boolean;
  sortOrder: number;
  packageSize?: string;
  pdfUrl?: string;
  categoryParentId?: string;
  categoryId?: string;   // filha
  imagesText: string;    // 1 URL por linha
};

export default function Dashboard() {
  const empty: Form = {
    name: '', description: '', price: 0, stock: 0, active: true, sortOrder: 0,
    packageSize: '', pdfUrl: '', imageUrl: '', categoryParentId: '', categoryId: '', imagesText: ''
  };

  const [list, setList] = useState<Product[]>([]);
  const [cats, setCats] = useState<CategoryNode[]>([]);
  const [form, setForm] = useState<Form>({ ...empty });
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const children = useMemo(
    () => cats.find(c => c.id === form.categoryParentId)?.children ?? [],
    [cats, form.categoryParentId]
  );

  async function refresh() {
    const [p, c] = await Promise.all([
      api.get('/products?sort=sortOrder'),
      api.get('/categories'),
    ]);
    setList(p.data);
    setCats(c.data);
  }

  useEffect(() => { refresh(); }, []);

  function parseImages(text: string) {
    return text.split('\n').map(s => s.trim()).filter(Boolean);
  }

  async function save() {
    setLoading(true);
    try {
      const payload: any = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        active: form.active,
        packageSize: form.packageSize || undefined,
        pdfUrl: form.pdfUrl || undefined,
        imageUrl: form.imageUrl || undefined,
        images: parseImages(form.imagesText),
        categoryId: form.categoryId || undefined,
      };
      if (editing) await api.put(`/products/${editing}`, payload);
      else await api.post('/products', payload);

      setForm({ ...empty });
      setEditing(null);
      await refresh();
    } finally { setLoading(false); }
  }

  async function remove(id: string) {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    await refresh();
  }

  async function move(id: string, dir: -1 | 1) {
    const p = list.find(x => x.id === id)!;
    await api.patch(`/products/${id}/sort-order`, { sortOrder: (p.sortOrder || 0) + (dir * 10) });
    await refresh();
  }

  function startEdit(p: Product) {
    setEditing(p.id);
    const parentId = p.category?.parent?.id || '';
    const catId = p.category?.id || '';
    setForm({
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock,
      active: p.active,
      sortOrder: p.sortOrder,
      packageSize: p.packageSize || '',
      pdfUrl: p.pdfUrl || '',
      imageUrl: p.imageUrl || '',
      categoryParentId: parentId,
      categoryId: catId,
      imagesText: (p.images || []).join('\n'),
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin — Products</h1>

      {/* Form */}
      <div className="rounded-xl border bg-white p-4 space-y-2">
        <h2 className="text-lg font-semibold">{editing ? 'Edit product' : 'New product'}</h2>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <input className="rounded border px-3 py-2 text-sm" placeholder="Name"
            value={form.name} onChange={e=>setForm(v=>({...v, name:e.target.value}))}/>
          <input className="rounded border px-3 py-2 text-sm" placeholder="Price (USD)" type="number" step="0.01"
            value={form.price} onChange={e=>setForm(v=>({...v, price:Number(e.target.value)}))}/>
          <input className="rounded border px-3 py-2 text-sm" placeholder="Stock" type="number"
            value={form.stock} onChange={e=>setForm(v=>({...v, stock:Number(e.target.value)}))}/>
          <input className="rounded border px-3 py-2 text-sm" placeholder="Package size (e.g., 1 gal / 32 oz)"
            value={form.packageSize} onChange={e=>setForm(v=>({...v, packageSize:e.target.value}))}/>
          <input className="rounded border px-3 py-2 text-sm" placeholder="PDF URL (datasheet)"
            value={form.pdfUrl} onChange={e=>setForm(v=>({...v, pdfUrl:e.target.value}))}/>
          <input className="rounded border px-3 py-2 text-sm" placeholder="Legacy cover image URL (optional)"
            value={form.imageUrl} onChange={e=>setForm(v=>({...v, imageUrl:e.target.value}))}/>

          <textarea className="md:col-span-2 rounded border px-3 py-2 text-sm" rows={3} placeholder="Description"
            value={form.description} onChange={e=>setForm(v=>({...v, description:e.target.value}))}/>

          {/* Categoria pai */}
          <select className="rounded border px-3 py-2 text-sm"
            value={form.categoryParentId}
            onChange={e=>setForm(v=>({...v, categoryParentId: e.target.value, categoryId: ''}))}>
            <option value="">Parent category</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Subcategoria (filha) */}
          <select className="rounded border px-3 py-2 text-sm"
            value={form.categoryId}
            onChange={e=>setForm(v=>({...v, categoryId: e.target.value}))}
            disabled={!form.categoryParentId}>
            <option value="">Subcategory</option>
            {children.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={e=>setForm(v=>({...v, active:e.target.checked}))}/>
            <span className="text-sm">Active</span>
          </label>

          <textarea className="md:col-span-2 rounded border px-3 py-2 text-sm" rows={4}
            placeholder={"Images (one URL per line)\nhttps://.../img1.jpg\nhttps://.../img2.jpg\nhttps://.../img3.jpg\nhttps://.../img4.jpg"}
            value={form.imagesText} onChange={e=>setForm(v=>({...v, imagesText:e.target.value}))}/>
        </div>

        <div className="flex gap-2">
          <button onClick={save} disabled={loading} className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
            {editing ? (loading ? 'Saving…' : 'Save changes') : (loading ? 'Creating…' : 'Create')}
          </button>
          {editing && (
            <button onClick={()=>{ setEditing(null); setForm({...empty}); }} className="rounded border px-4 py-2 text-sm">
              Cancel
            </button>
          )}
        </div>
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
            {list.map(p=>(
              <tr key={p.id} className="border-t">
                <td className="px-3 py-2">
                  <div className="inline-flex items-center gap-1">
                    <button onClick={()=>move(p.id, -1)} className="rounded border px-2 py-1">↑</button>
                    <button onClick={()=>move(p.id, +1)} className="rounded border px-2 py-1">↓</button>
                    <span className="ml-2 text-xs text-neutral-500">{p.sortOrder}</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-neutral-500">{p.description}</div>
                </td>
                <td className="px-3 py-2">
                  {p.category ? (
                    <span className="text-xs">
                      {p.category.parent ? `${p.category.parent.name} › ` : ''}{p.category.name}
                    </span>
                  ) : <span className="text-xs text-neutral-400">—</span>}
                </td>
                <td className="px-3 py-2">${p.price.toFixed(2)}</td>
                <td className="px-3 py-2">{p.stock}</td>
                <td className="px-3 py-2">{p.active ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button onClick={()=>startEdit(p)} className="rounded border px-2 py-1">Edit</button>
                    <button onClick={()=>remove(p.id)} className="rounded border px-2 py-1 text-red-600">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length===0 && (
              <tr><td className="px-3 py-3 text-neutral-500" colSpan={7}>No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
