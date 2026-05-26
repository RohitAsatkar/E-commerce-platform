import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useProducts } from '../lib/useProducts';
import { formatPrice, getProductCurrency } from '../lib/currency';
import { getActiveProductSale } from '../lib/sales';

const SIMILAR_CATEGORIES: Record<string, string[]> = {
  'shirts': ['t-shirts', 'polo', 'overshirts', 'linen'],
  't-shirts': ['polo', 'shirts', 'overshirts', 'shorts'],
  'polo': ['t-shirts', 'shirts', 'overshirts'],
  'overshirts': ['shirts', 'linen', 't-shirts', 'polo'],
  'linen': ['shirts', 'trousers', 'overshirts'],
  'jeans': ['trousers', 'cargo-pants', 'joggers'],
  'trousers': ['jeans', 'cargo-pants', 'linen', 'joggers'],
  'cargo-pants': ['joggers', 'jeans', 'trousers', 'shorts'],
  'joggers': ['cargo-pants', 'shorts', 'jeans', 'trousers'],
  'shorts': ['joggers', 'cargo-pants', 't-shirts'],
  'footwear': []
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, loading } = useProducts();
  const [size, setSize] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeDetailTab, setActiveDetailTab] = useState<'details' | 'shipping' | 'sustainability'>('details');
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [cartAddedToast, setCartAddedToast] = useState(false);

  // Slider Mouse Drag States
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const product = products.find(p => p.id === id);

  if (loading) return <div className="section container text-center" style={{ paddingTop: '120px' }}>Loading...</div>;
  if (!product) {
    return <div className="section container text-center" style={{ paddingTop: '120px' }}><h2>Product not found</h2></div>;
  }

  const isPant = ['jeans', 'trousers', 'cargo-pants', 'pants'].includes((product.category || '').toLowerCase());

  const imagesObj = Array.isArray(product.variants) ? product.variants.find((v: any) => v.is_images) : null;
  const additionalImages = imagesObj?.urls || [];
  const allImages = [product.image, ...additionalImages].filter(Boolean);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeftState(sliderRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Drag speed sensitivity
    sliderRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleScroll = () => {
    if (!sliderRef.current) return;
    const width = sliderRef.current.offsetWidth;
    const index = Math.round(sliderRef.current.scrollLeft / width);
    if (index !== currentIndex && index >= 0 && index < allImages.length) {
      setCurrentIndex(index);
    }
  };

  const scrollToImage = (index: number) => {
    if (!sliderRef.current) return;
    const width = sliderRef.current.offsetWidth;
    sliderRef.current.scrollTo({
      left: index * width,
      behavior: 'smooth'
    });
    setCurrentIndex(index);
  };

  const handleAddToCart = async () => {
    if (!size) {
      alert('Please select a size');
      return;
    }
    if (!user) {
      alert('Please sign in to add to cart.');
      navigate('/auth');
      return;
    }
    setAdding(true);
    try {
      const { error } = await supabase.from('cart_items').insert({
        user_id: user.id,
        product_id: product.id,
        quantity: quantity,
        size: size
      });
      if (error) throw error;
      setCartAddedToast(true);
      setTimeout(() => setCartAddedToast(false), 3000);
    } catch (err: any) {
      alert('Error adding to cart: ' + err.message);
    } finally {
      setAdding(false);
    }
  };

  const relatedProducts = (() => {
    // 1. Get products in the exact same category
    const sameCategory = products.filter(p => p.id !== product.id && p.category === product.category);
    
    // 2. Get products in similar categories
    const similarCategoriesList = SIMILAR_CATEGORIES[product.category] || [];
    const similarCategoryProducts = products.filter(
      p => p.id !== product.id && p.category !== product.category && similarCategoriesList.includes(p.category)
    );
    
    // Combine same category and similar categories
    let recommended = [...sameCategory, ...similarCategoryProducts];
    
    // 3. Fallback to other categories only if we don't have enough to show (e.g. less than 4)
    if (recommended.length < 4) {
      const otherProducts = products.filter(
        p => p.id !== product.id && 
             p.category !== product.category && 
             !similarCategoriesList.includes(p.category)
      );
      recommended = [...recommended, ...otherProducts];
    }
    
    return recommended.slice(0, 4);
  })();

  return (
    <div className="section" style={{ paddingTop: '120px', minHeight: '90vh' }}>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="container">
        
        {/* Floating Success Notification */}
        {cartAddedToast && (
          <div style={{
            position: 'fixed',
            top: '100px',
            right: '2rem',
            backgroundColor: 'var(--color-text)',
            color: 'var(--color-bg)',
            padding: '1.25rem 2rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            borderRadius: '2px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>✓</span>
            <div>
              <p style={{ margin: 0, fontWeight: '600', fontSize: '0.9rem' }}>Added to Cart</p>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>{quantity} × {product.name} ({size})</p>
            </div>
            <button 
              onClick={() => navigate('/cart')}
              style={{
                marginLeft: '1rem',
                padding: '0.4rem 0.8rem',
                fontSize: '0.75rem',
                border: '1px solid var(--color-bg)',
                backgroundColor: 'transparent',
                color: 'var(--color-bg)',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              View Cart
            </button>
          </div>
        )}

        <div className="flex" style={{ gap: '4rem', flexWrap: 'wrap' }}>
          
          {/* LEFT: Interactive Image Slider */}
          <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <div 
                ref={sliderRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onScroll={handleScroll}
                style={{ 
                  display: 'flex', 
                  overflowX: 'auto', 
                  scrollSnapType: 'x mandatory',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  borderRadius: '4px', 
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#f5f5f5',
                  userSelect: 'none'
                }}
                className="hide-scrollbar"
              >
                {allImages.map((imgUrl, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      flex: '0 0 100%', 
                      position: 'relative', 
                      paddingBottom: '133%', 
                      scrollSnapAlign: 'start',
                      pointerEvents: isDragging ? 'none' : 'auto'
                    }}
                  >
                    <img 
                      src={imgUrl} 
                      alt={`${product.name} ${index + 1}`} 
                      draggable="false"
                      style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }} 
                    />
                  </div>
                ))}
              </div>

              {/* Prev Navigation Arrow overlay */}
              {allImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => scrollToImage(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '1rem',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                    opacity: currentIndex === 0 ? 0 : 0.8,
                    transition: 'all 0.2s',
                    zIndex: 10,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                    fontSize: '1rem',
                    color: 'var(--color-text)'
                  }}
                >
                  ←
                </button>
              )}

              {/* Next Navigation Arrow overlay */}
              {allImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => scrollToImage(Math.min(allImages.length - 1, currentIndex + 1))}
                  disabled={currentIndex === allImages.length - 1}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '1rem',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: currentIndex === allImages.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: currentIndex === allImages.length - 1 ? 0 : 0.8,
                    transition: 'all 0.2s',
                    zIndex: 10,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                    fontSize: '1rem',
                    color: 'var(--color-text)'
                  }}
                >
                  →
                </button>
              )}

              {/* Bottom Pagination Dots overlay */}
              {allImages.length > 1 && (
                <div style={{
                  position: 'absolute',
                  bottom: '1.5rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '0.6rem',
                  zIndex: 10
                }}>
                  {allImages.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => scrollToImage(index)}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: currentIndex === index ? 'var(--color-text)' : 'rgba(0,0,0,0.25)',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* RIGHT: Product Buying Controls */}
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.8rem', color: 'var(--color-gray)', marginBottom: '0.5rem', display: 'block' }}>
              {product.category}
            </span>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>{product.name}</h1>
            
            {(() => {
              const activeSale = getActiveProductSale(product);
              const hasSale = activeSale !== null;
              if (hasSale) {
                return (
                  <>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.85rem', fontWeight: '700', color: '#dc2626' }}>{formatPrice(product, activeSale.salePrice)}</span>
                      <span style={{ fontSize: '1.35rem', textDecoration: 'line-through', color: 'var(--color-gray)' }}>{formatPrice(product)}</span>
                      <span style={{ backgroundColor: '#dc2626', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.25rem 0.6rem', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {activeSale.campaign.type === 'flash_sale' ? 'FLASH SALE' : 'SPECIAL OFFER'} -{activeSale.campaign.discountValue}%
                      </span>
                    </div>
                    {activeSale.campaign.endDate && (
                      <div style={{ margin: '0 0 2rem 0', padding: '0.75rem 1rem', border: '1px solid #fee2e2', backgroundColor: '#fff5f5', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.75rem', width: 'fit-content' }}>
                        <span style={{ fontSize: '1.1rem' }}>⏱️</span>
                        <div>
                          <p style={{ margin: 0, fontWeight: '700', fontSize: '0.8rem', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Limited Time Campaign</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-gray)' }}>
                            Ends: {new Date(activeSale.campaign.endDate).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                );
              } else {
                return (
                  <p style={{ fontSize: '1.5rem', fontWeight: '500', marginBottom: '2rem' }}>{formatPrice(product)}</p>
                );
              }
            })()}
            
            <p style={{ lineHeight: '1.8', marginBottom: '2rem', color: 'var(--color-text)', opacity: 0.9 }}>{product.description}</p>
            
            {/* Size variants section */}
            <div style={{ marginBottom: '2rem' }}>
              <div className="flex justify-between items-center mb-2">
                <span style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em', fontWeight: '600' }}>Size</span>
                <button 
                  onClick={() => setShowSizeGuide(true)}
                  style={{ background: 'none', border: 'none', fontSize: '0.8rem', color: 'var(--color-gray)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  Size Guide
                </button>
              </div>
              <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
                {(() => {
                  const sizeVariants = Array.isArray(product.variants) 
                    ? product.variants.filter((v: any) => v.size) 
                    : [];
                  const sizesToShow = sizeVariants.length > 0 
                    ? sizeVariants.map((v: any) => v.size)
                    : (isPant 
                        ? ['28', '30', '32', '34', '36', '38', '40']
                        : ['S', 'M', 'L', 'XL']);
                  
                  return sizesToShow.map((s: string) => {
                    const variant = sizeVariants.find((v: any) => v.size === s);
                    const sizePrice = variant?.priceAdjust ? product.price + variant.priceAdjust : product.price;
                    const sym = getProductCurrency(product);
                    return (
                      <button 
                        key={s} 
                        onClick={() => setSize(s)}
                        title={variant?.priceAdjust ? `${sym}${sizePrice.toFixed(2)}` : ''}
                        style={{ 
                          minWidth: '3.5rem', 
                          height: '3.5rem', 
                          padding: '0 0.75rem',
                          border: `1px solid ${size === s ? 'var(--color-text)' : 'var(--color-border)'}`,
                          backgroundColor: size === s ? 'var(--color-text)' : 'transparent',
                          color: size === s ? 'var(--color-bg)' : 'var(--color-text)',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          fontWeight: size === s ? '600' : '400',
                          fontSize: '0.9rem'
                        }}
                      >
                        {s}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Quantity Stepper selector */}
            <div style={{ marginBottom: '2.5rem' }}>
              <span style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
                Quantity
              </span>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', width: 'fit-content' }}>
                <button 
                  type="button" 
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  style={{ padding: '0.6rem 1.2rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1rem', color: 'var(--color-text)' }}
                >
                  —
                </button>
                <span style={{ padding: '0 1rem', minWidth: '2.5rem', textAlign: 'center', fontWeight: '600', fontSize: '0.95rem' }}>{quantity}</span>
                <button 
                  type="button" 
                  onClick={() => setQuantity(prev => prev + 1)}
                  style={{ padding: '0.6rem 1.2rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1rem', color: 'var(--color-text)' }}
                >
                  +
                </button>
              </div>
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginBottom: '1rem', padding: '1.25rem', fontSize: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }} 
              onClick={handleAddToCart} 
              disabled={adding}
            >
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-gray)', textAlign: 'center', margin: 0 }}>
              Free insured delivery & climate-neutral returns on all orders.
            </p>

            {/* Luxury Product Tabs accordion */}
            <div style={{ marginTop: '3.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                {['details', 'shipping', 'sustainability'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDetailTab(tab as any)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: activeDetailTab === tab ? 'var(--color-text)' : 'var(--color-gray)',
                      fontFamily: 'inherit',
                      fontWeight: activeDetailTab === tab ? '600' : '400',
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      paddingBottom: '0.5rem',
                      position: 'relative',
                      transition: 'all 0.2s',
                      paddingLeft: 0,
                      paddingRight: 0
                    }}
                  >
                    {tab}
                    {activeDetailTab === tab && (
                      <div style={{ position: 'absolute', bottom: '-1px', left: 0, right: 0, height: '1.5px', backgroundColor: 'var(--color-text)' }} />
                    )}
                  </button>
                ))}
              </div>
              <div style={{ minHeight: '100px', lineHeight: '1.8', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                {activeDetailTab === 'details' && (
                  <ul style={{ paddingLeft: '1.2rem', margin: 0, listStyleType: 'square', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <li>100% sustainably sourced organic materials.</li>
                    <li>Designed for a relaxed fit, engineered with architectural seams.</li>
                    <li>Made with high-density premium stitching.</li>
                    <li>Dry clean or hand wash cold, lay flat to dry.</li>
                    <li>Crafted in our limited carbon-neutral studio workshop.</li>
                  </ul>
                )}
                {activeDetailTab === 'shipping' && (
                  <p style={{ margin: 0, color: 'var(--color-gray)' }}>
                    We offer complimentary carbon-neutral worldwide shipping on all orders. Each item is packaged in a bio-degradable signature linen dustbag and a recycled cardboard case. 
                    Orders are processed within 24 hours. Estimated delivery: 3–5 business days. 
                    Complimentary insured returns are accepted within 14 days of receipt.
                  </p>
                )}
                {activeDetailTab === 'sustainability' && (
                  <p style={{ margin: 0, color: 'var(--color-gray)' }}>
                    Our design philosophy is rooted in circularity and zero-waste patterns. By choosing premium organic yarns and eliminating non-essential manufacturing steps, we reduce water consumption by 65% and energy usage by 40% compared to standard processes. Each piece is designed for longevity.
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* RELATED PRODUCTS SECTION */}
        <div style={{ marginTop: '6rem', borderTop: '1px solid var(--color-border)', paddingTop: '4rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-heading)', textAlign: 'center', marginBottom: '3.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            You May Also Like
          </h2>
          <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem' }}>
            {relatedProducts.map(rp => (
              <a 
                href={`/product/${rp.id}`} 
                key={rp.id} 
                className="product-card" 
                style={{ textDecoration: 'none', color: 'inherit' }}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/product/${rp.id}`);
                  window.scrollTo(0, 0);
                  setQuantity(1);
                  setSize(null);
                  setCurrentIndex(0);
                  if (sliderRef.current) {
                    sliderRef.current.scrollLeft = 0;
                  }
                }}
              >
                <div style={{ position: 'relative', paddingBottom: '133%', backgroundColor: '#f5f5f5', overflow: 'hidden', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                  <img src={rp.image} alt={rp.name} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.3s ease' }} />
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '500', margin: '0 0 0.5rem 0' }}>{rp.name}</h4>
                  <p style={{ margin: 0, color: 'var(--color-gray)', fontSize: '0.9rem' }}>{formatPrice(rp)}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

      </div>

      {/* SIZE GUIDE MODAL */}
      {showSizeGuide && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', padding: '2.5rem', width: '90%', maxWidth: '500px', border: '1px solid var(--color-border)', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <button onClick={() => setShowSizeGuide(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--color-text)' }}>✕</button>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Size Guide</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-gray)', marginBottom: '1.5rem' }}>All measurements are taken flat and are in inches. Fits true to size unless specified.</p>
            
            {isPant ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0' }}>Size (in)</th>
                    <th style={{ textAlign: 'center', padding: '0.5rem 0' }}>Waist (in)</th>
                    <th style={{ textAlign: 'center', padding: '0.5rem 0' }}>Inseam (in)</th>
                    <th style={{ textAlign: 'center', padding: '0.5rem 0' }}>Hip (in)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { s: '28', w: '28-29', i: '32', h: '36-37' },
                    { s: '30', w: '30-31', i: '32', h: '38-39' },
                    { s: '32', w: '32-33', i: '32', h: '40-41' },
                    { s: '34', w: '34-35', i: '34', h: '42-43' },
                    { s: '36', w: '36-37', i: '34', h: '44-45' },
                    { s: '38', w: '38-39', i: '34', h: '46-47' },
                    { s: '40', w: '40-41', i: '34', h: '48-49' },
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '0.5rem 0', fontWeight: '600' }}>{row.s}</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'center' }}>{row.w}</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'center' }}>{row.i}</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'center' }}>{row.h}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0' }}>Size</th>
                    <th style={{ textAlign: 'center', padding: '0.5rem 0' }}>Chest (in)</th>
                    <th style={{ textAlign: 'center', padding: '0.5rem 0' }}>Waist (in)</th>
                    <th style={{ textAlign: 'center', padding: '0.5rem 0' }}>Sleeve (in)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { s: 'XS', c: '34-36', w: '28-30', sl: '31.5' },
                    { s: 'S', c: '36-38', w: '30-32', sl: '32.5' },
                    { s: 'M', c: '38-40', w: '32-34', sl: '33.5' },
                    { s: 'L', c: '41-43', w: '35-37', sl: '34.5' },
                    { s: 'XL', c: '44-46', w: '38-40', sl: '35.5' },
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '0.5rem 0', fontWeight: '600' }}>{row.s}</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'center' }}>{row.c}</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'center' }}>{row.w}</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'center' }}>{row.sl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDetail;
