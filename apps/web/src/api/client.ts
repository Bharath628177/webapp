import type { Category, CategoryProducts, EnquiryRequest, FieldError, Product } from './types';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields: FieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, init);
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (body as { error?: { code: string; message: string; fields?: FieldError[] } } | null)
      ?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'unknown_error',
      error?.message ?? 'Something went wrong',
      error?.fields,
    );
  }
  return body as T;
}

export const api = {
  getFeatured: async () => (await request<{ products: Product[] }>('/featured')).products,

  getCategories: async () => (await request<{ categories: Category[] }>('/categories')).categories,

  getCategoryProducts: (slug: string) =>
    request<CategoryProducts>(`/categories/${encodeURIComponent(slug)}/products`),

  searchProducts: async (term: string) =>
    (await request<{ products: Product[] }>(`/products?search=${encodeURIComponent(term)}`)).products,

  getProduct: (id: string) => request<Product>(`/products/${encodeURIComponent(id)}`),

  submitEnquiry: (enquiry: EnquiryRequest) =>
    request<{ status: string }>('/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enquiry),
    }),
};
