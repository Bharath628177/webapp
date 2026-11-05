import type { CatalogueService } from '../catalogue/CatalogueService.js';
import type { EmailSender } from './email/EmailSender.js';

export interface Enquiry {
  productId: string;
  name: string;
  email: string;
  phone?: string | undefined;
  message?: string | undefined;
}

export interface EnquiryRouting {
  from: string;
  salesInbox: string;
}

export type EnquiryResult = 'sent' | 'product_not_found';

export class EnquiryService {
  constructor(
    private readonly catalogue: CatalogueService,
    private readonly emailSender: EmailSender,
    private readonly routing: EnquiryRouting,
  ) {}

  async submit(enquiry: Enquiry): Promise<EnquiryResult> {
    // Product details come from our catalogue, so a client cannot put its own text in them
    const product = await this.catalogue.getProduct(enquiry.productId);
    if (!product) {
      return 'product_not_found';
    }

    await this.emailSender.send({
      from: this.routing.from,
      to: this.routing.salesInbox,
      replyTo: enquiry.email,
      subject: `New enquiry: ${product.title}`,
      text: [
        `Product: ${product.title} (ID ${product.id})`,
        `Name: ${enquiry.name}`,
        `Email: ${enquiry.email}`,
        `Phone: ${enquiry.phone ?? 'Not provided'}`,
        '',
        'Message:',
        enquiry.message ?? 'Not provided',
      ].join('\n'),
    });
    return 'sent';
  }
}
