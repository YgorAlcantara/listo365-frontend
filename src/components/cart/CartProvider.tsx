import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: string; // e.g., productId::variantId or productId::base
  name: string;
  price?: number; // optional: hidden/public price control
  imageUrl: string;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  count: number;
  total: number; // sums only priced items
  hasUnpriced: boolean; // true if any item has no public price
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  inc: (id: string, step?: number) => void;
  dec: (id: string, step?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

// increment version if you change structure to avoid conflicts
const KEY = "listo365.cart.v2";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupted storage
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const api = useMemo<CartContextType>(() => {
    const hasUnpriced = items.some(
      (i) => !(typeof i.price === "number" && Number.isFinite(i.price))
    );

    const total = Number(
      items
        .reduce((acc, i) => {
          if (typeof i.price === "number" && Number.isFinite(i.price)) {
            return acc + i.price * i.quantity;
          }
          return acc;
        }, 0)
        .toFixed(2)
    );

    return {
      items,
      count: items.reduce((acc, i) => acc + i.quantity, 0),
      total,
      hasUnpriced,

      add: (item, qty = 1) =>
        setItems((prev) => {
          const found = prev.find((p) => p.id === item.id);
          if (found) {
            return prev.map((p) =>
              p.id === item.id ? { ...p, quantity: p.quantity + qty } : p
            );
          }
          return [...prev, { ...item, quantity: qty }];
        }),

      inc: (id, step = 1) =>
        setItems((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, quantity: p.quantity + step } : p
          )
        ),

      dec: (id, step = 1) =>
        setItems((prev) =>
          prev.flatMap((p) => {
            if (p.id !== id) return [p];
            const q = p.quantity - step;
            return q <= 0 ? [] : [{ ...p, quantity: q }];
          })
        ),

      setQty: (id, qty) =>
        setItems((prev) =>
          prev.flatMap((p) => {
            if (p.id !== id) return [p];
            return qty <= 0 ? [] : [{ ...p, quantity: qty }];
          })
        ),

      remove: (id) => setItems((prev) => prev.filter((p) => p.id !== id)),
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
