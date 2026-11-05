import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { ProductGrid } from '../components/ProductGrid';
import { QueryContent } from '../components/QueryContent';
import { StatusMessage } from '../components/StatusMessage';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const term = (searchParams.get('q') ?? '').trim();
  const results = useQuery({
    queryKey: ['search', term],
    queryFn: () => api.searchProducts(term),
    enabled: term !== '',
  });

  if (!term) {
    return <StatusMessage>Enter a search term to find products.</StatusMessage>;
  }

  return (
    <>
      <h1>Results for “{term}”</h1>
      <QueryContent query={results}>
        {(products) =>
          products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <StatusMessage>No products match your search.</StatusMessage>
          )
        }
      </QueryContent>
    </>
  );
}
