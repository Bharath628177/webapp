import type { AddressInfo } from 'node:net';
import { SMTPServer } from 'smtp-server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { EmailDeliveryError } from '../src/enquiries/email/EmailSender.js';
import { SmtpEmailSender } from '../src/enquiries/email/SmtpEmailSender.js';

const message = {
  from: 'catalogue@example.com',
  to: 'sales@example.com',
  replyTo: 'sam@customer.test',
  subject: 'New enquiry: Red Backpack',
  text: 'Name: Sam Lee',
};

describe('SmtpEmailSender', () => {
  const received: string[] = [];
  const server = new SMTPServer({
    authOptional: true,
    disabledCommands: ['STARTTLS'],
    onData(stream, _session, callback) {
      let raw = '';
      stream.on('data', (chunk) => (raw += String(chunk)));
      stream.on('end', () => {
        received.push(raw);
        callback();
      });
    },
  });
  let port: number;

  beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = (server.server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('delivers the message over SMTP', async () => {
    await new SmtpEmailSender({ host: '127.0.0.1', port }).send(message);

    expect(received).toHaveLength(1);
    expect(received[0]).toContain('To: sales@example.com');
    expect(received[0]).toContain('Reply-To: sam@customer.test');
    expect(received[0]).toContain('Subject: New enquiry: Red Backpack');
    expect(received[0]).toContain('Name: Sam Lee');
  });

  it('throws EmailDeliveryError with no customer details when the server is unreachable', async () => {
    const sender = new SmtpEmailSender({ host: '127.0.0.1', port: 1 });

    const error = await sender.send(message).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(EmailDeliveryError);
    expect(JSON.stringify(error)).not.toContain('sam@customer.test');
    expect(String(error)).not.toContain('sam@customer.test');
  });
});
