// ---------- PRODUCTS ----------
export type CategoryRef = {
  id: string;
  name: string;
  slug: string;
  parent?: { id: string; name: string; slug: string } | null;
};

export type ProductVisibility = {
  price: boolean;
  packageSize: boolean;
  pdf: boolean;
  images: boolean;
  description: boolean;
};

export type ProductVariant = {
  id: string;
  name: string;         // ex.: "1 gal", "32 oz"
  price: number;        // preço da variante
  stock: number;
  active: boolean;
  sortOrder: number;
  sku?: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number; // baseline (para lista/SEO); pode ser 0
  active: boolean;
  stock: number;
  sortOrder: number;
  packageSize?: string | null;
  pdfUrl?: string | null;
  imageUrl?: string | null;
  images: string[];
  category?: CategoryRef | null;
  sale?: {
    title?: string;
    percentOff?: number;
    priceOff?: number;
    startsAt: string;
    endsAt: string;
    salePrice: number;
  } | null;
  visibility?: ProductVisibility;
  variants?: ProductVariant[];
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
  isPrimary: boolean;
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
  unitPrice: number;
  product?: { id: string; name: string; slug: string; stock?: number };
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
