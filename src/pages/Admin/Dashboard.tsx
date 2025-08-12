import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Product } from '@/types';

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ name: '', description: '', price: 0, imageUrl: '', stock: 0 });

  const load = async () => setProducts((await api.get('/products')).data);
  useEffect(() => { load(); }, []);

  const create = async () => {
    await api.post('/products', form, { headers: { Authorization: `Bearer ${localStorage.getItem('listo365.token')}` } });
    setForm({ name: '', description: '', price: 0, imageUrl: '', stock: 0 });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin — Produtos</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className="rounded border px-3 py-2" placeholder="Nome" value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))} />
        <input className="rounded border px-3 py-2" placeholder="Preço" value={form.price} onChange={e=>setForm(v=>({...v,price:Number(e.target.value)}))} />
        <input className="rounded border px-3 py-2" placeholder="Estoque" value={form.stock} onChange={e => setForm(v => ({ ...v, stock: Number(e.target.value) }))} />
        <input className="rounded border px-3 py-2 sm:col-span-2" placeholder="Imagem (URL)" value={form.imageUrl} onChange={e=>setForm(v=>({...v,imageUrl:e.target.value}))} />
        <textarea className="rounded border px-3 py-2 sm:col-span-2" placeholder="Descrição" value={form.description} onChange={e=>setForm(v=>({...v,description:e.target.value}))} />
        <button onClick={create} className="rounded bg-emerald-600 px-4 py-2 font-medium text-white">Adicionar</button>
      </div>

      <ul className="divide-y rounded border bg-white">
        {products.map(p => (
          <li key={p.id} className="flex items-center justify-between px-4 py-3">
            <span className="font-medium">{p.name}</span>
            <span className="text-sm">R$ {p.price.toFixed(2)} • stk {p.stock}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
