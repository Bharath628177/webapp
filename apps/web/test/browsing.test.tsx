import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { bags, product, renderApp, stubApi } from './support';

const backpack = product('1', 'Red Backpack');
const tote = product('2', 'Blue Tote');

describe('home page', () => {
  it('shows the 5 featured products', async () => {
    const featured = ['1', '2', '3', '4', '5'].map((id) => product(id, `Product ${id}`));
    stubApi({ 'GET /api/featured': { body: { products: featured } } });

    renderApp('/');

    expect(await screen.findByText('Product 1')).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getAllByRole('link')).toHaveLength(5);
  });

  it('shows an error when products cannot be loaded', async () => {
    stubApi({
      'GET /api/featured': {
        status: 502,
        body: { error: { code: 'product_source_unavailable', message: 'Unavailable' } },
      },
    });

    renderApp('/');

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/i);
  });
});

describe('category page', () => {
  it('opens from a category link and shows both groups of products', async () => {
    stubApi({
      'GET /api/featured': { body: { products: [] } },
      'GET /api/categories/bags/products': {
        body: { category: bags, topRated: [backpack], additional: [tote] },
      },
    });
    renderApp('/');

    await userEvent.click(await screen.findByRole('link', { name: 'bags' }));

    const topRated = await screen.findByRole('region', { name: 'Top rated' });
    expect(within(topRated).getByText('Red Backpack')).toBeInTheDocument();
    const additional = screen.getByRole('region', { name: 'More in this category' });
    expect(within(additional).getByText('Blue Tote')).toBeInTheDocument();
  });

  it('hides the top rated group when the category has no picks', async () => {
    stubApi({
      'GET /api/categories/bags/products': {
        body: { category: bags, topRated: [], additional: [tote] },
      },
    });

    renderApp('/category/bags');

    expect(await screen.findByText('Blue Tote')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Top rated' })).not.toBeInTheDocument();
  });

  it('explains when the category does not exist', async () => {
    stubApi({});

    renderApp('/category/nope');

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not find that category.');
  });
});

describe('search', () => {
  const featuredNothing = { 'GET /api/featured': { body: { products: [] } } };

  it('shows only the products the API matched after clicking Search', async () => {
    const fetchMock = stubApi({
      ...featuredNothing,
      'GET /api/products?search=red%20bag': { body: { products: [backpack] } },
    });
    renderApp('/');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search products' }), ' red bag ');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('Red Backpack')).toBeInTheDocument();
    expect(screen.queryByText('Blue Tote')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/products?search=red%20bag', undefined);
  });

  it('also searches when pressing Enter', async () => {
    stubApi({
      ...featuredNothing,
      'GET /api/products?search=tote': { body: { products: [tote] } },
    });
    renderApp('/');

    await userEvent.type(screen.getByRole('searchbox'), 'tote{Enter}');

    expect(await screen.findByText('Blue Tote')).toBeInTheDocument();
  });

  it('sends no request for a blank term', async () => {
    const fetchMock = stubApi(featuredNothing);
    renderApp('/');

    await userEvent.type(screen.getByRole('searchbox'), '   ');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    const searchCalls = fetchMock.mock.calls.filter(([path]) => path.includes('search='));
    expect(searchCalls).toHaveLength(0);
  });

  it('shows an empty state when nothing matches', async () => {
    stubApi({ 'GET /api/products?search=spaceship': { body: { products: [] } } });

    renderApp('/search?q=spaceship');

    expect(await screen.findByText('No products match your search.')).toBeInTheDocument();
  });
});

describe('product page', () => {
  it('opens when clicking a product tile', async () => {
    stubApi({
      'GET /api/featured': { body: { products: [backpack] } },
      'GET /api/products/1': { body: backpack },
    });
    renderApp('/');

    await userEvent.click(await screen.findByRole('link', { name: /Red Backpack/ }));

    expect(await screen.findByRole('heading', { name: 'Red Backpack' })).toBeInTheDocument();
    expect(screen.getByText('Description of Red Backpack')).toBeInTheDocument();
    expect(screen.getByText('$12.50')).toBeInTheDocument();
  });

  it('explains when the product does not exist', async () => {
    stubApi({});

    renderApp('/product/nope');

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not find that product.');
  });
});
