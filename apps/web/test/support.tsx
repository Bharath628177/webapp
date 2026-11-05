import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import type { Category, Product } from '../src/api/types';
import { App } from '../src/App';

export const bags: Category = { slug: 'bags', name: 'bags' };

export function product(id: string, title: string): Product {
  return {
    id,
    title,
    description: `Description of ${title}`,
    price: 12.5,
    imageUrl: `https://images.example.com/${id}.png`,
    category: bags,
  };
}

type Route = { status?: number; body: unknown };
type Routes = Record<string, Route | ((init?: RequestInit) => Route)>;

/** Stubs the network at fetch, so tests also cover the real API client. Keys are "METHOD /path". */
export function stubApi(routes: Routes) {
  const allRoutes: Routes = {
    'GET /api/categories': { body: { categories: [bags] } },
    ...routes,
  };
  const fetchMock = vi.fn(async (path: string, init?: RequestInit) => {
    const route = allRoutes[`${init?.method ?? 'GET'} ${path}`];
    if (!route) {
      return Response.json({ error: { code: 'not_found', message: 'Not found' } }, { status: 404 });
    }
    const { status = 200, body } = typeof route === 'function' ? route(init) : route;
    return Response.json(body, { status });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function renderApp(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
