import { afterEach, describe, expect, it, vi } from 'vitest';
import { CachingProductSource } from '../src/catalogue/sources/CachingProductSource.js';
import { FakeStoreProductSource } from '../src/catalogue/sources/FakeStoreProductSource.js';
import { ProductSourceError } from '../src/catalogue/sources/ProductSource.js';
import { products } from './support/fixtures.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FakeStoreProductSource', () => {
  const stubFetch = (response: Response | Error) => {
    const fetchMock = vi.fn(async () => {
      if (response instanceof Error) throw response;
      return response;
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  };

  it('maps the provider response to domain products', async () => {
    const fetchMock = stubFetch(
      Response.json([
        {
          id: 3,
          title: ' Mens Cotton Jacket ',
          price: 55.99,
          description: ' Warm. ',
          category: "men's clothing",
          image: 'https://images.example.com/3.png',
          rating: { rate: 4.7, count: 500 },
        },
      ]),
    );

    const result = await new FakeStoreProductSource('https://store.test').listProducts();

    expect(fetchMock).toHaveBeenCalledWith('https://store.test/products', expect.anything());
    expect(result).toEqual([
      {
        id: '3',
        title: 'Mens Cotton Jacket',
        description: 'Warm.',
        price: 55.99,
        imageUrl: 'https://images.example.com/3.png',
        category: { slug: 'mens-clothing', name: "men's clothing" },
      },
    ]);
  });

  it.each([
    ['an error status', new Response('nope', { status: 503 })],
    ['an unexpected shape', Response.json([{ id: 'not-a-number' }])],
    ['a network failure', new Error('connect ECONNREFUSED')],
  ])('throws ProductSourceError on %s', async (_label, response) => {
    stubFetch(response);
    await expect(new FakeStoreProductSource('https://store.test').listProducts()).rejects.toThrow(
      ProductSourceError,
    );
  });

  it('retries once, so a single failed connection does not reach the customer', async () => {
    const fetchMock = vi
      .fn<() => Promise<Response>>()
      .mockRejectedValueOnce(new Error('connect ETIMEDOUT'))
      .mockResolvedValueOnce(Response.json([]));
    vi.stubGlobal('fetch', fetchMock);

    await expect(new FakeStoreProductSource('https://store.test').listProducts()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after the retry fails', async () => {
    const fetchMock = stubFetch(new Error('connect ETIMEDOUT'));

    await expect(new FakeStoreProductSource('https://store.test').listProducts()).rejects.toThrow(
      ProductSourceError,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('CachingProductSource', () => {
  it('reuses the result within the TTL and refetches after it', async () => {
    let time = 0;
    const listProducts = vi.fn(async () => products);
    const source = new CachingProductSource({ listProducts }, 1000, () => time);

    await source.listProducts();
    time = 999;
    await source.listProducts();
    expect(listProducts).toHaveBeenCalledTimes(1);

    time = 1000;
    await source.listProducts();
    expect(listProducts).toHaveBeenCalledTimes(2);
  });

  it('shares one upstream call between concurrent requests', async () => {
    const listProducts = vi.fn(async () => products);
    const source = new CachingProductSource({ listProducts }, 1000);

    await Promise.all([source.listProducts(), source.listProducts()]);

    expect(listProducts).toHaveBeenCalledTimes(1);
  });

  it('does not cache a failure', async () => {
    const listProducts = vi
      .fn<() => Promise<typeof products>>()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce(products);
    const source = new CachingProductSource({ listProducts }, 1000);

    await expect(source.listProducts()).rejects.toThrow('down');
    await expect(source.listProducts()).resolves.toEqual(products);
  });
});
