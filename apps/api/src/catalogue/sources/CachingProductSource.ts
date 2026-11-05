import type { Product } from '../../domain/product.js';
import type { ProductSource } from './ProductSource.js';

/** Wraps any source with a short TTL, so search does not call the provider on every request. */
export class CachingProductSource implements ProductSource {
  private cached?: { expiresAt: number; products: Promise<readonly Product[]> };

  constructor(
    private readonly inner: ProductSource,
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  listProducts(): Promise<readonly Product[]> {
    if (this.cached && this.now() < this.cached.expiresAt) {
      return this.cached.products;
    }

    // Cache the promise so concurrent requests share one upstream call
    const entry = { expiresAt: this.now() + this.ttlMs, products: this.inner.listProducts() };
    this.cached = entry;
    entry.products.catch(() => {
      // A failure must not be served from the cache until the TTL runs out
      if (this.cached === entry) {
        this.cached = undefined;
      }
    });
    return entry.products;
  }
}
