import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../lib/useProducts';
import { formatPrice } from '../lib/currency';
import { Sparkles } from 'lucide-react';
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

const Home = () => {
  const { products } = useProducts();
  const [pageConfig, setPageConfig] = useState<any>(null);

  useEffect(() => {
    const loadConfig = () => {
      const saved = localStorage.getItem('aura_cms_homepage');
      if (saved) {
        try {
          setPageConfig(JSON.parse(saved));
        } catch (e) {
          console.error("Error loading saved layout configs:", e);
          setPageConfig(DEFAULT_CMS_CONFIG);
        }
      } else {
        setPageConfig(DEFAULT_CMS_CONFIG);
      }
    };

    loadConfig();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'aura_cms_homepage') {
        loadConfig();
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

        if (block.block_type === 'HeroBanner') {
          const isSplit = block.data.layout === 'split';
          return (
            <section key={key} className={`cms-hero ${padClass} ${themeClass} ${alignClass}`} style={parallaxStyle as React.CSSProperties}>
              <div className={widthClass}>
                {isSplit ? (
                  <div className="cms-hero-split" style={{ border: '1px solid var(--color-border)' }}>
                    <div className="cms-hero-left" style={{
                      '--hero-padding-desktop': block.data.sectionWidth === 'narrow' ? '4rem 3rem' : '8rem 6rem'
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
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="cms-hero-full" style={{ backgroundImage: block.data.desktop_image ? `url(${block.data.desktop_image})` : 'none', minHeight: block.data.sectionPadding === 'compact' ? '50vh' : '85vh', ...parallaxStyle }}>
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
            <div key={key} style={{ backgroundColor: block.data.background_color || '#0c0a09', color: '#fff', padding: '1.25rem 2rem', textAlign: 'center', fontSize: '0.85rem', letterSpacing: '0.08em', fontFamily: '"Outfit", sans-serif', zIndex: 10 }}>
              <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem' }}>
                <Sparkles size={14} style={{ color: '#c5a880' }} />
                <span>{block.data.slides?.[0]?.text}</span>
              </div>
            </div>
          );
        }

        if (block.block_type === 'CategoryGrid') {
          return (
            <section key={key} className={`cms-cat-section ${padClass} ${themeClass} ${alignClass}`}>
              <div className={`container ${widthClass}`}>
                <h2 className="featured-cat-title animate-fade-up">
                  {block.data.title || 'Curated Categories'}
                </h2>
                <div 
                  className={`cms-cat-grid ${gapClass} ${hoverClass}`} 
                  style={{ 
                    '--grid-cols-desktop': block.layout_configuration?.grid_setup?.columns_desktop || block.data.gridColumns || 4,
                    '--grid-cols-tablet': block.layout_configuration?.grid_setup?.columns_tablet || 2,
                    '--grid-cols-mobile': block.layout_configuration?.grid_setup?.columns_mobile || 1
                  } as React.CSSProperties}
                >
                  {(block.data.categories || []).map((cat: any, cIdx: number) => {
                    const catObj = typeof cat === 'string' ? { name: cat, image: '' } : cat;
                    const slug = catObj.name.toLowerCase().replace(/\s+/g, '-');
                    return (
                      <Link 
                        key={cIdx} 
                        to={`/shop/${slug}`} 
                        className={`cms-cat-card animate-fade-up aspect-${block.data.aspectRatio || 'portrait'}`}
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
            <section key={key} className={`section new-arrivals ${padClass} ${themeClass} ${alignClass}`}>
              <div className={`container ${widthClass}`}>
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
                    '--grid-cols-desktop': block.layout_configuration?.grid_setup?.columns_desktop || block.data.gridColumns || 4,
                    '--grid-cols-tablet': block.layout_configuration?.grid_setup?.columns_tablet || 2,
                    '--grid-cols-mobile': block.layout_configuration?.grid_setup?.columns_mobile || 1
                  } as React.CSSProperties}
                >
                  {displayList.map((product, pIdx) => (
                    <Link to={`/product/${product.id}`} key={product.id} className="product-card animate-fade-up" style={{ animationDelay: `${pIdx * 0.06}s` }}>
                      <div className={`product-image-wrap aspect-${block.data.aspectRatio || 'portrait'}`}>
                        <img src={product.image} alt={product.name} className="product-image" />
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
            <section key={key} className={`cms-story ${padClass} ${themeClass} ${alignClass}`}>
              <div className={`cms-story-grid ${widthClass}`}>
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
                    <img src={block.data.image} alt="Story" className="cms-story-img" />
                  )}
                </div>
              </div>
            </section>
          );
        }

        if (block.block_type === 'EditorialGallery') {
          return (
            <section key={key} className={`cms-gallery ${padClass} ${themeClass} ${alignClass}`}>
              <div className={`container ${widthClass}`}>
                <div style={{ textAlign: block.data.textAlign || 'center', marginBottom: '3.5rem' }} className="animate-fade-up">
                  {block.data.subtitle && (
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--color-accent)', fontWeight: 600 }}>{block.data.subtitle}</span>
                  )}
                  <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '2.5rem', fontWeight: 500, margin: '0.5rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{block.data.title || 'Editorial Gallery'}</h3>
                </div>
                <div 
                  className={`cms-gallery-grid ${gapClass} ${hoverClass}`} 
                  style={{ 
                    '--grid-cols-desktop': block.layout_configuration?.grid_setup?.columns_desktop || block.data.gridColumns || 3,
                    '--grid-cols-tablet': block.layout_configuration?.grid_setup?.columns_tablet || 2,
                    '--grid-cols-mobile': block.layout_configuration?.grid_setup?.columns_mobile || 1
                  } as React.CSSProperties}
                >
                  <div className={`cms-gallery-item animate-fade-up aspect-${block.data.aspectRatio || 'portrait'}`} style={{ animationDelay: '0s' }}>
                    {block.data.image1 && <img src={block.data.image1} alt="Lookbook 1" className="cms-gallery-img" />}
                  </div>
                  <div className={`cms-gallery-item animate-fade-up aspect-${block.data.aspectRatio || 'portrait'}`} style={{ animationDelay: '0.08s' }}>
                    {block.data.image2 && <img src={block.data.image2} alt="Lookbook 2" className="cms-gallery-img" />}
                  </div>
                  <div className={`cms-gallery-item animate-fade-up aspect-${block.data.aspectRatio || 'portrait'}`} style={{ animationDelay: '0.16s' }}>
                    {block.data.image3 && <img src={block.data.image3} alt="Lookbook 3" className="cms-gallery-img" />}
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (block.block_type === 'NewsletterSubscribe') {
          return (
            <section key={key} className={`cms-news ${padClass} ${themeClass} ${alignClass}`}>
              <div className={widthClass} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
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

        return null;
      })}
    </div>
  );
};

export default Home;
