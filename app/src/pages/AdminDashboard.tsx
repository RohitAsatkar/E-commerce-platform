import { useEffect, useState, useMemo, useRef } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../lib/useProducts';
import { getProductCurrency } from '../lib/currency';
import {
  Search, Filter, X, LogOut,
  TrendingUp, ShoppingBag, Box, Clock, CheckCircle,
  AlertCircle, Eye, EyeOff, RefreshCw, Plus, Trash2, ArrowUp, ArrowDown, Globe, Compass, Sparkles,
  Monitor, Tablet, Smartphone, Maximize2, Minimize2,
  Copy, ChevronDown, ChevronRight, Grid, Sliders, Settings, Link, Layers, Edit3
} from 'lucide-react';
import './AdminDashboard.css';
import './Home.css';

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const PANT_SIZES = ['28', '30', '32', '34', '36', '38', '40'];
const FOOTWEAR_SIZES = ['6', '7', '8', '9', '10', '11', '12'];
const ACCESSORY_SIZES = ['One Size'];
const ALL_SIZES = [...CLOTHING_SIZES, ...PANT_SIZES, ...FOOTWEAR_SIZES, ...ACCESSORY_SIZES];

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

const getAvailableSizesForCategory = (category: string) => {
  const catLower = (category || '').toLowerCase();
  if (catLower === 'footwear') {
    return FOOTWEAR_SIZES;
  }
  if (['accessories', 'jewelry', 'beauty', 'watch', 'bags'].includes(catLower)) {
    return ACCESSORY_SIZES;
  }
  if (['jeans', 'trousers', 'cargo-pants', 'pants'].includes(catLower)) {
    return PANT_SIZES;
  }
  return CLOTHING_SIZES;
};
const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

const CmsMultiHeroCarousel = ({ block, style }: { block: any; style?: React.CSSProperties }) => {
  const slides = block.data?.slides || [];
  const autoplayEnabled = block.data?.autoplay_enabled !== false;
  const autoplaySpeed = block.data?.autoplay_speed || 4000;
  const slideGap = typeof block.data?.slide_gap === 'number' ? block.data.slide_gap : 20;

  const [currentIndex, setCurrentIndex] = useState(slides.length);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync visibility state of the page (to pause autoplay when page is in background)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Sync index when slides length changes
  useEffect(() => {
    setTransitionEnabled(false);
    setCurrentIndex(slides.length);
  }, [slides.length]);

  // Autoplay Effect
  useEffect(() => {
    if (!autoplayEnabled || isDragging || isHovered || slides.length === 0 || !isVisible) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev: number) => prev + 1);
    }, autoplaySpeed);
    return () => clearInterval(interval);
  }, [autoplayEnabled, autoplaySpeed, isDragging, isHovered, slides.length, isVisible]);

  // Safety bounds check to prevent visual vanishing if index goes out of range
  useEffect(() => {
    const N = slides.length;
    if (N === 0) return;
    if (currentIndex >= 3 * N || currentIndex < 0) {
      setTransitionEnabled(false);
      setCurrentIndex(((currentIndex % N) + N) % N + N);
    }
  }, [currentIndex, slides.length]);

  if (slides.length === 0) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', border: '1px dashed var(--color-border)', backgroundColor: 'var(--color-bg)', ...style }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-gray)' }}>No slides in Multi-Item Hero Banner Carousel. Add slides in settings.</p>
      </div>
    );
  }

  // Create virtual slides for infinite looping: [Group 1, Group 2, Group 3]
  const virtualSlides = [...slides, ...slides, ...slides];
  const N = slides.length;

  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
    setDragOffset(0);
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startX;
    setDragOffset(diff);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Swipe threshold to change slides (e.g. 50px)
    const threshold = 50;
    if (dragOffset < -threshold) {
      setCurrentIndex((prev: number) => prev + 1);
    } else if (dragOffset > threshold) {
      setCurrentIndex((prev: number) => prev - 1);
    }
    setDragOffset(0);
  };

  // Handle instant jump when wrapping to simulate infinite loop
  const handleTransitionEnd = () => {
    if (currentIndex >= 2 * N) {
      setTransitionEnabled(false);
      setCurrentIndex(currentIndex - N);
    } else if (currentIndex < N) {
      setTransitionEnabled(false);
      setCurrentIndex(currentIndex + N);
    }
  };

  // Turn transitions back on after jump
  useEffect(() => {
    if (!transitionEnabled) {
      // Force repaint to allow transition-less state jump
      if (containerRef.current) {
        containerRef.current.getBoundingClientRect();
      }
      setTransitionEnabled(true);
    }
  }, [transitionEnabled]);

  return (
    <div
      className="multi-hero-carousel-container"
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        '--slide-gap': `${slideGap}px`,
        ...style
      } as React.CSSProperties}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        handleDragEnd();
      }}
      onMouseDown={(e) => handleDragStart(e.clientX)}
      onMouseMove={(e) => handleDragMove(e.clientX)}
      onMouseUp={handleDragEnd}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
      onTouchEnd={handleDragEnd}
    >
      <div
        ref={containerRef}
        className="multi-hero-carousel-track"
        onTransitionEnd={handleTransitionEnd}
        style={{
          transition: !transitionEnabled || isDragging ? 'none' : 'transform 3s cubic-bezier(0.76, 0, 0.24, 1)',
          transform: `translateX(calc(-${currentIndex} * var(--shift-val) + var(--left-peek) + ${dragOffset}px))`
        }}
      >
        {virtualSlides.map((slide: any, idx: number) => {
          return (
            <a
              key={idx}
              href={slide.cta_url || '#'}
              onClick={(e) => e.preventDefault()}
              className="multi-item-slide"
              style={{
                backgroundImage: `url(${slide.image_url})`,
                display: 'block',
                cursor: 'pointer'
              }}
            >
              {!block.data?.hide_content && (
                <div className="multi-item-slide-overlay">
                  {slide.badge && (
                    <span className="multi-item-slide-badge">{slide.badge}</span>
                  )}
                  {!slide.badge && <div />}
                  
                  <div className="multi-item-slide-content">
                    <h3 className="multi-item-slide-title">{slide.title}</h3>
                    {slide.subtitle && (
                      <p className="multi-item-slide-subtitle">{slide.subtitle}</p>
                    )}
                    {slide.show_cta !== false && slide.cta_text && (
                      <span
                        className="multi-item-slide-cta"
                        style={{ cursor: 'pointer' }}
                      >
                        {slide.cta_text}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
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
      <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--color-bg)', border: '1px dashed var(--color-border)', color: 'var(--color-gray)', fontSize: '0.85rem', ...style }}>
        No slides configured. Open properties to add slides.
      </div>
    );
  }

  const layConfig = block.layout_configuration || {};
  const manualHeight = layConfig.manual_height;

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        height: manualHeight ? `${manualHeight}px` : '420px',
        minHeight: manualHeight ? `${manualHeight}px` : '420px',
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
                  bottom: '3rem',
                  left: '5%',
                  right: '5%',
                  zIndex: 3,
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  alignItems: 'flex-start',
                  textAlign: 'left'
                }}
              >
                {slide.subtitle && (
                  <span
                    style={{
                      fontSize: '0.75rem',
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
                    style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontSize: '2rem',
                      fontWeight: 400,
                      margin: '0.15rem 0',
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
                  <div
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem 1.4rem',
                      backgroundColor: '#fff',
                      color: '#000',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      border: 'none'
                    }}
                  >
                    {slide.cta_text}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length); }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '1rem',
              transform: 'translateY(-50%)',
              zIndex: 10,
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem'
            }}
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setActiveIndex((prev) => (prev + 1) % slides.length); }}
            style={{
              position: 'absolute',
              top: '50%',
              right: '1rem',
              transform: 'translateY(-50%)',
              zIndex: 10,
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem'
            }}
          >
            ›
          </button>
        </>
      )}

      {slides.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '1.25rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            display: 'flex',
            gap: '0.4rem'
          }}
        >
          {slides.map((_: any, idx: number) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setActiveIndex(idx); }}
                style={{
                  width: isActive ? '20px' : '5px',
                  height: '5px',
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

const AdminDashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const { products, refreshProducts } = useProducts();
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'cms' | 'marketing'>('overview');

  // ==========================================
  // CMS & MARKETING STATE DEFINITIONS
  // ==========================================
  const [cmsSubTab, setCmsSubTab] = useState<'visual' | 'static' | 'navigation' | 'media' | 'shop_filters' | 'grid_settings' | 'custom_pages'>('visual');

  // Dynamic Custom Pages State
  const [customPages, setCustomPages] = useState<any[]>(() => {
    const saved = localStorage.getItem('aura_custom_pages');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch(e) {
      return [];
    }
  });
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageType, setNewPageType] = useState<string>('collection');
  const [newPageBannerTitle, setNewPageBannerTitle] = useState('');
  const [newPageBannerDesc, setNewPageBannerDesc] = useState('');
  const [newPageBgColor, setNewPageBgColor] = useState('#121212');
  const [newPageBannerImage, setNewPageBannerImage] = useState('');
  const [newPageSelectedProducts, setNewPageSelectedProducts] = useState<string[]>([]);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [newPageBannerStyle, setNewPageBannerStyle] = useState<'minimal' | 'immersive' | 'split' | 'glass' | 'editorial-offset' | 'overlay-bold'>('minimal');
  const [newPageBannerTitleFont, setNewPageBannerTitleFont] = useState('Playfair Display');
  const [newPageBannerTitleColor, setNewPageBannerTitleColor] = useState('#ffffff');
  const [newPageBannerSubtitleFont, setNewPageBannerSubtitleFont] = useState('Outfit');
  const [newPageBannerSubtitleColor, setNewPageBannerSubtitleColor] = useState('#facc15');
  const [newPageBannerHideText, setNewPageBannerHideText] = useState(false);
  const [newPageBannerDescColor, setNewPageBannerDescColor] = useState('#cccccc');
  const [uploadingCustomPageBanner, setUploadingCustomPageBanner] = useState(false);
  const [newPageCtaText, setNewPageCtaText] = useState('');
  const [newPageCtaUrl, setNewPageCtaUrl] = useState('');
  const [newPageCtaColor, setNewPageCtaColor] = useState('#ffffff');
  const [newPageStartDate, setNewPageStartDate] = useState('');
  const [newPageEndDate, setNewPageEndDate] = useState('');
  const [newPageSeoTitle, setNewPageSeoTitle] = useState('');
  const [newPageSeoDescription, setNewPageSeoDescription] = useState('');
  const [newPageUseDynamicTheme, setNewPageUseDynamicTheme] = useState<boolean>(true);
  const [showRlsInstructionModal, setShowRlsInstructionModal] = useState<boolean>(false);

  // Advanced Promotional Sales Campaigns State
  const [salesCampaigns, setSalesCampaigns] = useState<any[]>(() => {
    const saved = localStorage.getItem('aura_sales_campaigns');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch(e) {
      return [];
    }
  });
  const [newCampaignTitle, setNewCampaignTitle] = useState('');
  const [newCampaignType, setNewCampaignType] = useState<'flash_sale' | 'special_sale'>('flash_sale');
  const [newCampaignDiscountType, setNewCampaignDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCampaignDiscountValue, setNewCampaignDiscountValue] = useState(15);
  const [newCampaignStartDate, setNewCampaignStartDate] = useState('');
  const [newCampaignEndDate, setNewCampaignEndDate] = useState('');
  const [newCampaignApplyTo, setNewCampaignApplyTo] = useState<'all' | 'specific'>('specific');
  const [newCampaignSelectedProducts, setNewCampaignSelectedProducts] = useState<string[]>([]);
  const [gridColumns, setGridColumns] = useState(() => {
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
  const [shopFilters, setShopFilters] = useState<{ name: string; slug: string }[]>(() => {
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
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
  const [sandboxMode, setSandboxMode] = useState<'edit' | 'preview'>('edit');
  const [simulatorCustomWidth, setSimulatorCustomWidth] = useState<number>(1280);
  const [activeConfigTab, setActiveConfigTab] = useState<'content' | 'motion' | 'geometry' | 'design' | 'cta'>('content');
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [showVault, setShowVault] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [searchCtaQuery, setSearchCtaQuery] = useState('');
  const [dbTableMissing, setDbTableMissing] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const syncCustomPages = async (updatedPages: any[]) => {
    const { data, error: selectError } = await supabase
      .from('storefront_config')
      .select('id')
      .eq('id', 'custom_pages')
      .maybeSingle();
    if (selectError) throw selectError;
    let res;
    if (data) {
      res = await supabase
        .from('storefront_config')
        .update({ config: updatedPages, updated_at: new Date().toISOString() })
        .eq('id', 'custom_pages');
    } else {
      res = await supabase
        .from('storefront_config')
        .insert({ id: 'custom_pages', config: updatedPages, updated_at: new Date().toISOString() });
    }
    if (res.error) throw res.error;
  };

  const syncSalesCampaigns = async (updatedCampaigns: any[]) => {
    const { data, error: selectError } = await supabase
      .from('storefront_config')
      .select('id')
      .eq('id', 'sales_campaigns')
      .maybeSingle();
    if (selectError) throw selectError;
    let res;
    if (data) {
      res = await supabase
        .from('storefront_config')
        .update({ config: updatedCampaigns, updated_at: new Date().toISOString() })
        .eq('id', 'sales_campaigns');
    } else {
      res = await supabase
        .from('storefront_config')
        .insert({ id: 'sales_campaigns', config: updatedCampaigns, updated_at: new Date().toISOString() });
    }
    if (res.error) throw res.error;
  };

  const resetCustomPageForm = () => {
    setEditingPageId(null);
    setNewPageTitle('');
    setNewPageSlug('');
    setNewPageBannerTitle('');
    setNewPageBannerDesc('');
    setNewPageBgColor('#121212');
    setNewPageBannerImage('');
    setNewPageSelectedProducts([]);
    setNewPageBannerStyle('minimal');
    setNewPageBannerTitleFont('Playfair Display');
    setNewPageBannerTitleColor('#ffffff');
    setNewPageBannerSubtitleFont('Outfit');
    setNewPageBannerSubtitleColor('#facc15');
    setNewPageBannerHideText(false);
    setNewPageBannerDescColor('#cccccc');
    setNewPageCtaText('');
    setNewPageCtaUrl('');
    setNewPageCtaColor('#ffffff');
    setNewPageStartDate('');
    setNewPageEndDate('');
    setNewPageSeoTitle('');
    setNewPageSeoDescription('');
    setNewPageUseDynamicTheme(true);
  };

  const handleCustomPageBannerUpload = async (file: File) => {
    setUploadingCustomPageBanner(true);
    try {
      const url = await uploadImage(file);
      setNewPageBannerImage(url);
      showToast("Banner image uploaded successfully");
    } catch (err: any) {
      showToast("Upload failed: " + err.message, "error");
    } finally {
      setUploadingCustomPageBanner(false);
    }
  };

  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [activeTab, cmsSubTab]);

  const [cmsPageConfig, setCmsPageConfig] = useState<any>(() => {
    const saved = localStorage.getItem('aura_cms_homepage');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading saved layout configs in AdminDashboard:", e);
      }
    }
    return {
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
          id: "block_news_01",
          block_type: "NewsletterSubscribe",
          order: 6,
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
  });
  const [selectedBlockId, setSelectedBlockId] = useState<string>("block_hero_01");
  let renderEditMenuRef = (): React.ReactNode => null;
  const [fullscreenSidebarWidth, setFullscreenSidebarWidth] = useState<number>(420);
  const [showFullscreenSidebar, setShowFullscreenSidebar] = useState<boolean>(true);

  // Navigation state
  const [navMenus, setNavMenus] = useState<any>({
    header: [
      { id: "nav_1", label: "New Arrivals", url: "/shop/new", badge: "New" },
      { id: "nav_2", label: "View All", url: "/shop/all", badge: "" },
      { id: "nav_3", label: "Our Story", url: "/story", badge: "" }
    ],
    footer: [
      { id: "foot_1", label: "FAQ", url: "/faq" },
      { id: "foot_2", label: "Shipping & Returns", url: "/shipping" },
      { id: "foot_3", label: "Size Guide", url: "/size-guide" }
    ]
  });

  // Media state
  const [mediaFiles, setMediaFiles] = useState<any[]>([
    { id: "med_1", name: "hero-desktop.webp", url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600", tag: "banner", size: "240 KB", type: "image/webp" },
    { id: "med_2", name: "minimalist-jacket.webp", url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=600", tag: "product", size: "180 KB", type: "image/webp" },
    { id: "med_3", name: "silver-watch.webp", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600", tag: "product", size: "125 KB", type: "image/webp" }
  ]);
  const [mediaSearch, setMediaSearch] = useState("");
  const [webpQuality, setWebpQuality] = useState(80);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  // Marketing sub-tab
  const [marketingSubTab, setMarketingSubTab] = useState<'promotions' | 'flash_sale' | 'workflows'>('promotions');
  const [promotionsList, setPromotionsList] = useState<any[]>([
    { id: "promo_1", code: "STUDIO26", type: "Percentage", value: 20, limit: 100, singleUse: true, minThreshold: 150, status: "Active" },
    { id: "promo_2", code: "FREESHIP", type: "Free Shipping", value: 0, limit: 500, singleUse: false, minThreshold: 50, status: "Active" }
  ]);
  const [newPromoForm, setNewPromoForm] = useState({
    code: "", type: "Percentage", value: 0, limit: 100, singleUse: false, minThreshold: 0
  });


  // Automation triggers
  const [automationRules, setAutomationRules] = useState<any[]>([
    { id: "auto_1", event: "cart_abandoned", action: "Send Coupon", payload: '{"discount_code": "RETRIEVED10"}', webhook: "https://api.marketing.aura/v1/abandoned-cart" },
    { id: "auto_2", event: "user_signup", action: "Trigger Welcome Series", payload: '{"campaign_id": "welcome_2026"}', webhook: "https://api.marketing.aura/v1/signup" }
  ]);
  const [newAutomation, setNewAutomation] = useState({
    event: "cart_abandoned", action: "Webhook Delivery", payload: '{"message": "Action payload"}', webhook: ""
  });

  // WYSIWYG / Static pages manager state
  const [selectedStaticTab, setSelectedStaticTab] = useState<'content' | 'seo' | 'analyzer'>('content');
  const [socialPreviewTab, setSocialPreviewTab] = useState<'google' | 'facebook' | 'twitter'>('google');
  const [staticPages, setStaticPages] = useState<any[]>([
    {
      id: "page_faq",
      title: "Frequently Asked Questions",
      slug: "faq",
      content: "<h2>Shipping & Delivery</h2><p>Standard shipping takes 3-5 business days.</p>",
      meta_title: "FAQ - Shipping, Returns, and Orders | Aura Studio",
      meta_description: "Find answers to frequently asked questions about our luxury fashion products, insured global delivery, return policies, and secure checkout processes.",
      focus_keywords: "faq, shipping, returns, order tracking",
      indexing: "index, follow",
      schema_markup: '{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": []\n}'
    },
    {
      id: "page_terms",
      title: "Terms of Service",
      slug: "terms",
      content: "<h2>Terms & Conditions</h2><p>Please review our policy guidelines before placing orders.</p>",
      meta_title: "Terms of Service & Usage Agreement | Aura Studio",
      meta_description: "Read the terms of service, membership rules, and purchasing agreement guidelines for shopping online at Aura Studio luxury ecommerce portal.",
      focus_keywords: "terms, conditions, agreement, legal",
      indexing: "index, follow",
      schema_markup: '{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "Terms of Service"\n}'
    }
  ]);
  const [selectedStaticPageId, setSelectedStaticPageId] = useState<string>("page_faq");

  const handleCreateStaticPage = () => {
    const newId = `page_${Date.now()}`;
    const newPage = {
      id: newId,
      title: "New Custom Page",
      slug: `custom-page-${Date.now().toString().slice(-4)}`,
      content: "<h2>New Custom Page</h2><p>Start writing rich content here...</p>",
      meta_title: "New Custom Page | Aura Studio",
      meta_description: "Add a high quality description to improve your page rank on search engine results.",
      focus_keywords: "custom, page",
      indexing: "index, follow",
      schema_markup: '{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "New Custom Page"\n}'
    };
    setStaticPages([...staticPages, newPage]);
    setSelectedStaticPageId(newId);
    showToast("New static page created!");
  };

  const handleDeleteStaticPage = (id: string) => {
    if (staticPages.length <= 1) {
      showToast("Cannot delete the last remaining page.");
      return;
    }
    const updated = staticPages.filter(p => p.id !== id);
    setStaticPages(updated);
    setSelectedStaticPageId(updated[0].id);
    showToast("Page deleted successfully.");
  };

  // Global SEO files configuration states
  const [robotsTxt, setRobotsTxt] = useState<string>(
    "User-agent: *\nAllow: /\nDisallow: /checkout\nDisallow: /account\n\nSitemap: https://aura.studio/sitemap.xml"
  );
  const [newSitemapUrl, setNewSitemapUrl] = useState<string>("");
  const [customSitemapUrls, setCustomSitemapUrls] = useState<string[]>([
    "https://aura.studio/",
    "https://aura.studio/shop",
    "https://aura.studio/about",
    "https://aura.studio/faq",
    "https://aura.studio/terms"
  ]);

  // Search, Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');

  // Product Filter, Search & Sort States
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productSubcategoryFilter, setProductSubcategoryFilter] = useState('all');
  const [productStockFilter, setProductStockFilter] = useState('all');
  const [productSort, setProductSort] = useState('name-asc');

  // Selected Order for Detail Drawer
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Product Form State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showSubcatModal, setShowSubcatModal] = useState(false);
  const [subcategories, setSubcategories] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('aura_subcategories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      shirts: ['casual-shirts', 'formal-shirts', 'linen-shirts'],
      't-shirts': ['crew-neck', 'v-neck', 'oversized'],
      polo: ['classic-polo', 'knit-polo'],
      jeans: ['slim-fit', 'relaxed-fit', 'straight-leg'],
      trousers: ['chinos', 'dress-trousers', 'linen-trousers'],
      linen: ['linen-shirts', 'linen-trousers'],
      'cargo-pants': ['utility-cargo', 'slim-cargo'],
      joggers: ['athletic-joggers', 'lounge-joggers'],
      shorts: ['denim-shorts', 'tailored-shorts'],
      overshirts: ['canvas-overshirts', 'wool-overshirts'],
      footwear: ['sneakers', 'loafers', 'boots']
    };
  });

  const [selectedSubcatMainCat, setSelectedSubcatMainCat] = useState('shirts');
  const [newSubcatName, setNewSubcatName] = useState('');

  const handleAddSubcategoryFromModal = () => {
    if (!newSubcatName.trim()) return;
    const slug = newSubcatName.toLowerCase().trim().replace(/\s+/g, '-');
    const currentList = subcategories[selectedSubcatMainCat] || [];
    if (!currentList.includes(slug)) {
      const updated = {
        ...subcategories,
        [selectedSubcatMainCat]: [...currentList, slug]
      };
      setSubcategories(updated);
      localStorage.setItem('aura_subcategories', JSON.stringify(updated));
      showToast('Subcategory created successfully!');
    } else {
      showToast('Subcategory already exists!', 'error');
    }
    setNewSubcatName('');
  };

  const [productForm, setProductForm] = useState({
    name: '', price: 0, category: 'shirts', subcategory: '', is_new: false, image: '', description: '',
    stock: 100, sku: '', tags: '', currency: 'INR'
  });
  const [selectedSizes, setSelectedSizes] = useState<Record<string, { enabled: boolean; priceAdjust: number }>>({
    // Clothing
    XS: { enabled: false, priceAdjust: 0 },
    S: { enabled: true, priceAdjust: 0 },
    M: { enabled: true, priceAdjust: 0 },
    L: { enabled: true, priceAdjust: 0 },
    XL: { enabled: false, priceAdjust: 0 },
    XXL: { enabled: false, priceAdjust: 0 },
    // Footwear
    '6': { enabled: false, priceAdjust: 0 },
    '7': { enabled: true, priceAdjust: 0 },
    '8': { enabled: true, priceAdjust: 0 },
    '9': { enabled: true, priceAdjust: 0 },
    '10': { enabled: true, priceAdjust: 0 },
    '11': { enabled: false, priceAdjust: 0 },
    '12': { enabled: false, priceAdjust: 0 },
    // Accessories
    'One Size': { enabled: true, priceAdjust: 0 }
  });
  const [activeFormTab, setActiveFormTab] = useState<'info' | 'pricing' | 'media'>('info');
  const [savingProduct, setSavingProduct] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [newAdditionalImageUrl, setNewAdditionalImageUrl] = useState<string>('');

  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (import.meta.env.DEV && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        setIsAdmin(true);
        fetchOrders();
        setCheckingRole(false);
        return;
      }

      if (!user) {
        setCheckingRole(false);
        setIsAdmin(false);
        return;
      }

      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();

      if (data && data.role === 'admin') {
        setIsAdmin(true);
        fetchOrders();
        // Automatically delete any legacy women products from Supabase
        supabase.from('products').delete().eq('category', 'women').then(() => {
          refreshProducts();
        });
      } else {
        setIsAdmin(false);
      }
      setCheckingRole(false);
    };

    checkAdmin();
  }, [user]);

  useEffect(() => {
    const loadCmsConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('storefront_config')
          .select('config')
          .eq('id', 'homepage_global')
          .maybeSingle();

        if (error) {
          if (error.code === 'PGRST205') {
            setDbTableMissing(true);
          }
          throw error;
        }

        if (data && data.config) {
          setCmsPageConfig(data.config);
          localStorage.setItem('aura_cms_homepage', JSON.stringify(data.config));
        }

        // Load grid settings
        const { data: gridData } = await supabase
          .from('storefront_config')
          .select('config')
          .eq('id', 'shop_grid_settings')
          .maybeSingle();
        if (gridData && gridData.config) {
          setGridColumns(gridData.config);
          localStorage.setItem('aura_shop_grid_columns', JSON.stringify(gridData.config));
        }

        // Load custom pages
        const { data: pagesData } = await supabase
          .from('storefront_config')
          .select('config')
          .eq('id', 'custom_pages')
          .maybeSingle();
        if (pagesData && pagesData.config) {
          setCustomPages(pagesData.config);
          localStorage.setItem('aura_custom_pages', JSON.stringify(pagesData.config));
        }

        // Load sales campaigns
        const { data: campaignsData } = await supabase
          .from('storefront_config')
          .select('config')
          .eq('id', 'sales_campaigns')
          .maybeSingle();
        if (campaignsData && campaignsData.config) {
          setSalesCampaigns(campaignsData.config);
          localStorage.setItem('aura_sales_campaigns', JSON.stringify(campaignsData.config));
        }
      } catch (err) {
        console.error("Failed to load storefront config from database:", err);
      }
    };

    if (isAdmin) {
      loadCmsConfig();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!cmsPageConfig) return;

    // Save to local storage immediately
    localStorage.setItem('aura_cms_homepage', JSON.stringify(cmsPageConfig));

    if (dbTableMissing) return;

    // Debounce database sync to 1.5s to prevent API spamming during drags
    const handler = setTimeout(async () => {
      try {
        const { data, error: checkError } = await supabase
          .from('storefront_config')
          .select('id')
          .eq('id', 'homepage_global')
          .maybeSingle();

        if (checkError) {
          if (checkError.code === 'PGRST205') {
            setDbTableMissing(true);
          }
          return;
        }

        if (data) {
          await supabase
            .from('storefront_config')
            .update({ config: cmsPageConfig, updated_at: new Date().toISOString() })
            .eq('id', 'homepage_global');
        } else {
          await supabase
            .from('storefront_config')
            .insert({ id: 'homepage_global', config: cmsPageConfig, updated_at: new Date().toISOString() });
        }
      } catch (err) {
        console.error("Auto-syncing config to database failed:", err);
      }
    }, 1500);

    return () => clearTimeout(handler);
  }, [cmsPageConfig, dbTableMissing]);

  const publishStorefrontConfig = async () => {
    setPublishing(true);
    try {
      const { data, error: selectError } = await supabase
        .from('storefront_config')
        .select('id')
        .eq('id', 'homepage_global')
        .maybeSingle();

      if (selectError && selectError.code === 'PGRST205') {
        setDbTableMissing(true);
        throw new Error("The storefront_config table does not exist in your database yet.");
      }

      let error = null;
      if (data) {
        const { error: updateError } = await supabase
          .from('storefront_config')
          .update({
            config: cmsPageConfig,
            updated_at: new Date().toISOString()
          })
          .eq('id', 'homepage_global');
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('storefront_config')
          .insert({
            id: 'homepage_global',
            config: cmsPageConfig,
            updated_at: new Date().toISOString()
          });
        error = insertError;
      }

      if (error) throw error;
      showToast("Storefront changes published to live website successfully!", "success");
    } catch (err: any) {
      console.error("Error publishing storefront configurations:", err);
      showToast(err.message || "Failed to publish storefront configuration.", "error");
      if (err.code === '42501' || (err.message && err.message.includes('row-level security'))) {
        setShowRlsInstructionModal(true);
      }
    } finally {
      setPublishing(false);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (ordersData) {
        setOrders(ordersData);

        // Fetch profiles associated with these orders
        const userIds = Array.from(new Set(ordersData.map((o: any) => o.user_id)));
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);

          if (profilesData) {
            const profileMap: Record<string, any> = {};
            profilesData.forEach((p: any) => {
              profileMap[p.id] = p;
            });
            setProfiles(profileMap);
          }
        }

        // Fetch order items to display items list in detail drawer
        const orderIds = ordersData.map((o: any) => o.id);
        if (orderIds.length > 0) {
          const { data: itemsData } = await supabase
            .from('order_items')
            .select('*')
            .in('order_id', orderIds);
          if (itemsData) {
            setOrderItems(itemsData);
          }
        }
      }
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      showToast("Failed to load orders: " + error.message, "error");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      }
      showToast(`Order status updated to ${newStatus}`);
    } catch (err: any) {
      showToast(`Failed to update status: ${err.message}`, "error");
    }
  };

  // Product list filter stats and calculation
  const totalUniqueProducts = products.length;
  const lowStockCount = products.filter(p => (p.stock ?? 100) < 10 && (p.stock ?? 100) > 0).length;
  const outOfStockCount = products.filter(p => (p.stock ?? 100) === 0).length;
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * (p.stock ?? 100)), 0);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Search filter (Name or SKU)
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase().trim();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    // 2. Category filter
    if (productCategoryFilter !== 'all') {
      result = result.filter(p => p.category === productCategoryFilter);
      if (productSubcategoryFilter !== 'all') {
        result = result.filter(p => {
          const subcatObj = Array.isArray(p.variants) ? p.variants.find((v: any) => v.is_subcategory) : null;
          return subcatObj?.subcategory === productSubcategoryFilter;
        });
      }
    }

    // 3. Stock level filter
    if (productStockFilter === 'low') {
      result = result.filter(p => (p.stock ?? 100) < 10 && (p.stock ?? 100) > 0);
    } else if (productStockFilter === 'out') {
      result = result.filter(p => (p.stock ?? 100) === 0);
    } else if (productStockFilter === 'instock') {
      result = result.filter(p => (p.stock ?? 100) >= 10);
    }

    // 4. Sorting logic
    result.sort((a, b) => {
      switch (productSort) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'stock-asc':
          return (a.stock ?? 100) - (b.stock ?? 100);
        case 'stock-desc':
          return (b.stock ?? 100) - (a.stock ?? 100);
        default:
          return 0;
      }
    });

    return result;
  }, [products, productSearch, productCategoryFilter, productSubcategoryFilter, productStockFilter, productSort]);

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError(error.message);
    }
    setLoggingIn(false);
  };

  if (checkingRole) {
    return <div className="section container text-center" style={{ paddingTop: '120px', minHeight: '80vh' }}>Verifying credentials...</div>;
  }

  if (!user) {
    return (
      <div className="section" style={{ paddingTop: '120px', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="container" style={{ maxWidth: '400px' }}>
          <h1 className="text-center mb-8" style={{ fontSize: '2rem' }}>Admin Secure Login</h1>
          {loginError && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{loginError}</div>}
          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="email" placeholder="Admin Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '1rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent' }} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '1rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent' }} />
            <button type="submit" className="btn btn-primary" disabled={loggingIn}>{loggingIn ? 'Authenticating...' : 'Secure Login'}</button>
          </form>
        </div>
      </div>
    );
  }

  if (user && !isAdmin) {
    return (
      <div className="section container text-center" style={{ paddingTop: '120px', minHeight: '80vh' }}>
        <h2 style={{ color: 'var(--color-accent)' }}>Access Denied</h2>
        <p className="mt-4 mb-8">You do not have administrator privileges to view this dashboard.</p>
        <button onClick={() => signOut()} className="btn btn-outline">Sign Out & Switch Account</button>
      </div>
    );
  }

  const handleImageFileChange = (file: File | null) => {
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw new Error('Image upload failed: ' + uploadError.message);

    const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const generateSKU = () => {
    const prefix = (productForm.category || 'GEN').slice(0, 3).toUpperCase();
    const cleanName = (productForm.name || 'PROD')
      .slice(0, 3)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, 'X');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const sku = `AU-${prefix}-${cleanName}-${randomSuffix}`;
    setProductForm(prev => ({ ...prev, sku }));
    showToast("SKU auto-generated!");
  };

  const handleOpenModal = (product: any = null) => {
    setImageFile(null);
    setImagePreview(null);
    setImageMode('upload');
    setActiveFormTab('info');
    if (product) {
      setEditingProduct(product);
      const subcatObj = Array.isArray(product.variants) ? product.variants.find((v: any) => v.is_subcategory) : null;
      setProductForm({
        name: product.name, price: product.price, category: product.category, subcategory: subcatObj?.subcategory || '', is_new: product.is_new,
        image: product.image, description: product.description,
        stock: product.stock ?? 100, sku: product.sku || '', tags: (product.tags || []).join(', '),
        currency: product.variants?.[0]?.currency || 'INR'
      });
      setImagePreview(product.image);
      const restored: Record<string, { enabled: boolean; priceAdjust: number }> = {};
      ALL_SIZES.forEach(s => { restored[s] = { enabled: false, priceAdjust: 0 }; });
      if (Array.isArray(product.variants)) {
        product.variants.forEach((v: any) => {
          if (v.size && restored[v.size] !== undefined) {
            restored[v.size] = { enabled: true, priceAdjust: v.priceAdjust || 0 };
          }
        });
      }
      setSelectedSizes(restored);

      const imagesObj = Array.isArray(product.variants) ? product.variants.find((v: any) => v.is_images) : null;
      setAdditionalImages(imagesObj?.urls || []);
      setNewAdditionalImageUrl('');
    } else {
      setEditingProduct(null);
      setProductForm({ name: '', price: 0, category: 'shirts', subcategory: '', is_new: false, image: '', description: '', stock: 100, sku: '', tags: '', currency: 'INR' });
      const restored: Record<string, { enabled: boolean; priceAdjust: number }> = {};
      ALL_SIZES.forEach(s => { restored[s] = { enabled: false, priceAdjust: 0 }; });
      restored['S'] = { enabled: true, priceAdjust: 0 };
      restored['M'] = { enabled: true, priceAdjust: 0 };
      restored['L'] = { enabled: true, priceAdjust: 0 };
      restored['7'] = { enabled: true, priceAdjust: 0 };
      restored['8'] = { enabled: true, priceAdjust: 0 };
      restored['9'] = { enabled: true, priceAdjust: 0 };
      restored['One Size'] = { enabled: true, priceAdjust: 0 };
      setSelectedSizes(restored);
      setAdditionalImages([]);
      setNewAdditionalImageUrl('');
    }
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      // 1. General validations
      if (!productForm.name.trim()) {
        showToast('Product Name is required.', 'error');
        setActiveFormTab('info');
        setSavingProduct(false);
        return;
      }
      if (!productForm.description.trim()) {
        showToast('Product Description is required.', 'error');
        setActiveFormTab('info');
        setSavingProduct(false);
        return;
      }
      if (productForm.price <= 0) {
        showToast('Base Price must be greater than 0.', 'error');
        setActiveFormTab('pricing');
        setSavingProduct(false);
        return;
      }
      if (productForm.stock < 0) {
        showToast('Stock Level cannot be negative.', 'error');
        setActiveFormTab('pricing');
        setSavingProduct(false);
        return;
      }

      let finalImageUrl = productForm.image;

      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      if (!finalImageUrl) {
        showToast('Please upload an image or provide an image URL on the Product Media tab.', 'error');
        setActiveFormTab('media');
        setSavingProduct(false);
        return;
      }

      const tagsArray = productForm.tags.split(',').map(t => t.trim()).filter(Boolean);

      const availableSizes = getAvailableSizesForCategory(productForm.category);
      const sizeVariants = availableSizes
        .filter(s => selectedSizes[s]?.enabled)
        .map(s => ({ size: s, priceAdjust: selectedSizes[s]?.priceAdjust || 0, currency: productForm.currency }));

      const subcatVariant = productForm.subcategory ? [{ is_subcategory: true, subcategory: productForm.subcategory }] : [];
      const variantsArray = [
        ...sizeVariants,
        ...subcatVariant,
        { is_images: true, urls: additionalImages }
      ];

      const payload = {
        name: productForm.name,
        price: Number(productForm.price),
        category: productForm.category,
        is_new: productForm.is_new,
        image: finalImageUrl,
        description: productForm.description,
        stock: Number(productForm.stock),
        sku: productForm.sku,
        tags: tagsArray,
        variants: variantsArray
      };

      if (editingProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
        showToast('Product updated successfully!');
      } else {
        const id = 'p_' + Date.now();
        const { error } = await supabase.from('products').insert({ id, ...payload });
        if (error) throw error;
        showToast('New product added successfully!');
      }

      await refreshProducts();
      setShowProductModal(false);
    } catch (err: any) {
      showToast("Error saving product: " + err.message, 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        showToast("Error deleting product: " + error.message, 'error');
      } else {
        showToast("Product deleted successfully!");
        await refreshProducts();
      }
    }
  };

  // Stats calculation
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const pendingCount = orders.filter(o => o.status === 'Processing').length;
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;



  // Search & Filter execution for Orders
  const filteredOrders = orders.filter((order: any) => {
    const profile = profiles[order.user_id] || {};
    const name = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase();
    const email = (profile.email || '').toLowerCase();
    const id = order.id.toLowerCase();
    const address = (order.shipping_address || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      id.includes(query) ||
      name.includes(query) ||
      email.includes(query) ||
      address.includes(query);

    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  }).sort((a: any, b: any) => {
    if (sortBy === 'Newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'Oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === 'Price: High to Low') return Number(b.total) - Number(a.total);
    if (sortBy === 'Price: Low to High') return Number(a.total) - Number(b.total);
    return 0;
  });

  // ==========================================
  // CMS HELPERS
  // ==========================================
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const blocks = [...cmsPageConfig.blocks];
    if (direction === 'up' && index > 0) {
      const temp = blocks[index];
      blocks[index] = blocks[index - 1];
      blocks[index - 1] = temp;
    } else if (direction === 'down' && index < blocks.length - 1) {
      const temp = blocks[index];
      blocks[index] = blocks[index + 1];
      blocks[index + 1] = temp;
    }
    const updated = blocks.map((b, i) => ({ ...b, order: i + 1 }));
    setCmsPageConfig({ ...cmsPageConfig, blocks: updated });
    showToast("Block order updated");
  };

  const handleUpdateBlockData = (blockId: string, field: string, value: any) => {
    setCmsPageConfig((prev: any) => {
      const updated = prev.blocks.map((b: any) => {
        if (b.id === blockId) {
          return {
            ...b,
            data: { ...b.data, [field]: value }
          };
        }
        return b;
      });
      return { ...prev, blocks: updated };
    });
  };


  const handleDeleteBlock = (blockId: string) => {
    if (window.confirm("Delete this layout block?")) {
      setCmsPageConfig((prev: any) => {
        const filtered = prev.blocks.filter((b: any) => b.id !== blockId);
        const reordered = filtered.map((b: any, i: number) => ({ ...b, order: i + 1 }));
        if (selectedBlockId === blockId && reordered.length > 0) {
          setSelectedBlockId(reordered[0].id);
        }
        return { ...prev, blocks: reordered };
      });
      showToast("Block deleted successfully");
    }
  };

  const handleUpdateBlockLayout = (blockId: string, field: string, value: any) => {
    setCmsPageConfig((prev: any) => {
      const updated = prev.blocks.map((b: any) => {
        if (b.id === blockId) {
          const layout = b.layout_configuration || {};
          return {
            ...b,
            layout_configuration: { ...layout, [field]: value }
          };
        }
        return b;
      });
      return { ...prev, blocks: updated };
    });
  };

  const handleUpdateBlockAnimation = (blockId: string, field: string, value: any) => {
    setCmsPageConfig((prev: any) => {
      const updated = prev.blocks.map((b: any) => {
        if (b.id === blockId) {
          const animation = b.animation_orchestrator || {};
          return {
            ...b,
            animation_orchestrator: { ...animation, [field]: value }
          };
        }
        return b;
      });
      return { ...prev, blocks: updated };
    });
  };

  const handleUpdateBlockDesign = (blockId: string, field: string, value: any) => {
    setCmsPageConfig((prev: any) => {
      const updated = prev.blocks.map((b: any) => {
        if (b.id === blockId) {
          const design = b.design_system_sync || {};
          return {
            ...b,
            design_system_sync: { ...design, [field]: value }
          };
        }
        return b;
      });
      return { ...prev, blocks: updated };
    });
  };

  const handleContentImageUpload = async (blockId: string, fieldName: string, file: File, index?: number) => {
    setUploadingField(index !== undefined ? `${fieldName}_${index}` : fieldName);
    try {
      const url = await uploadImage(file);
      const updated = cmsPageConfig.blocks.map((b: any) => {
        if (b.id === blockId) {
          if (index !== undefined) {
            const arr = b.data[fieldName] ? [...b.data[fieldName]] : [];
            const currentItem = typeof arr[index] === 'string' ? { name: arr[index], image: '', image_url: '' } : arr[index];
            if ((b.block_type === 'HeroSlider' || b.block_type === 'MultiHeroCarousel') && fieldName === 'slides') {
              arr[index] = { ...currentItem, image_url: url };
            } else {
              arr[index] = { ...currentItem, image: url };
            }
            return {
              ...b,
              data: { ...b.data, [fieldName]: arr }
            };
          } else {
            return {
              ...b,
              data: { ...b.data, [fieldName]: url }
            };
          }
        }
        return b;
      });
      setCmsPageConfig({ ...cmsPageConfig, blocks: updated });
      showToast("Image uploaded successfully");
    } catch (err: any) {
      showToast("Upload failed: " + err.message, "error");
    } finally {
      setUploadingField(null);
    }
  };

  const handleDuplicateBlock = (blockId: string) => {
    const idx = cmsPageConfig.blocks.findIndex((b: any) => b.id === blockId);
    if (idx === -1) return;
    const blockToCopy = cmsPageConfig.blocks[idx];
    const newBlock = {
      ...JSON.parse(JSON.stringify(blockToCopy)),
      id: `node_copy_${Math.random().toString(36).substr(2, 9)}`,
      order: blockToCopy.order + 1
    };
    const updatedBlocks = [...cmsPageConfig.blocks];
    updatedBlocks.splice(idx + 1, 0, newBlock);
    const ordered = updatedBlocks.map((b: any, index: number) => ({ ...b, order: index + 1 }));
    setCmsPageConfig({ ...cmsPageConfig, blocks: ordered });
    setSelectedBlockId(newBlock.id);
    showToast("Block duplicated");
  };

  const handleToggleGlobalBlock = (blockId: string) => {
    const updated = cmsPageConfig.blocks.map((b: any) => {
      if (b.id === blockId) {
        const isGlobal = !b.is_global;
        showToast(isGlobal ? "Component saved as global instance" : "Component is now a local instance");
        return { ...b, is_global: isGlobal };
      }
      return b;
    });
    setCmsPageConfig({ ...cmsPageConfig, blocks: updated });
  };

  const handleAddBlockFromVault = (type: string, semanticTag: string) => {
    const newId = `block_${type.toLowerCase()}_${Date.now()}`;
    let defaultData = {};
    if (type === 'HeroBanner') {
      defaultData = {
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
      };
    } else if (type === 'PromotionalSlider') {
      defaultData = {
        variant: "flash_sale_countdown",
        background_color: "#0c0a09",
        countdown_target_timestamp: "2026-06-25T23:59:59Z",
        slides: [{ text: "Mid-Season Preview: Code 'AURA10' for private 10% off.", link_url: "/shop/new" }]
      };
    } else if (type === 'CategoryGrid') {
      defaultData = {
        title: "Curated Categories",
        categories: [
          { name: "Shirts", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=300" },
          { name: "T-Shirts", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=300" },
          { name: "POLO", image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=300" },
          { name: "Jeans", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=300" }
        ]
      };
    } else if (type === 'FeaturedProducts') {
      defaultData = {
        title: "Weekly Curations",
        cta_text: "Shop Curations",
        cta_url: "/shop/all",
        limit: 4
      };
    } else if (type === 'BrandStory') {
      defaultData = {
        subtitle: "OUR ESSENCE",
        title: "THE ART OF SIMPLICITY",
        description: "We believe in architectural silhouettes, pure fabrics, and a curated color palette that brings calm to the wardrobe.",
        quote: "Simplicity is not the lack of clutter, but the presence of clarity.",
        image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600"
      };
    } else if (type === 'EditorialGallery') {
      defaultData = {
        title: "SEASONAL CAPTURES",
        subtitle: "FALL LOOKBOOK HIGHLIGHTS",
        image1: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=600",
        image2: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600",
        image3: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=600"
      };
    } else if (type === 'NewsletterSubscribe') {
      defaultData = {
        title: "JOIN THE DIALOGUE",
        subtitle: "Receive seasonal lookbooks, private previews, and stories about craft directly to your inbox.",
        button_text: "SUBSCRIBE",
        placeholder_text: "ENTER YOUR EMAIL ADDRESS"
      };
    } else if (type === 'Spacer') {
      defaultData = {
        height: 60
      };
    } else if (type === 'LuxuryFaq') {
      defaultData = {
        title: "Frequently Asked Questions",
        subtitle: "Customer Service & Polices",
        faqs: [
          { question: "What is your return policy?", answer: "We offer complimentary pickup and returns within 14 days of receipt for all unworn garments in their original packaging." },
          { question: "Do you ship internationally?", answer: "Yes, we ship to over 80 countries worldwide via tracked express courier, with import duties calculated at checkout." },
          { question: "Can I request custom tailoring?", answer: "Select outerwear pieces can be customized at our flagship design studio. Please contact concierge support to schedule a sizing appointment." }
        ]
      };
    } else if (type === 'ReviewTestimonials') {
      defaultData = {
        title: "Client Impressions",
        subtitle: "Voices of Aura Community",
        reviews: [
          { client_name: "Eleanor Vance", rating: 5, quote: "The architectural drape of the wool coat is unmatched. Truly heirloom quality.", client_avatar: "EV" },
          { client_name: "Julian Brooks", rating: 5, quote: "Understated elegance, beautiful weight, and flawless minimalist finishing.", client_avatar: "JB" }
        ]
      };
    } else if (type === 'LogoCloud') {
      defaultData = {
        title: "AS FEATURED IN",
        logos: [
          { name: "VOGUE", image_url: "" },
          { name: "GQ", image_url: "" },
          { name: "VANITY FAIR", image_url: "" },
          { name: "WALLPAPER*", image_url: "" },
          { name: "SENSE", image_url: "" }
        ]
      };
    } else if (type === 'HeroGrid') {
      defaultData = {
        title: "AURA / MODERN MOSAIC",
        subtitle: "PREMIUM LOOKBOOK CAPTURES",
        description: "An interactive composition of structural forms and natural textures, highlighting the season's tactile landscape.",
        image_left: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800",
        image_right_top: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600",
        image_right_bottom: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=600",
        cta_text: "DISCOVER CAMPAIGN",
        cta_url: "/shop/all"
      };
    } else if (type === 'HeroSlider') {
      defaultData = {
        autoplay_speed: 4000,
        autoplay_enabled: true,
        slides: [
          {
            image_url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1200",
            title: "SUMMER SHIRTS",
            subtitle: "STARTING AT ₹899",
            cta_text: "SHOP NOW",
            cta_url: "/shop/shirts"
          },
          {
            image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=1200",
            title: "MUST-HAVE DENIMS",
            subtitle: "BAGGY | RELAXED | STRAIGHT",
            cta_text: "EXPLORE DENIM",
            cta_url: "/shop/jeans"
          },
          {
            image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200",
            title: "FLAT 40% OFF",
            subtitle: "18TH TO 25TH MAY",
            cta_text: "SHOP SALE",
            cta_url: "/shop/all"
          }
        ]
      };
    } else if (type === 'MultiHeroCarousel') {
      defaultData = {
        autoplay_speed: 4000,
        autoplay_enabled: true,
        slide_gap: 20,
        slides: [
          {
            image_url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600",
            title: "LINEN EDIT",
            subtitle: "THAT MAKE AN IMPRESSION",
            badge: "NEWLY LAUNCHED",
            cta_text: "FLAT 50% OFF",
            cta_url: "/shop/linen",
            show_cta: true
          },
          {
            image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600",
            title: "PERFUMES",
            subtitle: "SCENTS OF MINIMALIST LUXURY",
            badge: "EXCLUSIVE",
            cta_text: "NOW LIVE",
            cta_url: "/shop/perfumes",
            show_cta: true
          },
          {
            image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600",
            title: "ARCHITECTURAL KNITS",
            subtitle: "STRUCTURED COMFORT",
            badge: "SEASONAL PREVIEW",
            cta_text: "EXPLORE NOW",
            cta_url: "/shop/all",
            show_cta: true
          }
        ]
      };
    }

    const newBlock = {
      id: newId,
      block_type: type,
      order: cmsPageConfig.blocks.length + 1,
      status: "published",
      semantic_tag: semanticTag,
      scheduling: { start_date: "", end_date: "" },
      layout_configuration: {
        padding: {
          fluid_clamp: "py-[clamp(3rem,6vw,8rem)] px-[clamp(1rem,4vw,3rem)]",
          preset: "medium",
          horizontal_preset: "editorial",
          horizontal_fluid_clamp: "px-[clamp(2rem,6vw,5rem)]"
        },
        grid_setup: { columns_mobile: 1, columns_tablet: 2, columns_desktop: 4, gap: "gap-8" },
        aspect_ratio: "portrait",
        object_fit: "cover",
        manual_height: "",
        manual_width: ""
      },
      animation_orchestrator: {
        entry_trigger: "scroll_view",
        viewport_options: { once: true, amount_visible_threshold: 0.15 },
        preset: "reveal_up",
        curves: { type: "cubic_bezier", value: [0.16, 1, 0.3, 1], duration_ms: 750 },
        stagger_children_ms: 50,
        hover_preset: "scale_and_shift",
        tactile_button_feedback: false
      },
      design_system_sync: {
        typography_scale: { title: "H2", body: "Body" },
        glassmorphic: false,
        color_profile: { bg: "Studio Background", text: "Neutral Slate" }
      },
      data: defaultData
    };

    setCmsPageConfig({
      ...cmsPageConfig,
      blocks: [...cmsPageConfig.blocks, newBlock]
    });
    setSelectedBlockId(newId);
    setShowVault(false);
    showToast(`Added ${type} preset enclosed in <${semanticTag}> tag`);
  };






  const handleSaveCmsConfig = () => {
    // Persist configuration locally to sync with storefront page
    localStorage.setItem('aura_cms_homepage', JSON.stringify(cmsPageConfig));
    showToast("CMS configurations synced to store storefront!");
  };

  // ==========================================
  // MARKETING HELPERS
  // ==========================================
  const handleAddPromo = (e: FormEvent) => {
    e.preventDefault();
    if (!newPromoForm.code) {
      showToast("Coupon code required", "error");
      return;
    }
    const newPromo = {
      id: `promo_${Date.now()}`,
      code: newPromoForm.code.toUpperCase(),
      type: newPromoForm.type,
      value: Number(newPromoForm.value),
      limit: Number(newPromoForm.limit),
      singleUse: newPromoForm.singleUse,
      minThreshold: Number(newPromoForm.minThreshold),
      status: "Active"
    };
    setPromotionsList([newPromo, ...promotionsList]);
    setNewPromoForm({
      code: "", type: "Percentage", value: 0, limit: 100, singleUse: false, minThreshold: 0
    });
    showToast(`Promo ${newPromo.code} created!`);
  };

  const handleDeletePromo = (id: string) => {
    if (window.confirm("Delete this promo code?")) {
      setPromotionsList(promotionsList.filter(p => p.id !== id));
      showToast("Promo deleted");
    }
  };

  const handleTogglePromo = (id: string) => {
    setPromotionsList(promotionsList.map(p => {
      if (p.id === id) {
        return { ...p, status: p.status === 'Active' ? 'Inactive' : 'Active' };
      }
      return p;
    }));
    showToast("Promo status updated");
  };


  const handleAddAutomation = (e: FormEvent) => {
    e.preventDefault();
    if (!newAutomation.webhook) {
      showToast("Webhook endpoint required", "error");
      return;
    }
    try {
      JSON.parse(newAutomation.payload);
    } catch (err) {
      showToast("Invalid JSON payload structure", "error");
      return;
    }
    const item = {
      id: `auto_${Date.now()}`,
      event: newAutomation.event,
      action: "Webhook Delivery",
      payload: newAutomation.payload,
      webhook: newAutomation.webhook
    };
    setAutomationRules([item, ...automationRules]);
    setNewAutomation({
      event: "cart_abandoned", action: "Webhook Delivery", payload: '{"message": "Action payload"}', webhook: ""
    });
    showToast("Automation trigger registered");
  };

  const handleDeleteAutomation = (id: string) => {
    if (window.confirm("Remove this automation trigger?")) {
      setAutomationRules(automationRules.filter(a => a.id !== id));
      showToast("Automation trigger deleted");
    }
  };

  // WYSIWYG Editor Mock Helpers
  const handleSaveStaticPage = (id: string, updatedContent: string) => {
    setStaticPages(staticPages.map(page => {
      if (page.id === id) {
        return { ...page, content: updatedContent };
      }
      return page;
    }));
  };

  const handleUpdateStaticPageField = (id: string, field: string, value: any) => {
    setStaticPages(staticPages.map(page => {
      if (page.id === id) {
        return { ...page, [field]: value };
      }
      return page;
    }));
  };

  // Media Optimization Mock Helpers
  const handleMediaUploadSimulation = (file: File) => {
    const optimizedSize = `${Math.round(file.size * (webpQuality / 100) / 1024)} KB`;
    const newMedia = {
      id: `med_${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, "") + ".webp",
      url: URL.createObjectURL(file),
      tag: "user-upload",
      size: optimizedSize,
      type: "image/webp"
    };
    setMediaFiles([newMedia, ...mediaFiles]);
    showToast(`Uploaded and optimized to WebP (${webpQuality}% Quality)!`);
  };

  const handleDeleteMedia = (id: string) => {
    if (window.confirm("Remove asset from media library?")) {
      setMediaFiles(mediaFiles.filter(m => m.id !== id));
      if (selectedMedia?.id === id) setSelectedMedia(null);
      showToast("Asset deleted");
    }
  };

  // Navigation helpers
  const handleUpdateNavBadge = (menu: 'header' | 'footer', index: number, badge: string) => {
    const updated = { ...navMenus };
    updated[menu][index].badge = badge;
    setNavMenus(updated);
    showToast("Menu badge updated");
  };

  const handleMoveNavItem = (menu: 'header' | 'footer', index: number, direction: 'up' | 'down') => {
    const updated = { ...navMenus };
    const items = [...updated[menu]];
    if (direction === 'up' && index > 0) {
      const temp = items[index];
      items[index] = items[index - 1];
      items[index - 1] = temp;
    } else if (direction === 'down' && index < items.length - 1) {
      const temp = items[index];
      items[index] = items[index + 1];
      items[index + 1] = temp;
    }
    updated[menu] = items;
    setNavMenus(updated);
    showToast("Navigation order updated");
  };

  const handleAddNavItem = (menu: 'header' | 'footer', label: string, url: string) => {
    if (!label || !url) return;
    const updated = { ...navMenus };
    updated[menu] = [...updated[menu], {
      id: `nav_add_${Date.now()}`,
      label,
      url,
      badge: ""
    }];
    setNavMenus(updated);
    showToast("Navigation link added");
  };

  const handleDeleteNavItem = (menu: 'header' | 'footer', id: string) => {
    const updated = { ...navMenus };
    updated[menu] = updated[menu].filter((item: any) => item.id !== id);
    setNavMenus(updated);
    showToast("Navigation link deleted");
  };





  const renderVisualBlocks = () => {
    return (
      <div className="home-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0', pointerEvents: 'auto', width: '100%' }}>
        {cmsPageConfig.blocks.map((block: any) => {
          const isSelected = block.id === selectedBlockId;
          const isScheduled = block.scheduling.start_date || block.scheduling.end_date;

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

          const layConfig = block.layout_configuration || {};
          const aspect = layConfig.aspect_ratio || 'portrait';
          const manualHeight = layConfig.manual_height;
          const manualWidth = layConfig.manual_width;
          const mobCols = layConfig.grid_setup?.columns_mobile || 1;
          const tabCols = layConfig.grid_setup?.columns_tablet || 2;
          const dskCols = layConfig.grid_setup?.columns_desktop || 4;

          const sectionStyle: React.CSSProperties = {
            ...parallaxStyle,
            ...(manualHeight ? { minHeight: `${manualHeight}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center' } : {})
          };

          const containerStyle: React.CSSProperties = {
            ...(manualWidth ? { maxWidth: `${manualWidth}px`, width: '100%', marginLeft: 'auto', marginRight: 'auto' } : {})
          };

          let blockContent = null;

          if (block.block_type === 'HeroBanner') {
            const isSplit = block.data.layout === 'split';
            const desktopPadding = manualHeight
              ? (manualHeight <= 500 ? '2rem 3rem 2rem' : manualHeight <= 650 ? '3rem 4rem 3rem' : '4rem 5rem 4rem')
              : (block.data.sectionWidth === 'narrow' ? '4rem 3rem 3rem' : '8rem 6rem 6rem');

            const fullPadding = manualHeight
              ? (manualHeight <= 500 ? '2rem 2rem' : manualHeight <= 650 ? '4rem 2rem' : '5rem 2rem')
              : '8rem 2rem';

            const heroSectionStyle: React.CSSProperties = {
              ...sectionStyle,
              ...(!isSplit && block.data.desktop_image ? {
                backgroundImage: `url(${block.data.desktop_image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              } : {})
            };

            blockContent = (
              <section className={`cms-hero ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={heroSectionStyle}>
                {!isSplit && block.data.desktop_image && <div className="cms-hero-full-overlay"></div>}
                <div className={widthClass} style={{ ...containerStyle, position: 'relative', zIndex: 2 }}>
                  {isSplit ? (
                    <div className="cms-hero-split" style={{ border: '1px solid var(--color-border)', minHeight: manualHeight ? `${manualHeight}px` : '80vh' }}>
                      <div className="cms-hero-left" style={{
                        '--hero-padding-desktop': desktopPadding
                      } as React.CSSProperties}>
                        {block.data.subtitle && (
                          <span className="cms-hero-subtitle">
                            {block.data.subtitle}
                          </span>
                        )}
                        <h1 className="cms-hero-title">
                          {block.data.title || 'AURA'}
                        </h1>
                        {block.data.description && (
                          <p className="cms-hero-description">
                            {block.data.description}
                          </p>
                        )}
                        <div className="cms-hero-actions" style={{ justifyContent: block.data.textAlign === 'center' ? 'center' : block.data.textAlign === 'right' ? 'flex-end' : 'flex-start' }}>
                          {block.data.cta_text && (
                            <button className="editorial-btn-primary" style={{ border: 'none', cursor: 'pointer' }}>
                              {block.data.cta_text}
                            </button>
                          )}
                          {block.data.secondary_cta_text && (
                            <button className="editorial-btn-secondary" style={{ border: 'none', cursor: 'pointer' }}>
                              {block.data.secondary_cta_text}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="cms-hero-right">
                        {block.data.desktop_image ? (
                          <img
                            src={block.data.desktop_image}
                            alt={block.data.title || 'Campaign'}
                            className="cms-hero-img"
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', backgroundColor: '#e5e5e5', color: '#a1a1aa', fontSize: '0.8rem' }}>No Image Selected</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="cms-hero-full" style={{
                      minHeight: manualHeight ? `${manualHeight}px` : (block.data.sectionPadding === 'compact' ? '50vh' : '85vh'),
                      '--hero-padding-full': fullPadding,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'
                    } as React.CSSProperties}>
                      <div className="cms-hero-full-content" style={{ maxWidth: manualWidth ? `${manualWidth}px` : '800px' }}>
                        {block.data.subtitle && (
                          <span className="cms-hero-subtitle">
                            {block.data.subtitle}
                          </span>
                        )}
                        <h1 className="cms-hero-full-title">
                          {block.data.title || 'AURA'}
                        </h1>
                        {block.data.description && (
                          <p className="cms-hero-full-description">
                            {block.data.description}
                          </p>
                        )}
                        <div className="cms-hero-actions" style={{ justifyContent: 'center' }}>
                          {block.data.cta_text && (
                            <button className="editorial-btn-primary" style={{ border: 'none', cursor: 'pointer' }}>
                              {block.data.cta_text}
                            </button>
                          )}
                          {block.data.secondary_cta_text && (
                            <button className="editorial-btn-secondary" style={{ border: 'none', cursor: 'pointer' }}>
                              {block.data.secondary_cta_text}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          } else if (block.block_type === 'PromotionalSlider') {
            blockContent = (
              <div style={{ backgroundColor: block.data.background_color || '#0c0a09', color: '#fff', padding: '1.25rem 2rem', textAlign: 'center', fontSize: '0.85rem', letterSpacing: '0.08em', fontFamily: '"Outfit", sans-serif', zIndex: 10 }}>
                <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem' }}>
                  <Sparkles size={14} style={{ color: '#c5a880' }} />
                  <span>{block.data.slides?.[0]?.text}</span>
                </div>
              </div>
            );
          } else if (block.block_type === 'CategoryGrid') {
            blockContent = (
              <section className={`cms-cat-section ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
                <div className={`container ${widthClass}`} style={containerStyle}>
                  <h2 className="featured-cat-title">
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
                      return (
                        <div
                          key={cIdx}
                          className={`cms-cat-card aspect-${aspect}`}
                          style={{
                            backgroundImage: catObj.image ? `url(${catObj.image})` : 'none',
                            backgroundColor: catObj.image ? 'transparent' : '#f5f5f4'
                          }}
                        >
                          {catObj.image && <div className="cms-cat-overlay"></div>}
                          <span className="cms-cat-name">
                            {catObj.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          } else if (block.block_type === 'FeaturedProducts') {
            const displayLimit = block.data.limit || 4;
            const displayList = products.slice(0, displayLimit);
            blockContent = (
              <section className={`section new-arrivals ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
                <div className={`container ${widthClass}`} style={containerStyle}>
                  <div className="section-header mb-8" style={{ display: 'flex', flexDirection: 'column', alignItems: block.data.textAlign === 'center' ? 'center' : block.data.textAlign === 'right' ? 'flex-end' : 'flex-start', gap: '0.5rem' }}>
                    <h2 className="section-title" style={{ margin: 0 }}>
                      {block.data.title || 'Curated Classics'}
                    </h2>
                    <span className="view-all-link">
                      {block.data.cta_text || 'View All Collection'}
                    </span>
                  </div>

                  <div
                    className={`product-grid ${gapClass} ${hoverClass}`}
                    style={{
                      '--grid-cols-desktop': dskCols,
                      '--grid-cols-tablet': tabCols,
                      '--grid-cols-mobile': mobCols
                    } as React.CSSProperties}
                  >
                    {displayList.map((product) => (
                      <div key={product.id} className="product-card">
                        <div className={`product-image-wrap aspect-${block.data.aspectRatio || 'portrait'}`} style={{ overflow: 'hidden', backgroundColor: '#f4f4f5', position: 'relative' }}>
                          <img src={product.image} alt={product.name} className="product-image" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {product.is_new && <span className="badge-new">New</span>}
                          <div className="product-quick-add">Quick View</div>
                        </div>
                        <div className="product-info" style={{ marginTop: '1rem' }}>
                          <span className="product-category">
                            {product.category.toUpperCase().replace('-', ' ')}
                          </span>
                          <h3 className="product-name">{product.name}</h3>
                          <p className="product-price">{getProductCurrency(product)}{product.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          } else if (block.block_type === 'BrandStory') {
            blockContent = (
              <section className={`cms-story ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
                <div className={`cms-story-grid ${widthClass}`} style={{ ...containerStyle, minHeight: manualHeight ? `${manualHeight}px` : '550px' }}>
                  <div className="cms-story-left">
                    {block.data.subtitle && (
                      <span className="cms-story-subtitle">{block.data.subtitle}</span>
                    )}
                    <h2 className="cms-story-title">{block.data.title || 'Brand Story'}</h2>
                    {block.data.quote && (
                      <blockquote className="cms-story-quote">
                        "{block.data.quote}"
                      </blockquote>
                    )}
                    {block.data.description && (
                      <p className="cms-story-description">{block.data.description}</p>
                    )}
                  </div>
                  <div className="cms-story-right">
                    {block.data.image && (
                      <img src={block.data.image} alt="Story" className="cms-story-img" />
                    )}
                  </div>
                </div>
              </section>
            );
          } else if (block.block_type === 'EditorialGallery') {
            blockContent = (
              <section className={`cms-gallery ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
                <div className={`container ${widthClass}`} style={containerStyle}>
                  <div style={{ textAlign: block.data.textAlign || 'center', marginBottom: '3.5rem' }}>
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
                    <div className={`cms-gallery-item aspect-${block.data.aspectRatio || 'portrait'}`}>
                      {block.data.image1 && <img src={block.data.image1} alt="Lookbook 1" className="cms-gallery-img" />}
                    </div>
                    <div className={`cms-gallery-item aspect-${block.data.aspectRatio || 'portrait'}`}>
                      {block.data.image2 && <img src={block.data.image2} alt="Lookbook 2" className="cms-gallery-img" />}
                    </div>
                    <div className={`cms-gallery-item aspect-${block.data.aspectRatio || 'portrait'}`}>
                      {block.data.image3 && <img src={block.data.image3} alt="Lookbook 3" className="cms-gallery-img" />}
                    </div>
                  </div>
                </div>
              </section>
            );
          } else if (block.block_type === 'NewsletterSubscribe') {
            blockContent = (
              <section className={`cms-news ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
                <div className={widthClass} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', ...containerStyle }}>
                  <h3 className="cms-news-title">{block.data.title || 'JOIN THE CLUB'}</h3>
                  {block.data.subtitle && (
                    <p className="cms-news-subtitle">{block.data.subtitle}</p>
                  )}
                  <div className="cms-news-form">
                    <input type="email" placeholder={block.data.placeholder_text || 'Enter email'} disabled className="cms-news-input" />
                    <button type="button" className="cms-news-btn" style={{ cursor: 'default' }}>
                      {block.data.button_text || 'Subscribe'}
                    </button>
                  </div>
                </div>
              </section>
            );
          } else if (block.block_type === 'Spacer') {
            blockContent = (
              <div style={{ height: `${block.data.height || 60}px` }} />
            );
          } else if (block.block_type === 'LuxuryFaq') {
            blockContent = (
              <section className={`cms-faq ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
                <div className={widthClass} style={containerStyle}>
                  <div style={{ textAlign: block.data.textAlign || 'center', marginBottom: '2.5rem' }}>
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>{block.data.subtitle || 'QUESTIONS'}</span>
                    <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '2.5rem', fontWeight: 500, margin: '0.5rem 0' }}>{block.data.title || 'FAQ'}</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '800px', margin: '0 auto' }}>
                    {(block.data.faqs || []).map((faq: any, fIdx: number) => (
                      <div key={fIdx} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                        <h4 style={{ fontWeight: 600, fontSize: '0.95rem', margin: '0 0 0.5rem 0', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{faq.question}</span>
                          <span style={{ color: 'var(--color-accent)' }}>+</span>
                        </h4>
                        <p style={{ color: 'var(--color-gray)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          } else if (block.block_type === 'ReviewTestimonials') {
            blockContent = (
              <section className={`cms-reviews ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
                <div className={widthClass} style={containerStyle}>
                  <div style={{ textAlign: block.data.textAlign || 'center', marginBottom: '3rem' }}>
                    <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>{block.data.subtitle}</span>
                    <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '2.5rem', fontWeight: 500, margin: '0.5rem 0' }}>{block.data.title || 'Testimonials'}</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {(block.data.reviews || []).map((rev: any, rIdx: number) => (
                      <div key={rIdx} style={{ border: '1px solid var(--color-border)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                        <div style={{ display: 'flex', gap: '2px', color: '#c5a880', fontSize: '1rem' }}>
                          {Array.from({ length: rev.rating || 5 }).map(() => '★')}
                        </div>
                        <blockquote style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--color-text)', margin: 0, flexGrow: 1 }}>"{rev.quote}"</blockquote>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>{rev.client_avatar || 'C'}</div>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{rev.client_name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          } else if (block.block_type === 'LogoCloud') {
            blockContent = (
              <section className={`cms-logocloud ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', ...sectionStyle }}>
                <div className={widthClass} style={containerStyle}>
                  {block.data.title && (
                    <h5 style={{ textAlign: 'center', fontSize: '0.7rem', letterSpacing: '0.2em', color: 'var(--color-gray)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>{block.data.title}</h5>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '3rem' }}>
                    {(block.data.logos || []).map((logo: any, lIdx: number) => (
                      <div key={lIdx} style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.15em', opacity: 0.65, fontFamily: '"Outfit", sans-serif', color: 'var(--color-text)' }}>
                        {logo.image_url ? <img src={logo.image_url} alt={logo.name} style={{ height: '24px', filter: 'grayscale(100%)' }} /> : logo.name}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          } else if (block.block_type === 'HeroGrid') {
            blockContent = (
              <section className={`cms-herogrid ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
                <div className={widthClass} style={containerStyle}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                      <img src={block.data.image_left} alt="Mosaic Left" style={{ width: '100%', height: '400px', objectFit: 'cover', border: '1px solid var(--color-border)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{block.data.subtitle}</span>
                        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '2.5rem', fontWeight: 500, margin: '0.5rem 0 1rem 0', textTransform: 'uppercase' }}>{block.data.title}</h2>
                        <p style={{ color: 'var(--color-gray)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>{block.data.description}</p>
                        {block.data.cta_text && (
                          <span style={{ borderBottom: '1px solid var(--color-text)', paddingBottom: '4px', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.1em', cursor: 'default' }}>{block.data.cta_text}</span>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <img src={block.data.image_right_top} alt="Mosaic Right Top" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                        <img src={block.data.image_right_bottom} alt="Mosaic Right Bottom" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          } else if (block.block_type === 'HeroSlider') {
            blockContent = (
              <CmsHeroSlider block={block} style={sectionStyle} />
            );
          } else if (block.block_type === 'MultiHeroCarousel') {
            blockContent = (
              <CmsMultiHeroCarousel block={block} style={sectionStyle} />
            );
          }

          return (
            <div
              key={block.id}
              onClick={sandboxMode === 'edit' ? (e) => { e.stopPropagation(); setSelectedBlockId(block.id); } : undefined}
              style={{
                border: sandboxMode === 'edit' ? `2px ${isSelected ? 'solid var(--color-text)' : 'dashed var(--color-border)'}` : 'none',
                position: 'relative',
                cursor: sandboxMode === 'edit' ? 'pointer' : 'default',
                margin: sandboxMode === 'edit' ? '0.5rem 0' : '0',
                transition: 'all 0.15s',
                ...(manualWidth ? { maxWidth: `${manualWidth}px`, width: '100%', marginLeft: 'auto', marginRight: 'auto' } : {})
              }}
            >
              {sandboxMode === 'edit' && (
                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.35rem', alignItems: 'center', zIndex: 100 }}>
                  {isScheduled && <span style={{ fontSize: '0.65rem', backgroundColor: '#eab308', color: '#000', padding: '0.15rem 0.35rem', fontWeight: '700', borderRadius: '2px' }}>Scheduled</span>}
                  <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--color-text)', color: 'var(--color-bg)', padding: '0.15rem 0.35rem', fontWeight: '700', textTransform: 'uppercase' }}>{block.block_type}</span>
                </div>
              )}
              <div style={{ pointerEvents: sandboxMode === 'edit' ? 'none' : 'auto' }}>
                {blockContent}
              </div>
            </div>
          );
        })}
      </div>
    );
  };





  return (
    <div className="admin-dashboard">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: '100px', right: '24px', zIndex: 5000,
          backgroundColor: toastType === 'success' ? '#16a34a' : '#dc2626',
          color: '#fff', padding: '0.85rem 1.5rem', borderRadius: '4px',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          animation: 'toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          {toastType === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{toastMessage}</span>
        </div>
      )}

      <div className="container" style={{ maxWidth: activeTab === 'cms' && cmsSubTab === 'visual' ? '1600px' : '1200px', transition: 'max-width 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)' }}>Admin Dashboard</h1>
            <p style={{ color: 'var(--color-gray)', fontSize: '0.95rem', marginTop: '0.25rem' }}>Store authority controls & analytics</p>
          </div>
          <button onClick={() => signOut()} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="admin-tab-bar">
          <button onClick={() => setActiveTab('overview')} className={`admin-tab-button ${activeTab === 'overview' ? 'active' : ''}`}>Overview</button>
          <button onClick={() => setActiveTab('products')} className={`admin-tab-button ${activeTab === 'products' ? 'active' : ''}`}>Product Management</button>
          <button onClick={() => setActiveTab('orders')} className={`admin-tab-button ${activeTab === 'orders' ? 'active' : ''}`}>Order Management</button>
          <button onClick={() => setActiveTab('cms')} className={`admin-tab-button ${activeTab === 'cms' ? 'active' : ''}`}>CMS Content</button>
          <button onClick={() => setActiveTab('marketing')} className={`admin-tab-button ${activeTab === 'marketing' ? 'active' : ''}`}>Promotions & Marketing</button>
        </div>

        {/* ================= OVERVIEW TAB ================= */}
        {activeTab === 'overview' && (
          <>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">Total Revenue</span>
                  <TrendingUp size={20} style={{ color: 'var(--color-accent)' }} />
                </div>
                <p className="admin-stat-value">₹{totalRevenue.toFixed(2)}</p>
              </div>
              <div className="admin-stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">Total Orders</span>
                  <ShoppingBag size={20} style={{ color: 'var(--color-accent)' }} />
                </div>
                <p className="admin-stat-value">{orders.length}</p>
              </div>
              <div className="admin-stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">Products Active</span>
                  <Box size={20} style={{ color: 'var(--color-accent)' }} />
                </div>
                <p className="admin-stat-value">{products.length}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>Recent Orders</h2>
              <button onClick={() => setActiveTab('orders')} className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>View All Orders</button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Detail</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-gray)' }}>No orders yet.</td></tr>
                  ) : (
                    orders.slice(0, 5).map((order: any) => {
                      const p = profiles[order.user_id] || {};
                      const customerName = p.first_name ? `${p.first_name} ${p.last_name || ''}` : 'Customer';
                      const firstItem = orderItems.find(item => item.order_id === order.id);
                      const prod = firstItem ? products.find(prod => prod.id === firstItem.product_id) : null;
                      const currencySymbol = prod ? getProductCurrency(prod) : '₹';

                      return (
                        <tr key={order.id}>
                          <td style={{ fontWeight: 600 }}>#{order.id.split('-')[0]}</td>
                          <td>
                            <div className="admin-customer-info">
                              <span className="admin-customer-name">{customerName}</span>
                              <span className="admin-customer-email">{p.email || 'No email'}</span>
                            </div>
                          </td>
                          <td>{new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                          <td>
                            <span className={`order-status-badge status-${order.status?.toLowerCase()}`}>
                              {order.status}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{currencySymbol}{Number(order.total).toFixed(2)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ================= PRODUCT MANAGEMENT TAB ================= */}
        {activeTab === 'products' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>Product Catalog</h2>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setShowSubcatModal(true)} className="btn btn-outline" style={{ padding: '0.6rem 1.5rem', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>Manage Subcategories</button>
                <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>+ Add Product</button>
              </div>
            </div>

            {/* Product Statistics Summary Bar */}
            <div className="admin-stats-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="admin-stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">Unique Products</span>
                  <Grid size={20} style={{ color: 'var(--color-accent)' }} />
                </div>
                <p className="admin-stat-value">{totalUniqueProducts}</p>
              </div>
              <div className="admin-stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">Low Stock Alerts</span>
                  <AlertCircle size={20} style={{ color: lowStockCount > 0 ? '#d97706' : 'var(--color-gray)' }} />
                </div>
                <p className="admin-stat-value" style={{ color: lowStockCount > 0 ? '#d97706' : 'inherit' }}>{lowStockCount}</p>
              </div>
              <div className="admin-stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">Out of Stock</span>
                  <X size={20} style={{ color: outOfStockCount > 0 ? '#dc2626' : 'var(--color-gray)' }} />
                </div>
                <p className="admin-stat-value" style={{ color: outOfStockCount > 0 ? '#dc2626' : 'inherit' }}>{outOfStockCount}</p>
              </div>
              <div className="admin-stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">Total Inventory Valuation</span>
                  <TrendingUp size={20} style={{ color: '#16a34a' }} />
                </div>
                <p className="admin-stat-value">₹{totalInventoryValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            {/* Product Controls Toolbar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: 'rgba(0,0,0,0.01)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px'
            }}>
              <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray)' }} />
                <input
                  type="text"
                  placeholder="Search by name, SKU..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.5rem 0.5rem 2.2rem',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-text)',
                    fontSize: '0.9rem'
                  }}
                />
                {productSearch && (
                  <button
                    onClick={() => setProductSearch('')}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray)' }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Category selector */}
                <select
                  value={productCategoryFilter}
                  onChange={e => {
                    setProductCategoryFilter(e.target.value);
                    setProductSubcategoryFilter('all');
                  }}
                  style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', fontSize: '0.9rem' }}
                >
                  <option value="all">All Categories</option>
                  <option value="shirts">Shirts</option>
                  <option value="t-shirts">T-Shirts</option>
                  <option value="polo">POLO</option>
                  <option value="jeans">Jeans</option>
                  <option value="trousers">Trousers</option>
                  <option value="linen">LINEN</option>
                  <option value="cargo-pants">Cargo Pants</option>
                  <option value="joggers">Joggers</option>
                  <option value="shorts">SHORTS</option>
                  <option value="overshirts">Overshirts</option>
                  <option value="footwear">Footwear</option>
                </select>

                {/* Subcategory selector */}
                {productCategoryFilter !== 'all' && (
                  <select
                    value={productSubcategoryFilter}
                    onChange={e => setProductSubcategoryFilter(e.target.value)}
                    style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', fontSize: '0.9rem', textTransform: 'capitalize' }}
                  >
                    <option value="all">All Subcategories</option>
                    {(subcategories[productCategoryFilter] || []).map(sub => (
                      <option key={sub} value={sub}>
                        {sub.replace(/-/g, ' ')}
                      </option>
                    ))}
                  </select>
                )}

                {/* Stock Level selector */}
                <select
                  value={productStockFilter}
                  onChange={e => setProductStockFilter(e.target.value)}
                  style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', fontSize: '0.9rem' }}
                >
                  <option value="all">All Stock Status</option>
                  <option value="instock">In Stock</option>
                  <option value="low">Low Stock (&lt; 10)</option>
                  <option value="out">Out of Stock (0)</option>
                </select>

                {/* Sorting selector */}
                <select
                  value={productSort}
                  onChange={e => setProductSort(e.target.value)}
                  style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', fontSize: '0.9rem' }}
                >
                  <option value="name-asc">Name (A - Z)</option>
                  <option value="name-desc">Name (Z - A)</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="stock-asc">Stock: Low to High</option>
                  <option value="stock-desc">Stock: High to Low</option>
                </select>
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-gray)' }}>
                        No products match your search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => {
                      const sizeVariant = Array.isArray(p.variants) ? p.variants.find((v: any) => v.size) : null;
                      const symbol = sizeVariant?.currency ? CURRENCIES.find(c => c.code === sizeVariant.currency)?.symbol : '₹';
                      const isLow = (p.stock ?? 100) < 10 && (p.stock ?? 100) > 0;
                      const isOut = (p.stock ?? 100) === 0;

                      return (
                        <tr key={p.id}>
                          <td><img src={p.image} alt={p.name} style={{ width: '44px', height: '56px', objectFit: 'cover', borderRadius: '2px' }} /></td>
                          <td style={{ fontWeight: '500' }}>
                            {p.name}
                            {p.is_new && <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', backgroundColor: 'var(--color-text)', color: 'var(--color-bg)', padding: '0.15rem 0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New</span>}
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.sku || '-'}</td>
                          <td>{symbol}{p.price}</td>
                          <td style={{
                            color: isOut ? '#dc2626' : isLow ? '#d97706' : 'inherit',
                            fontWeight: (isOut || isLow) ? '600' : 'normal'
                          }}>
                            {p.stock ?? 100}
                            {isOut ? ' (Out of Stock)' : isLow ? ' (Low Stock)' : ''}
                          </td>
                          <td style={{ textTransform: 'capitalize' }}>
                            <div>{p.category}</div>
                            {(() => {
                              const subcatObj = Array.isArray(p.variants) ? p.variants.find((v: any) => v.is_subcategory) : null;
                              if (subcatObj?.subcategory) {
                                return (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--color-gray)', textTransform: 'capitalize', display: 'block', marginTop: '0.15rem' }}>
                                    → {subcatObj.subcategory.replace(/-/g, ' ')}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                              <button onClick={() => handleOpenModal(p)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', fontSize: '0.9rem' }}>Edit</button>
                              <button onClick={() => handleDeleteProduct(p.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', fontSize: '0.9rem' }}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ================= ORDER MANAGEMENT TAB ================= */}
        {activeTab === 'orders' && (
          <>
            {/* Orders Statistics Banner */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">Total Revenue</span>
                  <TrendingUp size={20} style={{ color: '#16a34a' }} />
                </div>
                <p className="admin-stat-value">₹{totalRevenue.toFixed(2)}</p>
              </div>
              <div className="admin-stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">Orders Handled</span>
                  <ShoppingBag size={20} style={{ color: 'var(--color-accent)' }} />
                </div>
                <p className="admin-stat-value">{orders.length}</p>
              </div>
              <div className="admin-stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">AOV (Avg Value)</span>
                  <Box size={20} style={{ color: 'var(--color-accent)' }} />
                </div>
                <p className="admin-stat-value">₹{avgOrderValue.toFixed(2)}</p>
              </div>
              <div className="admin-stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">Processing / Pending</span>
                  <Clock size={20} style={{ color: '#d97706' }} />
                </div>
                <p className="admin-stat-value" style={{ color: pendingCount > 0 ? '#d97706' : 'inherit' }}>{pendingCount}</p>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="admin-control-bar">
              <div className="admin-search-wrapper">
                <Search size={16} className="admin-search-icon" />
                <input
                  type="text"
                  placeholder="Search Order ID, Customer name or address..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="admin-search-input"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray)' }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="admin-filters">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Filter size={15} style={{ color: 'var(--color-gray)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-gray)' }}>Filter:</span>
                </div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="admin-select"
                >
                  <option value="All">All Statuses</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="admin-select"
                >
                  <option value="Newest">Newest First</option>
                  <option value="Oldest">Oldest First</option>
                  <option value="Price: High to Low">Price: High to Low</option>
                  <option value="Price: Low to High">Price: Low to High</option>
                </select>

                <button
                  onClick={fetchOrders}
                  disabled={loadingOrders}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid var(--color-border)', padding: '0.8rem 1rem', cursor: 'pointer', background: 'transparent', color: 'var(--color-text)' }}
                  title="Reload Orders Data"
                >
                  <RefreshCw size={14} className={loadingOrders ? 'spin-animation' : ''} />
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Detail</th>
                    <th>Shipping Address</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-gray)' }}>
                        No orders match your search parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order: any) => {
                      const p = profiles[order.user_id] || {};
                      const customerName = p.first_name ? `${p.first_name} ${p.last_name || ''}` : 'Customer';
                      const firstItem = orderItems.find(item => item.order_id === order.id);
                      const prod = firstItem ? products.find(prod => prod.id === firstItem.product_id) : null;
                      const currencySymbol = prod ? getProductCurrency(prod) : '₹';

                      return (
                        <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedOrder(order)}>
                          <td style={{ fontWeight: 600 }}>#{order.id.split('-')[0]}</td>
                          <td>
                            <div className="admin-customer-info">
                              <span className="admin-customer-name">{customerName}</span>
                              <span className="admin-customer-email">{p.email || 'No email'}</span>
                            </div>
                          </td>
                          <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.shipping_address}>
                            {order.shipping_address}
                          </td>
                          <td>{new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                          <td onClick={e => e.stopPropagation()}>
                            <select
                              value={order.status || 'Processing'}
                              onChange={e => handleUpdateStatus(order.id, e.target.value)}
                              className={`order-status-badge status-${order.status?.toLowerCase()}`}
                              style={{ border: 'none', padding: '0.35rem 0.5rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}
                            >
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td style={{ fontWeight: 600 }}>{currencySymbol}{Number(order.total).toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', border: 'none', background: 'transparent', color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                            >
                              <Eye size={14} />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ================= CMS CONTENT MANAGEMENT TAB ================= */}
        {activeTab === 'cms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
            {/* CMS Sub-tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                {(['visual', 'static', 'navigation', 'media', 'shop_filters', 'grid_settings', 'custom_pages'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setCmsSubTab(tab)}
                    style={{
                      background: 'none', border: 'none', padding: '0.5rem 0', fontSize: '0.9rem', fontWeight: cmsSubTab === tab ? '700' : '400',
                      color: cmsSubTab === tab ? 'var(--color-text)' : 'var(--color-gray)', borderBottom: cmsSubTab === tab ? '2px solid var(--color-text)' : 'none',
                      cursor: 'pointer', transition: 'all 0.15s', textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}
                  >
                    {tab === 'visual' ? 'Storefront Builder' : tab === 'static' ? 'Static & SEO' : tab === 'navigation' ? 'Global Navigation' : tab === 'media' ? 'Media Library' : tab === 'shop_filters' ? 'Shop Filters' : tab === 'grid_settings' ? 'Grid Layout' : 'Custom Pages'}
                  </button>
                ))}
              </div>

              {cmsSubTab === 'visual' && (
                <button
                  onClick={publishStorefrontConfig}
                  className="btn btn-primary"
                  disabled={publishing}
                  style={{
                    padding: '0.45rem 1.25rem',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    borderRadius: '4px',
                    boxShadow: '0 4px 12px rgba(197, 168, 128, 0.25)',
                    opacity: publishing ? 0.7 : 1,
                    cursor: publishing ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Globe size={14} className={publishing ? 'animate-spin' : ''} />
                  <span>{publishing ? 'Publishing...' : 'Publish Live'}</span>
                </button>
              )}
            </div>

            {/* DB Table Missing Alert */}
            {dbTableMissing && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '6px',
                padding: '1rem 1.25rem',
                color: '#ef4444',
                fontSize: '0.85rem',
                lineHeight: '1.5',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                  <AlertCircle size={16} />
                  <span>DATABASE SYNCHRONIZATION RUNNING IN OFFLINE FALLBACK MODE</span>
                </div>
                <p style={{ margin: 0, opacity: 0.9 }}>
                  The <code>storefront_config</code> table was not found in your Supabase database.
                  Your modifications are currently saved only in your local browser storage (<code>localStorage</code>) and will <strong>not</strong> show on other devices or mobile.
                </p>
                <div style={{ marginTop: '0.5rem' }}>
                  <details>
                    <summary style={{ cursor: 'pointer', fontWeight: 600, outline: 'none' }}>
                      Show SQL command to run in your Supabase SQL Editor
                    </summary>
                    <pre style={{
                      backgroundColor: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      padding: '0.75rem',
                      borderRadius: '4px',
                      overflowX: 'auto',
                      fontSize: '0.75rem',
                      marginTop: '0.5rem',
                      border: '1px solid var(--color-border)',
                      fontFamily: 'monospace'
                    }}>
                      {`CREATE TABLE public.storefront_config (
  id TEXT PRIMARY KEY DEFAULT 'homepage_global',
  config JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.storefront_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view storefront config" ON public.storefront_config 
  FOR SELECT USING (true);

CREATE POLICY "Admins can update storefront config" ON public.storefront_config 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );`}
                    </pre>
                  </details>
                </div>
              </div>
            )}

            {/* Visual Canvas (Split Screen Workspace) */}
            {/* Visual Canvas (Three Column Workspace) */}
            {cmsSubTab === 'visual' && (() => {
              // Helper functions for dynamic configurations
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

              const getBlockAnimationConfig = (block: any) => {
                const defaults = {
                  entry_trigger: "scroll_view",
                  viewport_options: { once: true, amount_visible_threshold: 0.15 },
                  preset: "reveal_up",
                  curves: { type: "cubic_bezier", value: [0.16, 1, 0.3, 1], duration_ms: 750 },
                  stagger_children_ms: 50,
                  hover_preset: block.data?.hoverAnimation === 'lift' ? 'scale_and_shift' : 'none',
                  tactile_button_feedback: false
                };
                if (!block.animation_orchestrator) return defaults;
                return {
                  ...defaults,
                  ...block.animation_orchestrator,
                  viewport_options: { ...defaults.viewport_options, ...block.animation_orchestrator.viewport_options },
                  curves: { ...defaults.curves, ...block.animation_orchestrator.curves }
                };
              };

              const getBlockDesignSync = (block: any) => {
                const defaults = {
                  typography_scale: { title: "H2", body: "Body" },
                  glassmorphic: block.data?.themeStyle === 'glass',
                  color_profile: { bg: "Studio Background", text: "Neutral Slate" }
                };
                if (!block.design_system_sync) return defaults;
                return {
                  ...defaults,
                  ...block.design_system_sync,
                  typography_scale: { ...defaults.typography_scale, ...block.design_system_sync.typography_scale },
                  color_profile: { ...defaults.color_profile, ...block.design_system_sync.color_profile }
                };
              };

              const targetWidth = previewMode === 'desktop' ? simulatorCustomWidth : previewMode === 'tablet' ? 768 : 375;
              const scale = containerWidth && containerWidth < targetWidth ? (containerWidth - 32) / targetWidth : 1;

              return (
                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'stretch', minHeight: '80vh', position: 'relative' }}>

                  {/* 1. LEFT COLUMN: LAYER TREE SIDEBAR */}
                  <div style={{ backgroundColor: 'var(--color-bg)', borderRight: '1px solid var(--color-border)', paddingRight: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Layers size={14} style={{ color: 'var(--color-accent)' }} />
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Layers Hierarchy</h4>
                      </div>
                      <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--color-border)', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                        {cmsPageConfig.blocks.length} nodes
                      </span>
                    </div>

                    {/* Component Vault Open Button */}
                    <button
                      onClick={() => setShowVault(!showVault)}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    >
                      <Plus size={14} /> Component Vault
                    </button>

                    {/* Component Vault Slide-Out Shelf */}
                    {showVault && (
                      <div style={{ border: '1px solid var(--color-text)', borderRadius: '4px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'var(--color-bg)', zIndex: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>INSERT PRE-MAPPED PRESETS</span>
                          <button onClick={() => setShowVault(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray)' }}><X size={14} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                          {[
                            { type: 'HeroBanner', desc: 'Campaign Split Hero', tag: 'section' },
                            { type: 'HeroSlider', desc: 'Auto Rotating Slideshow Banner', tag: 'section' },
                            { type: 'MultiHeroCarousel', desc: 'Auto Rotating Multi-Item Hero Carousel', tag: 'section' },
                            { type: 'HeroGrid', desc: 'Lookbook Editorial Mosaic Grid', tag: 'header' },
                            { type: 'PromotionalSlider', desc: 'Countdown Announcement Bar', tag: 'aside' },
                            { type: 'CategoryGrid', desc: 'Curated Categories Grid', tag: 'section' },
                            { type: 'FeaturedProducts', desc: 'Weekly Featured Products', tag: 'article' },
                            { type: 'BrandStory', desc: 'Editorial Narrative Highlight', tag: 'aside' },
                            { type: 'ReviewTestimonials', desc: 'Luxury Client Testimonials Grid', tag: 'section' },
                            { type: 'EditorialGallery', desc: 'Lookbook Captures Slider', tag: 'section' },
                            { type: 'LuxuryFaq', desc: 'Interactive Accordion FAQ', tag: 'section' },
                            { type: 'NewsletterSubscribe', desc: 'Minimal Join Club Input', tag: 'footer' },
                            { type: 'Spacer', desc: 'Geometric Layout Spacer', tag: 'div' }
                          ].map((preset) => (
                            <div
                              key={preset.type}
                              style={{ border: '1px solid var(--color-border)', padding: '0.5rem', borderRadius: '2px', cursor: 'pointer' }}
                              onClick={() => handleAddBlockFromVault(preset.type, preset.tag)}
                              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-text)'}
                              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                            >
                              <div style={{ fontWeight: '700', fontSize: '0.75rem' }}>{preset.type}</div>
                              <div style={{ fontSize: '0.6rem', color: 'var(--color-gray)' }}>{preset.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Layer hierarchy tree nodes list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: '420px' }}>
                      {cmsPageConfig.blocks.map((block: any, idx: number) => {
                        const isSelected = block.id === selectedBlockId;
                        const isExpanded = expandedNodes[block.id] || false;
                        const semantic = block.semantic_tag || 'section';

                        return (
                          <div
                            key={block.id}
                            style={{
                              border: `1px solid ${isSelected ? 'var(--color-text)' : 'var(--color-border)'}`,
                              backgroundColor: isSelected ? 'rgba(0,0,0,0.01)' : 'transparent',
                              borderRadius: '4px',
                              padding: '0.5rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem' }}>
                              <div
                                onClick={() => {
                                  setExpandedNodes({ ...expandedNodes, [block.id]: !isExpanded });
                                }}
                                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                              >
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </div>

                              <div
                                onClick={() => setSelectedBlockId(block.id)}
                                style={{ flex: 1, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px' }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <span style={{ fontWeight: '700', fontSize: '0.75rem' }}>{idx + 1}. {block.block_type}</span>
                                  {block.is_global && (
                                    <span style={{ fontSize: '0.55rem', backgroundColor: 'var(--color-accent)', color: '#fff', padding: '1px 3px', borderRadius: '2px' }}>Global</span>
                                  )}
                                </div>
                                <span style={{ fontSize: '0.6rem', color: 'var(--color-gray)' }}>&lt;{semantic}&gt; {block.id.substring(0, 12)}...</span>
                              </div>

                              {/* Node action reorder/trash shortcuts */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <button onClick={() => handleMoveBlock(idx, 'up')} disabled={idx === 0} style={{ border: 'none', background: 'transparent', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: 'var(--color-gray)' }}><ArrowUp size={11} /></button>
                                <button onClick={() => handleMoveBlock(idx, 'down')} disabled={idx === cmsPageConfig.blocks.length - 1} style={{ border: 'none', background: 'transparent', cursor: idx === cmsPageConfig.blocks.length - 1 ? 'not-allowed' : 'pointer', color: 'var(--color-gray)' }}><ArrowDown size={11} /></button>
                                <button onClick={() => handleDeleteBlock(block.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#f87171' }}><Trash2 size={11} /></button>
                              </div>
                            </div>

                            {/* Expanded attributes sub-tree */}
                            {isExpanded && (
                              <div style={{ borderLeft: '1px dashed var(--color-border)', marginLeft: '6px', paddingLeft: '8px', marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.65rem', color: 'var(--color-gray)' }}>
                                <div>• Padding: <span style={{ fontWeight: 600 }}>{block.layout_configuration?.padding?.preset || 'medium'}</span></div>
                                <div>• Aspect Ratio: <span style={{ fontWeight: 600 }}>{block.layout_configuration?.aspect_ratio || 'portrait'}</span></div>
                                <div>• Hover Effect: <span style={{ fontWeight: 600 }}>{block.animation_orchestrator?.hover_preset || 'scale_and_shift'}</span></div>
                                <div>• Action Event: <span style={{ fontWeight: 600 }}>{block.data?.cta_action || 'route'}</span></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginTop: 'auto' }}>
                      <button
                        onClick={handleSaveCmsConfig}
                        className="btn btn-primary"
                        style={{ padding: '0.6rem 1rem', width: '100%', fontSize: '0.75rem' }}
                      >
                        Push Dynamic Layout
                      </button>
                    </div>
                  </div>

                  {/* 2. CENTER COLUMN: INTERACTIVE LIVE CANVAS */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Stress Tester Viewport Simulator + Sandbox switch */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>

                      {/* Viewport size buttons */}
                      <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'var(--color-bg)' }}>
                        {[
                          { mode: 'desktop', icon: <Monitor size={12} />, label: 'Laptop' },
                          { mode: 'tablet', icon: <Tablet size={12} />, label: 'Tablet' },
                          { mode: 'mobile', icon: <Smartphone size={12} />, label: 'Mobile' }
                        ].map((item) => (
                          <button
                            key={item.mode}
                            onClick={() => setPreviewMode(item.mode as any)}
                            style={{
                              padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600,
                              backgroundColor: previewMode === item.mode ? 'var(--color-text)' : 'transparent',
                              color: previewMode === item.mode ? 'var(--color-bg)' : 'var(--color-text)',
                              border: 'none', cursor: 'pointer', transition: 'all 0.15s'
                            }}
                          >
                            {item.icon} {item.label}
                          </button>
                        ))}
                      </div>

                      {/* Width Drag/Stress Tester Range Input */}
                      {previewMode === 'desktop' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-gray)' }}>Width: {simulatorCustomWidth}px</span>
                          <input
                            type="range"
                            min="320"
                            max="1600"
                            value={simulatorCustomWidth}
                            onChange={(e) => setSimulatorCustomWidth(Number(e.target.value))}
                            style={{ width: '80px', cursor: 'ew-resize' }}
                          />
                        </div>
                      )}

                      {/* Sandbox Switcher */}
                      <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'var(--color-bg)' }}>
                        {[
                          { mode: 'edit', label: 'Edit Mode' },
                          { mode: 'preview', label: 'Preview Interaction' }
                        ].map((m) => (
                          <button
                            key={m.mode}
                            onClick={() => setSandboxMode(m.mode as any)}
                            style={{
                              padding: '0.4rem 0.75rem', fontSize: '0.75rem', fontWeight: 600,
                              backgroundColor: sandboxMode === m.mode ? 'var(--color-text)' : 'transparent',
                              color: sandboxMode === m.mode ? 'var(--color-bg)' : 'var(--color-text)',
                              border: 'none', cursor: 'pointer', transition: 'all 0.15s'
                            }}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>

                      {/* Fullscreen Button */}
                      <button
                        onClick={() => setIsCanvasFullscreen(true)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray)' }}
                        title="Enter Fullscreen"
                      >
                        <Maximize2 size={15} />
                      </button>
                    </div>

                    {/* Simulator Device Frame wrapper */}
                    <div
                      ref={containerRef}
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        padding: '1.5rem 1rem',
                        backgroundColor: '#faf9f6',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                        minHeight: '650px',
                        position: 'relative'
                      }}
                    >
                      <div style={{
                        width: `${targetWidth * scale}px`,
                        flexShrink: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}>
                        <div
                          style={{
                            width: `${targetWidth}px`,
                            flexShrink: 0,
                            transform: `scale(${scale})`,
                            transformOrigin: 'top center',
                            border: previewMode === 'desktop' ? '1px solid var(--color-border)' : '12px solid #18181b',
                            borderRadius: previewMode === 'desktop' ? '4px' : '24px',
                            backgroundColor: 'var(--color-bg)',
                            overflow: 'hidden',
                            position: 'relative',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
                            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s ease'
                          }}
                        >
                          {/* Notch for mobile */}
                          {previewMode === 'mobile' && (
                            <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', width: '100px', height: '14px', backgroundColor: '#18181b', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                              <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#27272a', marginRight: '6px' }}></span>
                              <span style={{ width: '30px', height: '3px', borderRadius: '2px', backgroundColor: '#27272a' }}></span>
                            </div>
                          )}

                          {/* Header bar mock */}
                          <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: previewMode === 'mobile' ? '1.15rem 1rem 0.35rem' : '0.35rem 0.75rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.35rem', zIndex: 5 }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#eab308' }}></span>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
                            <span style={{ marginLeft: '0.25rem', fontSize: '0.6rem', color: 'var(--color-gray)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              AURA SIMULATOR ({sandboxMode.toUpperCase()})
                            </span>
                          </div>

                          <div
                            className={`preview-container-wrap ${previewMode === 'mobile' ? 'preview-mobile' : previewMode === 'tablet' ? 'preview-tablet' : 'preview-desktop'}`}
                            style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', pointerEvents: 'auto' }}
                          >
                            {cmsPageConfig.blocks.map((block: any) => {
                              const isSelected = block.id === selectedBlockId;

                              // Load current custom configurations
                              const layConfig = getBlockLayoutConfig(block);
                              const pad = layConfig.padding?.preset || 'editorial';
                              const aspect = layConfig.aspect_ratio || 'portrait';
                              const fit = layConfig.object_fit || 'cover';
                              const mobCols = layConfig.grid_setup?.columns_mobile || 1;
                              const tabCols = layConfig.grid_setup?.columns_tablet || 2;
                              const dskCols = layConfig.grid_setup?.columns_desktop || 4;

                              const padClass = `pad-${pad}`;
                              const padH = layConfig.padding?.horizontal_preset || '';
                              const padHClass = padH ? `pad-h-${padH}` : '';
                              const themeClass = block.data.themeStyle ? `theme-${block.data.themeStyle}` : 'theme-light';
                              const alignClass = block.data.textAlign ? `align-${block.data.textAlign}` : 'align-left';
                              const gapClass = block.data.columnGap ? `gap-${block.data.columnGap}` : 'gap-standard';
                              const hoverClass = block.data.hoverAnimation ? `hover-${block.data.hoverAnimation}` : 'hover-zoom';
                              const widthClass = block.data.sectionWidth ? `width-${block.data.sectionWidth}` : 'width-standard';

                              const manualHeight = layConfig.manual_height;
                              const manualWidth = layConfig.manual_width;

                              const sectionStyle: React.CSSProperties = {
                                ...(manualHeight ? { minHeight: `${manualHeight}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center' } : {})
                              };

                              const containerStyle: React.CSSProperties = {
                                ...(manualWidth ? { maxWidth: `${manualWidth}px`, width: '100%', marginLeft: 'auto', marginRight: 'auto' } : {})
                              };

                              let blockContent = null;

                              if (block.block_type === 'HeroBanner') {
                                const isSplit = block.data.layout === 'split';
                                const desktopPadding = manualHeight
                                  ? (manualHeight <= 500 ? '2rem 3rem 2rem' : manualHeight <= 650 ? '3rem 4rem 3rem' : '4rem 5rem 4rem')
                                  : (block.data.sectionWidth === 'narrow' ? '4rem 3rem 3rem' : '8rem 6rem 6rem');

                                const fullPadding = manualHeight
                                  ? (manualHeight <= 500 ? '2rem 2rem' : manualHeight <= 650 ? '4rem 2rem' : '5rem 2rem')
                                  : '8rem 2rem';

                                const heroSectionStyle: React.CSSProperties = {
                                  ...sectionStyle,
                                  ...(!isSplit && block.data.desktop_image ? {
                                    backgroundImage: `url(${block.data.desktop_image})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    position: 'relative'
                                  } : {})
                                };

                                blockContent = (
                                  <section className={`cms-hero ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={heroSectionStyle}>
                                    {!isSplit && block.data.desktop_image && <div className="cms-hero-full-overlay"></div>}
                                    <div className={widthClass} style={{ ...containerStyle, position: 'relative', zIndex: 2 }}>
                                      {isSplit ? (
                                        <div className="cms-hero-split" style={{ border: '1px solid var(--color-border)', minHeight: manualHeight ? `${manualHeight}px` : '80vh' }}>
                                          <div className="cms-hero-left" style={{
                                            '--hero-padding-desktop': desktopPadding
                                          } as React.CSSProperties}>
                                            {block.data.subtitle && <span className="cms-hero-subtitle">{block.data.subtitle}</span>}
                                            <h1 className="cms-hero-title">{block.data.title || 'AURA'}</h1>
                                            {block.data.description && <p className="cms-hero-description">{block.data.description}</p>}
                                            <div className="cms-hero-actions">
                                              {block.data.cta_text && <button className="editorial-btn-primary">{block.data.cta_text}</button>}
                                            </div>
                                          </div>
                                          <div className="cms-hero-right">
                                            {block.data.desktop_image ? (
                                              <img src={block.data.desktop_image} alt="Campaign" className="cms-hero-img" style={{ objectFit: fit as any }} />
                                            ) : (
                                              <div style={{ height: '300px', backgroundColor: '#f4f4f5' }} />
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="cms-hero-full" style={{
                                          minHeight: manualHeight ? `${manualHeight}px` : (block.data.sectionPadding === 'compact' ? '50vh' : '85vh'),
                                          '--hero-padding-full': fullPadding,
                                          display: 'flex',
                                          flexDirection: 'column',
                                          justifyContent: 'center',
                                          alignItems: 'center'
                                        } as React.CSSProperties}>
                                          <div className="cms-hero-full-content" style={{ maxWidth: manualWidth ? `${manualWidth}px` : '800px' }}>
                                            {block.data.subtitle && <span className="cms-hero-subtitle">{block.data.subtitle}</span>}
                                            <h1 className="cms-hero-full-title">{block.data.title || 'AURA'}</h1>
                                            {block.data.description && <p className="cms-hero-full-description">{block.data.description}</p>}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </section>
                                );
                              } else if (block.block_type === 'PromotionalSlider') {
                                blockContent = (
                                  <div style={{ backgroundColor: block.data.background_color || '#0c0a09', color: '#fff', padding: '1rem', textAlign: 'center', fontSize: '0.8rem', letterSpacing: '0.05em', ...sectionStyle }}>
                                    <span>{block.data.slides?.[0]?.text || 'Private Collection Preview'}</span>
                                  </div>
                                );
                              } else if (block.block_type === 'CategoryGrid') {
                                blockContent = (
                                  <section className={`cms-cat-section ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
                                    <div className={`container ${widthClass}`} style={containerStyle}>
                                      <h2 className="featured-cat-title" style={{ fontFamily: 'var(--font-heading)' }}>{block.data.title || 'Curated Categories'}</h2>

                                      {/* Grid mapping columns slider values dynamically in style overrides */}
                                      <div
                                        className={`cms-cat-grid ${gapClass} ${hoverClass}`}
                                        style={{
                                          display: 'grid',
                                          '--grid-cols-desktop': dskCols,
                                          '--grid-cols-tablet': tabCols,
                                          '--grid-cols-mobile': mobCols,
                                          gap: '1rem'
                                        } as React.CSSProperties}
                                      >
                                        {(block.data.categories || []).map((cat: any, cIdx: number) => {
                                          const catObj = typeof cat === 'string' ? { name: cat, image: '' } : cat;
                                          return (
                                            <div
                                              key={cIdx}
                                              className={`cms-cat-card aspect-${aspect}`}
                                              style={{
                                                backgroundImage: catObj.image ? `url(${catObj.image})` : 'none',
                                                backgroundColor: '#f5f5f4',
                                                backgroundSize: fit
                                              }}
                                            >
                                              <div className="cms-cat-overlay"></div>
                                              <span className="cms-cat-name">{catObj.name}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </section>
                                );
                              } else if (block.block_type === 'FeaturedProducts') {
                                const limit = block.data.limit || 4;
                                const displayList = products.slice(0, limit);
                                blockContent = (
                                  <section className={`section new-arrivals ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
                                    <div className={`container ${widthClass}`} style={containerStyle}>
                                      <h2 className="section-title" style={{ fontFamily: 'var(--font-heading)', marginBottom: '1.5rem' }}>{block.data.title || 'Curated Classics'}</h2>

                                      <div
                                        className={`product-grid ${gapClass} ${hoverClass}`}
                                        style={{
                                          display: 'grid',
                                          '--grid-cols-desktop': dskCols,
                                          '--grid-cols-tablet': tabCols,
                                          '--grid-cols-mobile': mobCols,
                                          gap: '1rem'
                                        } as React.CSSProperties}
                                      >
                                        {displayList.map((product) => (
                                          <div key={product.id} className="product-card">
                                            <div className={`product-image-wrap aspect-${aspect}`} style={{ overflow: 'hidden', position: 'relative' }}>
                                              <img src={product.image} alt={product.name} className="product-image" style={{ width: '100%', height: '100%', objectFit: fit as any }} />
                                            </div>
                                            <div style={{ marginTop: '0.5rem' }}>
                                              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-gray)' }}>{product.category}</span>
                                              <h4 style={{ fontSize: '0.85rem', margin: '2px 0' }}>{product.name}</h4>
                                              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>₹{product.price}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </section>
                                );
                              } else if (block.block_type === 'BrandStory') {
                                blockContent = (
                                  <section className={`cms-story ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
                                    <div className={`cms-story-grid ${widthClass}`} style={{ ...containerStyle, minHeight: manualHeight ? `${manualHeight}px` : '550px' }}>
                                      <div className="cms-story-left">
                                        {block.data.subtitle && <span className="cms-story-subtitle">{block.data.subtitle}</span>}
                                        <h2 className="cms-story-title">{block.data.title || 'Brand Story'}</h2>
                                        {block.data.quote && <blockquote className="cms-story-quote">"{block.data.quote}"</blockquote>}
                                        <p className="cms-story-description">{block.data.description}</p>
                                      </div>
                                      <div className="cms-story-right">
                                        {block.data.image && <img src={block.data.image} alt="Story" className="cms-story-img" style={{ objectFit: fit as any }} />}
                                      </div>
                                    </div>
                                  </section>
                                );
                              } else if (block.block_type === 'EditorialGallery') {
                                blockContent = (
                                  <section className={`cms-gallery ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
                                    <div className={`container ${widthClass}`} style={containerStyle}>
                                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', marginBottom: '2rem' }}>{block.data.title || 'Editorial Gallery'}</h3>
                                      <div
                                        className={`cms-gallery-grid ${gapClass} ${hoverClass}`}
                                        style={{
                                          display: 'grid',
                                          '--grid-cols-desktop': dskCols,
                                          '--grid-cols-tablet': tabCols,
                                          '--grid-cols-mobile': mobCols,
                                          gap: '1rem'
                                        } as React.CSSProperties}
                                      >
                                        {[block.data.image1, block.data.image2, block.data.image3].filter(Boolean).map((img, i) => (
                                          <div key={i} className={`cms-gallery-item aspect-${aspect}`}>
                                            <img src={img} alt="Lookbook" className="cms-gallery-img" style={{ objectFit: fit as any }} />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </section>
                                );
                              } else if (block.block_type === 'NewsletterSubscribe') {
                                blockContent = (
                                  <section className={`cms-news ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
                                    <div className={widthClass} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', ...containerStyle }}>
                                      <h3 className="cms-news-title">{block.data.title || 'JOIN THE CLUB'}</h3>
                                      <p className="cms-news-subtitle">{block.data.subtitle}</p>
                                      <div className="cms-news-form">
                                        <input type="email" placeholder="YOUR EMAIL ADDRESS" disabled className="cms-news-input" />
                                        <button type="button" className="cms-news-btn">{block.data.button_text || 'Join'}</button>
                                      </div>
                                    </div>
                                  </section>
                                );
                              } else if (block.block_type === 'Spacer') {
                                blockContent = (
                                  <div style={{ height: `${block.data.height || 60}px` }} />
                                );
                              } else if (block.block_type === 'LuxuryFaq') {
                                blockContent = (
                                  <section className={`cms-faq ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
                                    <div className={`container ${widthClass}`} style={containerStyle}>
                                      <div style={{ textAlign: block.data.textAlign || 'center', marginBottom: '2.5rem' }}>
                                        <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>{block.data.subtitle || 'QUESTIONS'}</span>
                                        <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '2.5rem', fontWeight: 500, margin: '0.5rem 0' }}>{block.data.title || 'FAQ'}</h3>
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '800px', margin: '0 auto' }}>
                                        {(block.data.faqs || []).map((faq: any, fIdx: number) => (
                                          <div key={fIdx} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                                            <h4 style={{ fontWeight: 600, fontSize: '0.95rem', margin: '0 0 0.5rem 0', display: 'flex', justifyContent: 'space-between' }}>
                                              <span>{faq.question}</span>
                                              <span style={{ color: 'var(--color-accent)' }}>+</span>
                                            </h4>
                                            <p style={{ color: 'var(--color-gray)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>{faq.answer}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </section>
                                );
                              } else if (block.block_type === 'ReviewTestimonials') {
                                blockContent = (
                                  <section className={`cms-reviews ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
                                    <div className={`container ${widthClass}`} style={containerStyle}>
                                      <div style={{ textAlign: block.data.textAlign || 'center', marginBottom: '3rem' }}>
                                        <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>{block.data.subtitle}</span>
                                        <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '2.5rem', fontWeight: 500, margin: '0.5rem 0' }}>{block.data.title || 'Testimonials'}</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                          {(block.data.reviews || []).map((rev: any, rIdx: number) => (
                                            <div key={rIdx} style={{ border: '1px solid var(--color-border)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                                              <div style={{ display: 'flex', gap: '2px', color: '#c5a880', fontSize: '1rem' }}>
                                                {Array.from({ length: rev.rating || 5 }).map(() => '★')}
                                              </div>
                                              <blockquote style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--color-text)', margin: 0, flexGrow: 1 }}>"{rev.quote}"</blockquote>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>{rev.client_avatar || 'C'}</div>
                                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{rev.client_name}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </section>
                                );
                              } else if (block.block_type === 'LogoCloud') {
                                blockContent = (
                                  <section className={`cms-logocloud ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', ...sectionStyle }}>
                                    <div className={`container ${widthClass}`} style={containerStyle}>
                                      {block.data.title && (
                                        <h5 style={{ textAlign: 'center', fontSize: '0.7rem', letterSpacing: '0.2em', color: 'var(--color-gray)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>{block.data.title}</h5>
                                      )}
                                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '3rem' }}>
                                        {(block.data.logos || []).map((logo: any, lIdx: number) => (
                                          <div key={lIdx} style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.15em', opacity: 0.65, fontFamily: '"Outfit", sans-serif', color: 'var(--color-text)' }}>
                                            {logo.image_url ? <img src={logo.image_url} alt={logo.name} style={{ height: '24px', filter: 'grayscale(100%)' }} /> : logo.name}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </section>
                                );
                              } else if (block.block_type === 'HeroGrid') {
                                blockContent = (
                                  <section className={`cms-herogrid ${padClass} ${padHClass} ${themeClass} ${alignClass}`} style={sectionStyle}>
                                    <div className={`container ${widthClass}`} style={containerStyle}>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                                          <img src={block.data.image_left} alt="Mosaic Left" style={{ width: '100%', height: '400px', objectFit: 'cover', border: '1px solid var(--color-border)' }} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                          <div>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{block.data.subtitle}</span>
                                            <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '2.5rem', fontWeight: 500, margin: '0.5rem 0 1rem 0', textTransform: 'uppercase' }}>{block.data.title}</h2>
                                            <p style={{ color: 'var(--color-gray)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>{block.data.description}</p>
                                            {block.data.cta_text && (
                                              <span style={{ borderBottom: '1px solid var(--color-text)', paddingBottom: '4px', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.1em', cursor: 'default' }}>{block.data.cta_text}</span>
                                            )}
                                          </div>
                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <img src={block.data.image_right_top} alt="Mosaic Right Top" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                                            <img src={block.data.image_right_bottom} alt="Mosaic Right Bottom" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </section>
                                );
                              } else if (block.block_type === 'HeroSlider') {
                                blockContent = (
                                  <CmsHeroSlider block={block} style={sectionStyle} />
                                );
                              } else if (block.block_type === 'MultiHeroCarousel') {
                                blockContent = (
                                  <CmsMultiHeroCarousel block={block} style={sectionStyle} />
                                );
                              }

                              return (
                                <div
                                  key={block.id}
                                  onClick={sandboxMode === 'edit' ? (e) => {
                                    e.stopPropagation();
                                    setSelectedBlockId(block.id);
                                  } : undefined}
                                  className="cms-canvas-block-wrapper"
                                  style={{
                                    border: sandboxMode === 'edit' ? (isSelected ? '2px solid var(--color-text)' : '1px dashed var(--color-border)') : 'none',
                                    position: 'relative',
                                    cursor: sandboxMode === 'edit' ? 'pointer' : 'default',
                                    margin: sandboxMode === 'edit' ? '0.5rem 0' : '0',
                                    transition: 'all 0.2s',
                                    pointerEvents: 'auto',
                                    ...(manualWidth ? { maxWidth: `${manualWidth}px`, width: '100%', marginLeft: 'auto', marginRight: 'auto' } : {})
                                  }}
                                >
                                  {sandboxMode === 'edit' && (
                                    <div className="cms-action-rail" style={{
                                      position: 'absolute',
                                      top: '-15px',
                                      right: '10px',
                                      backgroundColor: 'var(--color-text)',
                                      color: 'var(--color-bg)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                      zIndex: 200,
                                      fontSize: '0.7rem',
                                      opacity: 0,
                                      transition: 'opacity 0.2s, transform 0.2s',
                                      transform: 'translateY(5px)'
                                    }}>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDuplicateBlock(block.id); }}
                                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                                        title="Duplicate Block"
                                      >
                                        <Copy size={11} /> Duplicate
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleToggleGlobalBlock(block.id); }}
                                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                                      >
                                        <Globe size={11} /> Global
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}
                                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                                      >
                                        <Trash2 size={11} /> Delete
                                      </button>
                                    </div>
                                  )}

                                  {sandboxMode === 'edit' && (
                                    <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', zIndex: 10, display: 'flex', gap: '0.25rem' }}>
                                      <span style={{ fontSize: '0.55rem', backgroundColor: 'var(--color-text)', color: 'var(--color-bg)', padding: '2px 6px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                        &lt;{block.semantic_tag || 'section'}&gt;
                                      </span>
                                      {block.status === 'draft' && (
                                        <span style={{ fontSize: '0.55rem', backgroundColor: '#eab308', color: '#000', padding: '2px 6px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                          Draft
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  <div style={{ pointerEvents: sandboxMode === 'edit' ? 'none' : 'auto' }}>
                                    {blockContent}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. RIGHT COLUMN: ADVANCED COMPONENT CONTEXT CONFIGURATION */}
                  {(() => {
                    const editMenuFn = () => {
                      const block = cmsPageConfig.blocks.find((b: any) => b.id === selectedBlockId);
                      if (!block) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-gray)', textAlign: 'center', gap: '0.5rem', padding: '1rem' }}>
                            <Sliders size={24} />
                            <span style={{ fontSize: '0.8rem' }}>Select a dynamic layout block on the structure tree or live canvas to orchestrate motion, constraints, and geometry.</span>
                          </div>
                        );
                      }

                      // Pre-fill helper configuration blocks
                      const layConfig = getBlockLayoutConfig(block);
                      const animConfig = getBlockAnimationConfig(block);
                      const designSync = getBlockDesignSync(block);

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>

                          {/* Selected Block Info */}
                          <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{block.block_type}</span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>{block.id.substring(0, 15)}</span>
                            </div>

                            {/* Semantic tag and Status selector toggle */}
                            <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Tag:</span>
                                <select
                                  value={block.semantic_tag || 'section'}
                                  onChange={e => {
                                    const updated = cmsPageConfig.blocks.map((b: any) => b.id === block.id ? { ...b, semantic_tag: e.target.value } : b);
                                    setCmsPageConfig({ ...cmsPageConfig, blocks: updated });
                                  }}
                                  className="admin-select"
                                  style={{ padding: '2px 6px', fontSize: '0.65rem' }}
                                >
                                  <option value="section">&lt;section&gt;</option>
                                  <option value="article">&lt;article&gt;</option>
                                  <option value="aside">&lt;aside&gt;</option>
                                  <option value="div">&lt;div&gt;</option>
                                  <option value="footer">&lt;footer&gt;</option>
                                </select>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Status:</span>
                                <select
                                  value={block.status || 'published'}
                                  onChange={e => {
                                    const updated = cmsPageConfig.blocks.map((b: any) => b.id === block.id ? { ...b, status: e.target.value } : b);
                                    setCmsPageConfig({ ...cmsPageConfig, blocks: updated });
                                  }}
                                  className="admin-select"
                                  style={{ padding: '2px 6px', fontSize: '0.65rem', color: block.status === 'published' ? '#22c55e' : '#eab308', fontWeight: 'bold' }}
                                >
                                  <option value="published">Published</option>
                                  <option value="draft">Draft</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Five Tabs Headers */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2px', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.35rem' }}>
                            {[
                              { id: 'content', label: 'Content', icon: <Edit3 size={11} /> },
                              { id: 'motion', label: 'Motion', icon: <Sparkles size={11} /> },
                              { id: 'geometry', label: 'Layout', icon: <Grid size={11} /> },
                              { id: 'design', label: 'Token', icon: <Settings size={11} /> },
                              { id: 'cta', label: 'Route', icon: <Link size={11} /> }
                            ].map(t => {
                              const isSel = activeConfigTab === t.id;
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => setActiveConfigTab(t.id as any)}
                                  style={{
                                    background: 'none', border: 'none', padding: '0.35rem 0',
                                    fontSize: '0.7rem', fontWeight: isSel ? '700' : '400',
                                    color: isSel ? 'var(--color-text)' : 'var(--color-gray)',
                                    borderBottom: isSel ? '2px solid var(--color-text)' : 'none',
                                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'
                                  }}
                                >
                                  {t.icon}
                                  <span>{t.label}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Tab Content Panels */}
                          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8rem', paddingRight: '4px' }}>

                            {/* TAB CONTENT: COMPONENT CONTENT FIELDS */}
                            {activeConfigTab === 'content' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {block.block_type === 'HeroBanner' && (
                                  <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Hero Title</span>
                                      <input
                                        type="text"
                                        value={block.data.title || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'title', e.target.value)}
                                        className="admin-input"
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Hero Subtitle</span>
                                      <input
                                        type="text"
                                        value={block.data.subtitle || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'subtitle', e.target.value)}
                                        className="admin-input"
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Description</span>
                                      <textarea
                                        value={block.data.description || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'description', e.target.value)}
                                        className="admin-input"
                                        rows={3}
                                        style={{ resize: 'vertical' }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Hero Layout Style</span>
                                      <select
                                        value={block.data.layout || 'split'}
                                        onChange={e => handleUpdateBlockData(block.id, 'layout', e.target.value)}
                                        className="admin-select"
                                      >
                                        <option value="split">Split Screen Campaign</option>
                                        <option value="standard">Standard Centred Overlay</option>
                                      </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                                      <span style={{ fontWeight: 600 }}>Desktop Image</span>
                                      {block.data.desktop_image && (
                                        <img src={block.data.desktop_image} alt="Desktop Preview" style={{ width: '100%', height: '80px', objectFit: 'cover', border: '1px solid var(--color-border)', marginBottom: '0.25rem' }} />
                                      )}
                                      <input
                                        type="text"
                                        placeholder="Paste Image URL..."
                                        value={block.data.desktop_image || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'desktop_image', e.target.value)}
                                        className="admin-input"
                                        style={{ fontSize: '0.75rem' }}
                                      />
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <label className="btn btn-secondary" style={{ padding: '0.35rem 0.5rem', fontSize: '0.7rem', cursor: 'pointer', margin: 0, flex: 1, textAlign: 'center' }}>
                                          {uploadingField === 'desktop_image' ? 'Uploading...' : 'Upload File'}
                                          <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={async e => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                await handleContentImageUpload(block.id, 'desktop_image', file);
                                              }
                                            }}
                                          />
                                        </label>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                      <span style={{ fontWeight: 600 }}>Mobile Image</span>
                                      {block.data.mobile_image && (
                                        <img src={block.data.mobile_image} alt="Mobile Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', border: '1px solid var(--color-border)', marginBottom: '0.25rem' }} />
                                      )}
                                      <input
                                        type="text"
                                        placeholder="Paste Image URL..."
                                        value={block.data.mobile_image || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'mobile_image', e.target.value)}
                                        className="admin-input"
                                        style={{ fontSize: '0.75rem' }}
                                      />
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <label className="btn btn-secondary" style={{ padding: '0.35rem 0.5rem', fontSize: '0.7rem', cursor: 'pointer', margin: 0, flex: 1, textAlign: 'center' }}>
                                          {uploadingField === 'mobile_image' ? 'Uploading...' : 'Upload File'}
                                          <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={async e => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                await handleContentImageUpload(block.id, 'mobile_image', file);
                                              }
                                            }}
                                          />
                                        </label>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                                      <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>Primary CTA Text</span>
                                        <input
                                          type="text"
                                          value={block.data.cta_text || ''}
                                          onChange={e => handleUpdateBlockData(block.id, 'cta_text', e.target.value)}
                                          className="admin-input"
                                        />
                                      </label>
                                      <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>Primary CTA Link</span>
                                        <input
                                          type="text"
                                          value={block.data.cta_url || ''}
                                          onChange={e => handleUpdateBlockData(block.id, 'cta_url', e.target.value)}
                                          className="admin-input"
                                        />
                                      </label>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                      <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>Secondary CTA Text</span>
                                        <input
                                          type="text"
                                          value={block.data.secondary_cta_text || ''}
                                          onChange={e => handleUpdateBlockData(block.id, 'secondary_cta_text', e.target.value)}
                                          className="admin-input"
                                        />
                                      </label>
                                      <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>Secondary CTA Link</span>
                                        <input
                                          type="text"
                                          value={block.data.secondary_cta_url || ''}
                                          onChange={e => handleUpdateBlockData(block.id, 'secondary_cta_url', e.target.value)}
                                          className="admin-input"
                                        />
                                      </label>
                                    </div>
                                  </>
                                )}

                                {block.block_type === 'PromotionalSlider' && (
                                  <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Ticker Style Mode</span>
                                      <select
                                        value={block.data.variant || 'flash_sale_countdown'}
                                        onChange={e => handleUpdateBlockData(block.id, 'variant', e.target.value)}
                                        className="admin-select"
                                      >
                                        <option value="flash_sale_countdown">Flash Sale Countdown Ticker</option>
                                        <option value="standard">Scrolling Announcement Bar</option>
                                      </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Bar Background Hex Color</span>
                                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <input
                                          type="color"
                                          value={block.data.background_color || '#0c0a09'}
                                          onChange={e => handleUpdateBlockData(block.id, 'background_color', e.target.value)}
                                          style={{ width: '36px', height: '36px', border: '1px solid var(--color-border)', cursor: 'pointer', padding: 0, backgroundColor: 'transparent' }}
                                        />
                                        <input
                                          type="text"
                                          value={block.data.background_color || '#0c0a09'}
                                          onChange={e => handleUpdateBlockData(block.id, 'background_color', e.target.value)}
                                          className="admin-input"
                                          placeholder="#0c0a09"
                                          style={{ flex: 1 }}
                                        />
                                      </div>
                                    </div>
                                    {block.data.variant === 'flash_sale_countdown' && (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontWeight: 600 }}>Countdown Expiry Target</span>
                                        <input
                                          type="text"
                                          placeholder="e.g. 2026-06-25T23:59:59Z"
                                          value={block.data.countdown_target_timestamp || ''}
                                          onChange={e => handleUpdateBlockData(block.id, 'countdown_target_timestamp', e.target.value)}
                                          className="admin-input"
                                        />
                                        <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>ISO timestamp format representing the exact expiry moment.</span>
                                      </div>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600 }}>Announcement Items</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const currentSlides = block.data.slides || [];
                                            const updated = [...currentSlides, { text: 'New promo ticker slide...', link_url: '/shop/all' }];
                                            handleUpdateBlockData(block.id, 'slides', updated);
                                          }}
                                          className="btn btn-secondary"
                                          style={{ padding: '2px 8px', fontSize: '0.65rem' }}
                                        >
                                          + Add slide
                                        </button>
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {(block.data.slides || []).map((slide: any, sIdx: number) => (
                                          <div key={sIdx} style={{ border: '1px solid var(--color-border)', padding: '0.5rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.25rem', position: 'relative' }}>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updated = (block.data.slides || []).filter((_: any, i: number) => i !== sIdx);
                                                handleUpdateBlockData(block.id, 'slides', updated);
                                              }}
                                              style={{ position: 'absolute', top: '4px', right: '4px', border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                                            >
                                              ×
                                            </button>
                                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                              <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Slide Text</span>
                                              <input
                                                type="text"
                                                value={slide.text || ''}
                                                onChange={e => {
                                                  const updated = [...block.data.slides];
                                                  updated[sIdx] = { ...updated[sIdx], text: e.target.value };
                                                  handleUpdateBlockData(block.id, 'slides', updated);
                                                }}
                                                className="admin-input"
                                                style={{ padding: '0.25rem', fontSize: '0.75rem' }}
                                              />
                                            </label>
                                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                              <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Link Target URL</span>
                                              <input
                                                type="text"
                                                value={slide.link_url || ''}
                                                onChange={e => {
                                                  const updated = [...block.data.slides];
                                                  updated[sIdx] = { ...updated[sIdx], link_url: e.target.value };
                                                  handleUpdateBlockData(block.id, 'slides', updated);
                                                }}
                                                className="admin-input"
                                                style={{ padding: '0.25rem', fontSize: '0.75rem' }}
                                              />
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}

                                {block.block_type === 'CategoryGrid' && (
                                  <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Grid Title</span>
                                      <input
                                        type="text"
                                        value={block.data.title || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'title', e.target.value)}
                                        className="admin-input"
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                                      <span style={{ fontWeight: 600 }}>Responsive Grid Columns</span>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                        <span>Mobile Columns:</span>
                                        <strong>{layConfig.grid_setup?.columns_mobile || 1}</strong>
                                      </div>
                                      <input
                                        type="range" min="1" max="4"
                                        value={layConfig.grid_setup?.columns_mobile || 1}
                                        onChange={e => {
                                          const setup = layConfig.grid_setup || { columns_mobile: 1, columns_tablet: 2, columns_desktop: 4 };
                                          handleUpdateBlockLayout(block.id, 'grid_setup', { ...setup, columns_mobile: Number(e.target.value) });
                                        }}
                                        style={{ width: '100%', cursor: 'ew-resize' }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                        <span>Tablet Columns:</span>
                                        <strong>{layConfig.grid_setup?.columns_tablet || 2}</strong>
                                      </div>
                                      <input
                                        type="range" min="1" max="6"
                                        value={layConfig.grid_setup?.columns_tablet || 2}
                                        onChange={e => {
                                          const setup = layConfig.grid_setup || { columns_mobile: 1, columns_tablet: 2, columns_desktop: 4 };
                                          handleUpdateBlockLayout(block.id, 'grid_setup', { ...setup, columns_tablet: Number(e.target.value) });
                                        }}
                                        style={{ width: '100%', cursor: 'ew-resize' }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                        <span>Laptop/Desktop Columns:</span>
                                        <strong>{layConfig.grid_setup?.columns_desktop || 4}</strong>
                                      </div>
                                      <input
                                        type="range" min="1" max="8"
                                        value={layConfig.grid_setup?.columns_desktop || 4}
                                        onChange={e => {
                                          const setup = layConfig.grid_setup || { columns_mobile: 1, columns_tablet: 2, columns_desktop: 4 };
                                          handleUpdateBlockLayout(block.id, 'grid_setup', { ...setup, columns_desktop: Number(e.target.value) });
                                          handleUpdateBlockData(block.id, 'gridColumns', Number(e.target.value));
                                        }}
                                        style={{ width: '100%', cursor: 'ew-resize' }}
                                      />
                                    </div>
                                    {/* Quick Grid Presets */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                                      <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Quick Columns Presets (Desktop-Tablet-Mobile)</span>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.35rem' }}>
                                        {[
                                          { name: '1-Column List', desc: '1-1-1', mobile: 1, tablet: 1, desktop: 1 },
                                          { name: 'Classic Split', desc: '2-2-1', mobile: 1, tablet: 2, desktop: 2 },
                                          { name: 'Minimalist Trio', desc: '3-3-1', mobile: 1, tablet: 3, desktop: 3 },
                                          { name: 'Premium Quad', desc: '4-2-1', mobile: 1, tablet: 2, desktop: 4 },
                                          { name: 'Dense Showcase', desc: '6-3-2', mobile: 2, tablet: 3, desktop: 6 }
                                        ].map(preset => {
                                          const isSel = (layConfig.grid_setup?.columns_desktop === preset.desktop) &&
                                            (layConfig.grid_setup?.columns_tablet === preset.tablet) &&
                                            (layConfig.grid_setup?.columns_mobile === preset.mobile);
                                          return (
                                            <button
                                              key={preset.name}
                                              type="button"
                                              onClick={() => {
                                                handleUpdateBlockLayout(block.id, 'grid_setup', {
                                                  columns_mobile: preset.mobile,
                                                  columns_tablet: preset.tablet,
                                                  columns_desktop: preset.desktop,
                                                  gap: layConfig.grid_setup?.gap || 'gap-8'
                                                });
                                                handleUpdateBlockData(block.id, 'gridColumns', preset.desktop);
                                              }}
                                              style={{
                                                border: `1px solid ${isSel ? 'var(--color-text)' : 'var(--color-border)'}`,
                                                padding: '0.4rem 0.25rem',
                                                fontSize: '0.6rem',
                                                fontWeight: '700',
                                                backgroundColor: isSel ? 'var(--color-text)' : 'transparent',
                                                color: isSel ? 'var(--color-bg)' : 'var(--color-text)',
                                                cursor: 'pointer',
                                                textAlign: 'center'
                                              }}
                                            >
                                              <div>{preset.name}</div>
                                              <div style={{ fontSize: '0.55rem', opacity: 0.65, fontWeight: 'normal', marginTop: '2px' }}>{preset.desc}</div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600 }}>Grid Categories</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const currentCats = block.data.categories || [];
                                            const updated = [...currentCats, { name: 'New Category', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=300' }];
                                            handleUpdateBlockData(block.id, 'categories', updated);
                                          }}
                                          className="btn btn-secondary"
                                          style={{ padding: '2px 8px', fontSize: '0.65rem' }}
                                        >
                                          + Add category
                                        </button>
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {(block.data.categories || []).map((cat: any, cIdx: number) => {
                                          const catObj = typeof cat === 'string' ? { name: cat, image: '' } : cat;
                                          return (
                                            <div key={cIdx} style={{ border: '1px solid var(--color-border)', padding: '0.5rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.35rem', position: 'relative' }}>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updated = (block.data.categories || []).filter((_: any, i: number) => i !== cIdx);
                                                  handleUpdateBlockData(block.id, 'categories', updated);
                                                }}
                                                style={{ position: 'absolute', top: '4px', right: '4px', border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                                              >
                                                ×
                                              </button>
                                              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Category Name</span>
                                                <input
                                                  type="text"
                                                  value={catObj.name || ''}
                                                  onChange={e => {
                                                    const updated = [...block.data.categories];
                                                    const currentObj = typeof updated[cIdx] === 'string' ? { name: updated[cIdx], image: '' } : updated[cIdx];
                                                    updated[cIdx] = { ...currentObj, name: e.target.value };
                                                    handleUpdateBlockData(block.id, 'categories', updated);
                                                  }}
                                                  className="admin-input"
                                                  style={{ padding: '0.25rem', fontSize: '0.75rem' }}
                                                />
                                              </label>
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Category Image</span>
                                                {catObj.image && (
                                                  <img src={catObj.image} alt="Preview" style={{ width: '40px', height: '40px', objectFit: 'cover', border: '1px solid var(--color-border)' }} />
                                                )}
                                                <input
                                                  type="text"
                                                  placeholder="Image URL"
                                                  value={catObj.image || ''}
                                                  onChange={e => {
                                                    const updated = [...block.data.categories];
                                                    const currentObj = typeof updated[cIdx] === 'string' ? { name: updated[cIdx], image: '' } : updated[cIdx];
                                                    updated[cIdx] = { ...currentObj, image: e.target.value };
                                                    handleUpdateBlockData(block.id, 'categories', updated);
                                                  }}
                                                  className="admin-input"
                                                  style={{ padding: '0.25rem', fontSize: '0.7rem' }}
                                                />
                                                <label className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', cursor: 'pointer', margin: 0, textAlign: 'center' }}>
                                                  {uploadingField === `categories_${cIdx}` ? 'Uploading...' : 'Upload Image'}
                                                  <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={async e => {
                                                      const file = e.target.files?.[0];
                                                      if (file) {
                                                        await handleContentImageUpload(block.id, 'categories', file, cIdx);
                                                      }
                                                    }}
                                                  />
                                                </label>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </>
                                )}

                                {block.block_type === 'FeaturedProducts' && (
                                  <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Featured Section Title</span>
                                      <input
                                        type="text"
                                        value={block.data.title || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'title', e.target.value)}
                                        className="admin-input"
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Products Display Limit</span>
                                      <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={block.data.limit || 4}
                                        onChange={e => handleUpdateBlockData(block.id, 'limit', Number(e.target.value))}
                                        className="admin-input"
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Filter By Category</span>
                                      <select
                                        value={block.data.filter_category || 'all'}
                                        onChange={e => handleUpdateBlockData(block.id, 'filter_category', e.target.value)}
                                        className="admin-select"
                                      >
                                        <option value="all">All Products</option>
                                        <option value="men">Men's Collection</option>
                                        <option value="accessories">Accessories</option>
                                      </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                                      <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>CTA Button Text</span>
                                        <input
                                          type="text"
                                          value={block.data.cta_text || ''}
                                          onChange={e => handleUpdateBlockData(block.id, 'cta_text', e.target.value)}
                                          className="admin-input"
                                        />
                                      </label>
                                      <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>CTA Button Link</span>
                                        <input
                                          type="text"
                                          value={block.data.cta_url || ''}
                                          onChange={e => handleUpdateBlockData(block.id, 'cta_url', e.target.value)}
                                          className="admin-input"
                                        />
                                      </label>
                                    </div>
                                  </>
                                )}

                                {block.block_type === 'BrandStory' && (
                                  <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Story Subtitle</span>
                                      <input
                                        type="text"
                                        value={block.data.subtitle || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'subtitle', e.target.value)}
                                        className="admin-input"
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Story Title</span>
                                      <input
                                        type="text"
                                        value={block.data.title || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'title', e.target.value)}
                                        className="admin-input"
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Quote Highlight</span>
                                      <input
                                        type="text"
                                        value={block.data.quote || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'quote', e.target.value)}
                                        className="admin-input"
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Story Description</span>
                                      <textarea
                                        value={block.data.description || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'description', e.target.value)}
                                        className="admin-input"
                                        rows={4}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                                      <span style={{ fontWeight: 600 }}>Narrative Image</span>
                                      {block.data.image && (
                                        <img src={block.data.image} alt="Story Preview" style={{ width: '100%', height: '80px', objectFit: 'cover', border: '1px solid var(--color-border)', marginBottom: '0.25rem' }} />
                                      )}
                                      <input
                                        type="text"
                                        placeholder="Paste Image URL..."
                                        value={block.data.image || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'image', e.target.value)}
                                        className="admin-input"
                                      />
                                      <label className="btn btn-secondary" style={{ padding: '0.35rem 0.5rem', fontSize: '0.7rem', cursor: 'pointer', margin: 0, textAlign: 'center' }}>
                                        {uploadingField === 'image' ? 'Uploading...' : 'Upload Image File'}
                                        <input
                                          type="file"
                                          accept="image/*"
                                          style={{ display: 'none' }}
                                          onChange={async e => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              await handleContentImageUpload(block.id, 'image', file);
                                            }
                                          }}
                                        />
                                      </label>
                                    </div>
                                  </>
                                )}

                                {block.block_type === 'EditorialGallery' && (
                                  <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Gallery Title</span>
                                      <input
                                        type="text"
                                        value={block.data.title || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'title', e.target.value)}
                                        className="admin-input"
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Gallery Subtitle</span>
                                      <input
                                        type="text"
                                        value={block.data.subtitle || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'subtitle', e.target.value)}
                                        className="admin-input"
                                      />
                                    </div>
                                    {['image1', 'image2', 'image3'].map((imgKey, index) => (
                                      <div key={imgKey} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                                        <span style={{ fontWeight: 600 }}>Gallery Image {index + 1}</span>
                                        {block.data[imgKey] && (
                                          <img src={block.data[imgKey]} alt={`Gallery ${index + 1}`} style={{ width: '100%', height: '60px', objectFit: 'cover', border: '1px solid var(--color-border)' }} />
                                        )}
                                        <input
                                          type="text"
                                          placeholder="Paste URL..."
                                          value={block.data[imgKey] || ''}
                                          onChange={e => handleUpdateBlockData(block.id, imgKey, e.target.value)}
                                          className="admin-input"
                                          style={{ fontSize: '0.75rem' }}
                                        />
                                        <label className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem', cursor: 'pointer', margin: 0, textAlign: 'center' }}>
                                          {uploadingField === imgKey ? 'Uploading...' : `Upload Image ${index + 1}`}
                                          <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={async e => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                await handleContentImageUpload(block.id, imgKey, file);
                                              }
                                            }}
                                          />
                                        </label>
                                      </div>
                                    ))}
                                  </>
                                )}

                                {block.block_type === 'NewsletterSubscribe' && (
                                  <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Newsletter Title</span>
                                      <input
                                        type="text"
                                        value={block.data.title || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'title', e.target.value)}
                                        className="admin-input"
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Newsletter Subtitle</span>
                                      <input
                                        type="text"
                                        value={block.data.subtitle || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'subtitle', e.target.value)}
                                        className="admin-input"
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Subscribe Button Text</span>
                                      <input
                                        type="text"
                                        value={block.data.button_text || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'button_text', e.target.value)}
                                        className="admin-input"
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Input Placeholder Text</span>
                                      <input
                                        type="text"
                                        value={block.data.placeholder_text || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'placeholder_text', e.target.value)}
                                        className="admin-input"
                                      />
                                    </div>
                                  </>
                                )}

                                {block.block_type === 'Spacer' && (
                                  <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Spacer Height (pixels)</span>
                                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <input
                                          type="range" min="10" max="300" step="5"
                                          value={block.data.height || 60}
                                          onChange={e => handleUpdateBlockData(block.id, 'height', Number(e.target.value))}
                                          style={{ flex: 1, cursor: 'ew-resize' }}
                                        />
                                        <input
                                          type="number"
                                          value={block.data.height || 60}
                                          onChange={e => handleUpdateBlockData(block.id, 'height', Number(e.target.value))}
                                          className="admin-input"
                                          style={{ width: '60px' }}
                                        />
                                        <span>px</span>
                                      </div>
                                    </div>
                                  </>
                                )}

                                {block.block_type === 'HeroSlider' && (
                                  <>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                      <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                                        <input
                                          type="checkbox"
                                          checked={block.data.autoplay_enabled !== false}
                                          onChange={e => handleUpdateBlockData(block.id, 'autoplay_enabled', e.target.checked)}
                                        />
                                        Autoplay Enabled
                                      </label>
                                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '120px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Speed (ms)</span>
                                        <input
                                          type="number"
                                          min="1000"
                                          step="500"
                                          value={block.data.autoplay_speed || 4000}
                                          onChange={e => handleUpdateBlockData(block.id, 'autoplay_speed', Number(e.target.value))}
                                          className="admin-input"
                                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                                        />
                                      </label>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Slideshow Banners ({block.data.slides?.length || 0})</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const current = block.data.slides || [];
                                            const updated = [...current, {
                                              image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200",
                                              title: "NEW ARRIVAL",
                                              subtitle: "SEASON COLLECTION",
                                              cta_text: "SHOP NOW",
                                              cta_url: "/shop/all"
                                            }];
                                            handleUpdateBlockData(block.id, 'slides', updated);
                                          }}
                                          className="btn btn-secondary"
                                          style={{ padding: '4px 10px', fontSize: '0.7rem', fontWeight: 600 }}
                                        >
                                          + Add Slide
                                        </button>
                                      </div>

                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                                        {(block.data.slides || []).map((slide: any, sIdx: number) => (
                                          <div key={sIdx} style={{ border: '1px solid var(--color-border)', padding: '0.85rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.6rem', position: 'relative', backgroundColor: 'rgba(0,0,0,0.01)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--color-border)', paddingBottom: '0.35rem', marginBottom: '0.2rem' }}>
                                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-gray)' }}>Slide #{sIdx + 1}</span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updated = (block.data.slides || []).filter((_: any, i: number) => i !== sIdx);
                                                  handleUpdateBlockData(block.id, 'slides', updated);
                                                }}
                                                style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                                              >
                                                Delete Slide
                                              </button>
                                            </div>

                                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                              <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)', fontWeight: 600 }}>Slide Heading</span>
                                              <input
                                                type="text"
                                                value={slide.title || ''}
                                                onChange={e => {
                                                  const updated = [...(block.data.slides || [])];
                                                  updated[sIdx] = { ...updated[sIdx], title: e.target.value };
                                                  handleUpdateBlockData(block.id, 'slides', updated);
                                                }}
                                                className="admin-input"
                                                style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                                              />
                                            </label>

                                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                              <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)', fontWeight: 600 }}>Slide Subtitle</span>
                                              <input
                                                type="text"
                                                value={slide.subtitle || ''}
                                                onChange={e => {
                                                  const updated = [...(block.data.slides || [])];
                                                  updated[sIdx] = { ...updated[sIdx], subtitle: e.target.value };
                                                  handleUpdateBlockData(block.id, 'slides', updated);
                                                }}
                                                className="admin-input"
                                                style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                                              />
                                            </label>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                              <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)', fontWeight: 600 }}>Banner Image</span>
                                              {slide.image_url && (
                                                <img src={slide.image_url} alt="Slide Preview" style={{ width: '100%', height: '60px', objectFit: 'cover', border: '1px solid var(--color-border)', borderRadius: '2px', marginBottom: '0.25rem' }} />
                                              )}
                                              <input
                                                type="text"
                                                placeholder="https://example.com/image.jpg"
                                                value={slide.image_url || ''}
                                                onChange={e => {
                                                  const updated = [...(block.data.slides || [])];
                                                  updated[sIdx] = { ...updated[sIdx], image_url: e.target.value };
                                                  handleUpdateBlockData(block.id, 'slides', updated);
                                                }}
                                                className="admin-input"
                                                style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                                              />
                                              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.15rem' }}>
                                                <label className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem', cursor: 'pointer', margin: 0, flex: 1, textAlign: 'center', display: 'inline-block' }}>
                                                  {uploadingField === `slides_${sIdx}` ? 'Uploading...' : 'Upload Image File'}
                                                  <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={async e => {
                                                      const file = e.target.files?.[0];
                                                      if (file) {
                                                        await handleContentImageUpload(block.id, 'slides', file, sIdx);
                                                      }
                                                    }}
                                                  />
                                                </label>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const urls = [
                                                      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1200",
                                                      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=1200",
                                                      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200",
                                                      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1200"
                                                    ];
                                                    const rand = urls[Math.floor(Math.random() * urls.length)];
                                                    const updated = [...(block.data.slides || [])];
                                                    updated[sIdx] = { ...updated[sIdx], image_url: rand };
                                                    handleUpdateBlockData(block.id, 'slides', updated);
                                                  }}
                                                  style={{ fontSize: '0.6rem', border: '1px solid var(--color-border)', background: 'transparent', padding: '2px 6px', cursor: 'pointer', color: 'var(--color-gray)' }}
                                                >
                                                  Preset Lookbook Image
                                                </button>
                                              </div>
                                            </div>

                                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                              <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)', fontWeight: 600 }}>CTA Button Text</span>
                                              <input
                                                type="text"
                                                value={slide.cta_text || ''}
                                                onChange={e => {
                                                  const updated = [...(block.data.slides || [])];
                                                  updated[sIdx] = { ...updated[sIdx], cta_text: e.target.value };
                                                  handleUpdateBlockData(block.id, 'slides', updated);
                                                }}
                                                className="admin-input"
                                                style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                                              />
                                            </label>

                                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                              <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)', fontWeight: 600 }}>CTA Button Destination</span>
                                              <input
                                                type="text"
                                                value={slide.cta_url || ''}
                                                onChange={e => {
                                                  const updated = [...(block.data.slides || [])];
                                                  updated[sIdx] = { ...updated[sIdx], cta_url: e.target.value };
                                                  handleUpdateBlockData(block.id, 'slides', updated);
                                                }}
                                                className="admin-input"
                                                style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                                              />
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}

                                {block.block_type === 'MultiHeroCarousel' && (
                                  <>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                      <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                                        <input
                                          type="checkbox"
                                          checked={block.data.autoplay_enabled !== false}
                                          onChange={e => handleUpdateBlockData(block.id, 'autoplay_enabled', e.target.checked)}
                                        />
                                        Autoplay Enabled
                                      </label>
                                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '120px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Speed (ms)</span>
                                        <input
                                          type="number"
                                          min="1000"
                                          step="500"
                                          value={block.data.autoplay_speed || 4000}
                                          onChange={e => handleUpdateBlockData(block.id, 'autoplay_speed', Number(e.target.value))}
                                          className="admin-input"
                                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                                        />
                                      </label>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                                      <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                                        <input
                                          type="checkbox"
                                          checked={block.data.hide_content === true}
                                          onChange={e => handleUpdateBlockData(block.id, 'hide_content', e.target.checked)}
                                        />
                                        Hide Text Overlays (Image Only)
                                      </label>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Slide Gap</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-gray)' }}>{block.data.slide_gap || 20}px</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="10"
                                        max="30"
                                        value={block.data.slide_gap || 20}
                                        onChange={e => handleUpdateBlockData(block.id, 'slide_gap', Number(e.target.value))}
                                        style={{ width: '100%', accentColor: 'var(--color-text)', cursor: 'pointer' }}
                                      />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Carousel Banners ({block.data.slides?.length || 0})</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const current = block.data.slides || [];
                                            const updated = [...current, {
                                              image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600",
                                              title: "NEW COLLECTION",
                                              subtitle: "THAT MAKES AN IMPRESSION",
                                              badge: "NEWLY LAUNCHED",
                                              cta_text: "FLAT 50% OFF",
                                              cta_url: "/shop/all",
                                              show_cta: true
                                            }];
                                            handleUpdateBlockData(block.id, 'slides', updated);
                                          }}
                                          className="btn btn-secondary"
                                          style={{ padding: '4px 10px', fontSize: '0.7rem', fontWeight: 600 }}
                                        >
                                          + Add Slide
                                        </button>
                                      </div>

                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                                        {(block.data.slides || []).map((slide: any, sIdx: number) => (
                                          <div key={sIdx} style={{ border: '1px solid var(--color-border)', padding: '0.85rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.6rem', position: 'relative', backgroundColor: 'rgba(0,0,0,0.01)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--color-border)', paddingBottom: '0.35rem', marginBottom: '0.2rem' }}>
                                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-gray)' }}>Slide #{sIdx + 1}</span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updated = (block.data.slides || []).filter((_: any, i: number) => i !== sIdx);
                                                  handleUpdateBlockData(block.id, 'slides', updated);
                                                }}
                                                style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                                              >
                                                Delete Slide
                                              </button>
                                            </div>

                                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                              <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)', fontWeight: 600 }}>Slide Heading</span>
                                              <input
                                                type="text"
                                                value={slide.title || ''}
                                                onChange={e => {
                                                  const updated = [...(block.data.slides || [])];
                                                  updated[sIdx] = { ...updated[sIdx], title: e.target.value };
                                                  handleUpdateBlockData(block.id, 'slides', updated);
                                                }}
                                                className="admin-input"
                                                style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                                              />
                                            </label>

                                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                              <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)', fontWeight: 600 }}>Slide Subtitle</span>
                                              <input
                                                type="text"
                                                value={slide.subtitle || ''}
                                                onChange={e => {
                                                  const updated = [...(block.data.slides || [])];
                                                  updated[sIdx] = { ...updated[sIdx], subtitle: e.target.value };
                                                  handleUpdateBlockData(block.id, 'slides', updated);
                                                }}
                                                className="admin-input"
                                                style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                                              />
                                            </label>

                                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                              <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)', fontWeight: 600 }}>Slide Badge (e.g. NEWLY LAUNCHED)</span>
                                              <input
                                                type="text"
                                                value={slide.badge || ''}
                                                onChange={e => {
                                                  const updated = [...(block.data.slides || [])];
                                                  updated[sIdx] = { ...updated[sIdx], badge: e.target.value };
                                                  handleUpdateBlockData(block.id, 'slides', updated);
                                                }}
                                                className="admin-input"
                                                style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                                              />
                                            </label>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                              <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)', fontWeight: 600 }}>Banner Image</span>
                                              {slide.image_url && (
                                                <img src={slide.image_url} alt="Slide Preview" style={{ width: '100%', height: '60px', objectFit: 'cover', border: '1px solid var(--color-border)', borderRadius: '2px', marginBottom: '0.25rem' }} />
                                              )}
                                              <input
                                                type="text"
                                                placeholder="https://example.com/image.jpg"
                                                value={slide.image_url || ''}
                                                onChange={e => {
                                                  const updated = [...(block.data.slides || [])];
                                                  updated[sIdx] = { ...updated[sIdx], image_url: e.target.value };
                                                  handleUpdateBlockData(block.id, 'slides', updated);
                                                }}
                                                className="admin-input"
                                                style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                                              />
                                              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.15rem' }}>
                                                <label className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem', cursor: 'pointer', margin: 0, flex: 1, textAlign: 'center', display: 'inline-block' }}>
                                                  {uploadingField === `slides_${sIdx}` ? 'Uploading...' : 'Upload Image File'}
                                                  <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={async e => {
                                                      const file = e.target.files?.[0];
                                                      if (file) {
                                                        await handleContentImageUpload(block.id, 'slides', file, sIdx);
                                                      }
                                                    }}
                                                  />
                                                </label>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const urls = [
                                                      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600",
                                                      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600",
                                                      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600",
                                                      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=600"
                                                    ];
                                                    const rand = urls[Math.floor(Math.random() * urls.length)];
                                                    const updated = [...(block.data.slides || [])];
                                                    updated[sIdx] = { ...updated[sIdx], image_url: rand };
                                                    handleUpdateBlockData(block.id, 'slides', updated);
                                                  }}
                                                  style={{ fontSize: '0.6rem', border: '1px solid var(--color-border)', background: 'transparent', padding: '2px 6px', cursor: 'pointer', color: 'var(--color-gray)' }}
                                                >
                                                  Preset Lookbook Image
                                                </button>
                                              </div>
                                            </div>

                                            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.2rem' }}>
                                              <input
                                                type="checkbox"
                                                checked={slide.show_cta !== false}
                                                onChange={e => {
                                                  const updated = [...(block.data.slides || [])];
                                                  updated[sIdx] = { ...updated[sIdx], show_cta: e.target.checked };
                                                  handleUpdateBlockData(block.id, 'slides', updated);
                                                }}
                                              />
                                              Show CTA Button
                                            </label>

                                            {slide.show_cta !== false && (
                                              <>
                                                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                  <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)', fontWeight: 600 }}>CTA Button Text</span>
                                                  <input
                                                    type="text"
                                                    value={slide.cta_text || ''}
                                                    onChange={e => {
                                                      const updated = [...(block.data.slides || [])];
                                                      updated[sIdx] = { ...updated[sIdx], cta_text: e.target.value };
                                                      handleUpdateBlockData(block.id, 'slides', updated);
                                                    }}
                                                    className="admin-input"
                                                    style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                                                  />
                                                </label>

                                                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                  <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)', fontWeight: 600 }}>CTA Button Destination</span>
                                                  <input
                                                    type="text"
                                                    value={slide.cta_url || ''}
                                                    onChange={e => {
                                                      const updated = [...(block.data.slides || [])];
                                                      updated[sIdx] = { ...updated[sIdx], cta_url: e.target.value };
                                                      handleUpdateBlockData(block.id, 'slides', updated);
                                                    }}
                                                    className="admin-input"
                                                    style={{ padding: '0.4rem', fontSize: '0.75rem' }}
                                                  />
                                                </label>
                                              </>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}

                                {block.block_type === 'LuxuryFaq' && (
                                  <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>FAQ Section Title</span>
                                      <input
                                        type="text"
                                        value={block.data.title || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'title', e.target.value)}
                                        className="admin-input"
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>FAQ Section Subtitle</span>
                                      <input
                                        type="text"
                                        value={block.data.subtitle || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'subtitle', e.target.value)}
                                        className="admin-input"
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600 }}>FAQ Accordion Items</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const current = block.data.faqs || [];
                                            const updated = [...current, { question: 'New Question?', answer: 'Answer content here...' }];
                                            handleUpdateBlockData(block.id, 'faqs', updated);
                                          }}
                                          className="btn btn-secondary"
                                          style={{ padding: '2px 8px', fontSize: '0.65rem' }}
                                        >
                                          + Add FAQ
                                        </button>
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {(block.data.faqs || []).map((faq: any, fIdx: number) => (
                                          <div key={fIdx} style={{ border: '1px solid var(--color-border)', padding: '0.5rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.25rem', position: 'relative' }}>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updated = (block.data.faqs || []).filter((_: any, i: number) => i !== fIdx);
                                                handleUpdateBlockData(block.id, 'faqs', updated);
                                              }}
                                              style={{ position: 'absolute', top: '4px', right: '4px', border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                                            >
                                              ×
                                            </button>
                                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                              <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Question</span>
                                              <input
                                                type="text"
                                                value={faq.question || ''}
                                                onChange={e => {
                                                  const updated = [...block.data.faqs];
                                                  updated[fIdx] = { ...updated[fIdx], question: e.target.value };
                                                  handleUpdateBlockData(block.id, 'faqs', updated);
                                                }}
                                                className="admin-input"
                                                style={{ padding: '0.25rem', fontSize: '0.75rem' }}
                                              />
                                            </label>
                                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                              <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Answer</span>
                                              <textarea
                                                value={faq.answer || ''}
                                                onChange={e => {
                                                  const updated = [...block.data.faqs];
                                                  updated[fIdx] = { ...updated[fIdx], answer: e.target.value };
                                                  handleUpdateBlockData(block.id, 'faqs', updated);
                                                }}
                                                className="admin-input"
                                                style={{ padding: '0.25rem', fontSize: '0.75rem' }}
                                                rows={2}
                                              />
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}

                                {block.block_type === 'ReviewTestimonials' && (
                                  <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Testimonials Title</span>
                                      <input
                                        type="text"
                                        value={block.data.title || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'title', e.target.value)}
                                        className="admin-input"
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Testimonials Subtitle</span>
                                      <input
                                        type="text"
                                        value={block.data.subtitle || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'subtitle', e.target.value)}
                                        className="admin-input"
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600 }}>Client Testimonials</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const current = block.data.reviews || [];
                                            const updated = [...current, { client_name: 'Jane Doe', rating: 5, quote: 'Absolute perfection. A masterpiece of clothing.', client_avatar: '' }];
                                            handleUpdateBlockData(block.id, 'reviews', updated);
                                          }}
                                          className="btn btn-secondary"
                                          style={{ padding: '2px 8px', fontSize: '0.65rem' }}
                                        >
                                          + Add Review
                                        </button>
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {(block.data.reviews || []).map((rev: any, rIdx: number) => (
                                          <div key={rIdx} style={{ border: '1px solid var(--color-border)', padding: '0.5rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.25rem', position: 'relative' }}>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updated = (block.data.reviews || []).filter((_: any, i: number) => i !== rIdx);
                                                handleUpdateBlockData(block.id, 'reviews', updated);
                                              }}
                                              style={{ position: 'absolute', top: '4px', right: '4px', border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                                            >
                                              ×
                                            </button>
                                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                              <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Client Name</span>
                                              <input
                                                type="text"
                                                value={rev.client_name || ''}
                                                onChange={e => {
                                                  const updated = [...block.data.reviews];
                                                  updated[rIdx] = { ...updated[rIdx], client_name: e.target.value };
                                                  handleUpdateBlockData(block.id, 'reviews', updated);
                                                }}
                                                className="admin-input"
                                                style={{ padding: '0.25rem', fontSize: '0.75rem' }}
                                              />
                                            </label>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                              <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Rating (1-5)</span>
                                                <input
                                                  type="number"
                                                  min="1" max="5"
                                                  value={rev.rating || 5}
                                                  onChange={e => {
                                                    const updated = [...block.data.reviews];
                                                    updated[rIdx] = { ...updated[rIdx], rating: Number(e.target.value) };
                                                    handleUpdateBlockData(block.id, 'reviews', updated);
                                                  }}
                                                  className="admin-input"
                                                  style={{ padding: '0.25rem', fontSize: '0.75rem' }}
                                                />
                                              </label>
                                              <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Avatar Initials</span>
                                                <input
                                                  type="text"
                                                  value={rev.client_avatar || ''}
                                                  onChange={e => {
                                                    const updated = [...block.data.reviews];
                                                    updated[rIdx] = { ...updated[rIdx], client_avatar: e.target.value };
                                                    handleUpdateBlockData(block.id, 'reviews', updated);
                                                  }}
                                                  className="admin-input"
                                                  style={{ padding: '0.25rem', fontSize: '0.75rem' }}
                                                  placeholder="JD"
                                                />
                                              </label>
                                            </div>
                                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                              <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Quote</span>
                                              <textarea
                                                value={rev.quote || ''}
                                                onChange={e => {
                                                  const updated = [...block.data.reviews];
                                                  updated[rIdx] = { ...updated[rIdx], quote: e.target.value };
                                                  handleUpdateBlockData(block.id, 'reviews', updated);
                                                }}
                                                className="admin-input"
                                                style={{ padding: '0.25rem', fontSize: '0.75rem' }}
                                                rows={2}
                                              />
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}

                                {block.block_type === 'LogoCloud' && (
                                  <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Brand Cloud Title</span>
                                      <input
                                        type="text"
                                        value={block.data.title || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'title', e.target.value)}
                                        className="admin-input"
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600 }}>Featured Brand Logos</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const current = block.data.logos || [];
                                            const updated = [...current, { name: 'Vogue', image_url: '' }];
                                            handleUpdateBlockData(block.id, 'logos', updated);
                                          }}
                                          className="btn btn-secondary"
                                          style={{ padding: '2px 8px', fontSize: '0.65rem' }}
                                        >
                                          + Add Logo
                                        </button>
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {(block.data.logos || []).map((logo: any, lIdx: number) => (
                                          <div key={lIdx} style={{ border: '1px solid var(--color-border)', padding: '0.5rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.25rem', position: 'relative' }}>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updated = (block.data.logos || []).filter((_: any, i: number) => i !== lIdx);
                                                handleUpdateBlockData(block.id, 'logos', updated);
                                              }}
                                              style={{ position: 'absolute', top: '4px', right: '4px', border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                                            >
                                              ×
                                            </button>
                                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                              <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Brand Name</span>
                                              <input
                                                type="text"
                                                value={logo.name || ''}
                                                onChange={e => {
                                                  const updated = [...block.data.logos];
                                                  updated[lIdx] = { ...updated[lIdx], name: e.target.value };
                                                  handleUpdateBlockData(block.id, 'logos', updated);
                                                }}
                                                className="admin-input"
                                                style={{ padding: '0.25rem', fontSize: '0.75rem' }}
                                              />
                                            </label>
                                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                              <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Logo Image URL (Optional)</span>
                                              <input
                                                type="text"
                                                value={logo.image_url || ''}
                                                onChange={e => {
                                                  const updated = [...block.data.logos];
                                                  updated[lIdx] = { ...updated[lIdx], image_url: e.target.value };
                                                  handleUpdateBlockData(block.id, 'logos', updated);
                                                }}
                                                className="admin-input"
                                                style={{ padding: '0.25rem', fontSize: '0.75rem' }}
                                                placeholder="Paste URL..."
                                              />
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}

                                {block.block_type === 'HeroGrid' && (
                                  <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Grid Hero Title</span>
                                      <input
                                        type="text"
                                        value={block.data.title || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'title', e.target.value)}
                                        className="admin-input"
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Grid Hero Subtitle</span>
                                      <input
                                        type="text"
                                        value={block.data.subtitle || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'subtitle', e.target.value)}
                                        className="admin-input"
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontWeight: 600 }}>Description Narrative</span>
                                      <textarea
                                        value={block.data.description || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'description', e.target.value)}
                                        className="admin-input"
                                        rows={3}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                                      <span style={{ fontWeight: 600 }}>Left Highlight Image</span>
                                      <input
                                        type="text"
                                        value={block.data.image_left || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'image_left', e.target.value)}
                                        className="admin-input"
                                        style={{ fontSize: '0.75rem' }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                      <span style={{ fontWeight: 600 }}>Top Right Auxiliary Image</span>
                                      <input
                                        type="text"
                                        value={block.data.image_right_top || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'image_right_top', e.target.value)}
                                        className="admin-input"
                                        style={{ fontSize: '0.75rem' }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                      <span style={{ fontWeight: 600 }}>Bottom Right Auxiliary Image</span>
                                      <input
                                        type="text"
                                        value={block.data.image_right_bottom || ''}
                                        onChange={e => handleUpdateBlockData(block.id, 'image_right_bottom', e.target.value)}
                                        className="admin-input"
                                        style={{ fontSize: '0.75rem' }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                                      <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>CTA text</span>
                                        <input
                                          type="text"
                                          value={block.data.cta_text || ''}
                                          onChange={e => handleUpdateBlockData(block.id, 'cta_text', e.target.value)}
                                          className="admin-input"
                                        />
                                      </label>
                                      <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.7rem' }}>CTA link</span>
                                        <input
                                          type="text"
                                          value={block.data.cta_url || ''}
                                          onChange={e => handleUpdateBlockData(block.id, 'cta_url', e.target.value)}
                                          className="admin-input"
                                        />
                                      </label>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}

                            {/* TAB A: MOTION & INTERACTION */}
                            {activeConfigTab === 'motion' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                {/* Hover Micro-Interactions */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  <span style={{ fontWeight: 600 }}>Hover Micro-Interaction Presets</span>
                                  <select
                                    value={animConfig.hover_preset || 'scale_and_shift'}
                                    onChange={e => handleUpdateBlockAnimation(block.id, 'hover_preset', e.target.value)}
                                    className="admin-select"
                                  >
                                    <option value="none">None (Static)</option>
                                    <option value="magnetic">Magnetic Snap (Cursor Delta Vector Pull)</option>
                                    <option value="scale_and_shift">Scale & Shift + Sheen (Lift + Glare)</option>
                                    <option value="minimal_shift">Minimal Translate Lift</option>
                                  </select>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Assigns state-driven hardware-accelerated transitions to layout element containers on hover vectors.</span>
                                </div>

                                {/* Scroll entry transition */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  <span style={{ fontWeight: 600 }}>Scroll Entry Effect (IntersectionObserver)</span>
                                  <select
                                    value={animConfig.preset || 'reveal_up'}
                                    onChange={e => handleUpdateBlockAnimation(block.id, 'preset', e.target.value)}
                                    className="admin-select"
                                  >
                                    <option value="none">Immediate</option>
                                    <option value="reveal_up">Reveal-Up (Cubic-Bezier 20px Offset)</option>
                                    <option value="fade_in">Fade In</option>
                                  </select>
                                </div>

                                {/* Stagger Toggle */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      checked={animConfig.stagger_children || false}
                                      onChange={e => handleUpdateBlockAnimation(block.id, 'stagger_children', e.target.checked)}
                                    />
                                    <span style={{ fontWeight: 600 }}>Stagger Children Transition</span>
                                  </label>
                                  {animConfig.stagger_children && (
                                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginLeft: '1.25rem', marginTop: '0.25rem' }}>
                                      <span style={{ fontSize: '0.7rem' }}>Incremental Delay (ms)</span>
                                      <input
                                        type="number"
                                        value={animConfig.stagger_children_ms || 50}
                                        onChange={e => handleUpdateBlockAnimation(block.id, 'stagger_children_ms', Number(e.target.value))}
                                        className="admin-input"
                                        style={{ padding: '0.35rem' }}
                                      />
                                    </label>
                                  )}
                                </div>

                                {/* Tactile Indicator Toggle */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      checked={animConfig.tactile_button_feedback || false}
                                      onChange={e => handleUpdateBlockAnimation(block.id, 'tactile_button_feedback', e.target.checked)}
                                    />
                                    <span style={{ fontWeight: 600 }}>Tactile Button Feedback</span>
                                  </label>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)', marginLeft: '1.25rem' }}>Enables micro-animations on internal CTAs (e.g. arrow translations, shopping cart spin).</span>
                                </div>
                              </div>
                            )}

                            {/* TAB B: FLUID GEOMETRY & BREAKPOINTS */}
                            {activeConfigTab === 'geometry' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                {/* Clamp Padding Preset Matrix */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  <span style={{ fontWeight: 600 }}>Clamp Engine Spacing Preset</span>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.35rem' }}>
                                    {[
                                      { id: 'studio_minimal', name: 'Studio Minimal', formula: 'py-[clamp(1rem,2vw,1.5rem)] px-[clamp(1rem,2vw,1.5rem)]' },
                                      { id: 'compact', name: 'Compact', formula: 'py-[clamp(2rem,4vw,4rem)] px-[clamp(1rem,3vw,2rem)]' },
                                      { id: 'editorial', name: 'Balanced Canvas', formula: 'py-[clamp(4rem,8vw,8rem)] px-[clamp(1.5rem,5vw,4rem)]' },
                                      { id: 'grand', name: 'Grand Gallery', formula: 'py-[clamp(8rem,14vw,14rem)] px-[clamp(2rem,8vw,6rem)]' },
                                      { id: 'hero_fluid', name: 'Hero Fluid', formula: 'py-[clamp(10rem,18vw,20rem)] px-[clamp(3rem,10vw,8rem)]' }
                                    ].map(opt => {
                                      const isSel = (layConfig.padding?.preset || 'editorial') === opt.id;
                                      return (
                                        <button
                                          key={opt.id}
                                          type="button"
                                          onClick={() => {
                                            handleUpdateBlockLayout(block.id, 'padding', { preset: opt.id, fluid_clamp: opt.formula });
                                            handleUpdateBlockData(block.id, 'sectionPadding', opt.id);
                                          }}
                                          style={{
                                            border: `1px solid ${isSel ? 'var(--color-text)' : 'var(--color-border)'}`,
                                            padding: '0.4rem',
                                            fontSize: '0.65rem',
                                            fontWeight: '700',
                                            backgroundColor: isSel ? 'var(--color-text)' : 'transparent',
                                            color: isSel ? 'var(--color-bg)' : 'var(--color-text)',
                                            cursor: 'pointer',
                                            textAlign: 'center'
                                          }}
                                        >
                                          {opt.name}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div style={{ fontSize: '0.6rem', color: 'var(--color-gray)', fontFamily: 'monospace', overflowX: 'auto', backgroundColor: '#f4f4f5', padding: '4px', whiteSpace: 'nowrap' }}>
                                    {layConfig.padding?.fluid_clamp || 'py-[clamp(3rem,6vw,6rem)]'}
                                  </div>
                                </div>

                                {/* Horizontal Clamp Spacing Preset */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px dashed var(--color-border)', paddingTop: '0.75rem' }}>
                                  <span style={{ fontWeight: 600 }}>Horizontal Spacing Preset</span>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.35rem' }}>
                                    {[
                                      { id: 'none', name: 'No Padding', formula: 'px-0' },
                                      { id: 'studio_minimal', name: 'Studio Minimal', formula: 'px-[clamp(1rem,2vw,1.5rem)]' },
                                      { id: 'compact', name: 'Compact', formula: 'px-[clamp(1rem,3vw,2.5rem)]' },
                                      { id: 'editorial', name: 'Balanced Canvas', formula: 'px-[clamp(2rem,6vw,5rem)]' },
                                      { id: 'grand', name: 'Grand Gallery', formula: 'px-[clamp(4rem,10vw,8rem)]' },
                                      { id: 'epic', name: 'Epic Margins', formula: 'px-[clamp(6rem,15vw,12rem)]' }
                                    ].map(opt => {
                                      const currentPadding = layConfig.padding || {};
                                      const isSel = (currentPadding.horizontal_preset || 'editorial') === opt.id;
                                      return (
                                        <button
                                          key={opt.id}
                                          type="button"
                                          onClick={() => {
                                            handleUpdateBlockLayout(block.id, 'padding', {
                                              ...currentPadding,
                                              horizontal_preset: opt.id,
                                              horizontal_fluid_clamp: opt.formula
                                            });
                                            handleUpdateBlockData(block.id, 'sectionHorizontalPadding', opt.id);
                                          }}
                                          style={{
                                            border: `1px solid ${isSel ? 'var(--color-text)' : 'var(--color-border)'}`,
                                            padding: '0.4rem',
                                            fontSize: '0.65rem',
                                            fontWeight: '700',
                                            backgroundColor: isSel ? 'var(--color-text)' : 'transparent',
                                            color: isSel ? 'var(--color-bg)' : 'var(--color-text)',
                                            cursor: 'pointer',
                                            textAlign: 'center'
                                          }}
                                        >
                                          {opt.name}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div style={{ fontSize: '0.6rem', color: 'var(--color-gray)', fontFamily: 'monospace', overflowX: 'auto', backgroundColor: '#f4f4f5', padding: '4px', whiteSpace: 'nowrap' }}>
                                    {layConfig.padding?.horizontal_fluid_clamp || 'px-[clamp(2rem,6vw,5rem)]'}
                                  </div>
                                </div>

                                {/* Aspect-Ratio Locks */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                                  <span style={{ fontWeight: 600 }}>Visual Aspect-Ratio Lock</span>
                                  <select
                                    value={layConfig.aspect_ratio || 'portrait'}
                                    onChange={e => {
                                      handleUpdateBlockLayout(block.id, 'aspect_ratio', e.target.value);
                                      handleUpdateBlockData(block.id, 'aspectRatio', e.target.value);
                                    }}
                                    className="admin-select"
                                  >
                                    <option value="portrait">Portrait (3:4)</option>
                                    <option value="square">Square (1:1)</option>
                                    <option value="landscape">Landscape (16:9)</option>
                                  </select>

                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', cursor: 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      checked={layConfig.object_fit === 'cover'}
                                      onChange={e => handleUpdateBlockLayout(block.id, 'object_fit', e.target.checked ? 'cover' : 'contain')}
                                    />
                                    <span style={{ fontSize: '0.75rem' }}>Force hardware-accelerated Object Cover Fill</span>
                                  </label>
                                </div>

                                {/* Manual Sizing Sliders */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Sliders size={13} style={{ color: 'var(--color-accent)' }} />
                                    Manual Dimensions Engine
                                  </span>

                                  {/* Manual Height Slider */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                      <span>Manual Height (px)</span>
                                      <span style={{ fontWeight: 'bold' }}>{layConfig.manual_height ? `${layConfig.manual_height}px` : 'Auto / CSS Default'}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                      <input
                                        type="range"
                                        min="100"
                                        max="1200"
                                        step="10"
                                        value={layConfig.manual_height || 400}
                                        disabled={!layConfig.manual_height}
                                        onChange={e => handleUpdateBlockLayout(block.id, 'manual_height', Number(e.target.value))}
                                        style={{ flexGrow: 1, accentColor: 'var(--color-text)' }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleUpdateBlockLayout(block.id, 'manual_height', layConfig.manual_height ? "" : "500");
                                        }}
                                        style={{
                                          padding: '2px 8px',
                                          fontSize: '0.65rem',
                                          border: '1px solid var(--color-border)',
                                          backgroundColor: layConfig.manual_height ? 'var(--color-text)' : 'transparent',
                                          color: layConfig.manual_height ? 'var(--color-bg)' : 'var(--color-text)',
                                          cursor: 'pointer',
                                          fontWeight: 700
                                        }}
                                      >
                                        {layConfig.manual_height ? 'Lock' : 'Set'}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Manual Width Slider */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                      <span>Manual Width (px)</span>
                                      <span style={{ fontWeight: 'bold' }}>{layConfig.manual_width ? `${layConfig.manual_width}px` : 'Auto / CSS Default'}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                      <input
                                        type="range"
                                        min="300"
                                        max="1920"
                                        step="20"
                                        value={layConfig.manual_width || 1200}
                                        disabled={!layConfig.manual_width}
                                        onChange={e => handleUpdateBlockLayout(block.id, 'manual_width', Number(e.target.value))}
                                        style={{ flexGrow: 1, accentColor: 'var(--color-text)' }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleUpdateBlockLayout(block.id, 'manual_width', layConfig.manual_width ? "" : "1200");
                                        }}
                                        style={{
                                          padding: '2px 8px',
                                          fontSize: '0.65rem',
                                          border: '1px solid var(--color-border)',
                                          backgroundColor: layConfig.manual_width ? 'var(--color-text)' : 'transparent',
                                          color: layConfig.manual_width ? 'var(--color-bg)' : 'var(--color-text)',
                                          cursor: 'pointer',
                                          fontWeight: 700
                                        }}
                                      >
                                        {layConfig.manual_width ? 'Lock' : 'Set'}
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Multi-device responsive columns sliders */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                                  <span style={{ fontWeight: 600 }}>Adaptive Responsive Grid Columns</span>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                      <span>Mobile Viewport (Cols)</span>
                                      <span style={{ fontWeight: 'bold' }}>{layConfig.grid_setup?.columns_mobile || 1}</span>
                                    </div>
                                    <input
                                      type="range" min="1" max="4"
                                      value={layConfig.grid_setup?.columns_mobile || 1}
                                      onChange={e => {
                                        const setup = layConfig.grid_setup || { columns_mobile: 1, columns_tablet: 2, columns_desktop: 4 };
                                        handleUpdateBlockLayout(block.id, 'grid_setup', { ...setup, columns_mobile: Number(e.target.value) });
                                      }}
                                      style={{ width: '100%', cursor: 'ew-resize' }}
                                    />
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                      <span>Tablet Viewport (Cols)</span>
                                      <span style={{ fontWeight: 'bold' }}>{layConfig.grid_setup?.columns_tablet || 2}</span>
                                    </div>
                                    <input
                                      type="range" min="1" max="6"
                                      value={layConfig.grid_setup?.columns_tablet || 2}
                                      onChange={e => {
                                        const setup = layConfig.grid_setup || { columns_mobile: 1, columns_tablet: 2, columns_desktop: 4 };
                                        handleUpdateBlockLayout(block.id, 'grid_setup', { ...setup, columns_tablet: Number(e.target.value) });
                                      }}
                                      style={{ width: '100%', cursor: 'ew-resize' }}
                                    />
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                      <span>Desktop Viewport (Cols)</span>
                                      <span style={{ fontWeight: 'bold' }}>{layConfig.grid_setup?.columns_desktop || 4}</span>
                                    </div>
                                    <input
                                      type="range" min="1" max="8"
                                      value={layConfig.grid_setup?.columns_desktop || 4}
                                      onChange={e => {
                                        const setup = layConfig.grid_setup || { columns_mobile: 1, columns_tablet: 2, columns_desktop: 4 };
                                        handleUpdateBlockLayout(block.id, 'grid_setup', { ...setup, columns_desktop: Number(e.target.value) });
                                        handleUpdateBlockData(block.id, 'gridColumns', Number(e.target.value));
                                      }}
                                      style={{ width: '100%', cursor: 'ew-resize' }}
                                    />
                                    {/* Quick Columns Presets */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.25rem' }}>
                                      <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Quick Columns Presets (Desktop-Tablet-Mobile)</span>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.35rem' }}>
                                        {[
                                          { name: '1-Column List', desc: '1-1-1', mobile: 1, tablet: 1, desktop: 1 },
                                          { name: 'Classic Split', desc: '2-2-1', mobile: 1, tablet: 2, desktop: 2 },
                                          { name: 'Minimalist Trio', desc: '3-3-1', mobile: 1, tablet: 3, desktop: 3 },
                                          { name: 'Premium Quad', desc: '4-2-1', mobile: 1, tablet: 2, desktop: 4 },
                                          { name: 'Dense Showcase', desc: '6-3-2', mobile: 2, tablet: 3, desktop: 6 }
                                        ].map(preset => {
                                          const isSel = (layConfig.grid_setup?.columns_desktop === preset.desktop) &&
                                            (layConfig.grid_setup?.columns_tablet === preset.tablet) &&
                                            (layConfig.grid_setup?.columns_mobile === preset.mobile);
                                          return (
                                            <button
                                              key={preset.name}
                                              type="button"
                                              onClick={() => {
                                                handleUpdateBlockLayout(block.id, 'grid_setup', {
                                                  columns_mobile: preset.mobile,
                                                  columns_tablet: preset.tablet,
                                                  columns_desktop: preset.desktop,
                                                  gap: layConfig.grid_setup?.gap || 'gap-8'
                                                });
                                                handleUpdateBlockData(block.id, 'gridColumns', preset.desktop);
                                              }}
                                              style={{
                                                border: `1px solid ${isSel ? 'var(--color-text)' : 'var(--color-border)'}`,
                                                padding: '0.4rem 0.25rem',
                                                fontSize: '0.6rem',
                                                fontWeight: '700',
                                                backgroundColor: isSel ? 'var(--color-text)' : 'transparent',
                                                color: isSel ? 'var(--color-bg)' : 'var(--color-text)',
                                                cursor: 'pointer',
                                                textAlign: 'center'
                                              }}
                                            >
                                              <div>{preset.name}</div>
                                              <div style={{ fontSize: '0.55rem', opacity: 0.65, fontWeight: 'normal', marginTop: '2px' }}>{preset.desc}</div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TAB C: DESIGN SYSTEM TOKENS */}
                            {activeConfigTab === 'design' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                {/* Typography Scale Lock */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  <span style={{ fontWeight: 600 }}>Typography Scale Constraint</span>
                                  <select
                                    value={designSync.typography_scale?.title || 'H2'}
                                    onChange={e => handleUpdateBlockDesign(block.id, 'typography_scale', { ...designSync.typography_scale, title: e.target.value })}
                                    className="admin-select"
                                  >
                                    <option value="Display">Display Scale (Light Italic Serif 64px)</option>
                                    <option value="H1">H1 Scale (Sleek Sans-Serif Bold 40px)</option>
                                    <option value="H2">H2 Scale (Architectural Semi-Bold 24px)</option>
                                    <option value="Subheading">Subheading Scale (Outfit Medium 18px)</option>
                                    <option value="Body">Body Scale (Inter Regular 15px)</option>
                                  </select>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Locks heading size parameters to prevent visual spacing fragmentation.</span>
                                </div>

                                {/* Glassmorphic Checkbox */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      checked={designSync.glassmorphic || false}
                                      onChange={e => {
                                        handleUpdateBlockDesign(block.id, 'glassmorphic', e.target.checked);
                                        handleUpdateBlockData(block.id, 'themeStyle', e.target.checked ? 'glass' : 'light');
                                      }}
                                    />
                                    <span style={{ fontWeight: 600 }}>Frosted Glassmorphism Layer</span>
                                  </label>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)', marginLeft: '1.25rem' }}>Applies backdrop blurs (`backdrop-blur-md`), background transparency opacities, and clean borders.</span>
                                </div>

                                {/* Corporate Theme palette restriction */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                                  <span style={{ fontWeight: 600 }}>Harmonious Palette Constraint</span>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    {[
                                      { name: 'light', label: 'Studio Background', value: '#fcfbfa' },
                                      { name: 'dark', label: 'Neutral Slate', value: '#18181b' },
                                      { name: 'accent', label: 'Warm Beige Accent', value: '#c5a880' }
                                    ].map(tok => {
                                      const isSel = block.data.themeStyle === tok.name;
                                      return (
                                        <div
                                          key={tok.name}
                                          onClick={() => {
                                            handleUpdateBlockData(block.id, 'themeStyle', tok.name);
                                            handleUpdateBlockDesign(block.id, 'color_profile', { bg: tok.label });
                                          }}
                                          style={{
                                            border: `1px solid ${isSel ? 'var(--color-text)' : 'var(--color-border)'}`,
                                            padding: '0.4rem',
                                            borderRadius: '2px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.35rem',
                                            backgroundColor: isSel ? 'rgba(0,0,0,0.03)' : 'transparent'
                                          }}
                                        >
                                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: tok.value, border: '1px solid var(--color-border)' }}></span>
                                          <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{tok.label}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Enforces corporate theme rules and contrast ratios (disallows custom arbitrary hex color pollution).</span>
                                </div>
                              </div>
                            )}

                            {/* TAB D: SMART CTA & ANCHORS */}
                            {activeConfigTab === 'cta' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                {/* Predictive Deep-Link Combobox Input */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  <span style={{ fontWeight: 600 }}>Predictive Route Deep-Link</span>
                                  <input
                                    type="text"
                                    placeholder="Type to search Products / Collections..."
                                    value={searchCtaQuery}
                                    onChange={e => setSearchCtaQuery(e.target.value)}
                                    className="admin-input"
                                    style={{ padding: '0.5rem' }}
                                  />
                                  {searchCtaQuery && (
                                    <div style={{ border: '1px solid var(--color-border)', borderRadius: '2px', maxHeight: '100px', overflowY: 'auto', backgroundColor: 'var(--color-bg)', zIndex: 10 }}>
                                      {products.filter(p => p.name.toLowerCase().includes(searchCtaQuery.toLowerCase())).slice(0, 3).map(p => (
                                        <div
                                          key={p.id}
                                          onClick={() => {
                                            handleUpdateBlockData(block.id, 'cta_url', `/product/${p.id}`);
                                            setSearchCtaQuery('');
                                          }}
                                          style={{ padding: '4px 8px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', fontSize: '0.7rem' }}
                                        >
                                          Product: {p.name}
                                        </div>
                                      ))}
                                      {['new-arrivals', 'accessories', 'all-apparel'].filter(slug => slug.includes(searchCtaQuery.toLowerCase())).map(slug => (
                                        <div
                                          key={slug}
                                          onClick={() => {
                                            handleUpdateBlockData(block.id, 'cta_url', `/shop/${slug}`);
                                            setSearchCtaQuery('');
                                          }}
                                          style={{ padding: '4px 8px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', fontSize: '0.7rem' }}
                                        >
                                          Collection: {slug}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Current URL Target: <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{block.data.cta_url || '/shop/all'}</span></div>
                                </div>

                                {/* Click Triggers event mapping */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                                  <span style={{ fontWeight: 600 }}>Functional Modals Mapper</span>
                                  <select
                                    value={block.data.cta_action || 'route'}
                                    onChange={e => handleUpdateBlockData(block.id, 'cta_action', e.target.value)}
                                    className="admin-select"
                                  >
                                    <option value="route">Route Redirect (Deep Link Navigation)</option>
                                    <option value="cart">Open Shopping Cart Drawer Event</option>
                                    <option value="modal">Launch Newsletter Slide-out Modal</option>
                                    <option value="anchor">Anchor Scroll (Offset to dynamic container)</option>
                                  </select>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Binds clicking the CTA button to active system events instead of a standard URL redirection.</span>
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    };
                    renderEditMenuRef = editMenuFn;
                    return null;
                  })()}

                </div>
              );
            })()}

            {/* Static Content Pages & SEO Wrapper */}
            {cmsSubTab === 'static' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Static editor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {(() => {
                    const page = staticPages.find(p => p.id === selectedStaticPageId);
                    if (!page) return null;

                    // Real-time SEO analysis computations
                    const titleLength = (page.meta_title || '').length;
                    const descLength = (page.meta_description || '').length;
                    const hasH1 = /<h1|h2|h3/i.test(page.content || '');
                    const wordCount = (page.content || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
                    const slugHasKeyword = page.focus_keywords ? page.focus_keywords.split(',').map((k: string) => k.trim()).some((kw: string) => page.slug.includes(kw)) : false;
                    const titleHasKeyword = page.focus_keywords ? page.focus_keywords.split(',').map((k: string) => k.trim()).some((kw: string) => page.meta_title?.toLowerCase().includes(kw.toLowerCase())) : false;
                    const descHasKeyword = page.focus_keywords ? page.focus_keywords.split(',').map((k: string) => k.trim()).some((kw: string) => page.meta_description?.toLowerCase().includes(kw.toLowerCase())) : false;

                    const analysisChecks = [
                      { label: 'Meta Title Length (30-60 chars)', pass: titleLength >= 30 && titleLength <= 60, detail: `Current: ${titleLength} chars` },
                      { label: 'Meta Description Length (120-160 chars)', pass: descLength >= 120 && descLength <= 160, detail: `Current: ${descLength} chars` },
                      { label: 'Content Headings (H1/H2/H3 Tag Present)', pass: hasH1, detail: hasH1 ? 'Found headings' : 'No headings found' },
                      { label: 'Focus Keywords in URL Slug', pass: slugHasKeyword, detail: slugHasKeyword ? 'Found keyword' : 'Focus keyword not in slug' },
                      { label: 'Focus Keywords in Meta Title', pass: titleHasKeyword, detail: titleHasKeyword ? 'Found keyword' : 'Focus keyword not in title' },
                      { label: 'Focus Keywords in Meta Description', pass: descHasKeyword, detail: descHasKeyword ? 'Found keyword' : 'Focus keyword not in description' },
                      { label: 'Content Word Count (> 150 words)', pass: wordCount >= 150, detail: `Current: ${wordCount} words` }
                    ];

                    const passCount = analysisChecks.filter(c => c.pass).length;
                    const seoScore = Math.round((passCount / analysisChecks.length) * 100);

                    let isJsonValid = true;
                    try {
                      if (page.schema_markup) {
                        JSON.parse(page.schema_markup);
                      }
                    } catch (e) {
                      isJsonValid = false;
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Selector and Actions Bar */}
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                          <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>
                            Selected Page
                            <select
                              value={selectedStaticPageId}
                              onChange={e => setSelectedStaticPageId(e.target.value)}
                              className="admin-select"
                              style={{ width: '100%', padding: '0.65rem' }}
                            >
                              {staticPages.map(p => <option key={p.id} value={p.id}>{p.title} (/{p.slug})</option>)}
                            </select>
                          </label>
                          <button
                            type="button"
                            onClick={handleCreateStaticPage}
                            className="btn btn-primary"
                            style={{ alignSelf: 'flex-end', height: '40px', padding: '0 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Plus size={14} /> Add Page
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStaticPage(page.id)}
                            className="btn btn-outline"
                            style={{ alignSelf: 'flex-end', height: '40px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #d32f2f', color: '#d32f2f', padding: 0 }}
                            title="Delete current page"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Internal Subtabs */}
                        <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedStaticTab('content')}
                            style={{
                              padding: '0.75rem 0',
                              border: 'none',
                              borderBottom: selectedStaticTab === 'content' ? '2px solid var(--color-text)' : '2px solid transparent',
                              fontWeight: selectedStaticTab === 'content' ? '600' : '400',
                              color: selectedStaticTab === 'content' ? 'var(--color-text)' : 'var(--color-gray)',
                              fontSize: '0.85rem',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <Edit3 size={14} /> Content Editor
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedStaticTab('seo')}
                            style={{
                              padding: '0.75rem 0',
                              border: 'none',
                              borderBottom: selectedStaticTab === 'seo' ? '2px solid var(--color-text)' : '2px solid transparent',
                              fontWeight: selectedStaticTab === 'seo' ? '600' : '400',
                              color: selectedStaticTab === 'seo' ? 'var(--color-text)' : 'var(--color-gray)',
                              fontSize: '0.85rem',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <Globe size={14} /> SEO & Schema Tags
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedStaticTab('analyzer')}
                            style={{
                              padding: '0.75rem 0',
                              border: 'none',
                              borderBottom: selectedStaticTab === 'analyzer' ? '2px solid var(--color-text)' : '2px solid transparent',
                              fontWeight: selectedStaticTab === 'analyzer' ? '600' : '400',
                              color: selectedStaticTab === 'analyzer' ? 'var(--color-text)' : 'var(--color-gray)',
                              fontSize: '0.85rem',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <Sliders size={14} /> SEO Analyzer
                            <span style={{ fontSize: '0.7rem', backgroundColor: seoScore >= 70 ? '#2e7d32' : '#c2410c', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '10px', marginLeft: '0.25rem' }}>
                              {seoScore}%
                            </span>
                          </button>
                        </div>

                        {/* Content Tab Content */}
                        {selectedStaticTab === 'content' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Page Title
                              <input type="text" value={page.title} onChange={e => {
                                setStaticPages(staticPages.map(p => p.id === page.id ? { ...p, title: e.target.value } : p));
                              }} style={{ padding: '0.65rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                            </label>

                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>URL Slug
                              <input type="text" value={page.slug} onChange={e => {
                                setStaticPages(staticPages.map(p => p.id === page.id ? { ...p, slug: e.target.value } : p));
                              }} style={{ padding: '0.65rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                            </label>

                            {/* Text Editor Container */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <span style={{ fontWeight: '500' }}>Headless Rich-Text Content WYSIWYG Pane</span>
                              <div style={{ border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ backgroundColor: 'rgba(0,0,0,0.03)', padding: '0.5rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                                  <button type="button" onClick={() => showToast("Format Bold Applied")} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)' }}>B</button>
                                  <button type="button" onClick={() => showToast("Format Italic Applied")} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontStyle: 'italic', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)' }}>I</button>
                                  <button type="button" onClick={() => showToast("Format Underline Applied")} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', textDecoration: 'underline', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)' }}>U</button>
                                  <button type="button" onClick={() => showToast("Format Heading 2 Added")} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)' }}>H2</button>
                                  <button type="button" onClick={() => showToast("Format List Added")} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)' }}>List</button>
                                </div>
                                <textarea
                                  value={page.content}
                                  onChange={e => handleSaveStaticPage(page.id, e.target.value)}
                                  rows={10}
                                  style={{ width: '100%', padding: '1rem', border: 'none', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <button onClick={() => showToast("Static page saved successfully!")} className="btn btn-primary" style={{ padding: '0.65rem 2rem' }}>Save Page Changes</button>
                            </div>
                          </div>
                        )}

                        {/* SEO Tab Content */}
                        {selectedStaticTab === 'seo' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <span style={{ fontWeight: '500' }}>Meta Title</span>
                                <span style={{ color: titleLength > 60 ? '#dc2626' : 'var(--color-gray)' }}>
                                  {titleLength}/60 chars
                                </span>
                              </div>
                              <input
                                type="text"
                                value={page.meta_title || ''}
                                onChange={e => handleUpdateStaticPageField(page.id, 'meta_title', e.target.value)}
                                placeholder="Catchy page-specific search title"
                                style={{ padding: '0.65rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                              />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <span style={{ fontWeight: '500' }}>Meta Description</span>
                                <span style={{ color: descLength > 160 ? '#dc2626' : 'var(--color-gray)' }}>
                                  {descLength}/160 chars
                                </span>
                              </div>
                              <textarea
                                value={page.meta_description || ''}
                                onChange={e => handleUpdateStaticPageField(page.id, 'meta_description', e.target.value)}
                                placeholder="Write page specific description overview to display under search link..."
                                rows={3}
                                style={{ padding: '0.65rem', border: '1px solid var(--color-border)', resize: 'none', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                              />
                            </div>

                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Focus Keywords (Comma-separated)
                              <input
                                type="text"
                                value={page.focus_keywords || ''}
                                onChange={e => handleUpdateStaticPageField(page.id, 'focus_keywords', e.target.value)}
                                placeholder="e.g. faq, orders, delivery, policy"
                                style={{ padding: '0.65rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                              />
                            </label>

                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Search Crawler Indexing Directive (robots meta)
                              <select
                                value={page.indexing || 'index, follow'}
                                onChange={e => handleUpdateStaticPageField(page.id, 'indexing', e.target.value)}
                                className="admin-select"
                                style={{ padding: '0.65rem' }}
                              >
                                <option value="index, follow">index, follow (Standard recommendation)</option>
                                <option value="noindex, follow">noindex, follow (Hide page, keep link value)</option>
                                <option value="index, nofollow">index, nofollow (Show page, ignore outgoing links)</option>
                                <option value="noindex, nofollow">noindex, nofollow (Complete hide & block)</option>
                              </select>
                            </label>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: '500', fontSize: '0.8rem' }}>JSON-LD Schema Markup (Structured Data)</span>
                                <span style={{ fontSize: '0.7rem', color: isJsonValid ? '#2e7d32' : '#dc2626', fontWeight: 'bold' }}>
                                  {isJsonValid ? '✓ Valid JSON-LD' : '✗ Invalid JSON Schema'}
                                </span>
                              </div>
                              <textarea
                                value={page.schema_markup || ''}
                                onChange={e => handleUpdateStaticPageField(page.id, 'schema_markup', e.target.value)}
                                placeholder='{ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [] }'
                                rows={5}
                                style={{ padding: '0.65rem', border: '1px solid var(--color-border)', fontFamily: 'monospace', fontSize: '0.75rem', backgroundColor: 'transparent', color: 'var(--color-text)', resize: 'vertical' }}
                              />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <button onClick={() => showToast("SEO properties saved successfully!")} className="btn btn-primary" style={{ padding: '0.65rem 2rem' }}>Save SEO Settings</button>
                            </div>
                          </div>
                        )}

                        {/* SEO Analyzer Tab Content */}
                        {selectedStaticTab === 'analyzer' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ border: '1px solid var(--color-border)', padding: '1rem', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.01)', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                              <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '4px solid', borderColor: seoScore >= 70 ? '#2e7d32' : seoScore >= 40 ? '#c2410c' : '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-text)' }}>{seoScore}%</span>
                              </div>
                              <div>
                                <span style={{ fontWeight: '600', display: 'block', fontSize: '0.9rem', color: 'var(--color-text)' }}>Real-time SEO Score</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-gray)' }}>
                                  {seoScore >= 70 ? 'Excellent! This page complies with modern SEO standards.' : seoScore >= 40 ? 'Needs attention. Correct the warnings below to rank higher.' : 'Critical issues found. SEO tags must be populated.'}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05rem', color: 'var(--color-gray)' }}>SEO Checklist Analysis</span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {analysisChecks.map((check, index) => (
                                  <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '2px', backgroundColor: check.pass ? 'rgba(46, 125, 50, 0.02)' : 'rgba(220, 38, 38, 0.02)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      {check.pass ? (
                                        <CheckCircle size={16} color="#2e7d32" style={{ flexShrink: 0 }} />
                                      ) : (
                                        <AlertCircle size={16} color="#c2410c" style={{ flexShrink: 0 }} />
                                      )}
                                      <span style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--color-text)' }}>{check.label}</span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: check.pass ? '#2e7d32' : 'var(--color-gray)' }}>{check.detail}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* SEO Panel Wrapper */}
                {(() => {
                  const page = staticPages.find(p => p.id === selectedStaticPageId) || staticPages[0];
                  if (!page) return null;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {/* Realtime SERP & Social Preview Card */}
                      <div style={{ border: '1px solid var(--color-border)', padding: '1.5rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Globe size={16} /> Search & Social Previews
                        </h3>

                        {/* Preview Mode Selector */}
                        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'rgba(0,0,0,0.02)', padding: '0.25rem', borderRadius: '4px' }}>
                          <button
                            type="button"
                            onClick={() => setSocialPreviewTab('google')}
                            style={{
                              flex: 1,
                              padding: '0.4rem',
                              fontSize: '0.75rem',
                              fontWeight: socialPreviewTab === 'google' ? '600' : '400',
                              backgroundColor: socialPreviewTab === 'google' ? 'var(--color-bg)' : 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: '2px',
                              color: 'var(--color-text)'
                            }}
                          >
                            Google SERP
                          </button>
                          <button
                            type="button"
                            onClick={() => setSocialPreviewTab('facebook')}
                            style={{
                              flex: 1,
                              padding: '0.4rem',
                              fontSize: '0.75rem',
                              fontWeight: socialPreviewTab === 'facebook' ? '600' : '400',
                              backgroundColor: socialPreviewTab === 'facebook' ? 'var(--color-bg)' : 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: '2px',
                              color: 'var(--color-text)'
                            }}
                          >
                            Facebook
                          </button>
                          <button
                            type="button"
                            onClick={() => setSocialPreviewTab('twitter')}
                            style={{
                              flex: 1,
                              padding: '0.4rem',
                              fontSize: '0.75rem',
                              fontWeight: socialPreviewTab === 'twitter' ? '600' : '400',
                              backgroundColor: socialPreviewTab === 'twitter' ? 'var(--color-bg)' : 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: '2px',
                              color: 'var(--color-text)'
                            }}
                          >
                            Twitter
                          </button>
                        </div>

                        {socialPreviewTab === 'google' && (
                          <div style={{ border: '1px solid var(--color-border)', borderRadius: '4px', padding: '1rem', backgroundColor: 'var(--color-bg)', marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-gray)', textTransform: 'uppercase', letterSpacing: '0.05rem', display: 'block', marginBottom: '0.5rem' }}>Google SERP Mock Render</span>
                            <span style={{ fontSize: '0.85rem', color: '#1a0dab', display: 'block', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', fontWeight: '500' }}>
                              {page.meta_title || `${page.title} | Aura Studio`}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#006621', display: 'block', marginBottom: '0.2rem' }}>
                              https://aura.studio/{page.slug}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', opacity: 0.8 }}>
                              {page.meta_description || 'Add a meta description here to preview how your page will appear on search results.'}
                            </span>
                          </div>
                        )}

                        {socialPreviewTab === 'facebook' && (
                          <div style={{ border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--color-bg)', marginTop: '0.5rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                            <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-bg)', fontSize: '0.75rem', fontWeight: 'bold' }}>A</div>
                              <div>
                                <span style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', color: 'var(--color-text)' }}>Aura Studio</span>
                                <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Sponsored · Paid Partnership</span>
                              </div>
                            </div>
                            <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text)' }}>
                              Check out our latest update: <strong>{page.title}</strong> is now live on our official store!
                            </div>
                            <div style={{ width: '100%', height: '180px', backgroundColor: 'rgba(0,0,0,0.05)', backgroundImage: `url(${cmsPageConfig.seo.open_graph_image || 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1200'})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.02)', borderTop: '1px solid var(--color-border)' }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)', textTransform: 'uppercase' }}>AURA.STUDIO</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', margin: '0.2rem 0', color: 'var(--color-text)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                {page.meta_title || page.title}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-gray)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {page.meta_description || 'Add a meta description to preview social snippet.'}
                              </span>
                            </div>
                          </div>
                        )}

                        {socialPreviewTab === 'twitter' && (
                          <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--color-bg)', marginTop: '0.5rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
                              <div style={{ width: '120px', height: '120px', backgroundColor: 'rgba(0,0,0,0.05)', backgroundImage: `url(${cmsPageConfig.seo.open_graph_image || 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1200'})`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }} />
                              <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-gray)' }}>aura.studio</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', margin: '0.2rem 0', color: 'var(--color-text)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                  {page.meta_title || page.title}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-gray)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {page.meta_description || 'Discover luxury fashion releases.'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sitemap & robots.txt Panel */}
                      <div style={{ border: '1px solid var(--color-border)', padding: '1.5rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Settings size={16} /> Global SEO Files Config
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>robots.txt File Content</span>
                          <textarea
                            value={robotsTxt}
                            onChange={e => setRobotsTxt(e.target.value)}
                            rows={4}
                            style={{ padding: '0.5rem', border: '1px solid var(--color-border)', fontFamily: 'monospace', fontSize: '0.75rem', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>XML Sitemap Paths</span>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                              type="text"
                              value={newSitemapUrl}
                              onChange={e => setNewSitemapUrl(e.target.value)}
                              placeholder="https://aura.studio/custom-path"
                              style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!newSitemapUrl) return;
                                if (customSitemapUrls.includes(newSitemapUrl)) {
                                  showToast("URL already exists in sitemap.");
                                  return;
                                }
                                setCustomSitemapUrls([...customSitemapUrls, newSitemapUrl]);
                                setNewSitemapUrl("");
                                showToast("Path added to sitemap!");
                              }}
                              style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', backgroundColor: 'var(--color-text)', color: 'var(--color-bg)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                            >
                              Add
                            </button>
                          </div>

                          <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--color-border)', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {customSitemapUrls.map((url, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', padding: '0.2rem', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{url}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomSitemapUrls(customSitemapUrls.filter(u => u !== url));
                                    showToast("Path removed from sitemap.");
                                  }}
                                  style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', fontSize: '0.65rem' }}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => showToast("Robots.txt & Sitemap compiled and successfully deployed live!")}
                          className="btn btn-primary"
                          style={{ width: '100%', fontSize: '0.8rem', padding: '0.65rem' }}
                        >
                          Publish robots.txt & sitemap.xml
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Navigation Builder */}
            {cmsSubTab === 'navigation' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Header Menu */}
                <div style={{ border: '1px solid var(--color-border)', padding: '1.5rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Compass size={16} /> Header Navigation</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {navMenus.header.map((item: any, idx: number) => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--color-border)', padding: '0.75rem', borderRadius: '2px', backgroundColor: '#fcfcfc' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-text)' }}>{item.label}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-gray)' }}>{item.url}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Badge"
                            value={item.badge}
                            onChange={e => handleUpdateNavBadge('header', idx, e.target.value)}
                            style={{ padding: '0.25rem 0.5rem', width: '90px', fontSize: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                          />
                          <button onClick={() => handleMoveNavItem('header', idx, 'up')} disabled={idx === 0} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-gray)' }}><ArrowUp size={14} /></button>
                          <button onClick={() => handleMoveNavItem('header', idx, 'down')} disabled={idx === navMenus.header.length - 1} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-gray)' }}><ArrowDown size={14} /></button>
                          <button onClick={() => handleDeleteNavItem('header', item.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={e => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const label = (form.elements.namedItem('nav-label') as HTMLInputElement).value;
                    const url = (form.elements.namedItem('nav-url') as HTMLInputElement).value;
                    handleAddNavItem('header', label, url);
                    form.reset();
                  }} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input name="nav-label" placeholder="Link Label" required style={{ padding: '0.5rem', flex: 1, fontSize: '0.8rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                    <input name="nav-url" placeholder="/shop/category" required style={{ padding: '0.5rem', flex: 1, fontSize: '0.8rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Add Item</button>
                  </form>
                </div>

                {/* Footer Menu */}
                <div style={{ border: '1px solid var(--color-border)', padding: '1.5rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Compass size={16} /> Footer Links</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {navMenus.footer.map((item: any, idx: number) => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--color-border)', padding: '0.75rem', borderRadius: '2px', backgroundColor: '#fcfcfc' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-text)' }}>{item.label}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-gray)' }}>{item.url}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button onClick={() => handleMoveNavItem('footer', idx, 'up')} disabled={idx === 0} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-gray)' }}><ArrowUp size={14} /></button>
                          <button onClick={() => handleMoveNavItem('footer', idx, 'down')} disabled={idx === navMenus.footer.length - 1} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-gray)' }}><ArrowDown size={14} /></button>
                          <button onClick={() => handleDeleteNavItem('footer', item.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={e => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const label = (form.elements.namedItem('nav-label') as HTMLInputElement).value;
                    const url = (form.elements.namedItem('nav-url') as HTMLInputElement).value;
                    handleAddNavItem('footer', label, url);
                    form.reset();
                  }} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input name="nav-label" placeholder="Link Label" required style={{ padding: '0.5rem', flex: 1, fontSize: '0.8rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                    <input name="nav-url" placeholder="/shipping" required style={{ padding: '0.5rem', flex: 1, fontSize: '0.8rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Add Item</button>
                  </form>
                </div>
              </div>
            )}

            {/* Media Asset Manager */}
            {cmsSubTab === 'media' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                  <div className="admin-search-wrapper" style={{ flex: 1, maxWidth: '400px' }}>
                    <Search size={16} className="admin-search-icon" />
                    <input
                      type="text"
                      placeholder="Search assets by tag/name..."
                      className="admin-search-input"
                      value={mediaSearch}
                      onChange={e => setMediaSearch(e.target.value)}
                    />
                  </div>

                  {/* WebP Auto Encoder controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--color-border)', padding: '0.5rem 1rem', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>WebP Auto-Compression:</span>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={webpQuality}
                      onChange={e => setWebpQuality(Number(e.target.value))}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', fontFamily: 'monospace' }}>{webpQuality}% Quality</span>
                  </div>

                  <div>
                    <input
                      type="file"
                      id="media-uploader-input"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleMediaUploadSimulation(file);
                      }}
                    />
                    <button
                      onClick={() => document.getElementById('media-uploader-input')?.click()}
                      className="btn btn-primary" style={{ padding: '0.65rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Plus size={16} /> Batch Upload
                    </button>
                  </div>
                </div>

                {/* Media Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  {mediaFiles.filter(m => m.name.toLowerCase().includes(mediaSearch.toLowerCase()) || m.tag.toLowerCase().includes(mediaSearch.toLowerCase())).map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedMedia(item)}
                      style={{
                        border: `1px solid ${selectedMedia?.id === item.id ? 'var(--color-text)' : 'var(--color-border)'}`,
                        borderRadius: '4px', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', backgroundColor: '#fafafa'
                      }}
                    >
                      <div style={{ aspectRatio: '4/3', backgroundColor: '#e2e2e2', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', backgroundColor: '#fff' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text)' }}>{item.name}</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-gray)' }}>
                          <span>Size: {item.size}</span>
                          <span style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: '0.05rem 0.25rem', borderRadius: '2px' }}>{item.tag}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Media Drawer Details */}
                {selectedMedia && (
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: '4px', padding: '1.25rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <img src={selectedMedia.url} alt="detail" style={{ width: '80px', height: '80px', objectFit: 'cover', border: '1px solid var(--color-border)' }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-text)' }}>{selectedMedia.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-gray)', margin: 0 }}>Type: {selectedMedia.type} · Size: {selectedMedia.size} · Tag: {selectedMedia.tag}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Edit tag..."
                        value={selectedMedia.tag}
                        onChange={e => {
                          const val = e.target.value;
                          setMediaFiles(mediaFiles.map(m => m.id === selectedMedia.id ? { ...m, tag: val } : m));
                          setSelectedMedia({ ...selectedMedia, tag: val });
                        }}
                        style={{ padding: '0.4rem', border: '1px solid var(--color-border)', fontSize: '0.8rem', width: '120px', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                      />
                      <button onClick={() => handleDeleteMedia(selectedMedia.id)} className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', color: '#dc2626', borderColor: '#dc2626' }}>Delete Asset</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Shop Filters Manager */}
            {cmsSubTab === 'shop_filters' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: '#fff', padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.25rem' }}>Shop Page Category Toggles</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-gray)' }}>Manage the categories that show up as toggles at the top of the View All Products page. Drag/re-order, edit label casing/slugs, or add new category parameters dynamically.</p>
                </div>
                
                {/* List of Filters */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {shopFilters.map((filter, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#fafafa' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '30px', alignItems: 'center' }}>
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => {
                            const newFilters = [...shopFilters];
                            const temp = newFilters[index];
                            newFilters[index] = newFilters[index - 1];
                            newFilters[index - 1] = temp;
                            setShopFilters(newFilters);
                          }}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem', opacity: index === 0 ? 0.3 : 1 }}
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={index === shopFilters.length - 1}
                          onClick={() => {
                            const newFilters = [...shopFilters];
                            const temp = newFilters[index];
                            newFilters[index] = newFilters[index + 1];
                            newFilters[index + 1] = temp;
                            setShopFilters(newFilters);
                          }}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem', opacity: index === shopFilters.length - 1 ? 0.3 : 1 }}
                        >
                          ▼
                        </button>
                      </div>
                      
                      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--color-gray)', display: 'block', marginBottom: '0.15rem' }}>DISPLAY LABEL</label>
                          <input
                            type="text"
                            value={filter.name}
                            onChange={e => {
                              const newFilters = [...shopFilters];
                              newFilters[index].name = e.target.value;
                              setShopFilters(newFilters);
                            }}
                            className="admin-input"
                            style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--color-gray)', display: 'block', marginBottom: '0.15rem' }}>FILTER SLUG (URL PARAMETER)</label>
                          <input
                            type="text"
                            value={filter.slug}
                            onChange={e => {
                              const newFilters = [...shopFilters];
                              newFilters[index].slug = e.target.value.toLowerCase().replace(/\s+/g, '-');
                              setShopFilters(newFilters);
                            }}
                            className="admin-input"
                            style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const newFilters = shopFilters.filter((_, i) => i !== index);
                          setShopFilters(newFilters);
                        }}
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#dc2626', border: '1px solid #fca5a5', backgroundColor: 'transparent', cursor: 'pointer', borderRadius: '4px', marginTop: '1.1rem' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Filter */}
                <div style={{ display: 'flex', gap: '1rem', borderTop: '1px dashed var(--color-border)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShopFilters([...shopFilters, { name: 'NEW CATEGORY', slug: 'new-category' }]);
                    }}
                    className="btn btn-outline"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}
                  >
                    + Add Category Toggle
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Reset toggles to default sequence?')) {
                        setShopFilters([
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
                        ]);
                      }
                    }}
                    className="btn btn-outline"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem', color: 'var(--color-gray)' }}
                  >
                    Reset to Default
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('aura_shop_filters', JSON.stringify(shopFilters));
                      alert('Shop category toggles saved successfully!');
                    }}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', marginLeft: 'auto' }}
                  >
                    Save & Apply Changes
                  </button>
                </div>
              </div>
            )}

            {/* Grid Settings Manager */}
            {cmsSubTab === 'grid_settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: '#fff', padding: '2.5rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.25rem' }}>Product Showcase Grid Columns</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-gray)' }}>Configure the density of the product grid for customers across desktop, tablet, and mobile viewports.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                  {/* Desktop Columns */}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Desktop Columns</span>
                    <select
                      value={gridColumns.desktop}
                      onChange={e => setGridColumns({ ...gridColumns, desktop: Number(e.target.value) })}
                      style={{ padding: '0.8rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px' }}
                    >
                      <option value="2">2 Columns</option>
                      <option value="3">3 Columns</option>
                      <option value="4">4 Columns (Default)</option>
                      <option value="5">5 Columns</option>
                      <option value="6">6 Columns</option>
                      <option value="8">8 Columns</option>
                    </select>
                  </label>

                  {/* Tablet Columns */}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tablet Columns</span>
                    <select
                      value={gridColumns.tablet}
                      onChange={e => setGridColumns({ ...gridColumns, tablet: Number(e.target.value) })}
                      style={{ padding: '0.8rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px' }}
                    >
                      <option value="2">2 Columns (Default)</option>
                      <option value="3">3 Columns</option>
                      <option value="4">4 Columns</option>
                    </select>
                  </label>

                  {/* Mobile Columns */}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile Columns</span>
                    <select
                      value={gridColumns.mobile}
                      onChange={e => setGridColumns({ ...gridColumns, mobile: Number(e.target.value) })}
                      style={{ padding: '0.8rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px' }}
                    >
                      <option value="1">1 Column (Default)</option>
                      <option value="2">2 Columns</option>
                      <option value="3">3 Columns</option>
                      <option value="4">4 Columns</option>
                    </select>
                  </label>
                </div>

                {/* Preview Panel */}
                <div style={{ marginTop: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '1.5rem', backgroundColor: '#fafafa' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-gray)', marginBottom: '1rem' }}>Layout Density Preview</h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${gridColumns.desktop}, 1fr)`,
                    gap: '0.75rem',
                    minHeight: '80px'
                  }}>
                    {Array.from({ length: Math.min(gridColumns.desktop * 2, 16) }).map((_, i) => (
                      <div key={i} style={{ backgroundColor: 'rgba(0,0,0,0.05)', border: '1px solid var(--color-border)', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--color-gray)' }}>
                        Product {i + 1}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={async () => {
                      localStorage.setItem('aura_shop_grid_columns', JSON.stringify(gridColumns));
                      try {
                        const { data } = await supabase
                          .from('storefront_config')
                          .select('id')
                          .eq('id', 'shop_grid_settings')
                          .maybeSingle();

                        let error = null;
                        if (data) {
                          const { error: updateError } = await supabase
                            .from('storefront_config')
                            .update({
                              config: gridColumns,
                              updated_at: new Date().toISOString()
                            })
                            .eq('id', 'shop_grid_settings');
                          error = updateError;
                        } else {
                          const { error: insertError } = await supabase
                            .from('storefront_config')
                            .insert({
                              id: 'shop_grid_settings',
                              config: gridColumns,
                              updated_at: new Date().toISOString()
                            });
                          error = insertError;
                        }
                        if (error) throw error;
                        alert('Grid columns saved and synchronized successfully!');
                      } catch (err: any) {
                        console.error(err);
                        alert(`Saved locally! Cloud synchronization failed: ${err.message}`);
                      }
                    }}
                    className="btn btn-primary"
                    style={{ padding: '0.6rem 2rem' }}
                  >
                    Save Layout Settings
                  </button>
                </div>
              </div>
            )}

            {/* Custom Pages Manager */}
            {cmsSubTab === 'custom_pages' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Main Workspace: 2 Column Editor & Live Preview */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', alignItems: 'start' }}>
                  
                  {/* Left Column: Form Panel */}
                  <div style={{ backgroundColor: '#fff', padding: '2rem', border: '1px solid var(--color-border)', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-heading)' }}>
                          {editingPageId ? 'Edit Custom Page' : 'Create Dynamic Custom Page'}
                        </h3>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-gray)' }}>
                          Design and launch layout-curated pages with live schedules, custom banners, custom SEO, and specific product sequencing.
                        </p>
                      </div>
                      {editingPageId && (
                        <button
                          type="button"
                          onClick={resetCustomPageForm}
                          style={{
                            padding: '0.5rem 1rem',
                            border: '1px solid var(--color-border)',
                            backgroundColor: '#f3f4f6',
                            color: '#4b5563',
                            fontWeight: '600',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            borderRadius: '2px',
                            transition: 'all 0.2s'
                          }}
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    {/* Section 1: Page Configurations */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-accent)' }}>1. Page Setup</span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Page Title *
                          <input
                            type="text"
                            placeholder="e.g. Summer Clearance"
                            value={newPageTitle}
                            onChange={e => {
                              setNewPageTitle(e.target.value);
                              if (!editingPageId) {
                                setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                              }
                            }}
                            style={{ padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px', fontWeight: 'normal' }}
                          />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Page URL Path Slug *
                          <input
                            type="text"
                            placeholder="e.g. summer-clearance"
                            value={newPageSlug}
                            onChange={e => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
                            style={{ padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px', fontWeight: 'normal' }}
                          />
                        </label>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Page Category / Type
                          <select
                            value={newPageType}
                            onChange={e => setNewPageType(e.target.value)}
                            style={{ padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px', fontWeight: 'normal' }}
                          >
                            <option value="collection">Curated Collection</option>
                            <option value="sale">Markdown Sale Page</option>
                            <option value="offer">Promotional Offers Page</option>
                            <option value="custom">Custom Brand Page</option>
                            <option value="editorial">Brand Editorial & Lookbook</option>
                            <option value="launch">Exclusive Product Launch</option>
                            <option value="collab">Designer Collaboration Showcase</option>
                            <option value="vip">VIP Member Only Event</option>
                            <option value="seasonal">Seasonal Trend Report</option>
                            <option value="sustainability">Sustainability & Craftsmanship Story</option>
                          </select>
                        </label>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Start Date (Optional)
                            <input
                              type="datetime-local"
                              value={newPageStartDate}
                              onChange={e => setNewPageStartDate(e.target.value)}
                              style={{ padding: '0.7rem 0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px', fontSize: '0.8rem', fontWeight: 'normal' }}
                            />
                          </label>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>End Date (Optional)
                            <input
                              type="datetime-local"
                              value={newPageEndDate}
                              onChange={e => setNewPageEndDate(e.target.value)}
                              style={{ padding: '0.7rem 0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px', fontSize: '0.8rem', fontWeight: 'normal' }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Dynamic Design System Customizer Box */}
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '1.25rem',
                        backgroundColor: 'rgba(26, 54, 93, 0.04)',
                        border: '1px solid rgba(26, 54, 93, 0.1)',
                        borderRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-text)' }}>Dynamic Curation Design System</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-gray)' }}>Auto-apply tailored premium typography, grids, borders and styles mapping to this category.</span>
                          </div>
                          <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                            <input 
                              type="checkbox" 
                              checked={newPageUseDynamicTheme} 
                              onChange={e => setNewPageUseDynamicTheme(e.target.checked)} 
                              style={{ width: '40px', height: '20px', appearance: 'none', backgroundColor: newPageUseDynamicTheme ? 'var(--color-accent)' : '#cbd5e1', borderRadius: '15px', position: 'relative', outline: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
                            />
                            <span style={{ 
                              width: '16px', 
                              height: '16px', 
                              backgroundColor: '#ffffff', 
                              borderRadius: '50%', 
                              position: 'absolute', 
                              top: '2px', 
                              left: newPageUseDynamicTheme ? '22px' : '2px', 
                              transition: 'left 0.2s', 
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)' 
                            }} />
                          </label>
                        </div>

                        {newPageUseDynamicTheme && (
                          <div style={{ 
                            fontSize: '0.75rem', 
                            lineHeight: '1.4', 
                            color: '#1e3a8a', 
                            backgroundColor: '#eff6ff', 
                            borderLeft: '3px solid #3b82f6', 
                            padding: '0.65rem 0.85rem', 
                            borderRadius: '0 2px 2px 0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem'
                          }}>
                            <span style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                              ✦ Category Curation Summary
                            </span>
                            <span>
                              {newPageType === 'editorial' && "Editorial & Lookbook: Alternating staggered Vogue layout, Cormorant serif typography, warm paper styling (#fdfbf7), and elegant serif index numbers."}
                              {newPageType === 'vip' && "VIP Event: Private Velvet theme (#08080a), luxurious gold borders, custom Private Stock identifiers, and playfair display fonts."}
                              {newPageType === 'launch' && "Product Launch: Technical obsidian theme (#090a0f), monospace specs headers (Space Mono), and active release badge flags."}
                              {newPageType === 'sustainability' && "Sustainability: Linen clay background (#f5f2eb), double-dashed organic borders, and Cormorant storytelling layouts."}
                              {newPageType === 'collab' && "Collaboration: Avant-garde theme, thick solid frames (2px solid black), and AURA × LAB watermark stamps."}
                              {newPageType === 'seasonal' && "Seasonal: Soft sunset pastel tones, organic rounded corners (12px), and key trend selector chips."}
                              {newPageType === 'sale' && "Markdown Sale: Energetic product cards, bold highlighted red pricing, and maximum-contrast original prices."}
                              {newPageType === 'offer' && "Special Offer: High-contrast clean slate layouts (#f8fafc), dynamic blue promotional badge headers."}
                              {newPageType === 'collection' && "Curated Collection: Classic luxury aesthetics, elegant spacing parameters, and clean light-gray borders."}
                              {newPageType === 'custom' && "Brand Showcase: Tailored canvas configuration variables, clean minimalist line aesthetics."}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section 2: Banner Hero Settings */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-accent)' }}>2. Hero Banner Design</span>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Banner Title / Subtitle
                          <input
                            type="text"
                            placeholder="e.g. Exclusive 30% Off Selected Styles"
                            value={newPageBannerTitle}
                            onChange={e => setNewPageBannerTitle(e.target.value)}
                            style={{ padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px', fontWeight: 'normal' }}
                          />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Banner Layout Style
                          <select
                            value={newPageBannerStyle}
                            onChange={e => setNewPageBannerStyle(e.target.value as any)}
                            style={{ padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px', fontWeight: 'normal' }}
                          >
                            <option value="minimal">Minimal Color Block Layout</option>
                            <option value="immersive">Immersive Dark Overlay Layout</option>
                            <option value="split">Split Canvas Layout (Left Content, Right Image)</option>
                            <option value="glass">Glassmorphism Card Layout Overlay</option>
                            <option value="editorial-offset">Asymmetric Editorial Offset Layout</option>
                            <option value="overlay-bold">Bold Avant-Garde Overlay</option>
                          </select>
                        </label>
                      </div>

                      {/* Hide text checkbox toggle option */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0' }}>
                        <input
                          type="checkbox"
                          id="hideBannerText"
                          checked={newPageBannerHideText}
                          onChange={e => setNewPageBannerHideText(e.target.checked)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <label htmlFor="hideBannerText" style={{ fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                          Hide Banner Text Overlay (Showcase banner image only)
                        </label>
                      </div>

                      {/* Dynamic Typography & Color Customization Panel */}
                      {!newPageBannerHideText && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-accent)', letterSpacing: '0.05em' }}>TITLE TYPOGRAPHY</span>
                            
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', fontWeight: '600' }}>Font Family
                              <select
                                value={newPageBannerTitleFont}
                                onChange={e => setNewPageBannerTitleFont(e.target.value)}
                                style={{ padding: '0.4rem', border: '1px solid var(--color-border)', borderRadius: '2px', backgroundColor: '#fff', color: '#000', fontSize: '0.75rem', fontWeight: 'normal' }}
                              >
                                <option value="Playfair Display">Playfair Display (Elegant Serif)</option>
                                <option value="Cormorant Garamond">Cormorant Garamond (Fine Serif)</option>
                                <option value="Outfit">Outfit (Luxury Sans-Serif)</option>
                                <option value="Inter">Inter (Minimalist Sans-Serif)</option>
                                <option value="Space Mono">Space Mono (Avant-Garde Monospace)</option>
                              </select>
                            </label>

                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', fontWeight: '600' }}>Font Color
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                  type="color"
                                  value={newPageBannerTitleColor}
                                  onChange={e => setNewPageBannerTitleColor(e.target.value)}
                                  style={{ width: '28px', height: '28px', border: '1px solid var(--color-border)', cursor: 'pointer', padding: 0 }}
                                />
                                <input
                                  type="text"
                                  value={newPageBannerTitleColor}
                                  onChange={e => setNewPageBannerTitleColor(e.target.value)}
                                  style={{ padding: '0.35rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '2px', fontSize: '0.75rem', flex: 1, backgroundColor: '#fff', color: '#000', fontWeight: 'normal' }}
                                />
                              </div>
                            </label>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-accent)', letterSpacing: '0.05em' }}>SUBTITLE & TEXT TYPOGRAPHY</span>

                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', fontWeight: '600' }}>Subtitle Font Family
                              <select
                                value={newPageBannerSubtitleFont}
                                onChange={e => setNewPageBannerSubtitleFont(e.target.value)}
                                style={{ padding: '0.4rem', border: '1px solid var(--color-border)', borderRadius: '2px', backgroundColor: '#fff', color: '#000', fontSize: '0.75rem', fontWeight: 'normal' }}
                              >
                                <option value="Outfit">Outfit (Luxury Sans-Serif)</option>
                                <option value="Playfair Display">Playfair Display (Elegant Serif)</option>
                                <option value="Cormorant Garamond">Cormorant Garamond (Fine Serif)</option>
                                <option value="Inter">Inter (Minimalist Sans-Serif)</option>
                                <option value="Space Mono">Space Mono (Avant-Garde Monospace)</option>
                              </select>
                            </label>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', fontWeight: '600' }}>Subtitle Color
                                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                  <input
                                    type="color"
                                    value={newPageBannerSubtitleColor}
                                    onChange={e => setNewPageBannerSubtitleColor(e.target.value)}
                                    style={{ width: '24px', height: '24px', border: '1px solid var(--color-border)', cursor: 'pointer', padding: 0 }}
                                  />
                                  <input
                                    type="text"
                                    value={newPageBannerSubtitleColor}
                                    onChange={e => setNewPageBannerSubtitleColor(e.target.value)}
                                    style={{ padding: '0.3rem', border: '1px solid var(--color-border)', borderRadius: '2px', fontSize: '0.7rem', width: '50px', backgroundColor: '#fff', color: '#000', fontWeight: 'normal' }}
                                  />
                                </div>
                              </label>

                              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', fontWeight: '600' }}>Subtext Color
                                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                  <input
                                    type="color"
                                    value={newPageBannerDescColor}
                                    onChange={e => setNewPageBannerDescColor(e.target.value)}
                                    style={{ width: '24px', height: '24px', border: '1px solid var(--color-border)', cursor: 'pointer', padding: 0 }}
                                  />
                                  <input
                                    type="text"
                                    value={newPageBannerDescColor}
                                    onChange={e => setNewPageBannerDescColor(e.target.value)}
                                    style={{ padding: '0.3rem', border: '1px solid var(--color-border)', borderRadius: '2px', fontSize: '0.7rem', width: '50px', backgroundColor: '#fff', color: '#000', fontWeight: 'normal' }}
                                  />
                                </div>
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Banner Subtext / Description
                        <textarea
                          placeholder="Enter a brief summary that describes this page..."
                          value={newPageBannerDesc}
                          onChange={e => setNewPageBannerDesc(e.target.value)}
                          rows={2}
                          style={{ padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px', resize: 'vertical', fontFamily: 'inherit', fontWeight: 'normal' }}
                        />
                      </label>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.25rem' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Banner Background Color
                          <input
                            type="color"
                            value={newPageBgColor}
                            onChange={e => setNewPageBgColor(e.target.value)}
                            style={{ padding: '0.2rem 0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', width: '100%', height: '42px', cursor: 'pointer', borderRadius: '2px' }}
                          />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Banner Image URL & Upload
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                              type="text"
                              placeholder="e.g. https://images.unsplash.com/..."
                              value={newPageBannerImage}
                              onChange={e => setNewPageBannerImage(e.target.value)}
                              style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px', fontWeight: 'normal' }}
                            />
                            <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem 1rem', cursor: 'pointer', margin: 0, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                              {uploadingCustomPageBanner ? 'Uploading...' : 'Upload Image'}
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={async e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    await handleCustomPageBannerUpload(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </label>
                      </div>

                      {/* CTA Button Settings */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '600' }}>CTA Button Text
                          <input
                            type="text"
                            placeholder="e.g. Shop Now (Optional)"
                            value={newPageCtaText}
                            onChange={e => setNewPageCtaText(e.target.value)}
                            style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: '#fff', color: 'var(--color-text)', borderRadius: '2px', fontWeight: 'normal', fontSize: '0.8rem' }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '600' }}>CTA Button URL Destination
                          <input
                            type="text"
                            placeholder="e.g. #products"
                            value={newPageCtaUrl}
                            onChange={e => setNewPageCtaUrl(e.target.value)}
                            style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: '#fff', color: 'var(--color-text)', borderRadius: '2px', fontWeight: 'normal', fontSize: '0.8rem' }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '600' }}>CTA Color (Accent/Hex)
                          <input
                            type="color"
                            value={newPageCtaColor}
                            onChange={e => setNewPageCtaColor(e.target.value)}
                            style={{ padding: '0.2rem', border: '1px solid var(--color-border)', backgroundColor: '#fff', width: '100%', height: '32px', cursor: 'pointer', borderRadius: '2px' }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Section 3: SEO Optimization Suite */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-accent)' }}>3. SEO Tags Optimization</span>
                        <span style={{ fontSize: '0.7rem', color: '#15803d', backgroundColor: '#dcfce7', padding: '0.1rem 0.4rem', borderRadius: '2px', fontWeight: 'bold' }}>AUTO SEO ENABLED</span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>SEO Meta Title (Optional)
                          <input
                            type="text"
                            placeholder={`e.g. ${newPageTitle || 'Summer Clearance'} | Aura Luxury`}
                            value={newPageSeoTitle}
                            onChange={e => setNewPageSeoTitle(e.target.value)}
                            style={{ padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px', fontWeight: 'normal' }}
                          />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>SEO Meta Description (Optional)
                          <input
                            type="text"
                            placeholder="e.g. Discover handpicked luxury items in our clearance catalog with up to 50% discount..."
                            value={newPageSeoDescription}
                            onChange={e => setNewPageSeoDescription(e.target.value)}
                            style={{ padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px', fontWeight: 'normal' }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Section 4: Product Selector & Sequencing */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-accent)' }}>4. Product Showcase Catalog</span>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem' }}>
                        
                        {/* Selector Checklist */}
                        <div style={{ border: '1px solid var(--color-border)', borderRadius: '4px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Available Catalog ({products.length})</span>
                            <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.7rem' }}>
                              <button
                                type="button"
                                onClick={() => setNewPageSelectedProducts(products.map(p => p.id.toString()))}
                                style={{ border: 'none', background: 'transparent', textDecoration: 'underline', cursor: 'pointer', color: 'var(--color-accent)', fontWeight: 'bold' }}
                              >
                                All
                              </button>
                              <span style={{ color: 'var(--color-border)' }}>|</span>
                              <button
                                type="button"
                                onClick={() => setNewPageSelectedProducts([])}
                                style={{ border: 'none', background: 'transparent', textDecoration: 'underline', cursor: 'pointer', color: 'var(--color-gray)' }}
                              >
                                None
                              </button>
                            </div>
                          </div>

                          <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                            {products.map(p => {
                              const isSelected = newPageSelectedProducts.includes(p.id.toString());
                              return (
                                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem', cursor: 'pointer', backgroundColor: isSelected ? '#f8fafc' : 'transparent', border: '1px solid rgba(0,0,0,0.01)', borderRadius: '2px', transition: 'all 0.2s' }}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        setNewPageSelectedProducts([...newPageSelectedProducts, p.id.toString()]);
                                      } else {
                                        setNewPageSelectedProducts(newPageSelectedProducts.filter(id => id !== p.id.toString()));
                                      }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                  />
                                  <img src={p.image} alt={p.name} style={{ width: '24px', height: '30px', objectFit: 'cover', borderRadius: '1px' }} />
                                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{p.name}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-gray)' }}>₹{p.price}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Sequence Sequencing list */}
                        <div style={{ border: '1px solid var(--color-border)', borderRadius: '4px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: '#fcfcfc' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-accent)' }}>Sequence Ordering ({newPageSelectedProducts.length} Featured)</span>
                          {newPageSelectedProducts.length === 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', border: '1px dashed var(--color-border)', borderRadius: '2px', color: 'var(--color-gray)', fontSize: '0.75rem', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                              Select products on the left catalog checklist to change their display sequence.
                            </div>
                          ) : (
                            <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                              {newPageSelectedProducts.map((pId, idx) => {
                                const prod = products.find(p => p.id.toString() === pId);
                                if (!prod) return null;
                                return (
                                  <div key={pId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem', border: '1px solid var(--color-border)', borderRadius: '2px', backgroundColor: '#fff', fontSize: '0.8rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                                      <span style={{ fontWeight: 'bold', color: 'var(--color-accent)', minWidth: '16px' }}>{idx + 1}</span>
                                      <img src={prod.image} alt={prod.name} style={{ width: '20px', height: '24px', objectFit: 'cover' }} />
                                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }}>{prod.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                                      <button
                                        type="button"
                                        disabled={idx === 0}
                                        onClick={() => {
                                          const newSeq = [...newPageSelectedProducts];
                                          const temp = newSeq[idx];
                                          newSeq[idx] = newSeq[idx - 1];
                                          newSeq[idx - 1] = temp;
                                          setNewPageSelectedProducts(newSeq);
                                        }}
                                        style={{ border: 'none', background: '#f3f4f6', cursor: idx === 0 ? 'not-allowed' : 'pointer', padding: '0.2rem 0.4rem', borderRadius: '2px', fontSize: '0.7rem', opacity: idx === 0 ? 0.3 : 1 }}
                                      >
                                        ▲
                                      </button>
                                      <button
                                        type="button"
                                        disabled={idx === newPageSelectedProducts.length - 1}
                                        onClick={() => {
                                          const newSeq = [...newPageSelectedProducts];
                                          const temp = newSeq[idx];
                                          newSeq[idx] = newSeq[idx + 1];
                                          newSeq[idx + 1] = temp;
                                          setNewPageSelectedProducts(newSeq);
                                        }}
                                        style={{ border: 'none', background: '#f3f4f6', cursor: idx === newPageSelectedProducts.length - 1 ? 'not-allowed' : 'pointer', padding: '0.2rem 0.4rem', borderRadius: '2px', fontSize: '0.7rem', opacity: idx === newPageSelectedProducts.length - 1 ? 0.3 : 1 }}
                                      >
                                        ▼
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>

                    {/* Publish/Update Button */}
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newPageTitle.trim() || !newPageSlug.trim()) {
                          alert('Title and Slug are required!');
                          return;
                        }
                        if (newPageSelectedProducts.length === 0) {
                          alert('Please select at least one product!');
                          return;
                        }
                        // Check duplicate slug if creating or if slug changed
                        const isDuplicate = customPages.some(page => page.slug === newPageSlug && page.id !== editingPageId);
                        if (isDuplicate) {
                          alert('A custom page with this URL slug already exists!');
                          return;
                        }

                        let updatedPages = [];
                        if (editingPageId) {
                          // Edit existing page
                          updatedPages = customPages.map(page => {
                            if (page.id === editingPageId) {
                              return {
                                ...page,
                                title: newPageTitle,
                                slug: newPageSlug,
                                type: newPageType,
                                bannerTitle: newPageBannerTitle,
                                bannerDesc: newPageBannerDesc,
                                bgColor: newPageBgColor,
                                bannerImage: newPageBannerImage,
                                productIds: newPageSelectedProducts,
                                bannerStyle: newPageBannerStyle,
                                bannerTitleFont: newPageBannerTitleFont,
                                bannerTitleColor: newPageBannerTitleColor,
                                bannerSubtitleFont: newPageBannerSubtitleFont,
                                bannerSubtitleColor: newPageBannerSubtitleColor,
                                bannerHideText: newPageBannerHideText,
                                bannerDescColor: newPageBannerDescColor,
                                ctaText: newPageCtaText,
                                ctaUrl: newPageCtaUrl,
                                ctaColor: newPageCtaColor,
                                startDate: newPageStartDate,
                                endDate: newPageEndDate,
                                seoTitle: newPageSeoTitle,
                                seoDescription: newPageSeoDescription,
                                useDynamicTheme: newPageUseDynamicTheme,
                                updatedAt: new Date().toISOString()
                              };
                            }
                            return page;
                          });
                        } else {
                          // Create new page
                          const newPage = {
                            id: `page_${Date.now()}`,
                            title: newPageTitle,
                            slug: newPageSlug,
                            type: newPageType,
                            bannerTitle: newPageBannerTitle,
                            bannerDesc: newPageBannerDesc,
                            bgColor: newPageBgColor,
                            bannerImage: newPageBannerImage,
                            productIds: newPageSelectedProducts,
                            bannerStyle: newPageBannerStyle,
                            bannerTitleFont: newPageBannerTitleFont,
                            bannerTitleColor: newPageBannerTitleColor,
                            bannerSubtitleFont: newPageBannerSubtitleFont,
                            bannerSubtitleColor: newPageBannerSubtitleColor,
                            bannerHideText: newPageBannerHideText,
                            bannerDescColor: newPageBannerDescColor,
                            ctaText: newPageCtaText,
                            ctaUrl: newPageCtaUrl,
                            ctaColor: newPageCtaColor,
                            startDate: newPageStartDate,
                            endDate: newPageEndDate,
                            seoTitle: newPageSeoTitle,
                            seoDescription: newPageSeoDescription,
                            useDynamicTheme: newPageUseDynamicTheme,
                            createdAt: new Date().toISOString()
                          };
                          updatedPages = [...customPages, newPage];
                        }

                        try {
                          await syncCustomPages(updatedPages);
                          setCustomPages(updatedPages);
                          localStorage.setItem('aura_custom_pages', JSON.stringify(updatedPages));
                          alert(editingPageId ? 'Custom Page updated successfully!' : 'Dynamic custom page published successfully!');
                          resetCustomPageForm();
                        } catch (err: any) {
                          console.error("Failed to sync custom pages to DB:", err);
                          if (err.code === '42501' || (err.message && err.message.includes('row-level security'))) {
                            setShowRlsInstructionModal(true);
                          } else {
                            alert(`Failed to sync custom pages: ${err.message || 'Unknown database error'}`);
                          }
                        }
                      }}
                      className="btn btn-primary"
                      style={{ padding: '0.85rem', fontWeight: 'bold', width: '100%', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}
                    >
                      {editingPageId ? 'Save Custom Page Updates' : 'Publish Custom Page & Live Stream Products'}
                    </button>

                  </div>

                  {/* Right Column: Live Viewport Preview Simulator & Layout info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '100px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-gray)' }}>Live Simulator Preview</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-accent)', fontWeight: 'bold', backgroundColor: '#eef2ff', padding: '0.2rem 0.5rem', borderRadius: '20px' }}>Real-time updates</span>
                    </div>

                    {/* Simulated Viewport Device */}
                    <div style={{ border: '8px solid #1e293b', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', backgroundColor: '#f8fafc' }}>
                      {/* Browser Bar */}
                      <div style={{ backgroundColor: '#1e293b', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'block' }}></span>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'block' }}></span>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'block' }}></span>
                        </div>
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '4px', flex: 1, padding: '0.15rem 0.5rem', fontSize: '0.65rem', color: '#cbd5e1', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace' }}>
                          aura.luxury/page/{newPageSlug || 'clearance-sale'}
                        </div>
                      </div>

                      {/* Simulated Banner Container */}
                      <div style={{
                        minHeight: '220px',
                        backgroundColor: newPageBgColor,
                        backgroundImage: newPageBannerImage ? `url(${newPageBannerImage})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        color: '#fff',
                        position: 'relative',
                        padding: newPageBannerStyle === 'editorial-offset' ? '0' : '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: (newPageBannerStyle === 'split' || newPageBannerStyle === 'editorial-offset') ? 'flex-start' : 'center',
                        justifyContent: 'center',
                        textAlign: (newPageBannerStyle === 'split' || newPageBannerStyle === 'editorial-offset') ? 'left' : 'center',
                        overflow: 'hidden'
                      }}>
                        {/* Immersive Overlay */}
                        {newPageBannerStyle === 'immersive' && newPageBannerImage && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1 }} />
                        )}

                        {/* Glassmorphism Card Backdrop */}
                        {newPageBannerStyle === 'glass' && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)', zIndex: 1 }} />
                        )}

                        {/* Split Canvas Style overlay */}
                        {newPageBannerStyle === 'split' && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.1))', zIndex: 1 }} />
                        )}

                        {/* Editorial Offset Content Card */}
                        {newPageBannerStyle === 'editorial-offset' && (
                          <div style={{
                            position: 'absolute',
                            left: '8%',
                            top: '8%',
                            bottom: '8%',
                            width: '46%',
                            backgroundColor: newPageBgColor || '#121212',
                            border: '1px solid rgba(255,255,255,0.2)',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            zIndex: 2,
                            boxShadow: '10px 10px 30px rgba(0,0,0,0.3)'
                          }}>
                            {!newPageBannerHideText && (
                              <>
                                <span style={{ 
                                  fontSize: '0.5rem', 
                                  textTransform: 'uppercase', 
                                  letterSpacing: '0.15em', 
                                  color: newPageBannerSubtitleColor || '#facc15', 
                                  fontFamily: newPageBannerSubtitleFont === 'Playfair Display' || newPageBannerSubtitleFont === 'Cormorant Garamond' ? 'serif' : 'sans-serif',
                                  marginBottom: '0.25rem',
                                  fontWeight: '600'
                                }}>
                                  {pageTypeMap[newPageType] || 'Brand Showcase'}
                                </span>
                                <h4 style={{ 
                                  fontSize: '1rem', 
                                  fontFamily: newPageBannerTitleFont === 'Playfair Display' || newPageBannerTitleFont === 'Cormorant Garamond' ? 'serif' : 'sans-serif', 
                                  color: newPageBannerTitleColor || '#ffffff',
                                  margin: '0 0 0.25rem 0', 
                                  fontWeight: 'bold',
                                  lineHeight: '1.2' 
                                }}>
                                  {newPageTitle || 'Curated Design'}
                                </h4>
                                {newPageBannerTitle && (
                                  <h5 style={{ 
                                    fontSize: '0.65rem', 
                                    fontFamily: newPageBannerSubtitleFont === 'Playfair Display' || newPageBannerSubtitleFont === 'Cormorant Garamond' ? 'serif' : 'sans-serif', 
                                    color: newPageBannerSubtitleColor || '#facc15', 
                                    margin: '0 0 0.35rem 0', 
                                    fontWeight: '600' 
                                  }}>
                                    {newPageBannerTitle}
                                  </h5>
                                )}
                                {newPageBannerDesc && (
                                  <p style={{ fontSize: '0.55rem', color: newPageBannerDescColor || '#cccccc', margin: '0 0 0.5rem 0', opacity: 0.85, lineHeight: '1.3' }}>
                                    {newPageBannerDesc}
                                  </p>
                                )}
                                {newPageCtaText && (
                                  <div style={{
                                    alignSelf: 'flex-start',
                                    padding: '0.25rem 0.5rem',
                                    backgroundColor: newPageCtaColor,
                                    color: '#000',
                                    fontSize: '0.55rem',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    borderRadius: '1px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                  }}>
                                    {newPageCtaText}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* Bold Avant-Garde Overlay Text Panel frame style */}
                        {newPageBannerStyle === 'overlay-bold' && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.45)',
                            zIndex: 1
                          }} />
                        )}

                        {/* Banner Contents for split, minimal, immersive, glass, overlay-bold */}
                        {newPageBannerStyle !== 'editorial-offset' && !newPageBannerHideText && (
                          <div style={{ 
                            position: 'relative', 
                            zIndex: 2, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: newPageBannerStyle === 'split' ? 'flex-start' : 'center', 
                            maxWidth: '90%',
                            backgroundColor: newPageBannerStyle === 'glass' ? 'rgba(0,0,0,0.2)' : 'transparent',
                            padding: newPageBannerStyle === 'glass' ? '1rem' : '0',
                            borderRadius: '4px'
                          }}>
                            <span style={{ 
                              fontSize: '0.55rem', 
                              textTransform: 'uppercase', 
                              letterSpacing: '0.15em', 
                              color: newPageBannerSubtitleColor || '#facc15', 
                              padding: '0.1rem 0.4rem', 
                              borderRadius: '1px', 
                              fontWeight: '800', 
                              marginBottom: '0.5rem',
                              fontFamily: newPageBannerSubtitleFont === 'Playfair Display' || newPageBannerSubtitleFont === 'Cormorant Garamond' ? 'serif' : 'sans-serif'
                            }}>
                              {pageTypeMap[newPageType] || 'Brand Showcase'}
                            </span>
                            
                            <h4 style={{ 
                              fontSize: newPageBannerStyle === 'overlay-bold' ? '1.5rem' : '1.25rem', 
                              fontFamily: newPageBannerTitleFont === 'Playfair Display' || newPageBannerTitleFont === 'Cormorant Garamond' ? 'serif' : 'sans-serif', 
                              color: newPageBannerTitleColor || '#ffffff',
                              margin: '0 0 0.2rem 0', 
                              fontWeight: '900',
                              letterSpacing: newPageBannerStyle === 'overlay-bold' ? '0.05em' : 'normal',
                              textTransform: newPageBannerStyle === 'overlay-bold' ? 'uppercase' : 'none'
                            }}>
                              {newPageTitle || 'Untargeted Custom Page'}
                            </h4>

                            {newPageBannerTitle && (
                              <h5 style={{ 
                                fontSize: '0.75rem', 
                                fontFamily: newPageBannerSubtitleFont === 'Playfair Display' || newPageBannerSubtitleFont === 'Cormorant Garamond' ? 'serif' : 'sans-serif', 
                                color: newPageBannerSubtitleColor || '#facc15', 
                                margin: '0 0 0.4rem 0', 
                                fontWeight: '600',
                                letterSpacing: '0.1em'
                              }}>
                                {newPageBannerTitle}
                              </h5>
                            )}

                            {newPageBannerDesc && (
                              <p style={{ fontSize: '0.65rem', color: newPageBannerDescColor || '#cccccc', margin: '0 0 0.75rem 0', opacity: 0.85, lineHeight: '1.4' }}>
                                {newPageBannerDesc}
                              </p>
                            )}

                            {/* CTA Button Render */}
                            {newPageCtaText && (
                              <div style={{
                                display: 'inline-block',
                                padding: '0.35rem 0.75rem',
                                backgroundColor: newPageCtaColor,
                                color: '#000',
                                fontSize: '0.65rem',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                borderRadius: '2px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                              }}>
                                {newPageCtaText}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Simulated Product Grid */}
                      <div style={{ padding: '1rem', backgroundColor: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                            Showing {newPageSelectedProducts.length} products
                          </span>
                          <span style={{ fontSize: '0.65rem', color: '#0f172a', fontWeight: 'bold' }}>
                            Sort by: Featured
                          </span>
                        </div>

                        {newPageSelectedProducts.length === 0 ? (
                          <div style={{ padding: '2rem 1rem', textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            No products are featured. Grid is empty.
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            {newPageSelectedProducts.slice(0, 4).map(pId => {
                              const prod = products.find(p => p.id.toString() === pId);
                              if (!prod) return null;
                              return (
                                <div key={pId} style={{ border: '1px solid #f1f5f9', padding: '0.35rem', borderRadius: '4px' }}>
                                  <img src={prod.image} alt={prod.name} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '2px' }} />
                                  <div style={{ fontSize: '0.65rem', fontWeight: 'bold', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.name}</div>
                                  <div style={{ fontSize: '0.6rem', color: '#64748b' }}>₹{prod.price}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {newPageSelectedProducts.length > 4 && (
                          <div style={{ textAlign: 'center', fontSize: '0.65rem', color: '#64748b', marginTop: '0.5rem', fontWeight: 'bold' }}>
                            + {newPageSelectedProducts.length - 4} more products
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SEO Tag Live Preview */}
                    <div style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#475569', letterSpacing: '0.05em' }}>Google Search Result Preview</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ color: '#1a0dab', fontSize: '0.85rem', fontWeight: '500', textDecoration: 'underline', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {newPageSeoTitle || `${newPageTitle || 'Summer Clearance'} | Aura Luxury E-Commerce`}
                        </span>
                        <span style={{ color: '#006621', fontSize: '0.7rem' }}>
                          https://aura.luxury/page/{newPageSlug || 'clearance-sale'}
                        </span>
                        <span style={{ color: '#545454', fontSize: '0.7rem', lineHeight: '1.3' }}>
                          {newPageSeoDescription || newPageBannerDesc || 'Discover curated selections, exclusive prices, and premium clothing styles in our dedicated brand showcase catalog.'}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Bottom Row: List of Published Custom Pages */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', margin: '0 0 1.25rem 0', fontWeight: 'bold' }}>Published Dynamic Pages ({customPages.length})</h3>
                  {customPages.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--color-border)', backgroundColor: '#fff', borderRadius: '4px', color: 'var(--color-gray)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                      No dynamic custom pages built yet.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                      {customPages.map(page => {
                        // Check if the page is currently active (scheduling check)
                        const now = new Date().getTime();
                        let isLive = true;
                        if (page.startDate && new Date(page.startDate).getTime() > now) isLive = false;
                        if (page.endDate && new Date(page.endDate).getTime() < now) isLive = false;

                        return (
                          <div key={page.id} style={{ border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#fff', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: editingPageId === page.id ? '0 0 0 2px var(--color-accent)' : 'none', transition: 'all 0.2s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-text)' }}>{page.title}</h4>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-accent)', fontWeight: '800', backgroundColor: 'var(--color-light)', padding: '0.1rem 0.4rem', borderRadius: '1px' }}>
                                    {pageTypeMap[page.type] || page.type}
                                  </span>
                                  {page.bannerStyle && (
                                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-gray)', fontWeight: 'bold' }}>
                                      Layout: {page.bannerStyle}
                                    </span>
                                  )}
                                  <span style={{
                                    fontSize: '0.65rem',
                                    fontWeight: '800',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '1px',
                                    backgroundColor: isLive ? '#dcfce7' : '#fee2e2',
                                    color: isLive ? '#15803d' : '#b91c1c'
                                  }}>
                                    {isLive ? 'LIVE' : 'INACTIVE / OUT OF SCHEDULE'}
                                  </span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPageId(page.id);
                                    setNewPageTitle(page.title || '');
                                    setNewPageSlug(page.slug || '');
                                    setNewPageType(page.type || 'collection');
                                    setNewPageBannerTitle(page.bannerTitle || '');
                                    setNewPageBannerDesc(page.bannerDesc || '');
                                    setNewPageBgColor(page.bgColor || '#121212');
                                    setNewPageBannerImage(page.bannerImage || '');
                                    setNewPageSelectedProducts(page.productIds || []);
                                    setNewPageBannerStyle(page.bannerStyle || 'minimal');
                                    setNewPageBannerTitleFont(page.bannerTitleFont || 'Playfair Display');
                                    setNewPageBannerTitleColor(page.bannerTitleColor || '#ffffff');
                                    setNewPageBannerSubtitleFont(page.bannerSubtitleFont || 'Outfit');
                                    setNewPageBannerSubtitleColor(page.bannerSubtitleColor || '#facc15');
                                    setNewPageBannerHideText(!!page.bannerHideText);
                                    setNewPageBannerDescColor(page.bannerDescColor || '#cccccc');
                                    setNewPageCtaText(page.ctaText || '');
                                    setNewPageCtaUrl(page.ctaUrl || '');
                                    setNewPageCtaColor(page.ctaColor || '#ffffff');
                                    setNewPageStartDate(page.startDate || '');
                                    setNewPageEndDate(page.endDate || '');
                                    setNewPageSeoTitle(page.seoTitle || '');
                                    setNewPageSeoDescription(page.seoDescription || '');
                                    setNewPageUseDynamicTheme(page.useDynamicTheme !== false);
                                    
                                    // Scroll to the editor form smoothly
                                    window.scrollTo({ top: 300, behavior: 'smooth' });
                                  }}
                                  style={{ color: 'var(--color-accent)', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (window.confirm(`Are you sure you want to delete "${page.title}"?`)) {
                                      const updated = customPages.filter(p => p.id !== page.id);
                                      try {
                                        await syncCustomPages(updated);
                                        setCustomPages(updated);
                                        localStorage.setItem('aura_custom_pages', JSON.stringify(updated));
                                        if (editingPageId === page.id) {
                                          resetCustomPageForm();
                                        }
                                      } catch (err: any) {
                                        console.error("Failed to sync custom pages to DB:", err);
                                        if (err.code === '42501' || (err.message && err.message.includes('row-level security'))) {
                                          setShowRlsInstructionModal(true);
                                        } else {
                                          alert(`Failed to delete custom page: ${err.message || 'Unknown database error'}`);
                                        }
                                      }
                                    }
                                  }}
                                  style={{ color: '#dc2626', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-gray)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <span>Path URL Slug: <a href={`/page/${page.slug}`} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>/page/{page.slug}</a></span>
                              <span>Products Featured: <strong>{page.productIds?.length || 0} Products</strong></span>
                              {page.startDate && (
                                <span>Active Schedule: <strong>{new Date(page.startDate).toLocaleString()} — {page.endDate ? new Date(page.endDate).toLocaleString() : 'No expiry'}</strong></span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

        {/* ================= MARKETING TAB ================= */}
        {activeTab === 'marketing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
            {/* Marketing Sub-tabs */}
            <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
              {(['promotions', 'flash_sale', 'workflows'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setMarketingSubTab(tab)}
                  style={{
                    background: 'none', border: 'none', padding: '0.5rem 0', fontSize: '0.9rem', fontWeight: marketingSubTab === tab ? '700' : '400',
                    color: marketingSubTab === tab ? 'var(--color-text)' : 'var(--color-gray)', borderBottom: marketingSubTab === tab ? '2px solid var(--color-text)' : 'none',
                    cursor: 'pointer', transition: 'all 0.15s', textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}
                >
                  {tab === 'promotions' ? 'Discount Code Engine' : tab === 'flash_sale' ? 'Flash Sale Orchestrator' : 'Automation Workflows'}
                </button>
              ))}
            </div>

            {/* Discount Code Form & List */}
            {marketingSubTab === 'promotions' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Promo Code list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', margin: 0 }}>Active Promotional Rules</h3>
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Rule Details</th>
                          <th>Min Cart Trigger</th>
                          <th>Limits (Global)</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {promotionsList.map(item => (
                          <tr key={item.id}>
                            <td style={{ fontWeight: '700', fontSize: '0.95rem' }}>{item.code}</td>
                            <td>{item.type === 'Percentage' ? `${item.value}% Off Discount` : item.type === 'Fixed' ? `₹${item.value} Off Total` : 'Free Shipping Coupon'}</td>
                            <td>₹{item.minThreshold}</td>
                            <td>{item.limit} uses {item.singleUse ? '(1/user)' : ''}</td>
                            <td>
                              <span
                                onClick={() => handleTogglePromo(item.id)}
                                style={{
                                  padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: '700', borderRadius: '12px', cursor: 'pointer',
                                  backgroundColor: item.status === 'Active' ? '#dcfce7' : '#fee2e2', color: item.status === 'Active' ? '#16a34a' : '#dc2626'
                                }}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td>
                              <button onClick={() => handleDeletePromo(item.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc2626' }}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Rules Creator Form */}
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '4px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: '#fff' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', color: 'var(--color-text)' }}>Create Promo Code</h3>
                  <form onSubmit={handleAddPromo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>Discount Code
                      <input
                        type="text"
                        placeholder="e.g., WINTER30"
                        value={newPromoForm.code}
                        onChange={e => setNewPromoForm({ ...newPromoForm, code: e.target.value })}
                        required
                        style={{ padding: '0.55rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                      />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>Discount Type
                      <select
                        value={newPromoForm.type}
                        onChange={e => setNewPromoForm({ ...newPromoForm, type: e.target.value })}
                        style={{ padding: '0.55rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                      >
                        <option value="Percentage">Percentage Off (%)</option>
                        <option value="Fixed">Fixed Amount (₹)</option>
                        <option value="Free Shipping">Free Shipping</option>
                      </select>
                    </label>

                    {newPromoForm.type !== 'Free Shipping' && (
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>Discount Value
                        <input
                          type="number"
                          value={newPromoForm.value}
                          onChange={e => setNewPromoForm({ ...newPromoForm, value: Number(e.target.value) })}
                          required
                          style={{ padding: '0.55rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                        />
                      </label>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>Min Cart Trigger Value (₹)
                        <input
                          type="number"
                          value={newPromoForm.minThreshold}
                          onChange={e => setNewPromoForm({ ...newPromoForm, minThreshold: Number(e.target.value) })}
                          style={{ padding: '0.55rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                        />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>Global Usage Limit
                        <input
                          type="number"
                          value={newPromoForm.limit}
                          onChange={e => setNewPromoForm({ ...newPromoForm, limit: Number(e.target.value) })}
                          style={{ padding: '0.55rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                        />
                      </label>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-text)' }}>
                      <input
                        type="checkbox"
                        checked={newPromoForm.singleUse}
                        onChange={e => setNewPromoForm({ ...newPromoForm, singleUse: e.target.checked })}
                      />
                      Enforce single-user limit (1 use per account)
                    </label>

                    <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem', marginTop: '0.5rem' }}>Generate Coupon</button>
                  </form>
                </div>
              </div>
            )}

            {/* Flash Sale & Promotions Campaign Orchestrator */}
            {marketingSubTab === 'flash_sale' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '2rem', alignItems: 'start' }}>
                {/* Campaign Creator Form */}
                <div style={{ backgroundColor: '#fff', padding: '2rem', border: '1px solid var(--color-border)', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Sparkles size={18} style={{ color: '#eab308' }} /> Promotions & Campaign Orchestrator
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-gray)' }}>
                      Set up limited-time Flash Sales or Special Deals (like Festival Specials) for specific products or site-wide.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Campaign Name *
                      <input
                        type="text"
                        placeholder="e.g. Festival Special Diwali"
                        value={newCampaignTitle}
                        onChange={e => setNewCampaignTitle(e.target.value)}
                        style={{ padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px', fontWeight: 'normal' }}
                      />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Campaign Type
                      <select
                        value={newCampaignType}
                        onChange={e => setNewCampaignType(e.target.value as any)}
                        style={{ padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px', fontWeight: 'normal' }}
                      >
                        <option value="flash_sale">Flash Sale (with Countdown)</option>
                        <option value="special_sale">Special Sale (Festival / Weekend Deal)</option>
                      </select>
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Discount Type
                      <select
                        value={newCampaignDiscountType}
                        onChange={e => setNewCampaignDiscountType(e.target.value as any)}
                        style={{ padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px', fontWeight: 'normal' }}
                      >
                        <option value="percentage">Percentage Markdown (%)</option>
                        <option value="fixed">Fixed Price Deduction (₹)</option>
                      </select>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Discount Value *
                      <input
                        type="number"
                        min="1"
                        value={newCampaignDiscountValue}
                        onChange={e => setNewCampaignDiscountValue(Number(e.target.value))}
                        style={{ padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px', fontWeight: 'normal' }}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Campaign Start Time (Optional)
                      <input
                        type="datetime-local"
                        value={newCampaignStartDate}
                        onChange={e => setNewCampaignStartDate(e.target.value)}
                        style={{ padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px', fontWeight: 'normal' }}
                      />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Campaign End Time (Optional)
                      <input
                        type="datetime-local"
                        value={newCampaignEndDate}
                        onChange={e => setNewCampaignEndDate(e.target.value)}
                        style={{ padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px', fontWeight: 'normal' }}
                      />
                    </label>
                  </div>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Apply Campaign To
                    <select
                      value={newCampaignApplyTo}
                      onChange={e => setNewCampaignApplyTo(e.target.value as any)}
                      style={{ padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px', fontWeight: 'normal' }}
                    >
                      <option value="all">All Products (Entire Catalogue)</option>
                      <option value="specific">Specific Selected Products</option>
                    </select>
                  </label>

                  {/* Specific Product Checklist Selector */}
                  {newCampaignApplyTo === 'specific' && (
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: '4px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Eligible Campaign Products ({newCampaignSelectedProducts.length} Selected)</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setNewCampaignSelectedProducts(products.map(p => p.id.toString()))}
                            style={{ fontSize: '0.75rem', border: 'none', background: 'transparent', textDecoration: 'underline', cursor: 'pointer', color: 'var(--color-accent)' }}
                          >
                            Select All
                          </button>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-border)' }}>|</span>
                          <button
                            type="button"
                            onClick={() => setNewCampaignSelectedProducts([])}
                            style={{ fontSize: '0.75rem', border: 'none', background: 'transparent', textDecoration: 'underline', cursor: 'pointer', color: 'var(--color-gray)' }}
                          >
                            Deselect All
                          </button>
                        </div>
                      </div>

                      <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                        {products.map(p => {
                          const isSelected = newCampaignSelectedProducts.includes(p.id.toString());
                          return (
                            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', border: '1px solid rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'background 0.2s', backgroundColor: isSelected ? '#fafafa' : 'transparent', borderRadius: '2px' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setNewCampaignSelectedProducts([...newCampaignSelectedProducts, p.id.toString()]);
                                  } else {
                                    setNewCampaignSelectedProducts(newCampaignSelectedProducts.filter(id => id !== p.id.toString()));
                                  }
                                }}
                                style={{ transform: 'scale(1.1)', cursor: 'pointer' }}
                              />
                              <img src={p.image} alt={p.name} style={{ width: '32px', height: '40px', objectFit: 'cover', borderRadius: '2px' }} />
                              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.name}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-gray)' }}>₹{p.price}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      if (!newCampaignTitle.trim()) {
                        alert('Campaign name is required!');
                        return;
                      }
                      if (newCampaignApplyTo === 'specific' && newCampaignSelectedProducts.length === 0) {
                        alert('Please select at least one product for this campaign!');
                        return;
                      }

                      const newCampaign = {
                        id: `camp_${Date.now()}`,
                        title: newCampaignTitle,
                        type: newCampaignType,
                        discountType: newCampaignDiscountType,
                        discountValue: newCampaignDiscountValue,
                        startDate: newCampaignStartDate || undefined,
                        endDate: newCampaignEndDate || undefined,
                        applyTo: newCampaignApplyTo,
                        productIds: newCampaignApplyTo === 'all' ? [] : newCampaignSelectedProducts,
                        status: 'active'
                      };

                      const updatedCampaigns = [...salesCampaigns, newCampaign];

                      try {
                        await syncSalesCampaigns(updatedCampaigns);
                        setSalesCampaigns(updatedCampaigns);
                        localStorage.setItem('aura_sales_campaigns', JSON.stringify(updatedCampaigns));

                        // Reset fields
                        setNewCampaignTitle('');
                        setNewCampaignStartDate('');
                        setNewCampaignEndDate('');
                        setNewCampaignSelectedProducts([]);
                        
                        alert('Promotional Sales Campaign activated successfully!');
                      } catch (err: any) {
                        console.error("Failed to sync sales campaigns to DB:", err);
                        if (err.code === '42501' || (err.message && err.message.includes('row-level security'))) {
                          setShowRlsInstructionModal(true);
                        } else {
                          alert(`Failed to sync sales campaigns: ${err.message || 'Unknown database error'}`);
                        }
                      }
                    }}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem', fontWeight: 'bold', width: '100%', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    Launch Campaign & Broadcast Discounts
                  </button>
                </div>

                {/* Active Campaigns List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', margin: 0 }}>Active Campaigns ({salesCampaigns.length})</h3>
                  {salesCampaigns.length === 0 ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', border: '1px dashed var(--color-border)', backgroundColor: '#fff', borderRadius: '4px', color: 'var(--color-gray)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                      No active sales campaigns currently running.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {salesCampaigns.map(camp => (
                        <div key={camp.id} style={{ border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#fff', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: `4px solid ${camp.type === 'flash_sale' ? '#dc2626' : '#eab308'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>{camp.title}</h4>
                              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-gray)', fontWeight: 'bold' }}>
                                {camp.type === 'flash_sale' ? '⚡ Flash Sale' : '🎉 Special Sale'}
                              </span>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={async () => {
                                  const updated = salesCampaigns.map(c => {
                                    if (c.id === camp.id) {
                                      return { ...c, status: c.status === 'active' ? 'inactive' : 'active' };
                                    }
                                    return c;
                                  });
                                  try {
                                    await syncSalesCampaigns(updated);
                                    setSalesCampaigns(updated);
                                    localStorage.setItem('aura_sales_campaigns', JSON.stringify(updated));
                                  } catch (err: any) {
                                    console.error("Failed to sync sales campaigns:", err);
                                    if (err.code === '42501' || (err.message && err.message.includes('row-level security'))) {
                                      setShowRlsInstructionModal(true);
                                    } else {
                                      alert(`Failed to update campaign status: ${err.message || 'Unknown database error'}`);
                                    }
                                  }
                                }}
                                style={{
                                  border: 'none',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '2px',
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  backgroundColor: camp.status === 'active' ? '#dcfce7' : '#f3f4f6',
                                  color: camp.status === 'active' ? '#15803d' : '#4b5563'
                                }}
                              >
                                {camp.status === 'active' ? 'ACTIVE' : 'PAUSED'}
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to terminate campaign "${camp.title}"?`)) {
                                    const updated = salesCampaigns.filter(c => c.id !== camp.id);
                                    try {
                                      await syncSalesCampaigns(updated);
                                      setSalesCampaigns(updated);
                                      localStorage.setItem('aura_sales_campaigns', JSON.stringify(updated));
                                    } catch (err: any) {
                                      console.error("Failed to sync sales campaigns:", err);
                                      if (err.code === '42501' || (err.message && err.message.includes('row-level security'))) {
                                        setShowRlsInstructionModal(true);
                                      } else {
                                        alert(`Failed to delete campaign: ${err.message || 'Unknown database error'}`);
                                      }
                                    }
                                  }
                                }}
                                style={{ color: '#dc2626', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'var(--color-gray)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span>Discount: <strong>{camp.discountValue}{camp.discountType === 'percentage' ? '%' : '₹'} Off</strong></span>
                            <span>Scope: <strong>{camp.applyTo === 'all' ? 'Site-wide Catalogue' : `${camp.productIds?.length || 0} selected products`}</strong></span>
                            {camp.endDate && (
                              <span style={{ color: '#dc2626' }}>Ends: <strong>{new Date(camp.endDate).toLocaleString()}</strong></span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Automation Workflows */}
            {marketingSubTab === 'workflows' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Automation trigger list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', margin: 0 }}>Registered Marketing Triggers</h3>
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Event Action</th>
                          <th>System Action</th>
                          <th>Webhook Endpoint</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {automationRules.map(item => (
                          <tr key={item.id}>
                            <td>
                              <span style={{ fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.04)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--color-text)' }}>
                                {item.event}
                              </span>
                            </td>
                            <td>{item.action}</td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--color-gray)', wordBreak: 'break-all' }}>{item.webhook}</td>
                            <td>
                              <button onClick={() => handleDeleteAutomation(item.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc2626' }}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Workflow connector form */}
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '4px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: '#fff' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', color: 'var(--color-text)' }}>Register Trigger Routing</h3>
                  <form onSubmit={handleAddAutomation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>Event Trigger
                      <select
                        value={newAutomation.event}
                        onChange={e => setNewAutomation({ ...newAutomation, event: e.target.value })}
                        style={{ padding: '0.55rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                      >
                        <option value="cart_abandoned">cart_abandoned</option>
                        <option value="user_signup">user_signup</option>
                        <option value="order_completed">order_completed</option>
                        <option value="item_wishlisted">item_wishlisted</option>
                      </select>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>Action Type
                      <input
                        type="text"
                        value={newAutomation.action}
                        disabled
                        style={{ padding: '0.55rem', border: '1px solid var(--color-border)', backgroundColor: 'rgba(0,0,0,0.02)', color: 'var(--color-gray)' }}
                      />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>Webhook Endpoint URL
                      <input
                        type="url"
                        placeholder="https://your-endpoint.com/webhook"
                        value={newAutomation.webhook}
                        onChange={e => setNewAutomation({ ...newAutomation, webhook: e.target.value })}
                        required
                        style={{ padding: '0.55rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                      />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>JSON Payload String
                      <textarea
                        value={newAutomation.payload}
                        onChange={e => setNewAutomation({ ...newAutomation, payload: e.target.value })}
                        rows={4}
                        required
                        style={{ padding: '0.55rem', border: '1px solid var(--color-border)', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8rem', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                      />
                    </label>

                    <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem', marginTop: '0.5rem' }}>Register Trigger Route</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= ORDER DETAILS SLIDE-OUT DRAWER ================= */}
      {selectedOrder && (
        <div className="admin-drawer-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-drawer" onClick={e => e.stopPropagation()}>
            <div className="admin-drawer-header">
              <div>
                <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>Order Details</h2>
                <p style={{ color: 'var(--color-gray)', fontSize: '0.85rem', marginTop: '0.15rem' }}>ID: #{selectedOrder.id}</p>
              </div>
              <button className="admin-drawer-close" onClick={() => setSelectedOrder(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="admin-drawer-section">
              <h3 className="admin-drawer-section-title">Order Status</h3>
              <div className="status-change-wrapper">
                <span className={`order-status-badge status-${selectedOrder.status?.toLowerCase()}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  {selectedOrder.status}
                </span>
                <select
                  value={selectedOrder.status || 'Processing'}
                  onChange={e => handleUpdateStatus(selectedOrder.id, e.target.value)}
                  className="admin-select"
                  style={{ flex: 1 }}
                >
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="admin-drawer-section">
              <h3 className="admin-drawer-section-title">Customer Information</h3>
              <div className="admin-drawer-grid">
                <div className="admin-drawer-item">
                  <span className="admin-drawer-label">Full Name</span>
                  <span className="admin-drawer-value">
                    {profiles[selectedOrder.user_id]?.first_name ? `${profiles[selectedOrder.user_id].first_name} ${profiles[selectedOrder.user_id].last_name || ''}` : 'Customer'}
                  </span>
                </div>
                <div className="admin-drawer-item">
                  <span className="admin-drawer-label">Email Address</span>
                  <span className="admin-drawer-value">{profiles[selectedOrder.user_id]?.email || 'No email'}</span>
                </div>
                <div className="admin-drawer-item" style={{ gridColumn: 'span 2' }}>
                  <span className="admin-drawer-label">Shipping Destination</span>
                  <span className="admin-drawer-value" style={{ lineHeight: '1.4' }}>{selectedOrder.shipping_address}</span>
                </div>
              </div>
            </div>

            <div className="admin-drawer-section" style={{ flex: 1 }}>
              <h3 className="admin-drawer-section-title">Items List</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
                {orderItems.filter(item => item.order_id === selectedOrder.id).map((item: any) => {
                  const prod = products.find(p => p.id === item.product_id);
                  if (!prod) return null;
                  return (
                    <div key={item.id} className="drawer-order-item">
                      <img src={prod.image} alt={prod.name} className="drawer-order-item-img" />
                      <div className="drawer-order-item-details">
                        <p className="drawer-order-item-name">{prod.name}</p>
                        <p className="drawer-order-item-sub">Size: {item.size} · Qty: {item.quantity}</p>
                      </div>
                      <p className="drawer-order-item-price">
                        {getProductCurrency(prod)}{(Number(item.price_at_time) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Total Charge</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                  {(() => {
                    const firstItem = orderItems.find(item => item.order_id === selectedOrder.id);
                    const prod = firstItem ? products.find(p => p.id === firstItem.product_id) : null;
                    return prod ? getProductCurrency(prod) : '₹';
                  })()}{Number(selectedOrder.total).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= PRODUCT FORM MODAL ================= */}
      {showProductModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', padding: '2.5rem', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-heading)', margin: 0 }}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {productForm.sku ? `SKU: ${productForm.sku}` : 'New Draft'}
              </span>
            </div>

            {/* Step Tabs Indicator */}
            <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem', paddingBottom: '0.5rem' }}>
              {(['info', 'pricing', 'media'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveFormTab(t)}
                  style={{
                    paddingBottom: '0.75rem',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeFormTab === t ? '2px solid var(--color-text)' : '2px solid transparent',
                    color: activeFormTab === t ? 'var(--color-text)' : 'var(--color-gray)',
                    fontWeight: activeFormTab === t ? '600' : '400',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    paddingLeft: 0,
                    paddingRight: 0
                  }}
                >
                  {t === 'info' ? '1. General Info' : t === 'pricing' ? '2. Sizing & Pricing' : '3. Product Media'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* TAB 1: GENERAL INFO */}
              {activeFormTab === 'info' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product Name</span>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="e.g., Silk Linen Overshirt"
                      style={{ padding: '0.85rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px' }}
                    />
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</span>
                    <select
                      value={productForm.category}
                      onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                      style={{ padding: '0.85rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px' }}
                    >
                      <option value="shirts" style={{ backgroundColor: 'var(--color-bg)' }}>Shirts</option>
                      <option value="t-shirts" style={{ backgroundColor: 'var(--color-bg)' }}>T-Shirts</option>
                      <option value="polo" style={{ backgroundColor: 'var(--color-bg)' }}>POLO</option>
                      <option value="jeans" style={{ backgroundColor: 'var(--color-bg)' }}>Jeans</option>
                      <option value="trousers" style={{ backgroundColor: 'var(--color-bg)' }}>Trousers</option>
                      <option value="linen" style={{ backgroundColor: 'var(--color-bg)' }}>LINEN</option>
                      <option value="cargo-pants" style={{ backgroundColor: 'var(--color-bg)' }}>Cargo Pants</option>
                      <option value="joggers" style={{ backgroundColor: 'var(--color-bg)' }}>Joggers</option>
                      <option value="shorts" style={{ backgroundColor: 'var(--color-bg)' }}>SHORTS</option>
                      <option value="overshirts" style={{ backgroundColor: 'var(--color-bg)' }}>Overshirts</option>
                      <option value="footwear" style={{ backgroundColor: 'var(--color-bg)' }}>Footwear</option>
                    </select>
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subcategory</span>
                      <button
                        type="button"
                        onClick={() => {
                          const name = prompt('Enter new subcategory name:');
                          if (name) {
                            const slug = name.toLowerCase().trim().replace(/\s+/g, '-');
                            const currentList = subcategories[productForm.category] || [];
                            if (!currentList.includes(slug)) {
                              const updated = {
                                ...subcategories,
                                [productForm.category]: [...currentList, slug]
                              };
                              setSubcategories(updated);
                              localStorage.setItem('aura_subcategories', JSON.stringify(updated));
                              setProductForm(prev => ({ ...prev, subcategory: slug }));
                              showToast('Subcategory added and selected!');
                            } else {
                              setProductForm(prev => ({ ...prev, subcategory: slug }));
                            }
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--color-gray)', textDecoration: 'underline', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                      >
                        + New Subcategory
                      </button>
                    </div>
                    <select
                      value={productForm.subcategory}
                      onChange={e => setProductForm({ ...productForm, subcategory: e.target.value })}
                      style={{ padding: '0.85rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px', textTransform: 'capitalize' }}
                    >
                      <option value="" style={{ backgroundColor: 'var(--color-bg)' }}>None</option>
                      {(subcategories[productForm.category] || []).map(sub => (
                        <option key={sub} value={sub} style={{ backgroundColor: 'var(--color-bg)' }}>
                          {sub.replace(/-/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SKU Code</span>
                      <button
                        type="button"
                        onClick={generateSKU}
                        style={{ background: 'none', border: 'none', color: 'var(--color-gray)', textDecoration: 'underline', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                      >
                        Auto-Generate SKU
                      </button>
                    </div>
                    <input
                      type="text"
                      value={productForm.sku}
                      onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                      placeholder="e.g., AU-SHI-SILK-4819"
                      style={{ padding: '0.85rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px' }}
                    />
                  </div>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tags (comma separated)</span>
                    <input
                      type="text"
                      placeholder="e.g., summer, linen, organic, featured"
                      value={productForm.tags}
                      onChange={e => setProductForm({ ...productForm, tags: e.target.value })}
                      style={{ padding: '0.85rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px' }}
                    />
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</span>
                    <textarea
                      value={productForm.description}
                      onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                      rows={5}
                      placeholder="Describe the material, cut, design history, and architectural lines of this piece..."
                      style={{ padding: '0.85rem', border: '1px solid var(--color-border)', resize: 'vertical', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px', lineHeight: '1.6' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: '1 / -1', cursor: 'pointer', marginTop: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={productForm.is_new}
                      onChange={e => setProductForm({ ...productForm, is_new: e.target.checked })}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Mark as a new arrival on storefront</span>
                  </label>
                </div>
              )}

              {/* TAB 2: PRICING & SIZING */}
              {activeFormTab === 'pricing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Base Price</span>
                      <div style={{ display: 'flex', gap: '0' }}>
                        <select
                          value={productForm.currency}
                          onChange={e => setProductForm({ ...productForm, currency: e.target.value })}
                          style={{ padding: '0.85rem', border: '1px solid var(--color-border)', borderRight: 'none', backgroundColor: 'rgba(0,0,0,0.03)', color: 'var(--color-text)', fontWeight: '600', width: '95px', borderRadius: '2px 0 0 2px' }}
                        >
                          {CURRENCIES.map(c => <option key={c.code} value={c.code} style={{ backgroundColor: 'var(--color-bg)' }}>{c.symbol} {c.code}</option>)}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          value={productForm.price || ''}
                          onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })}
                          placeholder="0.00"
                          style={{ padding: '0.85rem', border: '1px solid var(--color-border)', flex: 1, backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '0 2px 2px 0' }}
                        />
                      </div>
                    </div>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock Level</span>
                      <input
                        type="number"
                        value={productForm.stock}
                        onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                        placeholder="100"
                        style={{ padding: '0.85rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px' }}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Size Variants Adjustment
                      <span style={{ color: 'var(--color-gray)', fontSize: '0.75rem', textTransform: 'none', marginLeft: '0.5rem' }}>
                        ({productForm.category === 'footwear' ? 'Footwear Chart' : productForm.category === 'accessories' ? 'Accessory Chart' : 'Apparel Chart'})
                      </span>
                    </span>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                      {getAvailableSizesForCategory(productForm.category).map(size => {
                        const curr = CURRENCIES.find(c => c.code === productForm.currency);
                        const sym = curr?.symbol || '₹';
                        const isEnabled = selectedSizes[size]?.enabled;
                        return (
                          <div
                            key={size}
                            style={{
                              border: `1px solid ${isEnabled ? 'var(--color-text)' : 'var(--color-border)'}`,
                              padding: '1rem',
                              borderRadius: '4px',
                              backgroundColor: isEnabled ? 'rgba(0,0,0,0.02)' : 'transparent',
                              transition: 'all 0.15s',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.5rem'
                            }}
                          >
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: isEnabled ? '600' : '400', fontSize: '0.9rem' }}>
                              <input
                                type="checkbox"
                                checked={isEnabled || false}
                                onChange={e => setSelectedSizes(prev => ({ ...prev, [size]: { ...prev[size], enabled: e.target.checked } }))}
                                style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                              />
                              {size}
                            </label>

                            {isEnabled && (
                              <div style={{ marginTop: '0.25rem', borderTop: '1px dashed var(--color-border)', paddingTop: '0.5rem' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-gray)', display: 'block', marginBottom: '0.25rem' }}>Price Adjust ({sym})</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={selectedSizes[size]?.priceAdjust || 0}
                                  onChange={e => setSelectedSizes(prev => ({ ...prev, [size]: { ...prev[size], priceAdjust: Number(e.target.value) } }))}
                                  style={{ width: '100%', padding: '0.4rem', border: '1px solid var(--color-border)', fontSize: '0.8rem', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px' }}
                                />
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-gray)', marginTop: '0.35rem', display: 'block', fontWeight: '500' }}>
                                  Final: {sym}{(productForm.price + (selectedSizes[size]?.priceAdjust || 0)).toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PRODUCT MEDIA */}
              {activeFormTab === 'media' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

                  {/* Primary Image Upload */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary Catalog Image</span>
                      <div style={{ display: 'flex', gap: '0.25rem', border: '1px solid var(--color-border)', borderRadius: '2px', padding: '2px' }}>
                        <button
                          type="button"
                          onClick={() => setImageMode('upload')}
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', border: 'none', background: imageMode === 'upload' ? 'var(--color-text)' : 'transparent', color: imageMode === 'upload' ? 'var(--color-bg)' : 'var(--color-text)', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s' }}
                        >
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageMode('url')}
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', border: 'none', background: imageMode === 'url' ? 'var(--color-text)' : 'transparent', color: imageMode === 'url' ? 'var(--color-bg)' : 'var(--color-text)', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s' }}
                        >
                          Paste URL
                        </button>
                      </div>
                    </div>

                    {imageMode === 'upload' ? (
                      <div
                        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--color-text)'; }}
                        onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                        onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--color-border)'; const f = e.dataTransfer.files[0]; if (f) handleImageFileChange(f); }}
                        style={{
                          border: '2px dashed var(--color-border)',
                          padding: '2.5rem 1rem',
                          textAlign: 'center',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(0,0,0,0.01)',
                          transition: 'all 0.2s'
                        }}
                        onClick={() => document.getElementById('product-image-input')?.click()}
                      >
                        <input id="product-image-input" type="file" accept="image/*" onChange={e => handleImageFileChange(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                        {imagePreview ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'center' }}>
                            <img src={imagePreview} alt="Preview" style={{ width: '80px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--color-border)' }} />
                            <div style={{ textAlign: 'left' }}>
                              <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{imageFile ? imageFile.name : 'Current Image'}</p>
                              <p style={{ color: 'var(--color-gray)', fontSize: '0.75rem' }}>{imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : 'Drop a new file here to swap'}</p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span style={{ fontSize: '1.5rem', color: 'var(--color-gray)', display: 'block', marginBottom: '0.5rem' }}>↑</span>
                            <p style={{ fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Click or drag a cover image here</p>
                            <p style={{ color: 'var(--color-gray)', fontSize: '0.75rem' }}>Supporting JPEG, PNG, or WEBP up to 5MB</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={productForm.image}
                        onChange={e => setProductForm({ ...productForm, image: e.target.value })}
                        style={{ padding: '0.85rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px' }}
                      />
                    )}
                  </div>

                  {/* Multi-Image Gallery */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Additional Gallery Images
                    </span>

                    {additionalImages.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', border: '1px solid var(--color-border)', padding: '1rem', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.01)' }}>
                        {additionalImages.map((imgUrl, index) => (
                          <div key={index} style={{ position: 'relative', width: '90px', height: '110px', border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                            <img src={imgUrl} alt={`Gallery ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() => setAdditionalImages(additionalImages.filter((_, idx) => idx !== index))}
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(220, 38, 38, 0.95)',
                                color: '#fff',
                                border: 'none',
                                fontSize: '0.7rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: 0
                              }}
                              title="Delete this image"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                      <input
                        type="url"
                        placeholder="Paste image URL here..."
                        value={newAdditionalImageUrl}
                        onChange={e => setNewAdditionalImageUrl(e.target.value)}
                        style={{ flex: 1, padding: '0.85rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newAdditionalImageUrl) return;
                          setAdditionalImages([...additionalImages, newAdditionalImageUrl]);
                          setNewAdditionalImageUrl('');
                          showToast("Gallery image added!");
                        }}
                        style={{ padding: '0 1.25rem', fontSize: '0.8rem', backgroundColor: 'var(--color-text)', color: 'var(--color-bg)', border: 'none', cursor: 'pointer', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em', borderRadius: '2px' }}
                      >
                        Add URL
                      </button>
                      <label
                        style={{
                          padding: '0 1.25rem',
                          fontSize: '0.8rem',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'transparent',
                          color: 'var(--color-text)',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          justifyContent: 'center',
                          textTransform: 'uppercase',
                          fontWeight: '600',
                          letterSpacing: '0.05em',
                          borderRadius: '2px'
                        }}
                      >
                        Upload Files
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={async e => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;
                            showToast(`Uploading ${files.length} images...`);
                            try {
                              const uploadedUrls = await Promise.all(
                                files.map(async file => await uploadImage(file))
                              );
                              setAdditionalImages(prev => [...prev, ...uploadedUrls]);
                              showToast("All images uploaded successfully!");
                            } catch (err: any) {
                              showToast("Upload failed: " + err.message, "error");
                            }
                          }}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </div>

                </div>
              )}

              {/* Form Actions Footer */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {activeFormTab !== 'info' ? (
                    <button
                      type="button"
                      onClick={() => setActiveFormTab(activeFormTab === 'media' ? 'pricing' : 'info')}
                      style={{ padding: '0.75rem 1.5rem', background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text)', cursor: 'pointer', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em', fontWeight: '600' }}
                    >
                      ← Back
                    </button>
                  ) : <div />}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="btn btn-outline"
                    style={{ padding: '0.75rem 2rem', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}
                  >
                    Cancel
                  </button>

                  {activeFormTab !== 'media' ? (
                    <button
                      type="button"
                      onClick={() => setActiveFormTab(activeFormTab === 'info' ? 'pricing' : 'media')}
                      className="btn btn-primary"
                      style={{ padding: '0.75rem 2rem', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}
                    >
                      Next Step →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={savingProduct}
                      className="btn btn-primary"
                      style={{ padding: '0.75rem 2rem', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}
                    >
                      {savingProduct ? 'Saving...' : 'Save Product'}
                    </button>
                  )}
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= MANAGE SUBCATEGORIES MODAL ================= */}
      {showSubcatModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', padding: '2.5rem', width: '100%', maxWidth: '600px', borderRadius: '4px', border: '1px solid var(--color-border)', position: 'relative' }}>
            <button 
              onClick={() => setShowSubcatModal(false)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--color-text)' }}
            >
              ✕
            </button>
            <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>Manage Subcategories</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-gray)', marginBottom: '1.5rem' }}>Select a main category to manage or add new subcategory tags for your catalog.</p>

            {/* Main Category Dropdown in Subcategories Editor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <span style={{ fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Main Category</span>
              <select
                value={selectedSubcatMainCat}
                onChange={e => setSelectedSubcatMainCat(e.target.value)}
                style={{ padding: '0.8rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px' }}
              >
                <option value="shirts" style={{ backgroundColor: 'var(--color-bg)' }}>Shirts</option>
                <option value="t-shirts" style={{ backgroundColor: 'var(--color-bg)' }}>T-Shirts</option>
                <option value="polo" style={{ backgroundColor: 'var(--color-bg)' }}>POLO</option>
                <option value="jeans" style={{ backgroundColor: 'var(--color-bg)' }}>Jeans</option>
                <option value="trousers" style={{ backgroundColor: 'var(--color-bg)' }}>Trousers</option>
                <option value="linen" style={{ backgroundColor: 'var(--color-bg)' }}>LINEN</option>
                <option value="cargo-pants" style={{ backgroundColor: 'var(--color-bg)' }}>Cargo Pants</option>
                <option value="joggers" style={{ backgroundColor: 'var(--color-bg)' }}>Joggers</option>
                <option value="shorts" style={{ backgroundColor: 'var(--color-bg)' }}>SHORTS</option>
                <option value="overshirts" style={{ backgroundColor: 'var(--color-bg)' }}>Overshirts</option>
                <option value="footwear" style={{ backgroundColor: 'var(--color-bg)' }}>Footwear</option>
              </select>
            </div>

            {/* List of current Subcategories */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', padding: '1rem', borderRadius: '4px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-gray)' }}>Current Subcategories</span>
              {(subcategories[selectedSubcatMainCat] || []).length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-gray)', fontStyle: 'italic', margin: 0 }}>No subcategories created yet.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {(subcategories[selectedSubcatMainCat] || []).map(sub => (
                    <span 
                      key={sub} 
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        padding: '0.3rem 0.75rem', 
                        backgroundColor: 'rgba(0,0,0,0.05)', 
                        border: '1px solid var(--color-border)', 
                        borderRadius: '20px', 
                        fontSize: '0.8rem',
                        textTransform: 'capitalize'
                      }}
                    >
                      {sub.replace(/-/g, ' ')}
                      <button 
                        type="button" 
                        onClick={() => {
                          const updatedList = (subcategories[selectedSubcatMainCat] || []).filter(item => item !== sub);
                          const updated = {
                            ...subcategories,
                            [selectedSubcatMainCat]: updatedList
                          };
                          setSubcategories(updated);
                          localStorage.setItem('aura_subcategories', JSON.stringify(updated));
                        }}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#dc2626', padding: 0 }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Subcategory input field */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="Type new subcategory name..."
                value={newSubcatName}
                onChange={e => setNewSubcatName(e.target.value)}
                style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', borderRadius: '2px', fontSize: '0.9rem' }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubcategoryFromModal();
                  }
                }}
              />
              <button 
                type="button" 
                onClick={handleAddSubcategoryFromModal}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.5rem', fontSize: '0.85rem' }}
              >
                Add Subcategory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Visual Live Canvas Simulator Modal */}
      {isCanvasFullscreen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(252, 251, 250, 0.98)', // Premium, light minimalist wash (similar to Aura branding)
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          color: 'var(--color-text)',
          fontFamily: '"Outfit", sans-serif'
        }}>
          {/* Header Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 2.5rem',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: '#fff',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
                <span style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Aura Fullscreen Canvas Preview</span>
              </div>
              {sandboxMode === 'edit' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Component:</span>
                  <select
                    value={selectedBlockId}
                    onChange={(e) => setSelectedBlockId(e.target.value)}
                    className="admin-select"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: '#fff', cursor: 'pointer' }}
                  >
                    {cmsPageConfig.blocks.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.block_type} ({b.id.replace('block_', '')})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Device Toggles */}
            <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'var(--color-bg)' }}>
              <button
                onClick={() => setPreviewMode('desktop')}
                style={{
                  padding: '0.6rem 1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  fontFamily: '"Outfit", sans-serif',
                  backgroundColor: previewMode === 'desktop' ? 'var(--color-text)' : 'transparent',
                  color: previewMode === 'desktop' ? 'var(--color-bg)' : 'var(--color-text)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <Monitor size={15} /> Laptop (Full Width)
              </button>
              <button
                onClick={() => setPreviewMode('tablet')}
                style={{
                  padding: '0.6rem 1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  fontFamily: '"Outfit", sans-serif',
                  backgroundColor: previewMode === 'tablet' ? 'var(--color-text)' : 'transparent',
                  color: previewMode === 'tablet' ? 'var(--color-bg)' : 'var(--color-text)',
                  borderLeft: '1px solid var(--color-border)',
                  borderRight: '1px solid var(--color-border)',
                  borderTop: 'none',
                  borderBottom: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <Tablet size={15} /> Tablet (768px)
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                style={{
                  padding: '0.6rem 1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  fontFamily: '"Outfit", sans-serif',
                  backgroundColor: previewMode === 'mobile' ? 'var(--color-text)' : 'transparent',
                  color: previewMode === 'mobile' ? 'var(--color-bg)' : 'var(--color-text)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <Smartphone size={15} /> Mobile (375px)
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {sandboxMode === 'edit' && (
                <button
                  onClick={() => setShowFullscreenSidebar(!showFullscreenSidebar)}
                  className="btn btn-outline"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.2rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    borderColor: 'var(--color-border)',
                    backgroundColor: showFullscreenSidebar ? 'rgba(0,0,0,0.03)' : 'transparent'
                  }}
                >
                  {showFullscreenSidebar ? <EyeOff size={15} /> : <Eye size={15} />}
                  <span>{showFullscreenSidebar ? "Hide Menu" : "Show Menu"}</span>
                </button>
              )}

              {/* Exit Fullscreen */}
              <button
                onClick={() => setIsCanvasFullscreen(false)}
                className="btn btn-outline"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1.2rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer'
                }}
              >
                <Minimize2 size={15} /> Minimize View
              </button>
            </div>
          </div>

          {/* Simulator Content Area */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            overflow: 'hidden',
            backgroundColor: '#f5f5f4'
          }}>
            {/* Simulator Preview Pane (Left) */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '3rem 1.5rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start'
            }}>
              <div
                style={{
                  width: previewMode === 'desktop' ? '1280px' : previewMode === 'tablet' ? '768px' : '375px',
                  maxWidth: '100%',
                  border: previewMode === 'desktop' ? '1px solid var(--color-border)' : '16px solid #1c1917',
                  borderRadius: previewMode === 'desktop' ? '8px' : previewMode === 'tablet' ? '28px' : '40px',
                  backgroundColor: 'var(--color-bg)',
                  boxShadow: '0 30px 100px rgba(0,0,0,0.12)',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                {/* Top Notch for mobile/tablet view */}
                {(previewMode === 'mobile' || previewMode === 'tablet') && (
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '120px',
                    height: '18px',
                    backgroundColor: '#1c1917',
                    borderBottomLeftRadius: '12px',
                    borderBottomRightRadius: '12px',
                    zIndex: 100,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#27272a', marginRight: '6px' }}></span>
                    <span style={{ width: '40px', height: '3px', borderRadius: '2px', backgroundColor: '#27272a' }}></span>
                  </div>
                )}

                {/* Browser bar */}
                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.02)',
                  padding: (previewMode === 'mobile' || previewMode === 'tablet') ? '1.25rem 1.25rem 0.5rem 1.25rem' : '0.65rem 1.25rem',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  zIndex: 5
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#eab308' }}></span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
                  <span style={{ marginLeft: '0.75rem', fontSize: '0.7rem', color: 'var(--color-gray)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Aura Visual Simulator (Active Config Canvas)
                  </span>
                </div>

                {/* Page Visual Blocks */}
                <div
                  className={`preview-container-wrap ${previewMode === 'mobile' ? 'preview-mobile' : previewMode === 'tablet' ? 'preview-tablet' : 'preview-desktop'}`}
                  style={{
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem',
                    backgroundColor: '#fff'
                  }}
                >
                  {renderVisualBlocks()}
                </div>
              </div>
            </div>

            {/* Config Sidebar Pane (Right) - Only in edit mode and visible */}
            {sandboxMode === 'edit' && showFullscreenSidebar && (
              <div style={{
                width: `${fullscreenSidebarWidth}px`,
                borderLeft: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg)',
                padding: '1.5rem',
                overflowY: 'auto',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxShadow: '-10px 0 30px rgba(0,0,0,0.02)',
                transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Sliders size={16} style={{ color: 'var(--color-accent)' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Component Properties</span>
                    </div>
                    {/* Size Selector Control */}
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        onClick={() => setFullscreenSidebarWidth(320)}
                        style={{ padding: '2px 6px', fontSize: '0.65rem', fontWeight: 600, border: '1px solid var(--color-border)', backgroundColor: fullscreenSidebarWidth === 320 ? 'var(--color-text)' : 'transparent', color: fullscreenSidebarWidth === 320 ? 'var(--color-bg)' : 'var(--color-text)', cursor: 'pointer', borderRadius: '2px' }}
                        title="Compact Width (320px)"
                      >
                        S
                      </button>
                      <button
                        onClick={() => setFullscreenSidebarWidth(420)}
                        style={{ padding: '2px 6px', fontSize: '0.65rem', fontWeight: 600, border: '1px solid var(--color-border)', backgroundColor: fullscreenSidebarWidth === 420 ? 'var(--color-text)' : 'transparent', color: fullscreenSidebarWidth === 420 ? 'var(--color-bg)' : 'var(--color-text)', cursor: 'pointer', borderRadius: '2px' }}
                        title="Standard Width (420px)"
                      >
                        M
                      </button>
                      <button
                        onClick={() => setFullscreenSidebarWidth(550)}
                        style={{ padding: '2px 6px', fontSize: '0.65rem', fontWeight: 600, border: '1px solid var(--color-border)', backgroundColor: fullscreenSidebarWidth === 550 ? 'var(--color-text)' : 'transparent', color: fullscreenSidebarWidth === 550 ? 'var(--color-bg)' : 'var(--color-text)', cursor: 'pointer', borderRadius: '2px' }}
                        title="Wide Width (550px)"
                      >
                        L
                      </button>
                    </div>
                  </div>
                  {/* Fine grain width adjustment slider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Width: {fullscreenSidebarWidth}px</span>
                    <input
                      type="range"
                      min="300"
                      max="700"
                      value={fullscreenSidebarWidth}
                      onChange={(e) => setFullscreenSidebarWidth(Number(e.target.value))}
                      style={{ flex: 1, height: '3px', cursor: 'ew-resize', accentColor: 'var(--color-accent)' }}
                    />
                  </div>
                </div>
                {renderEditMenuRef()}
              </div>
            )}
          </div>
        </div>
      )}
      {/* RLS Instructions Modal */}
      {showRlsInstructionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            color: '#f8fafc',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(197, 168, 128, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #1e293b',
              backgroundColor: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>⚡</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#facc15', fontFamily: '"Outfit", sans-serif' }}>DATABASE WRITE BLOCKED</h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Row-Level Security Policy Violation</span>
                </div>
              </div>
              <button
                onClick={() => setShowRlsInstructionModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', maxHeight: '70vh' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                You are currently running on <strong>localhost</strong>, which bypasses the frontend Admin access check.
                However, writing changes live requires authorization in your cloud database (Supabase).
                Your current session lacks administrator privileges.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600 }}>How to enable live publishing:</h4>
                <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.5rem', lineHeight: '1.5' }}>
                  <li>
                    <strong style={{ color: '#cbd5e1' }}>Register/Sign up</strong> a user account at the Auth page:
                    <br />
                    <a
                      href="/auth"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#c5a880', textDecoration: 'underline', fontWeight: 600, display: 'inline-block', marginTop: '0.25rem' }}
                    >
                      Open Auth Page in New Tab ↗
                    </a>
                  </li>
                  <li>
                    Log in with that account.
                  </li>
                  <li>
                    Open your <strong style={{ color: '#cbd5e1' }}>Supabase Project Dashboard</strong> and navigate to the <strong style={{ color: '#cbd5e1' }}>SQL Editor</strong>.
                  </li>
                  <li>
                    Execute the SQL statement below to promote your account to <strong style={{ color: '#cbd5e1' }}>admin</strong> status:
                  </li>
                </ol>
              </div>

              {/* SQL box */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>SQL Command</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("UPDATE public.profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL';");
                      alert("SQL command copied to clipboard!");
                    }}
                    style={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      color: '#cbd5e1',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Copy SQL
                  </button>
                </div>
                <pre style={{
                  margin: 0,
                  padding: '1rem',
                  backgroundColor: '#020617',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  color: '#38bdf8',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap'
                }}>
                  {`UPDATE public.profiles \nSET role = 'admin' \nWHERE email = 'YOUR_EMAIL_ADDRESS';`}
                </pre>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>
                  * Replace <code style={{ color: '#e2e8f0' }}>YOUR_EMAIL_ADDRESS</code> with the email of the account you signed up with.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #1e293b',
              backgroundColor: '#0f172a',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => setShowRlsInstructionModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
