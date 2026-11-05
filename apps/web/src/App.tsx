import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { StatusMessage } from './components/StatusMessage';
import { CategoryPage } from './pages/CategoryPage';
import { HomePage } from './pages/HomePage';
import { ProductPage } from './pages/ProductPage';
import { SearchPage } from './pages/SearchPage';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="category/:slug" element={<CategoryPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="product/:id" element={<ProductPage />} />
        <Route path="*" element={<StatusMessage>Page not found.</StatusMessage>} />
      </Route>
    </Routes>
  );
}
