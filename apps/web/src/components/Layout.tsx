import { useQuery } from '@tanstack/react-query';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { api } from '../api/client';
import { SearchForm } from './SearchForm';

export function Layout() {
  const categories = useQuery({ queryKey: ['categories'], queryFn: api.getCategories });

  return (
    <>
      <header className="site-header">
        <div className="site-header__row">
          <Link className="site-header__brand" to="/">
            Product Catalogue
          </Link>
          <SearchForm />
        </div>
        {/* The page's own error state covers an outage, so a failed nav renders nothing */}
        {categories.data && (
          <nav aria-label="Categories" className="category-nav">
            {categories.data.map((category) => (
              <NavLink key={category.slug} to={`/category/${encodeURIComponent(category.slug)}`}>
                {category.name}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main className="site-main">
        <Outlet />
      </main>
    </>
  );
}
