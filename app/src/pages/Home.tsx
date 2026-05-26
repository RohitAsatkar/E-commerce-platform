import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../lib/useProducts';
import { formatPrice } from '../lib/currency';
import { Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Home.css';

const DEFAULT_CMS_CONFIG = {
  page_id: "homepage_global",
  title: "Main Storefront Homepage",
  slug: "index",
  status: "published",
  seo: {
    meta_title: "AURA | The Art of Minimalist Luxury",
    meta_description: "Discover a curated standard of minimalist apparel. Crafted for those who appreciate understated elegance and architectural lines.",
    open_graph_image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1200"
  },
  blocks: [
    {
      id: "block_hero_01",
      block_type: "HeroBanner",
      order: 1,
      status: "published",
      scheduling: { start_date: "", end_date: "" },
      data: {
        layout: "split",
        title: "AURA / THE NEW MINIMAL",
        subtitle: "FALL / WINTER COLLECTION",
        description: "Discover the new standard of minimalist luxury apparel. Crafted for those who appreciate understated elegance and timeless silhouette.",
        cta_text: "VIEW ALL",
        cta_url: "/shop/all",
        secondary_cta_text: "SHOP ACCESSORIES",
        secondary_cta_url: "/shop/accessories",
        desktop_image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1200",
        mobile_image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600"
      }
    },
    {
      id: "block_promo_slider_01",
      block_type: "PromotionalSlider",
      order: 2,
      status: "published",
      scheduling: { start_date: "", end_date: "" },
      data: {
        variant: "flash_sale_countdown",
        background_color: "#0c0a09",
        countdown_target_timestamp: "2026-06-25T23:59:59Z",
        slides: [{ text: "Mid-Season Preview: Code 'AURA10' for private 10% off.", link_url: "/shop/new" }]
      }
    },
    {
      id: "block_brand_story_01",
      block_type: "BrandStory",
      order: 3,
      status: "published",
      scheduling: { start_date: "", end_date: "" },
      data: {
        subtitle: "OUR ESSENCE",
        title: "THE ART OF SIMPLICITY",
        description: "We believe in architectural silhouettes, pure fabrics, and a curated color palette that brings calm to the wardrobe. Every item is created with meticulous attention to detail.",
        quote: "Simplicity is not the lack of clutter, but the presence of clarity.",
        image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600"
      }
    },
    {
      id: "block_cat_grid_01",
      block_type: "CategoryGrid",
      order: 4,
      status: "published",
      scheduling: { start_date: "", end_date: "" },
      data: {
        title: "Curated Categories",
        categories: [
          { name: "Shirts", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=300" },
          { name: "T-Shirts", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=300" },
          { name: "POLO", image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=300" },
          { name: "Jeans", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=300" },
          { name: "Trousers", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=300" },
          { name: "LINEN", image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=300" },
          { name: "Cargo pants", image: "https://images.unsplash.com/photo-1517423568366-8b83523034fd?auto=format&fit=crop&q=80&w=300" },
          { name: "Joggers", image: "https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&q=80&w=300" },
          { name: "SHORTS", image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=300" },
          { name: "Overshirts", image: "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&q=80&w=300" },
          { name: "Footwear", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=300" }
        ]
      }
    },
    {
      id: "block_editorial_gallery_01",
      block_type: "EditorialGallery",
      order: 5,
      status: "published",
      scheduling: { start_date: "", end_date: "" },
      data: {
        title: "SEASONAL CAPTURES",
        subtitle: "FALL LOOKBOOK HIGHLIGHTS",
        image1: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=600",
        image2: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600",
        image3: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=600"
      }
    },
    {
      id: "block_featured_prod_01",
      block_type: "FeaturedProducts",
      order: 6,
      status: "published",
      scheduling: { start_date: "", end_date: "" },
      data: {
        title: "Curated Classics",
        cta_text: "VIEW ALL",
        limit: 4
      }
    },
    {
      id: "block_newsletter_01",
      block_type: "NewsletterSubscribe",
      order: 7,
      status: "published",
      scheduling: { start_date: "", end_date: "" },
      data: {
        title: "JOIN THE DIALOGUE",
        subtitle: "Receive seasonal lookbooks, private previews, and stories about craft directly to your inbox.",
        button_text: "SUBSCRIBE",
        placeholder_text: "ENTER YOUR EMAIL ADDRESS"
      }
    }
  ]
};

const CmsHeroSlider = ({ block, style }: { block: any; style?: React.CSSProperties }) => {
  const slides = block.data.slides || [];
  const [activeIndex, setActiveIndex] = useState(0);
  const autoplayEnabled = block.data.autoplay_enabled !== false;
  const autoplaySpeed = block.data.autoplay_speed || 4000;

  useEffect(() => {
    if (!autoplayEnabled || slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, autoplaySpeed);
    return () => clearInterval(interval);
  }, [slides.length, autoplayEnabled, autoplaySpeed]);

  if (slides.length === 0) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: '#f5f5f5', color: '#999', fontSize: '0.9rem', ...style }}>
        No slides configured. Add slides in settings.
      </div>
    );
  }

  const layConfig = block.layout_configuration || {};
  const manualHeight = layConfig.manual_height;

  return (
    <section
      className="cms-hero-slider"
      style={{
        position: 'relative',
        width: '100%',
        height: manualHeight ? `${manualHeight}px` : '75vh',
        minHeight: manualHeight ? `${manualHeight}px` : '480px',
        overflow: 'hidden',
        backgroundColor: '#000',
        fontFamily: '"Outfit", sans-serif',
        ...style
      }}
    >
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        {slides.map((slide: any, idx: number) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: isActive ? 1 : 0,
                visibility: isActive ? 'visible' : 'hidden',
                transition: 'opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), visibility 0.8s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${slide.image_url})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 6s ease-out',
                  zIndex: 1
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  zIndex: 2
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  bottom: '4rem',
                  left: '5%',
                  right: '5%',
                  zIndex: 3,
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  alignItems: 'flex-start',
                  textAlign: 'left'
                }}
              >
                {slide.subtitle && (
                  <span
                    className="animate-fade-up"
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: 'rgba(255, 255, 255, 0.9)',
                      textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? 'translateY(0)' : 'translateY(15px)',
                      transition: 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s'
                    }}
                  >
                    {slide.subtitle}
                  </span>
                )}
                {slide.title && (
                  <h2
                    className="animate-fade-up"
                    style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontSize: 'clamp(2rem, 4vw, 4rem)',
                      fontWeight: 400,
                      margin: '0.25rem 0',
                      letterSpacing: '0.03em',
                      textTransform: 'uppercase',
                      textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? 'translateY(0)' : 'translateY(15px)',
                      transition: 'opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s'
                    }}
                  >
                    {slide.title}
                  </h2>
                )}
                {slide.cta_text && (
                  <Link
                    to={slide.cta_url || '/shop/all'}
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.7rem 1.8rem',
                      backgroundColor: '#fff',
                      color: '#000',
                      textDecoration: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      border: 'none',
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? 'translateY(0)' : 'translateY(15px)',
                      transition: 'opacity 0.8s ease 0.4s, transform 0.8s ease 0.4s, background-color 0.3s, color 0.3s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#000';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff';
                      e.currentTarget.style.color = '#000';
                    }}
                  >
                    {slide.cta_text}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={() => setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length)}
            style={{
              position: 'absolute',
              top: '50%',
              left: '1.5rem',
              transform: 'translateY(-50%)',
              zIndex: 10,
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              transition: 'background 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            ‹
          </button>
          <button
            onClick={() => setActiveIndex((prev) => (prev + 1) % slides.length)}
            style={{
              position: 'absolute',
              top: '50%',
              right: '1.5rem',
              transform: 'translateY(-50%)',
              zIndex: 10,
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              transition: 'background 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            ›
          </button>
        </>
      )}

      {slides.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '1.75rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            display: 'flex',
            gap: '0.6rem'
          }}
        >
          {slides.map((_: any, idx: number) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                style={{
                  width: isActive ? '28px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  border: 'none',
                  backgroundColor: isActive ? '#fff' : 'rgba(255, 255, 255, 0.4)',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.3s ease'
                }}
              />
            );
          })}
        </div>
      )}
    </section>
  );
};

const Home = () => {
  const { products } = useProducts();
  const [pageConfig, setPageConfig] = useState<any>(null);

  useEffect(() => {
    const loadConfig = async () => {
      // 1. Try local storage cache first for instant load
      const saved = localStorage.getItem('aura_cms_homepage');
      if (saved) {
        try {
          setPageConfig(JSON.parse(saved));
        } catch (e) {
          console.error("Error parsing saved layout cache:", e);
        }
      }

      // 2. Load latest live storefront config from Supabase database
      try {
        const { data, error } = await supabase
          .from('storefront_config')
          .select('config')
          .eq('id', 'homepage_global')
          .maybeSingle();

        if (error) throw error;

        if (data && data.config) {
          setPageConfig(data.config);
          localStorage.setItem('aura_cms_homepage', JSON.stringify(data.config));
        } else if (!saved) {
          // If no database config and no cache, use default
          setPageConfig(DEFAULT_CMS_CONFIG);
        }
      } catch (err) {
        console.error("Failed to fetch live storefront config from Supabase, using cache/default:", err);
        if (!saved) {
          setPageConfig(DEFAULT_CMS_CONFIG);
        }
      }
    };

    loadConfig();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'aura_cms_homepage' && e.newValue) {
        try {
          setPageConfig(JSON.parse(e.newValue));
        } catch (err) { }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  if (!pageConfig) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', fontFamily: '"Outfit", sans-serif', color: 'var(--color-gray)' }}>Loading AURA Storefront...</div>;
  }

  const getBlockLayoutConfig = (block: any) => {
    const defaults = {
      padding: {
        fluid_clamp: "py-[clamp(3rem,6vw,8rem)] px-[clamp(1rem,4vw,3rem)]",
        preset: "editorial",
        horizontal_preset: "editorial",
        horizontal_fluid_clamp: "px-[clamp(2rem,6vw,5rem)]"
      },
      grid_setup: { columns_mobile: 1, columns_tablet: 2, columns_desktop: 4, gap: "gap-8" },
      aspect_ratio: block.data?.aspectRatio || "portrait",
      object_fit: "cover",
      manual_height: "",
      manual_width: ""
    };
    if (!block.layout_configuration) return defaults;
    return {
      ...defaults,
      ...block.layout_configuration,
      padding: { ...defaults.padding, ...block.layout_configuration.padding },
      grid_setup: { ...defaults.grid_setup, ...block.layout_configuration.grid_setup }
    };
  };

  // Filter out draft blocks and sort by order
  const activeBlocks = (pageConfig.blocks || [])
    .filter((block: any) => block.status === 'published')
    .sort((a: any, b: any) => a.order - b.order);

  return (
    <div className="home-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {activeBlocks.map((block: any) => {
        const key = block.id;
        const widthClass = block.data.sectionWidth ? `width-${block.data.sectionWidth}` : 'width-standard';
        const padClass = block.data.sectionPadding ? `pad-${block.data.sectionPadding}` : 'pad-editorial';
        const padHClass = block.data.sectionHorizontalPadding ? `pad-h-${block.data.sectionHorizontalPadding}` : '';
        const themeClass = block.data.themeStyle ? `theme-${block.data.themeStyle}` : 'theme-light';
        const alignClass = block.data.textAlign ? `align-${block.data.textAlign}` : 'align-left';
        const gapClass = block.data.columnGap ? `gap-${block.data.columnGap}` : 'gap-standard';
        const hoverClass = block.data.hoverAnimation ? `hover-${block.data.hoverAnimation}` : 'hover-zoom';

        const parallaxStyle = (block.data.parallaxBg && block.data.layout !== 'split' && block.data.desktop_image) ? {
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover'
        } : {};

        const layConfig = getBlockLayoutConfig(block);
        const aspect = layConfig.aspect_ratio || 'portrait';
        const fit = layConfig.object_fit || 'cover';
        const mobCols = layConfig.grid_setup?.columns_mobile || 1;
        const tabCols = layConfig.grid_setup?.columns_tablet || 2;
        const dskCols = layConfig.grid_setup?.columns_desktop || 4;

        const manualHeight = layConfig.manual_height;
        const manualWidth = layConfig.manual_width;

        const sectionStyle: React.CSSProperties = {
          ...parallaxStyle,
          ...(manualHeight ? { minHeight: `${manualHeight}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center' } : {}),
          ...(manualWidth ? { maxWidth: `${manualWidth}px`, width: '100%', marginLeft: 'auto', marginRight: 'auto' } : {})
        };

        const containerStyle: React.CSSProperties = {
          ...(manualWidth ? { maxWidth: `${manualWidth}px`, width: '100%', marginLeft: 'auto', marginRight: 'auto' } : {})
        };

        if (block.block_type === 'HeroBanner') {
          const isSplit = block.data.layout === 'split';
          const desktopPadding = manualHeight
            ? (manualHeight <= 500 ? '2rem 3rem 2rem' : manualHeight <= 650 ? '3rem 4rem 3rem' : '4rem 5rem 4rem')
            : (block.data.sectionWidth === 'narrow' ? '4rem 3rem 3rem' : '8rem 6rem 6rem');

          const fullPadding = manualHeight
            ? (manualHeight <= 500 ? '2rem 2rem' : manualHeight <= 650 ? '4rem 2rem' : '5rem 2rem')
            : '8rem 2rem';

          return (
            <section key={key} className={`cms-hero ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
              <div className={widthClass} style={containerStyle}>
                {isSplit ? (
                  <div className="cms-hero-split" style={{ border: '1px solid var(--color-border)', minHeight: manualHeight ? `${manualHeight}px` : '80vh' }}>
                    <div className="cms-hero-left" style={{
                      '--hero-padding-desktop': desktopPadding
                    } as React.CSSProperties}>
                      {block.data.subtitle && (
                        <span className="cms-hero-subtitle animate-fade-up">
                          {block.data.subtitle}
                        </span>
                      )}
                      <h1 className="cms-hero-title animate-fade-up delay-1">
                        {block.data.title || 'AURA'}
                      </h1>
                      {block.data.description && (
                        <p className="cms-hero-description animate-fade-up delay-2">
                          {block.data.description}
                        </p>
                      )}
                      <div className="cms-hero-actions animate-fade-up delay-3" style={{ justifyContent: block.data.textAlign === 'center' ? 'center' : block.data.textAlign === 'right' ? 'flex-end' : 'flex-start' }}>
                        {block.data.cta_text && (
                          <Link to={block.data.cta_url || '/shop/all'} className="editorial-btn-primary">
                            {block.data.cta_text}
                          </Link>
                        )}
                        {block.data.secondary_cta_text && (
                          <Link to={block.data.secondary_cta_url || '/shop/all'} className="editorial-btn-secondary">
                            {block.data.secondary_cta_text}
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="cms-hero-right animate-fade-in delay-2">
                      {block.data.desktop_image && (
                        <img
                          src={block.data.desktop_image}
                          alt={block.data.title || 'Campaign'}
                          className="cms-hero-img"
                          style={{ objectFit: fit as any }}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="cms-hero-full" style={{
                    backgroundImage: block.data.desktop_image ? `url(${block.data.desktop_image})` : 'none',
                    minHeight: manualHeight ? `${manualHeight}px` : (block.data.sectionPadding === 'compact' ? '50vh' : '85vh'),
                    '--hero-padding-full': fullPadding,
                    ...parallaxStyle
                  } as unknown as React.CSSProperties}>
                    {block.data.desktop_image && <div className="cms-hero-full-overlay"></div>}
                    <div className="cms-hero-full-content">
                      {block.data.subtitle && (
                        <span className="cms-hero-subtitle animate-fade-up" style={{ color: block.data.desktop_image ? '#e4e4e7' : 'var(--color-accent)' }}>
                          {block.data.subtitle}
                        </span>
                      )}
                      <h1 className="cms-hero-full-title animate-fade-up delay-1">
                        {block.data.title || 'AURA'}
                      </h1>
                      {block.data.description && (
                        <p className="cms-hero-full-description animate-fade-up delay-2">
                          {block.data.description}
                        </p>
                      )}
                      <div className="cms-hero-actions animate-fade-up delay-3" style={{ justifyContent: 'center' }}>
                        {block.data.cta_text && (
                          <Link to={block.data.cta_url || '/shop/all'} className="editorial-btn-primary" style={{ backgroundColor: block.data.desktop_image ? '#fff' : 'var(--color-text)', color: block.data.desktop_image ? '#000' : 'var(--color-bg)', borderColor: block.data.desktop_image ? '#fff' : 'var(--color-text)' }}>
                            {block.data.cta_text}
                          </Link>
                        )}
                        {block.data.secondary_cta_text && (
                          <Link to={block.data.secondary_cta_url || '/shop/all'} className="editorial-btn-secondary" style={{ color: block.data.desktop_image ? '#fff' : 'var(--color-text)' }}>
                            {block.data.secondary_cta_text}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        }

        if (block.block_type === 'PromotionalSlider') {
          return (
            <div key={key} style={{ backgroundColor: block.data.background_color || '#0c0a09', color: '#fff', padding: '1.25rem 2rem', textAlign: 'center', fontSize: '0.85rem', letterSpacing: '0.08em', fontFamily: '"Outfit", sans-serif', zIndex: 10, ...sectionStyle }}>
              <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem' }}>
                <Sparkles size={14} style={{ color: '#c5a880' }} />
                <span>{block.data.slides?.[0]?.text}</span>
              </div>
            </div>
          );
        }

        if (block.block_type === 'CategoryGrid') {
          return (
            <section key={key} className={`cms-cat-section ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
              <div className={`container ${widthClass}`} style={containerStyle}>
                <h2 className="featured-cat-title animate-fade-up">
                  {block.data.title || 'Curated Categories'}
                </h2>
                <div
                  className={`cms-cat-grid ${gapClass} ${hoverClass}`}
                  style={{
                    '--grid-cols-desktop': dskCols,
                    '--grid-cols-tablet': tabCols,
                    '--grid-cols-mobile': mobCols
                  } as React.CSSProperties}
                >
                  {(block.data.categories || []).map((cat: any, cIdx: number) => {
                    const catObj = typeof cat === 'string' ? { name: cat, image: '' } : cat;
                    const slug = catObj.name.toLowerCase().replace(/\s+/g, '-');
                    return (
                      <Link
                        key={cIdx}
                        to={`/shop/${slug}`}
                        className={`cms-cat-card animate-fade-up aspect-${aspect}`}
                        style={{
                          backgroundImage: catObj.image ? `url(${catObj.image})` : 'none',
                          backgroundColor: catObj.image ? 'transparent' : '#f5f5f4',
                          animationDelay: `${cIdx * 0.04}s`
                        }}
                      >
                        {catObj.image && <div className="cms-cat-overlay"></div>}
                        <span className="cms-cat-name animate-fade-up">
                          {catObj.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        }

        if (block.block_type === 'FeaturedProducts') {
          const displayLimit = block.data.limit || 4;
          const displayList = products.slice(0, displayLimit);

          return (
            <section key={key} className={`section new-arrivals ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
              <div className={`container ${widthClass}`} style={containerStyle}>
                <div className="section-header mb-8 animate-fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: block.data.textAlign === 'center' ? 'center' : block.data.textAlign === 'right' ? 'flex-end' : 'flex-start', gap: '0.5rem' }}>
                  <h2 className="section-title" style={{ margin: 0 }}>
                    {block.data.title || 'Curated Classics'}
                  </h2>
                  <Link to="/shop/all" className="view-all-link">
                    {block.data.cta_text || 'View All Collection'}
                  </Link>
                </div>

                <div
                  className={`product-grid ${gapClass} ${hoverClass}`}
                  style={{
                    '--grid-cols-desktop': dskCols,
                    '--grid-cols-tablet': tabCols,
                    '--grid-cols-mobile': mobCols
                  } as React.CSSProperties}
                >
                  {displayList.map((product, pIdx) => (
                    <Link to={`/product/${product.id}`} key={product.id} className="product-card animate-fade-up" style={{ animationDelay: `${pIdx * 0.06}s` }}>
                      <div className={`product-image-wrap aspect-${aspect}`}>
                        <img src={product.image} alt={product.name} className="product-image" style={{ objectFit: fit as any }} />
                        {product.is_new && <span className="badge-new">New</span>}
                        <div className="product-quick-add">Quick View</div>
                      </div>
                      <div className="product-info">
                        <span className="product-category">
                          {product.category.toUpperCase().replace('-', ' ')}
                        </span>
                        <h3 className="product-name">{product.name}</h3>
                        <p className="product-price">{formatPrice(product)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (block.block_type === 'BrandStory') {
          return (
            <section key={key} className={`cms-story ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
              <div className={`cms-story-grid ${widthClass}`} style={{ ...containerStyle, minHeight: manualHeight ? `${manualHeight}px` : '550px' }}>
                <div className="cms-story-left">
                  {block.data.subtitle && (
                    <span className="cms-story-subtitle animate-fade-up">{block.data.subtitle}</span>
                  )}
                  <h2 className="cms-story-title animate-fade-up delay-1">{block.data.title || 'Brand Story'}</h2>
                  {block.data.quote && (
                    <blockquote className="cms-story-quote animate-fade-up delay-2">
                      "{block.data.quote}"
                    </blockquote>
                  )}
                  {block.data.description && (
                    <p className="cms-story-description animate-fade-up delay-3">{block.data.description}</p>
                  )}
                </div>
                <div className="cms-story-right animate-fade-in delay-2">
                  {block.data.image && (
                    <img src={block.data.image} alt="Story" className="cms-story-img" style={{ objectFit: fit as any }} />
                  )}
                </div>
              </div>
            </section>
          );
        }

        if (block.block_type === 'EditorialGallery') {
          return (
            <section key={key} className={`cms-gallery ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
              <div className={`container ${widthClass}`} style={containerStyle}>
                <div style={{ textAlign: block.data.textAlign || 'center', marginBottom: '3.5rem' }} className="animate-fade-up">
                  {block.data.subtitle && (
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--color-accent)', fontWeight: 600 }}>{block.data.subtitle}</span>
                  )}
                  <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '2.5rem', fontWeight: 500, margin: '0.5rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{block.data.title || 'Editorial Gallery'}</h3>
                </div>
                <div
                  className={`cms-gallery-grid ${gapClass} ${hoverClass}`}
                  style={{
                    '--grid-cols-desktop': dskCols,
                    '--grid-cols-tablet': tabCols,
                    '--grid-cols-mobile': mobCols
                  } as React.CSSProperties}
                >
                  <div className={`cms-gallery-item animate-fade-up aspect-${aspect}`} style={{ animationDelay: '0s' }}>
                    {block.data.image1 && <img src={block.data.image1} alt="Lookbook 1" className="cms-gallery-img" style={{ objectFit: fit as any }} />}
                  </div>
                  <div className={`cms-gallery-item animate-fade-up aspect-${aspect}`} style={{ animationDelay: '0.08s' }}>
                    {block.data.image2 && <img src={block.data.image2} alt="Lookbook 2" className="cms-gallery-img" style={{ objectFit: fit as any }} />}
                  </div>
                  <div className={`cms-gallery-item animate-fade-up aspect-${aspect}`} style={{ animationDelay: '0.16s' }}>
                    {block.data.image3 && <img src={block.data.image3} alt="Lookbook 3" className="cms-gallery-img" style={{ objectFit: fit as any }} />}
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (block.block_type === 'NewsletterSubscribe') {
          return (
            <section key={key} className={`cms-news ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
              <div className={widthClass} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', ...containerStyle }}>
                <h3 className="cms-news-title animate-fade-up">{block.data.title || 'JOIN THE CLUB'}</h3>
                {block.data.subtitle && (
                  <p className="cms-news-subtitle animate-fade-up delay-1">{block.data.subtitle}</p>
                )}
                <form className="cms-news-form animate-fade-up delay-2" onSubmit={(e) => { e.preventDefault(); alert("Subscription saved! Thank you."); }}>
                  <input type="email" placeholder={block.data.placeholder_text || 'Enter email'} required className="cms-news-input" />
                  <button type="submit" className="cms-news-btn">
                    {block.data.button_text || 'Subscribe'}
                  </button>
                </form>
              </div>
            </section>
          );
        }

        if (block.block_type === 'Spacer') {
          return (
            <div key={key} style={{ height: `${block.data.height || 60}px` }} />
          );
        }

        if (block.block_type === 'LuxuryFaq') {
          return (
            <section key={key} className={`cms-faq ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
              <div className={`container ${widthClass}`} style={containerStyle}>
                <div style={{ textAlign: block.data.textAlign || 'center', marginBottom: '3.5rem' }} className="animate-fade-up">
                  {block.data.subtitle && (
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--color-accent)', fontWeight: 600 }}>{block.data.subtitle}</span>
                  )}
                  <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '2.5rem', fontWeight: 500, margin: '0.5rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{block.data.title || 'FAQ'}</h3>
                </div>
                <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(block.data.faqs || []).map((faq: any, fIdx: number) => (
                    <details
                      key={fIdx}
                      className="faq-details animate-fade-up"
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        paddingBottom: '1rem',
                        cursor: 'pointer',
                        animationDelay: `${fIdx * 0.05}s`
                      }}
                    >
                      <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: '1rem', listStyle: 'none', padding: '0.5rem 0' }}>
                        <span>{faq.question}</span>
                        <span className="faq-icon" style={{ fontSize: '1.25rem', color: 'var(--color-accent)', transition: 'transform 0.2s' }}>+</span>
                      </summary>
                      <div style={{ color: 'var(--color-gray)', fontSize: '0.9rem', lineHeight: '1.6', marginTop: '0.5rem', cursor: 'default' }}>
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (block.block_type === 'ReviewTestimonials') {
          return (
            <section key={key} className={`cms-reviews ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
              <div className={`container ${widthClass}`} style={containerStyle}>
                <div style={{ textAlign: block.data.textAlign || 'center', marginBottom: '3.5rem' }} className="animate-fade-up">
                  {block.data.subtitle && (
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--color-accent)', fontWeight: 600 }}>{block.data.subtitle}</span>
                  )}
                  <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '2.5rem', fontWeight: 500, margin: '0.5rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{block.data.title || 'Client Impressions'}</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                  {(block.data.reviews || []).map((rev: any, rIdx: number) => (
                    <div
                      key={rIdx}
                      className="review-card animate-fade-up"
                      style={{
                        border: '1px solid var(--color-border)',
                        padding: '2.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem',
                        animationDelay: `${rIdx * 0.08}s`,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '4px', color: '#c5a880', fontSize: '1rem' }}>
                        {Array.from({ length: rev.rating || 5 }).map(() => '★')}
                      </div>
                      <blockquote style={{ fontStyle: 'italic', fontSize: '0.95rem', color: 'var(--color-text)', margin: 0, flexGrow: 1, lineHeight: '1.6' }}>
                        "{rev.quote}"
                      </blockquote>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-light-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                          {rev.client_avatar || rev.client_name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.05em' }}>{rev.client_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (block.block_type === 'LogoCloud') {
          return (
            <section key={key} className={`cms-logocloud ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', ...sectionStyle }}>
              <div className={`container ${widthClass}`} style={containerStyle}>
                {block.data.title && (
                  <h5 style={{ textAlign: 'center', fontSize: '0.75rem', letterSpacing: '0.25em', color: 'var(--color-gray)', textTransform: 'uppercase', marginBottom: '2rem' }} className="animate-fade-up">{block.data.title}</h5>
                )}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '4rem' }} className="animate-fade-up">
                  {(block.data.logos || []).map((logo: any, lIdx: number) => (
                    <div
                      key={lIdx}
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        letterSpacing: '0.2em',
                        opacity: 0.55,
                        fontFamily: '"Outfit", sans-serif',
                        color: 'var(--color-text)',
                        transition: 'opacity 0.2s'
                      }}
                      className="logo-cloud-item"
                    >
                      {logo.image_url ? (
                        <img src={logo.image_url} alt={logo.name} style={{ height: '28px', filter: 'grayscale(100%)' }} />
                      ) : (
                        logo.name
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (block.block_type === 'HeroGrid') {
          return (
            <section key={key} className={`cms-herogrid ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
              <div className={`container ${widthClass}`} style={containerStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
                  <div className="animate-fade-in" style={{ position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={block.data.image_left}
                      alt="Mosaic Highlight"
                      style={{
                        width: '100%',
                        maxHeight: '550px',
                        objectFit: 'cover',
                        transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                      className="mosaic-left-img"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    <div className="animate-fade-up">
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.25em', fontWeight: 600 }}>{block.data.subtitle}</span>
                      <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '3rem', fontWeight: 500, margin: '0.75rem 0 1.25rem 0', textTransform: 'uppercase', lineHeight: 1.1 }}>{block.data.title}</h2>
                      <p style={{ color: 'var(--color-gray)', fontSize: '1rem', lineHeight: '1.7', marginBottom: '2rem' }}>{block.data.description}</p>
                      {block.data.cta_text && (
                        <Link
                          to={block.data.cta_url || '/shop/all'}
                          style={{
                            display: 'inline-block',
                            borderBottom: '2px solid var(--color-text)',
                            paddingBottom: '4px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            letterSpacing: '0.15em',
                            color: 'var(--color-text)',
                            textTransform: 'uppercase',
                            textDecoration: 'none',
                            transition: 'color 0.2s, border-color 0.2s'
                          }}
                          className="mosaic-cta-link"
                        >
                          {block.data.cta_text}
                        </Link>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div className="animate-fade-up" style={{ overflow: 'hidden', animationDelay: '0.1s' }}>
                        <img src={block.data.image_right_top} alt="Mosaic Aux 1" style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
                      </div>
                      <div className="animate-fade-up" style={{ overflow: 'hidden', animationDelay: '0.2s' }}>
                        <img src={block.data.image_right_bottom} alt="Mosaic Aux 2" style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (block.block_type === 'HeroSlider') {
          return (
            <CmsHeroSlider key={key} block={block} style={sectionStyle} />
          );
        }

        return null;
      })}
    </div>
  );
};

export default Home;
