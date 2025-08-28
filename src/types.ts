// ---------- CATEGORIES ----------
export type CategoryRef = {
  id: string;
  name: string;
  slug: string;
  parent?: { id: string; name: string; slug: string } | null;
};

// Lightweight UI variant (when encoded in packageSize or for quick selects)
export type Variant = {
  label: string; // e.g., "1 gal", "32 oz"
  price: number | null; // can be null if only label exists
};

// Visibility flags used by Admin and public UI
export type ProductVisibility = {
  price: boolean;
  packageSize: boolean;
  pdf: boolean;
  images: boolean;
  description: boolean;
};

// Persisted product variant (DB table ProductVariant)
export type ProductVariant = {
  id: string;
  name: string; // "1 Gallon"
  price?: number; // pode ocultar no público
  stock: number;
  active: boolean;
  sortOrder: number;
  sku?: string;
  imageUrl?: string | null; // 👈 capa opcional da variante
  images?: string[]; // 👈 galeria opcional da variante
};

// ---------- PRODUCTS ----------
export type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string; // may be hidden by visibility
  price?: number; // baseline; may be hidden by visibility
  active: boolean;
  stock: number;
  sortOrder: number;

  // legacy / optional fields
  packageSize?: string | null; // may contain JSON with {label, price}
  pdfUrl?: string | null;
  imageUrl?: string | null; // legacy cover fallback
  images: string[]; // gallery

  category?: CategoryRef | null;

  sale?: {
    title?: string;
    percentOff?: number;
    priceOff?: number;
    startsAt: string;
    endsAt: string;
    salePrice: number;
  } | null;

  variants?: ProductVariant[]; // optional when feature is enabled
  visibility?: ProductVisibility;
};

// ---------- CUSTOMERS / ADDRESSES ----------
export type Address = {
  id: string;
  customerId: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  country: string;
  isPrimary?: boolean; // not required by backend, but safe for UI
  createdAt: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  marketingOptIn: boolean;
  createdAt: string;
  addresses?: Address[];
};

// ---------- ORDERS ----------
export type OrderStatus =
  | "RECEIVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REFUSED"
  | "CANCELLED";

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number; // snapshot
  product?: { id: string; name: string; slug: string; stock?: number };

  // variant info snapshot (optional)
  variantId?: string | null;
  variantName?: string | null;
};

export type OrderInquiry = {
  id: string;
  customerId: string;
  addressId?: string | null;
  status: OrderStatus;
  note?: string | null;
  adminNote?: string | null;
  recurrence?: string | null;
  createdAt: string;
  customer?: Customer;
  address?: Address | null;
  items: OrderItem[];
};

// ---------- PAGINATION ----------
export type Page<T> = {
  total: number;
  page: number;
  pageSize: number;
  rows: T[];
};

// src/types/cart.ts
export type CartItem = {
  /** productId ou productId::variantId */
  id: string;
  /** Nome mostrado (ex.: "Pisos Perfectos (1 Gallon)") */
  name: string;
  /** Preço unitário; undefined => “Request a quote” */
  price?: number;
  /** Miniatura opcional para exibir no Cart */
  imageUrl?: string | null;
  /** Metadados de variante (opcionais) */
  variantId?: string | null;
  variantName?: string | null;

  /** Quantidade no carrinho */
  quantity: number;
  /** Chave interna para a UI; pode ser o próprio id */
  key: string;
};

export type CartState = {
  items: CartItem[];
};

export type CartContextValue = {
  items: CartItem[];
  count: number;
  /** Soma apenas itens com preço numérico */
  subtotal: number;
  add: (
    item: Omit<CartItem, "quantity" | "key"> & { quantity?: number }
  ) => void;
  remove: (id: string) => void;
  clear: () => void;
};
