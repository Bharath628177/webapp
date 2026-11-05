import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { product, renderApp, stubApi } from './support';

const backpack = product('1', 'Red Backpack');
const getProduct = { 'GET /api/products/1': { body: backpack } };

async function openForm() {
  renderApp('/product/1');
  await userEvent.click(await screen.findByRole('button', { name: 'Enquire' }));
}

async function fillRequiredFields() {
  await userEvent.type(screen.getByLabelText('Name'), 'Sam Lee');
  await userEvent.type(screen.getByLabelText('Email'), 'sam@customer.test');
}

function submit() {
  return userEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));
}

describe('enquiry', () => {
  it('sends the details and shows a thank you message', async () => {
    let sentBody: unknown;
    stubApi({
      ...getProduct,
      'POST /api/enquiries': (init) => {
        sentBody = JSON.parse(String(init?.body));
        return { status: 202, body: { status: 'received' } };
      },
    });
    await openForm();

    await fillRequiredFields();
    await userEvent.type(screen.getByLabelText('Message (optional)'), 'In stock?');
    await submit();

    expect(await screen.findByRole('heading', { name: 'Thank you' })).toBeInTheDocument();
    expect(sentBody).toEqual({
      productId: '1',
      name: 'Sam Lee',
      email: 'sam@customer.test',
      message: 'In stock?',
    });
  });

  it('shows an error, no thank you, and keeps the input when sending fails', async () => {
    stubApi({
      ...getProduct,
      'POST /api/enquiries': {
        status: 502,
        body: { error: { code: 'email_unavailable', message: 'We could not send your enquiry.' } },
      },
    });
    await openForm();

    await fillRequiredFields();
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not send your enquiry.');
    expect(screen.queryByRole('heading', { name: 'Thank you' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Sam Lee');
    expect(screen.getByLabelText('Email')).toHaveValue('sam@customer.test');
  });

  it('shows field errors returned by the API', async () => {
    stubApi({
      ...getProduct,
      'POST /api/enquiries': {
        status: 400,
        body: {
          error: {
            code: 'validation_failed',
            message: 'Invalid request',
            fields: [{ field: 'phone', message: 'Enter a valid phone number' }],
          },
        },
      },
    });
    await openForm();

    await fillRequiredFields();
    await userEvent.type(screen.getByLabelText('Phone (optional)'), 'call me');
    await submit();

    expect(await screen.findByText('Enter a valid phone number')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone (optional)')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not submit until the required fields are complete', async () => {
    const fetchMock = stubApi(getProduct);
    await openForm();

    await submit();

    const posts = fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST');
    expect(posts).toHaveLength(0);
    expect(screen.queryByRole('heading', { name: 'Thank you' })).not.toBeInTheDocument();
  });
});
