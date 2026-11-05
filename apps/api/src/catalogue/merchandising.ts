import { readFileSync } from 'node:fs';
import { z } from 'zod';

const FEATURED_PRODUCT_COUNT = 5;

const productIdList = z.array(z.string().min(1)).refine((ids) => new Set(ids).size === ids.length, {
  error: 'Product IDs must be unique',
});

/** The owner's choices, kept apart from product data so that either can change alone. */
export const merchandisingSchema = z.object({
  home: productIdList.refine((ids) => ids.length === FEATURED_PRODUCT_COUNT, {
    error: `Home page must feature exactly ${FEATURED_PRODUCT_COUNT} products`,
  }),
  categories: z.record(z.string(), productIdList),
});

export type Merchandising = z.infer<typeof merchandisingSchema>;

/** Throws on invalid config, so a bad edit stops startup rather than reaching customers. */
export function loadMerchandising(filePath: URL): Merchandising {
  return merchandisingSchema.parse(JSON.parse(readFileSync(filePath, 'utf-8')));
}
