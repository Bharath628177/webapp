import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { errorBody } from '../http/errors.js';
import type { EnquiryService } from './EnquiryService.js';

const enquirySchema = z.object({
  productId: z.string({ error: 'Product is required' }).min(1, 'Product is required').max(100),
  name: z
    .string({ error: 'Enter your name' })
    .trim()
    .min(1, 'Enter your name')
    .max(100, 'Name is too long'),
  email: z
    .string({ error: 'Enter your email address' })
    .trim()
    .max(254, 'Email address is too long')
    .pipe(z.email('Enter a valid email address')),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\-.\s]{6,30}$/, 'Enter a valid phone number')
    .optional(),
  message: z.string().trim().max(2000, 'Message is too long').optional(),
});

export function registerEnquiryRoutes(
  app: FastifyInstance,
  enquiries: EnquiryService,
  rateLimitPerMinute: number,
): void {
  app.post(
    '/api/enquiries',
    { config: { rateLimit: { max: rateLimitPerMinute, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const result = await enquiries.submit(enquirySchema.parse(request.body));
      if (result === 'product_not_found') {
        return reply.code(404).send(errorBody('product_not_found', 'Product not found'));
      }
      return reply.code(202).send({ status: 'received' });
    },
  );
}
