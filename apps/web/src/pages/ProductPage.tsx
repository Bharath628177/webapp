import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { EnquiryForm } from '../components/EnquiryForm';
import { QueryContent } from '../components/QueryContent';
import { formatPrice } from '../lib/format';

export function ProductPage() {
  const id = useParams().id ?? '';
  const [enquiring, setEnquiring] = useState(false);
  const query = useQuery({ queryKey: ['product', id], queryFn: () => api.getProduct(id) });

  return (
    <QueryContent query={query} notFoundMessage="We could not find that product.">
      {(product) => (
        <article className="product-detail">
          <img src={product.imageUrl} alt={product.title} />
          <div>
            <h1>{product.title}</h1>
            <p className="product-detail__price">{formatPrice(product.price)}</p>
            <p>{product.description}</p>
            <p>
              <Link
                className="capitalised"
                to={`/category/${encodeURIComponent(product.category.slug)}`}
              >
                {product.category.name}
              </Link>
            </p>
            {enquiring ? (
              <EnquiryForm product={product} />
            ) : (
              <button type="button" onClick={() => setEnquiring(true)}>
                Enquire
              </button>
            )}
          </div>
        </article>
      )}
    </QueryContent>
  );
}
