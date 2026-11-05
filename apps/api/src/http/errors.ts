import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { ProductSourceError } from '../catalogue/sources/ProductSource.js';
import { EmailDeliveryError } from '../enquiries/email/EmailSender.js';

interface FieldError {
  field: string;
  message: string;
}

export function errorBody(code: string, message: string, fields?: FieldError[]) {
  return { error: { code, message, ...(fields ? { fields } : {}) } };
}

function clientErrorStatus(error: unknown): number | null {
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    const { statusCode } = error;
    if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
      return statusCode;
    }
  }
  return null;
}

/** One error shape for every failure. Internal details are logged and never sent to the client. */
export function registerErrorHandling(app: FastifyInstance): void {
  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send(errorBody('not_found', 'Not found'));
  });

  app.setErrorHandler((error: unknown, request, reply) => {
    if (error instanceof ZodError) {
      const fields = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return reply.code(400).send(errorBody('validation_failed', 'Invalid request', fields));
    }

    if (error instanceof ProductSourceError) {
      request.log.error({ err: error }, 'Product source failed');
      return reply
        .code(502)
        .send(errorBody('product_source_unavailable', 'Products are unavailable right now'));
    }

    if (error instanceof EmailDeliveryError) {
      // Only the code: raw mail errors can contain customer addresses
      request.log.error({ smtpCode: error.smtpCode }, 'Enquiry email failed');
      return reply
        .code(502)
        .send(errorBody('email_unavailable', 'We could not send your enquiry. Please try again.'));
    }

    const status = clientErrorStatus(error);
    if (status === 429) {
      return reply.code(429).send(errorBody('rate_limited', 'Too many requests. Please try later.'));
    }
    if (status !== null) {
      return reply.code(status).send(errorBody('bad_request', 'Invalid request'));
    }

    request.log.error({ err: error }, 'Unexpected error');
    return reply.code(500).send(errorBody('internal_error', 'Something went wrong'));
  });
}
