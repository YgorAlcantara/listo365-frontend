export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string;
  active: boolean;
  stock: number;
};

export type OrderItemInput = { productId: string; quantity: number; unitPrice: number };
