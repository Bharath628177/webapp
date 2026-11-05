import { describe, expect, it } from 'vitest';
import { EmailDeliveryError } from '../src/enquiries/email/EmailSender.js';
import { RecordingEmailSender, testApp } from './support/fixtures.js';

const validEnquiry = {
  productId: '1',
  name: 'Sam Lee',
  email: 'sam@customer.test',
  phone: '+44 20 7946 0000',
  message: 'Is this in stock?',
};

function post(app: Awaited<ReturnType<typeof testApp>>, payload: object) {
  return app.inject({ method: 'POST', url: '/api/enquiries', payload });
}

describe('POST /api/enquiries', () => {
  it('emails the sales inbox with the enquiry details', async () => {
    const emailSender = new RecordingEmailSender();
    const app = await testApp({ emailSender });

    const response = await post(app, validEnquiry);

    expect(response.statusCode).toBe(202);
    expect(emailSender.sent).toHaveLength(1);
    const [email] = emailSender.sent;
    expect(email?.to).toBe('sales@example.com');
    expect(email?.replyTo).toBe('sam@customer.test');
    expect(email?.subject).toBe('New enquiry: Red Backpack');
    expect(email?.text).toContain('Sam Lee');
    expect(email?.text).toContain('+44 20 7946 0000');
    expect(email?.text).toContain('Is this in stock?');
  });

  it('accepts an enquiry without the optional fields', async () => {
    const emailSender = new RecordingEmailSender();
    const app = await testApp({ emailSender });

    const response = await post(app, {
      productId: '1',
      name: 'Sam Lee',
      email: 'sam@customer.test',
    });

    expect(response.statusCode).toBe(202);
    expect(emailSender.sent[0]?.text).toContain('Phone: Not provided');
  });

  it('uses the catalogue product, ignoring product text sent by the client', async () => {
    const emailSender = new RecordingEmailSender();
    const app = await testApp({ emailSender });

    await post(app, { ...validEnquiry, productTitle: 'Injected title' });

    expect(emailSender.sent[0]?.subject).toBe('New enquiry: Red Backpack');
    expect(emailSender.sent[0]?.text).not.toContain('Injected title');
  });

  it.each([
    ['a missing name', { name: undefined }, 'name'],
    ['a blank name', { name: '   ' }, 'name'],
    ['an overlong name', { name: 'x'.repeat(101) }, 'name'],
    ['a missing email', { email: undefined }, 'email'],
    ['an invalid email', { email: 'not-an-email' }, 'email'],
    ['a header injection attempt', { email: 'a@b.test\r\nBcc: c@d.test' }, 'email'],
    ['an invalid phone', { phone: 'call me' }, 'phone'],
    ['an overlong message', { message: 'x'.repeat(2001) }, 'message'],
    ['a missing product', { productId: undefined }, 'productId'],
  ])('rejects %s without sending email', async (_label, change, field) => {
    const emailSender = new RecordingEmailSender();
    const app = await testApp({ emailSender });

    const response = await post(app, { ...validEnquiry, ...change });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.fields.map((f: { field: string }) => f.field)).toContain(field);
    expect(emailSender.sent).toHaveLength(0);
  });

  it('returns 404 for an unknown product without sending email', async () => {
    const emailSender = new RecordingEmailSender();
    const app = await testApp({ emailSender });

    const response = await post(app, { ...validEnquiry, productId: 'nope' });

    expect(response.statusCode).toBe(404);
    expect(emailSender.sent).toHaveLength(0);
  });

  it('returns 502 when email fails, so the customer never sees a false thank you', async () => {
    const app = await testApp({
      emailSender: {
        send: async () => {
          throw new EmailDeliveryError('ECONNECTION');
        },
      },
    });

    const response = await post(app, validEnquiry);

    expect(response.statusCode).toBe(502);
    expect(response.json().error.code).toBe('email_unavailable');
  });

  it('does not log customer details when email fails', async () => {
    const logLines: string[] = [];
    const app = await testApp({
      emailSender: {
        send: async () => {
          throw new EmailDeliveryError('ECONNECTION');
        },
      },
      logger: { level: 'trace', stream: { write: (line: string) => logLines.push(line) } },
    });

    await post(app, validEnquiry);

    const logs = logLines.join('');
    expect(logs).toContain('ECONNECTION');
    expect(logs).not.toContain('sam@customer.test');
    expect(logs).not.toContain('Sam Lee');
    expect(logs).not.toContain('7946');
  });

  it('rate limits repeated enquiries', async () => {
    const app = await testApp({ enquiryRateLimitPerMinute: 2 });

    await post(app, validEnquiry);
    await post(app, validEnquiry);
    const response = await post(app, validEnquiry);

    expect(response.statusCode).toBe(429);
    expect(response.json().error.code).toBe('rate_limited');
  });

  it('rejects an oversized body', async () => {
    const app = await testApp();
    const response = await post(app, { ...validEnquiry, message: 'x'.repeat(20 * 1024) });
    expect(response.statusCode).toBe(413);
  });
});
