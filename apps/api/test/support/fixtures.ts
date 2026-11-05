import type { Merchandising } from '../../src/catalogue/merchandising.js';
import type { ProductSource } from '../../src/catalogue/sources/ProductSource.js';
import type { Product } from '../../src/domain/product.js';
import type { EmailMessage, EmailSender } from '../../src/enquiries/email/EmailSender.js';
import { buildApp, type AppDependencies } from '../../src/app.js';

function product(id: string, title: string, slug: string, name: string): Product {
  return {
    id,
    title,
    description: `Description of ${title}`,
    price: 10,
    imageUrl: `https://images.example.com/${id}.png`,
    category: { slug, name },
  };
}

export const products: Product[] = [
  product('1', 'Red Backpack', 'bags', 'bags'),
  product('2', 'Blue Tote', 'bags', 'bags'),
  product('3', 'Green Duffel', 'bags', 'bags'),
  product('4', 'Gold Ring', 'jewellery', 'jewellery'),
  product('5', 'Silver Chain', 'jewellery', 'jewellery'),
  product('6', "Men's Jacket", 'mens-clothing', "men's clothing"),
];

export const merchandising: Merchandising = {
  home: ['5', '1', '6', '3', '4'],
  categories: { bags: ['3', '1'] },
};

export function sourceOf(items: readonly Product[]): ProductSource {
  return { listProducts: async () => items };
}

export class RecordingEmailSender implements EmailSender {
  readonly sent: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.sent.push(message);
  }
}

export function testApp(overrides: Partial<AppDependencies> = {}) {
  return buildApp({
    productSource: sourceOf(products),
    merchandising,
    emailSender: new RecordingEmailSender(),
    enquiryRouting: { from: 'catalogue@example.com', salesInbox: 'sales@example.com' },
    enquiryRateLimitPerMinute: 100,
    ...overrides,
  });
}
