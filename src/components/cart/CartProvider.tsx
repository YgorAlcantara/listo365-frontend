import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number | null; // null = precisa cotação
  imageUrl: string;
  quantity: number;
  variant?: string; // tamanho
  needsQuote?: boolean; // quando price=null
};

type CartContextType = {
  items: CartItem[];
  count: number;
  total: number; // soma apenas itens com preço
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  inc: (id: string, step?: number, variant?: string) => void;
  dec: (id: string, step?: number, variant?: string) => void;
  setQty: (id: string, qty: number, variant?: string) => void;
  remove: (id: string, variant?: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextType | null>(null);
const KEY = "listo365.cart.v1";

function keyOf(i: { id: string; variant?: string }) {
  return `${i.id}__${i.variant ?? ""}`;
}

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
    const count = items.reduce((acc, i) => acc + i.quantity, 0);
    const total = Number(
      items.reduce((acc, i) => acc + i.quantity * (i.price ?? 0), 0).toFixed(2)
    );

    return {
      items,
      count,
      total,

      add: (item, qty = 1) =>
        setItems((prev) => {
          // chave por produto+variante -> itens separados por tamanho
          const k = keyOf(item);
          const found = prev.find((p) => keyOf(p) === k);
          if (found) {
            return prev.map((p) =>
              keyOf(p) === k ? { ...p, quantity: p.quantity + qty } : p
            );
          }
          return [...prev, { ...item, quantity: qty }];
        }),

      inc: (id, step = 1, variant) =>
        setItems((prev) =>
          prev.map((p) =>
            keyOf(p) === keyOf({ id, variant })
              ? { ...p, quantity: p.quantity + step }
              : p
          )
        ),

      dec: (id, step = 1, variant) =>
        setItems((prev) =>
          prev.flatMap((p) => {
            if (keyOf(p) !== keyOf({ id, variant })) return [p];
            const q = p.quantity - step;
            return q <= 0 ? [] : [{ ...p, quantity: q }];
          })
        ),

      setQty: (id, qty, variant) =>
        setItems((prev) =>
          prev.flatMap((p) => {
            if (keyOf(p) !== keyOf({ id, variant })) return [p];
            return qty <= 0 ? [] : [{ ...p, quantity: qty }];
          })
        ),

      remove: (id, variant) =>
        setItems((prev) =>
          prev.filter((p) => keyOf(p) !== keyOf({ id, variant }))
        ),

      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
