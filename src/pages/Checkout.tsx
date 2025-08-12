import { useCart } from '@/components/cart/CartProvider';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/services/api';

const Schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  note: z.string().optional(),
});

type FormData = z.infer<typeof Schema>;

export default function Checkout() {
  const { items, total, clear } = useCart();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(Schema) });

  const onSubmit = async (data: FormData) => {
    await api.post('/orders', {
      customerName: data.name,
      customerEmail: data.email,
      customerPhone: data.phone,
      note: data.note,
      items: items.map(i => ({ productId: i.id, quantity: i.quantity, unitPrice: i.price })),
    });
    clear();
    alert('Solicitação enviada! Em breve entraremos em contato.');
  };

  if (items.length === 0) return <p className="text-sm">Sua sacola está vazia.</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Finalizar solicitação</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm">Nome</span>
          <input className="w-full rounded-lg border px-3 py-2" {...register('name')} />
          {errors.name && <span className="text-xs text-red-600">{errors.name.message}</span>}
        </label>
        <label className="space-y-1">
          <span className="text-sm">E‑mail</span>
          <input className="w-full rounded-lg border px-3 py-2" {...register('email')} />
          {errors.email && <span className="text-xs text-red-600">{errors.email.message}</span>}
        </label>
        <label className="space-y-1">
          <span className="text-sm">Telefone (opcional)</span>
          <input className="w-full rounded-lg border px-3 py-2" {...register('phone')} />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm">Observações (opcional)</span>
          <textarea className="w-full rounded-lg border px-3 py-2" rows={3} {...register('note')} />
        </label>
      </div>
      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-2 font-medium">Resumo</h3>
        <ul className="space-y-1 text-sm">
          {items.map(i => (
            <li key={i.id} className="flex justify-between">
              <span>{i.name} × {i.quantity}</span>
              <span>R$ {(i.quantity * i.price).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t pt-3 font-semibold">
          <span>Total</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>
      </div>
      <button type="submit" disabled={isSubmitting} className="inline-flex w-full justify-center rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-60">Confirmar e enviar</button>
    </form>
  );
}
