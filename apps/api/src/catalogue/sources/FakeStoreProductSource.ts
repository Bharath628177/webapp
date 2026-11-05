import { z } from 'zod';
import { toCategorySlug, type Product } from '../../domain/product.js';
import { ProductSourceError, type ProductSource } from './ProductSource.js';

const fakeStoreProductsSchema = z.array(
  z.object({
    id: z.number(),
    title: z.string(),
    price: z.number(),
    description: z.string(),
    category: z.string(),
    image: z.url(),
  }),
);

export class FakeStoreProductSource implements ProductSource {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs = 5000,
  ) {}

  async listProducts(): Promise<readonly Product[]> {
    try {
      // One retry: connections to the provider occasionally fail or time out when run for real
      return await this.fetchProducts().catch(() => this.fetchProducts());
    } catch (error) {
      throw new ProductSourceError('Could not load products from Fake Store', { cause: error });
    }
  }

  private async fetchProducts(): Promise<readonly Product[]> {
    const response = await fetch(`${this.baseUrl}/products`, {
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) {
      throw new Error(`Fake Store responded with ${response.status}`);
    }
    return fakeStoreProductsSchema.parse(await response.json()).map((product) => ({
      id: String(product.id),
      title: product.title.trim(),
      description: product.description.trim(),
      price: product.price,
      imageUrl: product.image,
      category: { slug: toCategorySlug(product.category), name: product.category },
    }));
  }
}
