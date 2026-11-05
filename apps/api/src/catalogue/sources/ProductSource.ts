import type { Product } from '../../domain/product.js';

/** Where product data comes from. Swap the implementation to change data provider. */
export interface ProductSource {
  listProducts(): Promise<readonly Product[]>;
}

export class ProductSourceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ProductSourceError';
  }
}
