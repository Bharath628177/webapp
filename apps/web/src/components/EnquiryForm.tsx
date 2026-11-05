import { useMutation } from '@tanstack/react-query';
import { useId, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import type { EnquiryRequest, Product } from '../api/types';
import { StatusMessage } from './StatusMessage';

interface FieldProps {
  name: keyof EnquiryRequest;
  label: string;
  type?: string;
  required?: boolean;
  multiline?: boolean;
  error?: string | undefined;
}

function Field({ name, label, type = 'text', required = false, multiline = false, error }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const shared = {
    id,
    name,
    required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
  };

  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {!required && ' (optional)'}
      </label>
      {multiline ? <textarea rows={4} {...shared} /> : <input type={type} {...shared} />}
      {error && (
        <p className="form-field__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}

function optional(form: FormData, name: string): string | undefined {
  const value = String(form.get(name) ?? '').trim();
  return value || undefined;
}

export function EnquiryForm({ product }: { product: Product }) {
  const enquiry = useMutation({ mutationFn: api.submitEnquiry });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const phone = optional(form, 'phone');
    const message = optional(form, 'message');
    enquiry.mutate({
      productId: product.id,
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      ...(phone ? { phone } : {}),
      ...(message ? { message } : {}),
    });
  }

  if (enquiry.isSuccess) {
    return (
      <div className="enquiry-thanks" role="status">
        <h2>Thank you</h2>
        <p>We have received your enquiry about {product.title} and will be in touch soon.</p>
      </div>
    );
  }

  const fieldErrors = enquiry.error instanceof ApiError ? enquiry.error.fields : [];
  const errorFor = (field: string) => fieldErrors.find((error) => error.field === field)?.message;

  return (
    // The inputs stay mounted after a failure, so the customer keeps what they typed
    <form className="enquiry-form" onSubmit={handleSubmit}>
      <h2>Enquire about this product</h2>
      {enquiry.isError && (
        <StatusMessage role="alert">
          {enquiry.error instanceof ApiError
            ? enquiry.error.message
            : 'We could not send your enquiry. Please try again.'}
        </StatusMessage>
      )}
      <Field name="name" label="Name" required error={errorFor('name')} />
      <Field name="email" label="Email" type="email" required error={errorFor('email')} />
      <Field name="phone" label="Phone" type="tel" error={errorFor('phone')} />
      <Field name="message" label="Message" multiline error={errorFor('message')} />
      <button type="submit" disabled={enquiry.isPending}>
        {enquiry.isPending ? 'Sending…' : 'Send enquiry'}
      </button>
    </form>
  );
}
