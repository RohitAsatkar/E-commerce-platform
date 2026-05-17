import { useParams, Link } from 'react-router-dom';
import { useProducts } from '../lib/useProducts';
import { formatPrice } from '../lib/currency';

const ProductListing = () => {
  const { category } = useParams<{ category: string }>();
  const { products, loading } = useProducts();
  
  let displayedProducts = products;
  let title = 'All Products';

  if (category) {
    if (category === 'new') {
      displayedProducts = products.filter(p => p.is_new);
      title = 'New Arrivals';
    } else {
      displayedProducts = products.filter(p => p.category === category);
      title = category.charAt(0).toUpperCase() + category.slice(1);
    }
  }

  if (loading) return <div className="section container text-center" style={{ paddingTop: '120px' }}>Loading products...</div>;

  return (
    <div className="section" style={{ paddingTop: '120px' }}>
      <div className="container">
        <h1 className="mb-8 text-center" style={{ fontSize: '3rem' }}>{title}</h1>
        
        <div className="flex justify-between items-center mb-8" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
          <p style={{ color: 'var(--color-gray)' }}>{displayedProducts.length} Results</p>
          <div className="flex gap-4">
            <select style={{ background: 'transparent', border: 'none', fontFamily: 'inherit', color: 'inherit', outline: 'none', cursor: 'pointer' }}>
              <option>Sort by: Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="product-grid">
          {displayedProducts.map(product => (
            <Link to={`/product/${product.id}`} key={product.id} className="product-card">
              <div className="product-image-wrap">
                <img src={product.image} alt={product.name} className="product-image" />
                {product.is_new && <span className="badge-new">New</span>}
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-price">{formatPrice(product)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductListing;
