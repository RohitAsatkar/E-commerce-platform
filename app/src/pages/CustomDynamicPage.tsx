import { useParams, Link } from 'react-router-dom';
import { useProducts } from '../lib/useProducts';
import { formatPrice } from '../lib/currency';
import { useState } from 'react';
import { getActiveProductSale } from '../lib/sales';

const CustomDynamicPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { products, loading } = useProducts();
  const [sortOption, setSortOption] = useState('Featured');

  // Load grid settings
  const [gridColumns] = useState(() => {
    const saved = localStorage.getItem('aura_shop_grid_columns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { desktop: 4, tablet: 2, mobile: 1 };
  });

  // Find page setup from localStorage
  const pagesRaw = localStorage.getItem('aura_custom_pages');
  const pages = pagesRaw ? JSON.parse(pagesRaw) : [];
  const page = pages.find((p: any) => p.slug === slug);

  if (loading) {
    return <div style={{ paddingTop: '120px', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!page) {
    return (
      <div className="container text-center" style={{ paddingTop: '160px', minHeight: '80vh' }}>
        <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>Page Not Found</h2>
        <p style={{ color: 'var(--color-gray)', marginBottom: '2rem' }}>The requested custom page does not exist or has been removed by the admin.</p>
        <Link to="/shop" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Back to Shop</Link>
      </div>
    );
  }

  // Filter products by selected product IDs
  const pageProductIds = page.productIds || [];
  let displayedProducts = products.filter(p => pageProductIds.includes(p.id.toString()));

  // Apply sorting
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

  // Determine banner colors & design variables
  const bannerBg = page.bgColor || '#121212';
  const hasBannerImage = !!page.bannerImage;

  return (
    <div style={{ minHeight: '90vh', paddingBottom: '4rem' }}>
      {/* Banner Block */}
      <div 
        style={{
          position: 'relative',
          padding: '5rem 2rem',
          backgroundColor: bannerBg,
          backgroundImage: hasBannerImage ? `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45)), url(${page.bannerImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#ffffff',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '260px',
          marginTop: '60px',
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.2)'
        }}
      >
        <span 
          style={{ 
            fontSize: '0.8rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.2em', 
            color: '#dc2626', 
            backgroundColor: '#ffffff',
            padding: '0.25rem 0.75rem',
            fontWeight: 'bold',
            borderRadius: '2px',
            marginBottom: '1rem',
            fontFamily: 'Outfit, sans-serif'
          }}
        >
          {page.type === 'sale' ? 'Markdown Sale' : page.type === 'offer' ? 'Special Offer' : page.type === 'collection' ? 'Curated Collection' : 'Brand Showcase'}
        </span>
        <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-heading)', margin: '0 0 0.5rem 0', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>{page.title}</h1>
        {page.bannerTitle && (
          <h2 style={{ fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif', fontWeight: 600, color: '#eab308', margin: '0 0 0.75rem 0', letterSpacing: '0.05em' }}>
            {page.bannerTitle}
          </h2>
        )}
        {page.bannerDesc && (
          <p style={{ maxWidth: '600px', margin: 0, fontSize: '0.95rem', opacity: 0.9, lineHeight: '1.6' }}>
            {page.bannerDesc}
          </p>
        )}
      </div>

      {/* Grid Content Section */}
      <div className="container" style={{ marginTop: '3rem' }}>
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

        {displayedProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-gray)' }}>
            No products are currently featured in this campaign.
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default CustomDynamicPage;
