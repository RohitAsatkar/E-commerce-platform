import { useSearchParams, Link } from 'react-router-dom';
import { useProducts } from '../lib/useProducts';
import { searchProducts } from '../lib/searchEngine';
import { formatPrice } from '../lib/currency';
import { getActiveProductSale } from '../lib/sales';
import { useEffect } from 'react';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { products, loading } = useProducts();

  // Run search pipeline
  const displayedProducts = searchProducts(products, query);

  // Dynamic document title for SEO
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `Search results for "${query}" | AURA`;
    return () => {
      document.title = originalTitle;
    };
  }, [query]);

  if (loading) {
    return <div className="product-listing-section container text-center">Loading search results...</div>;
  }

  return (
    <div className="product-listing-section">
      <div className="container">
        {/* Search Header */}
        <div className="product-listing-header" style={{ marginBottom: '2rem' }}>
          <h1 className="product-listing-title" style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)' }}>Search Results</h1>
          <p className="category-description-text" style={{ color: 'var(--color-gray)', marginTop: '0.5rem' }}>
            {displayedProducts.length > 0 
              ? `Showing results for "${query}"`
              : `No results found for "${query}". Try searching for something else.`
            }
          </p>
        </div>

        {displayedProducts.length > 0 ? (
          <div 
            className="product-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1.5rem',
              marginTop: '2rem'
            }}
          >
            {displayedProducts.map(product => {
              const activeSale = getActiveProductSale(product);
              const hasSale = activeSale !== null;

              return (
                <Link to={`/product/${product.id}`} key={product.id} className="product-card">
                  <div className="product-image-wrap">
                    <img src={product.image} alt={product.name} className="product-image" />
                    {product.is_new && <span className="badge-new">New</span>}
                    {hasSale && (
                      <span 
                        className="badge-sale" 
                        style={{ 
                          backgroundColor: '#dc2626', 
                          color: '#fff', 
                          position: 'absolute', 
                          top: '12px', 
                          right: '12px', 
                          padding: '0.2rem 0.6rem', 
                          fontSize: '0.7rem', 
                          fontWeight: '700', 
                          textTransform: 'uppercase', 
                          borderRadius: '2px', 
                          zIndex: 10,
                          letterSpacing: '0.05em',
                          fontFamily: 'Outfit, sans-serif'
                        }}
                      >
                        {activeSale.campaign.type === 'flash_sale' ? 'FLASH' : 'SALE'} -{activeSale.campaign.discountValue}%
                      </span>
                    )}
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    {hasSale ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <p className="product-price" style={{ color: '#dc2626', fontWeight: '700', margin: 0 }}>{formatPrice(product, activeSale.salePrice)}</p>
                        <p style={{ textDecoration: 'line-through', color: 'var(--color-gray)', fontSize: '0.8rem', margin: 0 }}>{formatPrice(product)}</p>
                      </div>
                    ) : (
                      <p className="product-price">{formatPrice(product)}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '4rem 2rem', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: '6px' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>We couldn't find any matches</p>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-gray)', display: 'block', marginTop: '0.5rem' }}>
              Check the spelling or try searching for general terms like "shirt", "jackets", or "accessories".
            </span>
            <Link to="/shop" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '1.5rem', padding: '0.75rem 2rem', textDecoration: 'none' }}>
              Browse All Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
