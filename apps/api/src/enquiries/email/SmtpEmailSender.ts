import nodemailer from 'nodemailer';
import { EmailDeliveryError, type EmailMessage, type EmailSender } from './EmailSender.js';

export interface SmtpOptions {
  host: string;
  port: number;
  user?: string | undefined;
  pass?: string | undefined;
}

export class SmtpEmailSender implements EmailSender {
  private readonly transport: ReturnType<typeof nodemailer.createTransport>;

  constructor({ host, port, user, pass }: SmtpOptions) {
    this.transport = nodemailer.createTransport({
      host,
      port,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      ...(user && pass ? { auth: { user, pass } } : {}),
    });
  }

  async send(message: EmailMessage): Promise<void> {
    try {
      await this.transport.sendMail(message);
    } catch (error) {
      const code = error instanceof Error && 'code' in error ? String(error.code) : 'UNKNOWN';
      throw new EmailDeliveryError(code);
    }
  }
}
