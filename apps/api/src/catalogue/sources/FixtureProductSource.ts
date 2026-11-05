import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { productSchema, type Product } from '../../domain/product.js';
import { ProductSourceError, type ProductSource } from './ProductSource.js';

/** Serves products from a local JSON file, for working offline or when the live API is down. */
export class FixtureProductSource implements ProductSource {
  constructor(private readonly filePath: URL) {}

  async listProducts(): Promise<readonly Product[]> {
    try {
      const contents = await readFile(this.filePath, 'utf-8');
      return z.array(productSchema).parse(JSON.parse(contents));
    } catch (error) {
      throw new ProductSourceError('Could not load products from fixture file', { cause: error });
    }
  }
}
