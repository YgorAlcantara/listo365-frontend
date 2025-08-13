export type CategoryNode = {
  id: string; name: string; slug: string;
  parent?: { id: string; name: string; slug: string } | null;
  children?: CategoryNode[];
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  active: boolean;
  stock: number;
  sortOrder: number;
  packageSize?: string | null;
  pdfUrl?: string | null;
  category?: { id: string; name: string; slug: string; parent?: { id: string; name: string; slug: string } | null } | null;
  images: string[];
  imageUrl?: string | null; // fallback
};

