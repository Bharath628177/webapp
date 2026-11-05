import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { errorBody } from '../http/errors.js';
import type { CatalogueService } from './CatalogueService.js';

const searchQuerySchema = z.object({
  search: z
    .string({ error: 'A search term is required' })
    .trim()
    .min(1, 'A search term is required')
    .max(100, 'Search term is too long'),
});

export function registerCatalogueRoutes(app: FastifyInstance, catalogue: CatalogueService): void {
  app.get('/api/featured', async () => ({ products: await catalogue.getFeatured() }));

  app.get('/api/categories', async () => ({ categories: await catalogue.listCategories() }));

  app.get<{ Params: { slug: string } }>('/api/categories/:slug/products', async (request, reply) => {
    const result = await catalogue.getCategoryProducts(request.params.slug);
    if (!result) {
      return reply.code(404).send(errorBody('category_not_found', 'Category not found'));
    }
    return result;
  });

  app.get('/api/products', async (request) => {
    const { search } = searchQuerySchema.parse(request.query);
    return { products: await catalogue.search(search) };
  });

  app.get<{ Params: { id: string } }>('/api/products/:id', async (request, reply) => {
    const product = await catalogue.getProduct(request.params.id);
    if (!product) {
      return reply.code(404).send(errorBody('product_not_found', 'Product not found'));
    }
    return product;
  });
}
