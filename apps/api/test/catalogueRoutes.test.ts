import { describe, expect, it } from 'vitest';
import { ProductSourceError } from '../src/catalogue/sources/ProductSource.js';
import { testApp } from './support/fixtures.js';

describe('catalogue routes', () => {
  it('GET /api/featured returns the 5 featured products', async () => {
    const app = await testApp();
    const response = await app.inject({ url: '/api/featured' });
    expect(response.statusCode).toBe(200);
    expect(response.json().products).toHaveLength(5);
  });

  it('GET /api/categories lists categories', async () => {
    const app = await testApp();
    const response = await app.inject({ url: '/api/categories' });
    expect(response.json().categories).toContainEqual({
      slug: 'mens-clothing',
      name: "men's clothing",
    });
  });

  it('GET /api/categories/:slug/products returns both groups', async () => {
    const app = await testApp();
    const body = (await app.inject({ url: '/api/categories/bags/products' })).json();
    expect(body.category.slug).toBe('bags');
    expect(body.topRated).toHaveLength(2);
    expect(body.additional).toHaveLength(1);
  });

  it('GET /api/categories/:slug/products returns 404 for an unknown category', async () => {
    const app = await testApp();
    const response = await app.inject({ url: '/api/categories/nope/products' });
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('category_not_found');
  });

  it('GET /api/products?search= returns only matches', async () => {
    const app = await testApp();
    const response = await app.inject({ url: '/api/products', query: { search: 'backpack' } });
    expect(response.json().products.map((p: { id: string }) => p.id)).toEqual(['1']);
  });

  it.each([
    ['a missing term', {}],
    ['a blank term', { search: '   ' }],
    ['an overlong term', { search: 'x'.repeat(101) }],
  ])('GET /api/products returns 400 for %s', async (_label, query) => {
    const app = await testApp();
    const response = await app.inject({ url: '/api/products', query });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('validation_failed');
  });

  it('GET /api/products/:id returns the product, or 404 when unknown', async () => {
    const app = await testApp();
    expect((await app.inject({ url: '/api/products/1' })).json().title).toBe('Red Backpack');
    expect((await app.inject({ url: '/api/products/nope' })).statusCode).toBe(404);
  });

  it('returns 502 without internal details when the product source fails', async () => {
    const app = await testApp({
      productSource: {
        listProducts: async () => {
          throw new ProductSourceError('secret upstream detail');
        },
      },
    });
    const response = await app.inject({ url: '/api/featured' });
    expect(response.statusCode).toBe(502);
    expect(response.json().error.code).toBe('product_source_unavailable');
    expect(response.body).not.toContain('secret upstream detail');
  });

  it('returns the JSON error shape for an unknown route', async () => {
    const app = await testApp();
    const response = await app.inject({ url: '/api/nope' });
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('not_found');
  });

  it('GET /health reports ok', async () => {
    const app = await testApp();
    expect((await app.inject({ url: '/health' })).json()).toEqual({ status: 'ok' });
  });
});
