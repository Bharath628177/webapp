// Mirrors the API responses in apps/api. Written by hand for the PoC; see DECISIONS.md.
export interface Category {
  slug: string;
  name: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  category: Category;
}

export interface CategoryProducts {
  category: Category;
  topRated: Product[];
  additional: Product[];
}

export interface EnquiryRequest {
  productId: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
}

export interface FieldError {
  field: string;
  message: string;
}
