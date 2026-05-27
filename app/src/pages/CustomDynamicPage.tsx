import { Component, useState, useEffect } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProducts } from '../lib/useProducts';
import { formatPrice } from '../lib/currency';
import { getActiveProductSale } from '../lib/sales';
import { supabase } from '../lib/supabase';

// Error Boundary to prevent white screen and display debugging info
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class PageErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("CustomDynamicPage Error caught:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="container text-center" style={{ paddingTop: '160px', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', color: '#dc2626', marginBottom: '1rem' }}>Something went wrong</h2>
          <p style={{ color: 'var(--color-gray)', marginBottom: '1.5rem', maxWidth: '500px' }}>
            An unexpected error occurred while rendering this page layout.
          </p>
          <pre style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '4px', maxWidth: '650px', overflowX: 'auto', fontSize: '0.8rem', textAlign: 'left', fontFamily: 'monospace', color: '#b91c1c' }}>
            {this.state.error?.toString()}
            {"\n\n"}
            {this.state.error?.stack}
          </pre>
          <Link to="/shop" className="btn btn-primary" style={{ marginTop: '1.5rem', padding: '0.75rem 2rem' }}>Back to Shop</Link>
        </div>
      );
    }
    return this.props.children;
  }
}

interface PageTheme {
  bodyBg: string;
  textColor: string;
  accentColor: string;
  gridStyle: 'classic' | 'asymmetric' | 'modern-tech' | 'bold-frame' | 'ambient-glow' | 'organic' | 'craft';
  fontFamily: string;
  cardBg: string;
  cardBorder: string;
  cardPadding: string;
  hasIndexNumbers?: boolean;
  hasSpecs?: boolean;
  hasCollabStamp?: boolean;
  hasVipLock?: boolean;
  hasTrendTag?: boolean;
  hasCraftLabel?: boolean;
  hasSaleTag?: boolean;
  hasPromoTag?: boolean;
  dividerStyle: string;
}

const getCategoryTheme = (type: string): PageTheme => {
  switch (type) {
    case 'editorial':
      return {
        bodyBg: '#fdfbf7',
        textColor: '#1a1a1a',
        accentColor: '#8c7853',
        gridStyle: 'asymmetric',
        fontFamily: '"Cormorant Garamond", serif',
        cardBg: 'transparent',
        cardBorder: 'none',
        cardPadding: '0',
        hasIndexNumbers: true,
        dividerStyle: '1px solid #e6dfd3'
      };
    case 'launch':
      return {
        bodyBg: '#090a0f',
        textColor: '#f4f4f5',
        accentColor: '#10b981',
        gridStyle: 'modern-tech',
        fontFamily: '"Space Mono", monospace',
        cardBg: '#111217',
        cardBorder: '1px solid #27272a',
        cardPadding: '1.25rem',
        hasSpecs: true,
        dividerStyle: '1px solid #27272a'
      };
    case 'collab':
      return {
        bodyBg: '#ffffff',
        textColor: '#000000',
        accentColor: '#000000',
        gridStyle: 'bold-frame',
        fontFamily: '"Outfit", sans-serif',
        cardBg: '#ffffff',
        cardBorder: '2px solid #000000',
        cardPadding: '1.25rem',
        hasCollabStamp: true,
        dividerStyle: '2px solid #000000'
      };
    case 'vip':
      return {
        bodyBg: '#08080a',
        textColor: '#f5f5f7',
        accentColor: '#d4af37',
        gridStyle: 'ambient-glow',
        fontFamily: '"Playfair Display", serif',
        cardBg: '#121214',
        cardBorder: '1px solid #d4af3733',
        cardPadding: '1.5rem',
        hasVipLock: true,
        dividerStyle: '1px solid #d4af3722'
      };
    case 'seasonal':
      return {
        bodyBg: '#fbf9f6',
        textColor: '#2c3e50',
        accentColor: '#e07a5f',
        gridStyle: 'organic',
        fontFamily: '"Outfit", sans-serif',
        cardBg: '#ffffff',
        cardBorder: '1px solid #f0e6df',
        cardPadding: '1rem',
        hasTrendTag: true,
        dividerStyle: '1px solid #f0e6df'
      };
    case 'sustainability':
      return {
        bodyBg: '#f5f2eb',
        textColor: '#2e2b26',
        accentColor: '#4f5d2f',
        gridStyle: 'craft',
        fontFamily: '"Cormorant Garamond", serif',
        cardBg: 'transparent',
        cardBorder: '1px double #d2cbb8',
        cardPadding: '1.25rem',
        hasCraftLabel: true,
        dividerStyle: '1px dashed #d2cbb8'
      };
    case 'sale':
      return {
        bodyBg: '#ffffff',
        textColor: '#121212',
        accentColor: '#dc2626',
        gridStyle: 'classic',
        fontFamily: '"Outfit", sans-serif',
        cardBg: '#ffffff',
        cardBorder: '1px solid #fee2e2',
        cardPadding: '1rem',
        hasSaleTag: true,
        dividerStyle: '1px solid #fee2e2'
      };
    case 'offer':
      return {
        bodyBg: '#f8fafc',
        textColor: '#0f172a',
        accentColor: '#2563eb',
        gridStyle: 'classic',
        fontFamily: '"Outfit", sans-serif',
        cardBg: '#ffffff',
        cardBorder: '1px solid #e2e8f0',
        cardPadding: '1rem',
        hasPromoTag: true,
        dividerStyle: '1px solid #e2e8f0'
      };
    default:
      return {
        bodyBg: '#ffffff',
        textColor: '#121212',
        accentColor: '#121212',
        gridStyle: 'classic',
        fontFamily: '"Outfit", sans-serif',
        cardBg: '#ffffff',
        cardBorder: '1px solid #e5e7eb',
        cardPadding: '1rem',
        dividerStyle: '1px solid #e5e7eb'
      };
  }
};

const CustomDynamicPageContent = () => {
  const { slug } = useParams<{ slug: string }>();
  const { products, loading } = useProducts();
  const [sortOption, setSortOption] = useState('Featured');

  // Load grid settings
  const [gridColumns, setGridColumns] = useState(() => {
    const saved = localStorage.getItem('aura_shop_grid_columns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return { desktop: 4, tablet: 2, mobile: 1 };
  });

  useEffect(() => {
    const fetchGridSettings = async () => {
      try {
        const { data } = await supabase
          .from('storefront_config')
          .select('config')
          .eq('id', 'shop_grid_settings')
          .maybeSingle();
        if (data && data.config) {
          setGridColumns(data.config);
          localStorage.setItem('aura_shop_grid_columns', JSON.stringify(data.config));
        }
      } catch (err) {
        console.error("Failed to load grid settings from cloud:", err);
      }
    };
    fetchGridSettings();
  }, []);

  const [customPages, setCustomPages] = useState<any[]>(() => {
    const saved = localStorage.getItem('aura_custom_pages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) { }
    }
    return [];
  });

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const { data } = await supabase
          .from('storefront_config')
          .select('config')
          .eq('id', 'custom_pages')
          .maybeSingle();
        if (data && data.config && Array.isArray(data.config)) {
          setCustomPages(data.config);
          localStorage.setItem('aura_custom_pages', JSON.stringify(data.config));
        }
      } catch (err) {
        console.error("Failed to load custom pages from cloud:", err);
      }
    };
    fetchPages();
  }, []);

  const page = Array.isArray(customPages) ? customPages.find((p: any) => p && p.slug === slug) : null;

  // 1. Dynamic document SEO updates (moved here to comply with Rules of Hooks)
  useEffect(() => {
    if (!page) return;
    const originalTitle = document.title;
    document.title = page.seoTitle || `${page.title} | Aura Luxury`;

    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', page.seoDescription || page.bannerDesc || 'Exquisite custom luxury products curation.');

    return () => {
      document.title = originalTitle;
      if (metaDesc) {
        if (originalDesc) {
          metaDesc.setAttribute('content', originalDesc);
        } else {
          metaDesc.remove();
        }
      }
    };
  }, [page]);

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

  // 2. Active date range validation
  const now = new Date().getTime();
  const isBefore = page.startDate && new Date(page.startDate).getTime() > now;
  const isAfter = page.endDate && new Date(page.endDate).getTime() < now;

  if (isBefore) {
    return (
      <div className="container text-center" style={{ paddingTop: '160px', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-accent)', fontWeight: 'bold', marginBottom: '1rem' }}>Coming Soon</span>
        <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', marginBottom: '1.25rem' }}>{page.title}</h2>
        <p style={{ color: 'var(--color-gray)', maxWidth: '500px', marginBottom: '2rem' }}>This curated selection will be launched on <strong>{new Date(page.startDate).toLocaleString()}</strong>. Check back soon!</p>
        <Link to="/shop" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Browse Shop Catalog</Link>
      </div>
    );
  }

  if (isAfter) {
    return (
      <div className="container text-center" style={{ paddingTop: '160px', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#dc2626', fontWeight: 'bold', marginBottom: '1rem' }}>Closed / Expired</span>
        <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', marginBottom: '1.25rem' }}>{page.title}</h2>
        <p style={{ color: 'var(--color-gray)', maxWidth: '500px', marginBottom: '2rem' }}>This custom event concluded on <strong>{new Date(page.endDate).toLocaleString()}</strong>. Explore our latest arrivals instead.</p>
        <Link to="/shop" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Explore New Arrivals</Link>
      </div>
    );
  }

  // 3. Filter and sequence catalog showcase matching page.productIds custom sequence safely
  const pageProductIds = Array.isArray(page.productIds) ? page.productIds : [];
  let displayedProducts = pageProductIds
    .map((pId: any) => {
      if (!pId) return null;
      return Array.isArray(products) ? products.find(p => p && p.id && p.id.toString() === pId.toString()) : null;
    })
    .filter((p: any) => !!p);

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

  const bannerBg = page.bgColor || '#121212';
  const hasBannerImage = !!page.bannerImage;
  const bannerStyle = page.bannerStyle || 'minimal';

  const fontMap: Record<string, string> = {
    'Playfair Display': '"Playfair Display", serif',
    'Cormorant Garamond': '"Cormorant Garamond", serif',
    'Outfit': '"Outfit", sans-serif',
    'Inter': '"Inter", sans-serif',
    'Space Mono': '"Space Mono", monospace'
  };

  const pageTypeMap: Record<string, string> = {
    'collection': 'Curated Collection',
    'sale': 'Markdown Sale',
    'offer': 'Special Offer',
    'custom': 'Brand Showcase',
    'editorial': 'Editorial & Lookbook',
    'launch': 'Exclusive Product Launch',
    'collab': 'Designer Collaboration',
    'vip': 'VIP Access Event',
    'seasonal': 'Seasonal Trend',
    'sustainability': 'Craft & Sustainability'
  };

  const defaultTheme: PageTheme = {
    bodyBg: '#121212',
    textColor: '#ffffff',
    accentColor: '#facc15',
    gridStyle: 'classic',
    fontFamily: '"Outfit", sans-serif',
    cardBg: 'transparent',
    cardBorder: 'none',
    cardPadding: '0',
    dividerStyle: '1px solid var(--color-border)'
  };

  const theme = page.useDynamicTheme !== false ? getCategoryTheme(page.type || 'collection') : defaultTheme;

  const titleFont = fontMap[page.bannerTitleFont] || theme.fontFamily || 'var(--font-heading)';
  const titleColor = page.bannerTitleColor || (theme.bodyBg === '#ffffff' && !page.bannerImage ? '#111111' : '#ffffff');
  const subtitleFont = fontMap[page.bannerSubtitleFont] || theme.fontFamily || '"Outfit", sans-serif';
  const subtitleColor = page.bannerSubtitleColor || theme.accentColor || '#facc15';
  const descColor = page.bannerDescColor || (theme.bodyBg === '#ffffff' && !page.bannerImage ? '#555555' : '#cccccc');

  return (
    <div style={{ minHeight: '90vh', paddingBottom: '4rem', backgroundColor: theme.bodyBg, color: theme.textColor, fontFamily: theme.fontFamily, transition: 'all 0.3s ease' }}>
      {/* Banner Block */}
      {page.bannerHideText ? (
        /* HIDE TEXT MODE: Showcase only banner image without any text overlay */
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: bannerStyle === 'overlay-bold' ? '480px' : bannerStyle === 'split' ? '380px' : '320px',
            marginTop: '60px',
            backgroundColor: bannerBg,
            backgroundImage: hasBannerImage ? `url(${page.bannerImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.2)'
          }}
        />
      ) : bannerStyle === 'editorial-offset' ? (
        /* 1. Asymmetric Editorial Offset Layout */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1.2fr)',
            backgroundColor: bannerBg,
            color: '#ffffff',
            marginTop: '60px',
            minHeight: '450px',
            padding: '3rem 2rem',
            gap: '2rem',
            alignItems: 'center',
            position: 'relative'
          }}
          className="editorial-offset-banner"
        >
          <div
            style={{
              backgroundColor: bannerBg,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '3.5rem 3rem',
              boxShadow: '-10px 10px 30px rgba(0,0,0,0.3)',
              zIndex: 2,
              position: 'relative'
            }}
          >
            <span style={{
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: subtitleColor,
              fontFamily: subtitleFont,
              fontWeight: 'bold',
              marginBottom: '1rem',
              display: 'inline-block'
            }}>
              {pageTypeMap[page.type] || 'Brand Showcase'}
            </span>
            <h1 style={{
              fontSize: '2.5rem',
              fontFamily: titleFont,
              color: titleColor,
              margin: '0 0 0.75rem 0',
              fontWeight: 'bold',
              lineHeight: '1.2'
            }}>
              {page.title}
            </h1>
            {page.bannerTitle && (
              <h2 style={{
                fontSize: '1.2rem',
                fontFamily: subtitleFont,
                fontWeight: 600,
                color: subtitleColor,
                margin: '0 0 0.75rem 0',
                letterSpacing: '0.05em'
              }}>
                {page.bannerTitle}
              </h2>
            )}
            {page.bannerDesc && (
              <p style={{ maxWidth: '550px', margin: '0 0 1.5rem 0', fontSize: '0.95rem', color: descColor, lineHeight: '1.6' }}>
                {page.bannerDesc}
              </p>
            )}
            {page.ctaText && (
              <a href={page.ctaUrl || '#products'} style={{ display: 'inline-block', padding: '0.75rem 2rem', backgroundColor: page.ctaColor || '#ffffff', color: '#000000', fontWeight: 'bold', textDecoration: 'none', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.8rem', borderRadius: '2px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                {page.ctaText}
              </a>
            )}
          </div>
          <div
            style={{
              backgroundImage: `url(${page.bannerImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: '100%',
              minHeight: '380px',
              border: '10px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '10px 10px 30px rgba(0,0,0,0.25)'
            }}
          />
        </div>
      ) : bannerStyle === 'overlay-bold' && hasBannerImage ? (
        /* 2. Bold Avant-Garde Overlay Layout */
        <div
          style={{
            position: 'relative',
            padding: '8rem 2rem',
            backgroundImage: `url(${page.bannerImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '480px',
            marginTop: '60px',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.45)', zIndex: 1 }} />
          <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', bottom: '20px', border: '1px solid rgba(255,255,255,0.2)', pointerEvents: 'none', zIndex: 2 }} />
          <div
            style={{
              position: 'relative',
              zIndex: 3,
              maxWidth: '850px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span style={{
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              color: subtitleColor,
              fontFamily: subtitleFont,
              fontWeight: '800',
              marginBottom: '1.5rem',
            }}>
              {pageTypeMap[page.type] || 'Brand Showcase'}
            </span>
            <h1 style={{
              fontSize: '4.5rem',
              fontFamily: titleFont,
              color: titleColor,
              margin: '0 0 1rem 0',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              lineHeight: '1.1',
              textShadow: '0 5px 15px rgba(0,0,0,0.5)'
            }}>
              {page.title}
            </h1>
            {page.bannerTitle && (
              <h2 style={{
                fontSize: '1.4rem',
                fontFamily: subtitleFont,
                fontWeight: '700',
                color: subtitleColor,
                margin: '0 0 1.25rem 0',
                letterSpacing: '0.15em',
                textTransform: 'uppercase'
              }}>
                {page.bannerTitle}
              </h2>
            )}
            {page.bannerDesc && (
              <p style={{ margin: '0 0 2rem 0', fontSize: '1rem', color: descColor, maxWidth: '650px', lineHeight: '1.7', textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
                {page.bannerDesc}
              </p>
            )}
            {page.ctaText && (
              <a href={page.ctaUrl || '#products'} style={{ display: 'inline-block', padding: '1rem 3rem', backgroundColor: page.ctaColor || '#ffffff', color: '#000000', fontWeight: 'bold', textDecoration: 'none', letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.85rem', borderRadius: '2px', transition: 'all 0.2s', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' }}>
                {page.ctaText}
              </a>
            )}
          </div>
        </div>
      ) : bannerStyle === 'split' && hasBannerImage ? (
        /* 3. Split Canvas Layout (Improved) */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(300px, 0.8fr)',
            backgroundColor: bannerBg,
            color: '#ffffff',
            marginTop: '60px',
            minHeight: '380px',
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.15)'
          }}
          className="split-banner-grid"
        >
          <div style={{ padding: '4rem 3.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: subtitleColor, fontFamily: subtitleFont, fontWeight: 'bold', marginBottom: '1rem' }}>
              {pageTypeMap[page.type] || 'Brand Showcase'}
            </span>
            <h1 style={{ fontSize: '2.5rem', fontFamily: titleFont, color: titleColor, margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{page.title}</h1>
            {page.bannerTitle && (
              <h2 style={{ fontSize: '1.2rem', fontFamily: subtitleFont, fontWeight: 600, color: subtitleColor, margin: '0 0 0.75rem 0', letterSpacing: '0.05em' }}>{page.bannerTitle}</h2>
            )}
            {page.bannerDesc && (
              <p style={{ maxWidth: '550px', margin: '0 0 1.5rem 0', fontSize: '0.95rem', color: descColor, lineHeight: '1.6' }}>{page.bannerDesc}</p>
            )}
            {page.ctaText && (
              <a href={page.ctaUrl || '#products'} style={{ display: 'inline-block', padding: '0.75rem 2rem', backgroundColor: page.ctaColor || '#ffffff', color: '#000000', fontWeight: 'bold', textDecoration: 'none', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.8rem', borderRadius: '2px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                {page.ctaText}
              </a>
            )}
          </div>
          <div style={{ backgroundImage: `url(${page.bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '260px' }} />
        </div>
      ) : bannerStyle === 'glass' && hasBannerImage ? (
        /* 4. Glassmorphism Card Layout Overlay (Improved) */
        <div
          style={{
            position: 'relative',
            padding: '6rem 2rem',
            backgroundImage: `url(${page.bannerImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '360px',
            marginTop: '60px',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.35)', zIndex: 1 }} />
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '3rem 3rem',
              borderRadius: '4px',
              maxWidth: '680px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
            }}
          >
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: subtitleColor, fontFamily: subtitleFont, fontWeight: 'bold', marginBottom: '1rem' }}>
              {pageTypeMap[page.type] || 'Brand Showcase'}
            </span>
            <h1 style={{ fontSize: '2.5rem', fontFamily: titleFont, color: titleColor, margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{page.title}</h1>
            {page.bannerTitle && (
              <h2 style={{ fontSize: '1.15rem', fontFamily: subtitleFont, fontWeight: 600, color: subtitleColor, margin: '0 0 0.75rem 0', letterSpacing: '0.05em' }}>{page.bannerTitle}</h2>
            )}
            {page.bannerDesc && (
              <p style={{ margin: page.ctaText ? '0 0 1.5rem 0' : '0', fontSize: '0.9rem', color: descColor, lineHeight: '1.6' }}>{page.bannerDesc}</p>
            )}
            {page.ctaText && (
              <a href={page.ctaUrl || '#products'} style={{ display: 'inline-block', padding: '0.75rem 2rem', backgroundColor: page.ctaColor || '#ffffff', color: '#000000', fontWeight: 'bold', textDecoration: 'none', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.8rem', borderRadius: '2px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                {page.ctaText}
              </a>
            )}
          </div>
        </div>
      ) : (
        /* 5. Minimal / Immersive Layouts (Improved) */
        <div
          style={{
            position: 'relative',
            padding: '6rem 2rem',
            backgroundColor: bannerBg,
            backgroundImage: hasBannerImage ? `linear-gradient(rgba(0, 0, 0, ${bannerStyle === 'immersive' ? 0.65 : 0.4}), rgba(0, 0, 0, ${bannerStyle === 'immersive' ? 0.65 : 0.4})), url(${page.bannerImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: '#ffffff',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
            marginTop: '60px',
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.2)'
          }}
        >
          <span
            style={{
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: subtitleColor,
              fontFamily: subtitleFont,
              fontWeight: 'bold',
              marginBottom: '1rem'
            }}
          >
            {pageTypeMap[page.type] || 'Brand Showcase'}
          </span>
          <h1 style={{ fontSize: '3rem', fontFamily: titleFont, color: titleColor, margin: '0 0 0.5rem 0', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>{page.title}</h1>
          {page.bannerTitle && (
            <h2 style={{ fontSize: '1.25rem', fontFamily: subtitleFont, fontWeight: 600, color: subtitleColor, margin: '0 0 0.75rem 0', letterSpacing: '0.05em' }}>
              {page.bannerTitle}
            </h2>
          )}
          {page.bannerDesc && (
            <p style={{ maxWidth: '600px', margin: page.ctaText ? '0 0 1.5rem 0' : '0', fontSize: '0.95rem', color: descColor, lineHeight: '1.6' }}>
              {page.bannerDesc}
            </p>
          )}
          {page.ctaText && (
            <a href={page.ctaUrl || '#products'} style={{ display: 'inline-block', padding: '0.75rem 2rem', backgroundColor: page.ctaColor || '#ffffff', color: '#000000', fontWeight: 'bold', textDecoration: 'none', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.8rem', borderRadius: '2px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
              {page.ctaText}
            </a>
          )}
        </div>
      )}

      {/* Grid Content Section */}
      <div id="products" className="container" style={{ marginTop: '4rem', paddingBottom: '6rem' }}>
        <div className="flex justify-between items-center mb-8" style={{ borderBottom: theme.dividerStyle, paddingBottom: '1.25rem' }}>
          <p style={{ color: theme.bodyBg === '#ffffff' || theme.bodyBg === '#fdfbf7' ? '#555555' : '#a1a1aa', fontFamily: theme.fontFamily, fontSize: '0.9rem', letterSpacing: '0.05em' }}>
            {displayedProducts.length} Curated Pieces
          </p>
          <div className="flex gap-4">
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
              style={{ background: 'transparent', border: 'none', fontFamily: theme.fontFamily, color: theme.textColor, outline: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }}
            >
              <option value="Featured" style={{ backgroundColor: theme.cardBg, color: theme.textColor }}>Sort by: Featured</option>
              <option value="Price: Low to High" style={{ backgroundColor: theme.cardBg, color: theme.textColor }}>Sort by: Price: Low to High</option>
              <option value="Price: High to Low" style={{ backgroundColor: theme.cardBg, color: theme.textColor }}>Sort by: Price: High to Low</option>
            </select>
          </div>
        </div>

        {displayedProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem 4rem', color: 'var(--color-gray)', fontFamily: theme.fontFamily }}>
            No products are currently featured in this curation.
          </div>
        ) : (
          <div
            className="product-grid"
            style={{
              ['--grid-cols-desktop' as any]: gridColumns.desktop,
              ['--grid-cols-tablet' as any]: gridColumns.tablet,
              ['--grid-cols-mobile' as any]: gridColumns.mobile,
              paddingTop: theme.gridStyle === 'asymmetric' ? '2rem' : '0',
              paddingBottom: theme.gridStyle === 'asymmetric' ? '4rem' : '0',
            }}
          >
            {displayedProducts.map((product: any, index: number) => {
              const activeSale = getActiveProductSale(product);
              const hasSale = activeSale !== null;

              // Asymmetric vertical card offsets for editorial / collab layout
              const isEven = index % 2 === 0;
              const cardOffset = theme.gridStyle === 'asymmetric' && !isEven ? '40px' : '0px';

              return (
                <Link
                  to={`/product/${product.id}`}
                  key={product.id}
                  className={`product-card category-${page.type}`}
                  style={{
                    backgroundColor: theme.cardBg,
                    border: theme.cardBorder,
                    padding: theme.cardPadding,
                    borderRadius: theme.gridStyle === 'organic' ? '12px' : '0px',
                    transform: cardOffset !== '0px' ? `translateY(${cardOffset})` : 'none',
                    marginBottom: cardOffset !== '0px' ? cardOffset : '0px',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    boxShadow: theme.gridStyle === 'ambient-glow' ? '0 12px 40px rgba(212, 175, 55, 0.08)' : 'none',
                    overflow: 'hidden'
                  }}
                >
                  <div className="product-image-wrap" style={{ borderRadius: theme.gridStyle === 'organic' ? '12px 12px 0 0' : '0px', overflow: 'hidden', position: 'relative' }}>
                    <img src={product.image} alt={product.name} className="product-image" style={{ transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                    {product.is_new && (
                      <span className="badge-new" style={{ backgroundColor: theme.accentColor, color: theme.bodyBg === '#ffffff' ? '#ffffff' : '#000000', fontSize: '0.6rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '1px' }}>
                        New
                      </span>
                    )}
                    {hasSale && (
                      <span
                        className="badge-sale"
                        style={{
                          backgroundColor: theme.accentColor || '#dc2626',
                          color: theme.bodyBg === '#ffffff' || theme.bodyBg === '#f5f2eb' ? '#ffffff' : '#000000',
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.65rem',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          borderRadius: '1px',
                          zIndex: 10,
                          letterSpacing: '0.08em',
                          fontFamily: theme.fontFamily
                        }}
                      >
                        {activeSale.campaign.type === 'flash_sale' ? 'FLASH' : 'SALE'} -{activeSale.campaign.discountValue}%
                      </span>
                    )}

                    {theme.hasCollabStamp && (
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        fontSize: '0.55rem',
                        fontWeight: '900',
                        padding: '0.25rem 0.6rem',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        zIndex: 10,
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                      }}>
                        AURA × LAB
                      </div>
                    )}
                  </div>

                  <div className="product-info" style={{ padding: theme.cardPadding !== '0' ? '1rem 0 0 0' : '0.85rem 0', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>

                    {theme.hasVipLock && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: theme.accentColor, fontSize: '0.6rem', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.1rem' }}>
                        <span style={{ width: '5px', height: '5px', backgroundColor: theme.accentColor, borderRadius: '50%', display: 'inline-block' }}></span>
                        VIP PRIVATE STOCK
                      </div>
                    )}

                    {theme.hasIndexNumbers && (
                      <div style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.5rem', color: theme.textColor, opacity: 0.25, marginBottom: '0.15rem', lineHeight: '1' }}>
                        {(index + 1).toString().padStart(2, '0')}
                      </div>
                    )}

                    {theme.hasCraftLabel && (
                      <div style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.8rem', color: theme.accentColor, opacity: 0.9, letterSpacing: '0.02em', marginBottom: '0.1rem' }}>
                        Artisanal Craft Spec
                      </div>
                    )}

                    {theme.hasTrendTag && (
                      <div style={{ fontSize: '0.6rem', color: theme.accentColor, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.1rem' }}>
                        • Key Trend Selection
                      </div>
                    )}

                    <h3 className="product-name" style={{ fontFamily: theme.fontFamily, color: theme.textColor, fontSize: '0.95rem', margin: 0, fontWeight: '500', letterSpacing: '0.02em', lineHeight: '1.4' }}>
                      {product.name}
                    </h3>

                    {hasSale ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.15rem' }}>
                        <p className="product-price" style={{ color: theme.accentColor || '#dc2626', fontWeight: '700', margin: 0, fontSize: '0.9rem', fontFamily: theme.fontFamily }}>
                          {formatPrice(product, activeSale.salePrice)}
                        </p>
                        <p style={{ textDecoration: 'line-through', color: 'var(--color-gray)', fontSize: '0.78rem', margin: 0 }}>
                          {formatPrice(product)}
                        </p>
                      </div>
                    ) : (
                      <p className="product-price" style={{ color: theme.textColor, margin: '0.15rem 0 0 0', fontSize: '0.9rem', fontFamily: theme.fontFamily, fontWeight: '600' }}>
                        {formatPrice(product)}
                      </p>
                    )}

                    {theme.hasSpecs && (
                      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem', fontFamily: '"Space Mono", monospace' }}>
                        <span style={{ fontSize: '0.55rem', border: '1px solid #27272a', padding: '0.1rem 0.35rem', color: '#a1a1aa' }}>SPEC-04</span>
                        <span style={{ fontSize: '0.55rem', border: '1px solid #27272a', padding: '0.1rem 0.35rem', color: theme.accentColor }}>RELEASE_I</span>
                      </div>
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

const CustomDynamicPage = () => {
  return (
    <PageErrorBoundary>
      <CustomDynamicPageContent />
    </PageErrorBoundary>
  );
};

export default CustomDynamicPage;
