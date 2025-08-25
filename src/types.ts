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

export type Variant = {
  label: string; // "1 gal", "5 gal", ...
  price?: number | null; // preço da variante (ou null para cotação)
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number; // preço base (fallback)
  active: boolean;
  stock: number;
  sortOrder: number;
  packageSize?: string | null; // JSON de variantes OU texto legado "1 gal | 5 gal"
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

  visibility?: ProductVisibility; // mapeado das flags do backend
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
  unitPrice: number; // se seu backend retorna Decimal/string, pode usar: number | string
  product?: { id: string; name: string; slug: string; stock?: number };
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
