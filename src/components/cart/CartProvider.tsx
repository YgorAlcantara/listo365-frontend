import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type CartItem = {
  id: string;             // productId
  variantId?: string;     // opcional
  variantName?: string;   // opcional
  name: string;
  price: number | null;   // <-- pode ser null quando preço oculto
  imageUrl: string;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  count: number;
  total: number | null;   // null quando houver itens sem preço
  hasQuotedItems: boolean;
  add: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  inc: (id: string, variantId?: string, step?: number) => void;
  dec: (id: string, variantId?: string, step?: number) => void;
  setQty: (id: string, variantId: string | undefined, qty: number) => void;
  remove: (id: string, variantId?: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextType | null>(null);
const KEY = 'listo365.cart.v2';

const keyOf = (id: string, variantId?: string) => `${id}::${variantId ?? 'base'}`;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const api = useMemo<CartContextType>(() => {
    const hasQuotedItems = items.some(i => i.price == null);
    const numericTotal = items.reduce((acc, i) => acc + (i.price ?? 0) * i.quantity, 0);
    const total = hasQuotedItems ? null : Number(numericTotal.toFixed(2));

    return {
      items,
      count: items.reduce((acc, i) => acc + i.quantity, 0),
      total,
      hasQuotedItems,
      add: (item, qty = 1) => setItems(prev => {
        const k = keyOf(item.id, item.variantId);
        const found = prev.find(p => keyOf(p.id, p.variantId) === k);
        if (found) {
          return prev.map(p => keyOf(p.id, p.variantId) === k ? { ...p, quantity: p.quantity + qty } : p);
        }
        return [...prev, { ...item, quantity: qty }];
      }),
      inc: (id, variantId, step = 1) =>
        setItems(prev => prev.map(p => keyOf(p.id, p.variantId) === keyOf(id, variantId) ? { ...p, quantity: p.quantity + step } : p)),
      dec: (id, variantId, step = 1) =>
        setItems(prev => prev.flatMap(p => {
          if (keyOf(p.id, p.variantId) !== keyOf(id, variantId)) return [p];
          const q = p.quantity - step;
          return q <= 0 ? [] : [{ ...p, quantity: q }];
        })),
      setQty: (id, variantId, qty) =>
        setItems(prev => prev.flatMap(p => keyOf(p.id, p.variantId) === keyOf(id, variantId) ? (qty <= 0 ? [] : [{ ...p, quantity: qty }]) : [p])),
      remove: (id, variantId) =>
        setItems(prev => prev.filter(p => keyOf(p.id, p.variantId) !== keyOf(id, variantId))),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
