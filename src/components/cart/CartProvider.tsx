import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AddInput = {
  id: string; // "productId" ou "productId::variantId"
  name: string;
  price?: number; // ausente => item de cotação (quote-only)
  imageUrl?: string | null;
  variantId?: string | null;
  variantName?: string | null;
  quantity?: number; // default 1
};

export type CartItem = {
  id: string;
  name: string;
  quantity: number;
  price?: number;
  imageUrl?: string | null;
  variantId?: string | null;
  variantName?: string | null;
};

type CartContextValue = {
  items: CartItem[];
  count: number; // soma das quantidades
  subtotal: number; // soma apenas de itens com preço (quote-only conta 0)
  add: (input: AddInput) => void;
  remove: (id: string) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  setQuantity: (id: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "cart_v2";

function clampQty(n: number) {
  if (!Number.isFinite(n)) return 1;
  return Math.max(0, Math.min(999, Math.trunc(n)));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr
        .map((it) => ({
          id: String(it.id),
          name: String(it.name),
          quantity: clampQty(Number(it.quantity ?? 1)),
          price:
            typeof it.price === "number" && Number.isFinite(it.price)
              ? Number(it.price)
              : undefined,
          imageUrl: it.imageUrl ?? null,
          variantId: it.variantId ?? null,
          variantName: it.variantName ?? null,
        }))
        .filter((it) => it.id && it.name && it.quantity > 0);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // soma quantidades
  const count = useMemo(
    () => items.reduce((acc, it) => acc + clampQty(it.quantity), 0),
    [items]
  );

  // subtotal seguro: quote-only (sem price) entra como 0
  const subtotal = useMemo(
    () =>
      items.reduce((acc, it) => {
        const unit = typeof it.price === "number" ? it.price : 0;
        return acc + unit * clampQty(it.quantity);
      }, 0),
    [items]
  );

  function add(input: AddInput) {
    setItems((prev) => {
      const qty = clampQty(input.quantity ?? 1);
      const idx = prev.findIndex((it) => it.id === input.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          // acumula quantidade
          quantity: clampQty(next[idx].quantity + qty),
          // atualiza props “leves” (imagem, variant) se vierem
          price:
            typeof input.price === "number" && Number.isFinite(input.price)
              ? input.price
              : next[idx].price,
          imageUrl: input.imageUrl ?? next[idx].imageUrl,
          variantId: input.variantId ?? next[idx].variantId,
          variantName: input.variantName ?? next[idx].variantName,
        };
        return next;
      }
      const nuevo: CartItem = {
        id: input.id,
        name: input.name,
        quantity: qty,
        price:
          typeof input.price === "number" && Number.isFinite(input.price)
            ? input.price
            : undefined,
        imageUrl: input.imageUrl ?? null,
        variantId: input.variantId ?? null,
        variantName: input.variantName ?? null,
      };
      return [...prev, nuevo];
    });
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function increment(id: string) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, quantity: clampQty(it.quantity + 1) } : it
      )
    );
  }

  function decrement(id: string) {
    setItems((prev) =>
      prev
        .map((it) =>
          it.id === id ? { ...it, quantity: clampQty(it.quantity - 1) } : it
        )
        .filter((it) => it.quantity > 0)
    );
  }

  function setQuantity(id: string, qty: number) {
    const q = clampQty(qty);
    setItems((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, quantity: q } : it))
        .filter((it) => it.quantity > 0)
    );
  }

  function clear() {
    setItems([]);
  }

  const value: CartContextValue = {
    items,
    count,
    subtotal,
    add,
    remove,
    increment,
    decrement,
    setQuantity,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
