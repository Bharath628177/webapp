import { Link } from 'react-router-dom';
import type { Product } from '../api/types';
import { formatPrice } from '../lib/format';

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="product-grid">
      {products.map((product) => (
        <li key={product.id}>
          <Link className="product-tile" to={`/product/${encodeURIComponent(product.id)}`}>
            <img src={product.imageUrl} alt="" loading="lazy" />
            <span className="product-tile__title">{product.title}</span>
            <span className="product-tile__price">{formatPrice(product.price)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
