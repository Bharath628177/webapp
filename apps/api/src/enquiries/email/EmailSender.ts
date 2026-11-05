export interface EmailMessage {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
}

/** How email leaves the system. Swap the implementation to change email provider. */
export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

/** Holds only a provider code, so it is safe to log. */
export class EmailDeliveryError extends Error {
  constructor(readonly smtpCode: string) {
    super('Email delivery failed');
    this.name = 'EmailDeliveryError';
  }
}
