import type { Category, Product } from '../domain/product.js';
import type { Merchandising } from './merchandising.js';
import type { ProductSource } from './sources/ProductSource.js';

export interface Logger {
  warn(details: object, message: string): void;
}

export interface CategoryProducts {
  category: Category;
  topRated: Product[];
  additional: Product[];
}

export class CatalogueService {
  constructor(
    private readonly source: ProductSource,
    private readonly merchandising: Merchandising,
    private readonly logger: Logger,
  ) {}

  async getFeatured(): Promise<Product[]> {
    return this.pick(await this.source.listProducts(), this.merchandising.home);
  }

  async listCategories(): Promise<Category[]> {
    const categories = new Map<string, Category>();
    for (const { category } of await this.source.listProducts()) {
      categories.set(category.slug, category);
    }
    return [...categories.values()];
  }

  /** Returns null when no product belongs to the category. */
  async getCategoryProducts(slug: string): Promise<CategoryProducts | null> {
    const products = (await this.source.listProducts()).filter(
      (product) => product.category.slug === slug,
    );
    const [first] = products;
    if (!first) {
      return null;
    }

    const topRated = this.pick(products, this.merchandising.categories[slug] ?? []);
    const topRatedIds = new Set(topRated.map((product) => product.id));
    return {
      category: first.category,
      topRated,
      additional: products.filter((product) => !topRatedIds.has(product.id)),
    };
  }

  /** Case-insensitive phrase match on title, description and category name. */
  async search(term: string): Promise<Product[]> {
    const needle = term.trim().toLowerCase();
    return (await this.source.listProducts()).filter((product) =>
      [product.title, product.description, product.category.name].some((text) =>
        text.toLowerCase().includes(needle),
      ),
    );
  }

  async getProduct(id: string): Promise<Product | null> {
    const products = await this.source.listProducts();
    return products.find((product) => product.id === id) ?? null;
  }

  /** Keeps the owner's order. A stale ID is skipped, so one bad pick cannot break the page. */
  private pick(products: readonly Product[], ids: readonly string[]): Product[] {
    const byId = new Map(products.map((product) => [product.id, product]));
    return ids.flatMap((id) => {
      const product = byId.get(id);
      if (!product) {
        this.logger.warn({ productId: id }, 'Merchandising config names an unavailable product');
        return [];
      }
      return [product];
    });
  }
}
