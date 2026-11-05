import { buildApp } from './app.js';
import { loadMerchandising } from './catalogue/merchandising.js';
import { CachingProductSource } from './catalogue/sources/CachingProductSource.js';
import { FakeStoreProductSource } from './catalogue/sources/FakeStoreProductSource.js';
import { FixtureProductSource } from './catalogue/sources/FixtureProductSource.js';
import type { ProductSource } from './catalogue/sources/ProductSource.js';
import { loadConfig, type Config } from './config.js';
import { SmtpEmailSender } from './enquiries/email/SmtpEmailSender.js';

function createProductSource(config: Config): ProductSource {
  switch (config.PRODUCT_SOURCE) {
    case 'fakestore':
      return new CachingProductSource(
        new FakeStoreProductSource(config.FAKE_STORE_BASE_URL),
        config.CACHE_TTL_SECONDS * 1000,
      );
    case 'fixture':
      return new FixtureProductSource(new URL('../fixtures/products.json', import.meta.url));
  }
}

const config = loadConfig();

const app = await buildApp({
  productSource: createProductSource(config),
  merchandising: loadMerchandising(new URL('../config/merchandising.json', import.meta.url)),
  emailSender: new SmtpEmailSender({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  }),
  enquiryRouting: { from: config.ENQUIRY_FROM, salesInbox: config.SALES_INBOX },
  enquiryRateLimitPerMinute: config.ENQUIRY_RATE_LIMIT_PER_MINUTE,
  trustProxy: config.TRUST_PROXY,
  logger: { level: config.LOG_LEVEL },
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => void app.close());
}

await app.listen({ host: config.HOST, port: config.PORT });
