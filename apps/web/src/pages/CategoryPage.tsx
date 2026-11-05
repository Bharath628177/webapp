import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { ProductGrid } from '../components/ProductGrid';
import { QueryContent } from '../components/QueryContent';

export function CategoryPage() {
  const slug = useParams().slug ?? '';
  const query = useQuery({
    queryKey: ['category', slug],
    queryFn: () => api.getCategoryProducts(slug),
  });

  return (
    <QueryContent query={query} notFoundMessage="We could not find that category.">
      {({ category, topRated, additional }) => (
        <>
          <h1 className="capitalised">{category.name}</h1>
          {topRated.length > 0 && (
            <section aria-labelledby="top-rated-heading">
              <h2 id="top-rated-heading">Top rated</h2>
              <ProductGrid products={topRated} />
            </section>
          )}
          {additional.length > 0 && (
            <section aria-labelledby="additional-heading">
              <h2 id="additional-heading">More in this category</h2>
              <ProductGrid products={additional} />
            </section>
          )}
        </>
      )}
    </QueryContent>
  );
}
