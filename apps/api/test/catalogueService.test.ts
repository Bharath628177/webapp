import { describe, expect, it, vi } from 'vitest';
import { CatalogueService } from '../src/catalogue/CatalogueService.js';
import { merchandising, products, sourceOf } from './support/fixtures.js';

function service(config = merchandising) {
  const logger = { warn: vi.fn() };
  return { catalogue: new CatalogueService(sourceOf(products), config, logger), logger };
}

describe('getFeatured', () => {
  it("returns the owner's picks in the owner's order", async () => {
    const featured = await service().catalogue.getFeatured();
    expect(featured.map((product) => product.id)).toEqual(['5', '1', '6', '3', '4']);
  });

  it('skips and logs a pick that no longer exists', async () => {
    const { catalogue, logger } = service({ ...merchandising, home: ['1', 'gone'] });
    const featured = await catalogue.getFeatured();
    expect(featured.map((product) => product.id)).toEqual(['1']);
    expect(logger.warn).toHaveBeenCalledWith({ productId: 'gone' }, expect.any(String));
  });
});

describe('listCategories', () => {
  it('returns each category once', async () => {
    const categories = await service().catalogue.listCategories();
    expect(categories.map((category) => category.slug)).toEqual([
      'bags',
      'jewellery',
      'mens-clothing',
    ]);
  });
});

describe('getCategoryProducts', () => {
  it('splits a category into top rated and additional with no overlap', async () => {
    const result = await service().catalogue.getCategoryProducts('bags');
    expect(result?.topRated.map((product) => product.id)).toEqual(['3', '1']);
    expect(result?.additional.map((product) => product.id)).toEqual(['2']);
  });

  it('shows only additional products when the category has no picks', async () => {
    const result = await service().catalogue.getCategoryProducts('jewellery');
    expect(result?.topRated).toEqual([]);
    expect(result?.additional.map((product) => product.id)).toEqual(['4', '5']);
  });

  it('ignores a pick that belongs to another category', async () => {
    const { catalogue } = service({ ...merchandising, categories: { bags: ['4', '1'] } });
    const result = await catalogue.getCategoryProducts('bags');
    expect(result?.topRated.map((product) => product.id)).toEqual(['1']);
    expect(result?.additional.map((product) => product.id)).toEqual(['2', '3']);
  });

  it('returns null for an unknown category', async () => {
    expect(await service().catalogue.getCategoryProducts('nope')).toBeNull();
  });
});

describe('search', () => {
  const ids = async (term: string) =>
    (await service().catalogue.search(term)).map((product) => product.id);

  it('matches the title regardless of case', async () => {
    expect(await ids('BACKPACK')).toEqual(['1']);
  });

  it('matches the description', async () => {
    expect(await ids('description of gold')).toEqual(['4']);
  });

  it('matches the category name', async () => {
    expect(await ids('jewellery')).toEqual(['4', '5']);
  });

  it('ignores surrounding whitespace', async () => {
    expect(await ids('  backpack  ')).toEqual(['1']);
  });

  it('returns nothing when no product matches', async () => {
    expect(await ids('spaceship')).toEqual([]);
  });
});

describe('getProduct', () => {
  it('returns a product by ID, or null when unknown', async () => {
    const { catalogue } = service();
    expect((await catalogue.getProduct('1'))?.title).toBe('Red Backpack');
    expect(await catalogue.getProduct('nope')).toBeNull();
  });
});
