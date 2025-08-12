import { useEffect, useState } from 'react';
import { api } from '@/services/api';

type Promo = { id: string; title: string };

export function PromoBar() {
  const [promo, setPromo] = useState<Promo | null>(null);
  useEffect(() => {
    api.get('/promotions').then(r => setPromo(r.data?.[0] ? { id: r.data[0].id, title: r.data[0].title } : null)).catch(()=>{});
  }, []);
  if (!promo) return null;
  return (
    <div className="bg-emerald-600 text-white">
      <div className="mx-auto max-w-7xl px-4 py-2 text-center text-sm font-medium">
        {promo.title}
      </div>
    </div>
  );
}
