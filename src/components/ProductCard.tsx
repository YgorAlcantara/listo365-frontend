import { motion } from 'framer-motion';
import { useCart } from '@/components/cart/CartProvider';
import { money } from '@/components/utils'; // <-- aqui

type Props = { id: string; name: string; description: string; price: number; imageUrl: string };

export function ProductCard({ id, name, description, price, imageUrl }: Props) {
  const { add } = useCart();
  return (
    <motion.article whileHover={{ y: -2 }} className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition">
      <div className="relative aspect-[4/3] w-full bg-neutral-100"
           style={{backgroundImage:`url(${imageUrl})`, backgroundSize:'cover', backgroundPosition:'center'}} />
      <div className="space-y-2 p-4">
        <h3 className="text-lg font-semibold leading-tight">{name}</h3>
        <p className="line-clamp-2 text-sm text-neutral-600">{description}</p>
        <div className="flex items-center justify-between">
          <span className="text-base font-bold">{money.format(price)}</span> {/* USD */}
          <button
            onClick={() => add({ id, name, price, imageUrl }, 1)}
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:border-emerald-500 hover:text-emerald-700"
          >
            Add
          </button>
        </div>
      </div>
    </motion.article>
  );
}
