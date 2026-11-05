import { z } from 'zod';

export const categorySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
});

export const productSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  price: z.number().nonnegative(),
  imageUrl: z.url(),
  category: categorySchema,
});

export type Category = z.infer<typeof categorySchema>;
export type Product = z.infer<typeof productSchema>;

/** Turns a provider's category name into a URL-safe slug, e.g. "men's clothing" to "mens-clothing". */
export function toCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
