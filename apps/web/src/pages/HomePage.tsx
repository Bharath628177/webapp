import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ProductGrid } from '../components/ProductGrid';
import { QueryContent } from '../components/QueryContent';

export function HomePage() {
  const featured = useQuery({ queryKey: ['featured'], queryFn: api.getFeatured });

  return (
    <>
      <h1>Top rated products</h1>
      <QueryContent query={featured}>{(products) => <ProductGrid products={products} />}</QueryContent>
    </>
  );
}
