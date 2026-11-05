import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyServerOptions } from 'fastify';
import { CatalogueService } from './catalogue/CatalogueService.js';
import type { Merchandising } from './catalogue/merchandising.js';
import { registerCatalogueRoutes } from './catalogue/routes.js';
import type { ProductSource } from './catalogue/sources/ProductSource.js';
import type { EmailSender } from './enquiries/email/EmailSender.js';
import { EnquiryService, type EnquiryRouting } from './enquiries/EnquiryService.js';
import { registerEnquiryRoutes } from './enquiries/routes.js';
import { registerErrorHandling } from './http/errors.js';

export interface AppDependencies {
  productSource: ProductSource;
  merchandising: Merchandising;
  emailSender: EmailSender;
  enquiryRouting: EnquiryRouting;
  enquiryRateLimitPerMinute: number;
  trustProxy?: boolean;
  logger?: FastifyServerOptions['logger'];
}

/** Takes its adapters as arguments, so tests and future providers plug in without code changes here. */
export async function buildApp(dependencies: AppDependencies) {
  const app = Fastify({
    logger: dependencies.logger ?? false,
    trustProxy: dependencies.trustProxy ?? false,
    bodyLimit: 16 * 1024,
  });

  await app.register(helmet);
  await app.register(rateLimit, { global: false });
  registerErrorHandling(app);

  const catalogue = new CatalogueService(
    dependencies.productSource,
    dependencies.merchandising,
    app.log,
  );
  const enquiries = new EnquiryService(
    catalogue,
    dependencies.emailSender,
    dependencies.enquiryRouting,
  );

  app.get('/health', async () => ({ status: 'ok' }));
  registerCatalogueRoutes(app, catalogue);
  registerEnquiryRoutes(app, enquiries, dependencies.enquiryRateLimitPerMinute);

  return app;
}
