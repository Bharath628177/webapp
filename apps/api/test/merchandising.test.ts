import { describe, expect, it } from 'vitest';
import { loadMerchandising, merchandisingSchema } from '../src/catalogue/merchandising.js';
import { FixtureProductSource } from '../src/catalogue/sources/FixtureProductSource.js';

describe('merchandisingSchema', () => {
  it.each([
    ['fewer than 5 home products', ['1', '2', '3', '4']],
    ['more than 5 home products', ['1', '2', '3', '4', '5', '6']],
    ['duplicate home products', ['1', '1', '2', '3', '4']],
  ])('rejects %s', (_label, home) => {
    expect(merchandisingSchema.safeParse({ home, categories: {} }).success).toBe(false);
  });
});

describe('shipped config', () => {
  it('names real products in the right categories', async () => {
    const config = loadMerchandising(new URL('../config/merchandising.json', import.meta.url));
    const products = await new FixtureProductSource(
      new URL('../fixtures/products.json', import.meta.url),
    ).listProducts();
    const categoryById = new Map(products.map((product) => [product.id, product.category.slug]));

    for (const id of config.home) {
      expect(categoryById.has(id), `home pick ${id}`).toBe(true);
    }
    for (const [slug, ids] of Object.entries(config.categories)) {
      for (const id of ids) {
        expect(categoryById.get(id), `${slug} pick ${id}`).toBe(slug);
      }
    }
  });
});
