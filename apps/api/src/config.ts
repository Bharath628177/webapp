import { z } from 'zod';

const envSchema = z.object({
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.string().default('info'),
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  PRODUCT_SOURCE: z.enum(['fakestore', 'fixture']).default('fakestore'),
  FAKE_STORE_BASE_URL: z.url().default('https://fakestoreapi.com'),
  CACHE_TTL_SECONDS: z.coerce.number().int().nonnegative().default(60),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  ENQUIRY_FROM: z.email().default('catalogue@example.com'),
  SALES_INBOX: z.email().default('sales@example.com'),
  ENQUIRY_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(5),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  // Compose passes unset optional values as empty strings, which mean "use the default"
  const provided = Object.fromEntries(Object.entries(env).filter(([, value]) => value !== ''));
  return envSchema.parse(provided);
}
