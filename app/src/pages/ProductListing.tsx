import { useParams, Link } from 'react-router-dom';
import { useProducts } from '../lib/useProducts';
import { formatPrice } from '../lib/currency';
import { useState } from 'react';
import { getActiveProductSale } from '../lib/sales';

const ProductListing = () => {
  const { category } = useParams<{ category: string }>();
  const { products, loading } = useProducts();
  const [sortOption, setSortOption] = useState('Featured');

  const [gridColumns] = useState(() => {
    const saved = localStorage.getItem('aura_shop_grid_columns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return { desktop: 4, tablet: 2, mobile: 1 };
  });

  const [filterCategories] = useState<{ name: string; slug: string }[]>(() => {
    const saved = localStorage.getItem('aura_shop_filters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { name: 'ALL', slug: 'all' },
      { name: 'NEW', slug: 'new' },
      { name: 'SHIRTS', slug: 'shirts' },
      { name: 'T-SHIRTS', slug: 't-shirts' },
      { name: 'JEANS', slug: 'jeans' },
      { name: 'OVERSHIRT', slug: 'overshirt' },
      { name: 'TROUSERS', slug: 'trousers' },
      { name: 'CARGO PANTS', slug: 'cargo-pants' },
      { name: 'SWEATERS', slug: 'sweaters' },
      { name: 'JACKETS', slug: 'jackets' },
      { name: 'SHOES', slug: 'shoes' },
      { name: 'LUXE', slug: 'luxe' }
    ];
  });
  
  let displayedProducts = products;
  let title = 'All Products';

  const currentCategorySlug = category || 'all';

  if (currentCategorySlug !== 'all') {
    if (currentCategorySlug === 'new') {
      displayedProducts = products.filter(p => p.is_new);
      title = 'New Arrivals';
    } else if (currentCategorySlug === 'men') {
      const apparelCategories = ['shirts', 't-shirts', 'polo', 'jeans', 'trousers', 'linen', 'cargo-pants', 'joggers', 'shorts', 'overshirts'];
      displayedProducts = products.filter(p => apparelCategories.includes((p.category || '').toLowerCase()));
      title = "Men's Collection";
    } else {
      displayedProducts = products.filter(p => {
        const prodCat = (p.category || '').toLowerCase().replace(/\s+/g, '-');
        return prodCat === currentCategorySlug;
      });
      const activeCat = filterCategories.find(c => c.slug === currentCategorySlug);
      if (activeCat) {
        title = activeCat.name;
      } else {
        title = currentCategorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }
    }
  }

  // Handle user sort selection
  if (sortOption === 'Price: Low to High') {
    displayedProducts = [...displayedProducts].sort((a, b) => {
      const saleA = getActiveProductSale(a);
      const saleB = getActiveProductSale(b);
      const priceA = saleA ? saleA.salePrice : a.price;
      const priceB = saleB ? saleB.salePrice : b.price;
      return priceA - priceB;
    });
  } else if (sortOption === 'Price: High to Low') {
    displayedProducts = [...displayedProducts].sort((a, b) => {
      const saleA = getActiveProductSale(a);
      const saleB = getActiveProductSale(b);
      const priceA = saleA ? saleA.salePrice : a.price;
      const priceB = saleB ? saleB.salePrice : b.price;
      return priceB - priceA;
    });
  }

  if (loading) return <div className="product-listing-section container text-center">Loading products...</div>;

  return (
    <div className="product-listing-section">
      <div className="container">
        <h1 className="product-listing-title">{title}</h1>
        
        {/* Category Toggles Row */}
        <div className="category-toggles-container">
          <div className="category-toggles-track">
            {filterCategories.map(cat => {
              const isActive = currentCategorySlug === cat.slug;
              return (
                <Link
                  key={cat.slug}
                  to={`/shop/${cat.slug}`}
                  className={`category-toggle-btn ${isActive ? 'active' : ''}`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between items-center mb-8" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
          <p style={{ color: 'var(--color-gray)' }}>{displayedProducts.length} Results</p>
          <div className="flex gap-4">
            <select 
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
              style={{ background: 'transparent', border: 'none', fontFamily: 'inherit', color: 'inherit', outline: 'none', cursor: 'pointer' }}
            >
              <option value="Featured">Sort by: Featured</option>
              <option value="Price: Low to High">Sort by: Price: Low to High</option>
              <option value="Price: High to Low">Sort by: Price: High to Low</option>
            </select>
          </div>
        </div>

        <div 
          className="product-grid"
          style={{
            ['--grid-cols-desktop' as any]: gridColumns.desktop,
            ['--grid-cols-tablet' as any]: gridColumns.tablet,
            ['--grid-cols-mobile' as any]: gridColumns.mobile,
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
      </div>
    </div>
  );
};

export default ProductListing;
