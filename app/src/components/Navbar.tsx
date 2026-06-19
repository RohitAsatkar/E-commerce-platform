import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../lib/useProducts';
import { formatPrice } from '../lib/currency';
import { supabase } from '../lib/supabase';
import { searchProducts } from '../lib/searchEngine';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const { products } = useProducts();
  const navigate = useNavigate();
  const { user } = useAuth();

  const popularSearches = ['Linen', 'Overshirts', 'Cargo Pants', 'Footwear'];

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      setCartCount(0);
      return;
    }

    const fetchCartCount = async () => {
      try {
        const { data, error } = await supabase
          .from('cart_items')
          .select('quantity')
          .eq('user_id', user.id);

        if (error) throw error;
        
        const total = data ? data.reduce((sum, item: any) => sum + (item.quantity || 1), 0) : 0;
        setCartCount(total);
      } catch (err) {
        console.error("Failed to fetch cart count:", err);
      }
    };

    fetchCartCount();

    const handleCartChange = () => {
      fetchCartCount();
    };

    window.addEventListener('cart-change', handleCartChange);

    // Subscribe to realtime changes on cart_items table for this user
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchCartCount();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('cart-change', handleCartChange);
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        isSearchOpen &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
        setSearchQuery('');
        if (searchInputRef.current) {
          searchInputRef.current.blur();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed === '') return;

    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setDebouncedQuery('');
      setSearchResults([]);
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery === '') {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    // Execute the backend-like normalized fuzzy search pipeline
    const results = searchProducts(products, debouncedQuery);
    setSearchResults(results.slice(0, 5));
    setSearchLoading(false);
  }, [debouncedQuery, products]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const location = useLocation();
  const isHome = location.pathname === '/';
  const isSolid = isScrolled || !isHome;

  // Load custom pages dynamically to populate the sandwich menu
  const [customPages, setCustomPages] = useState<any[]>([]);

  useEffect(() => {
    const loadPages = async () => {
      const saved = localStorage.getItem('aura_custom_pages');
      if (saved) {
        try {
          setCustomPages(JSON.parse(saved));
        } catch (e) {}
      }

      try {
        const { data } = await supabase
          .from('storefront_config')
          .select('config')
          .eq('id', 'custom_pages')
          .maybeSingle();
        if (data && data.config) {
          setCustomPages(data.config);
          localStorage.setItem('aura_custom_pages', JSON.stringify(data.config));
        }
      } catch (err) {
        console.error("Failed to load custom pages from cloud:", err);
      }
    };
    loadPages();
  }, [isMenuDrawerOpen]);

  // Load active campaign for the top banner
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const checkCampaigns = async () => {
      let campaigns = [];
      const saved = localStorage.getItem('aura_sales_campaigns');
      if (saved) {
        try {
          campaigns = JSON.parse(saved);
        } catch (e) {}
      }

      try {
        const { data } = await supabase
          .from('storefront_config')
          .select('config')
          .eq('id', 'sales_campaigns')
          .maybeSingle();
        if (data && data.config) {
          campaigns = data.config;
          localStorage.setItem('aura_sales_campaigns', JSON.stringify(data.config));
        }
      } catch (err) {
        console.error("Failed to load campaigns from cloud:", err);
      }

      const now = new Date().getTime();
      const active = campaigns.find((c: any) => {
        if (c.status !== 'active') return false;
        if (c.startDate && new Date(c.startDate).getTime() > now) return false;
        if (c.endDate && new Date(c.endDate).getTime() < now) return false;
        return true;
      });
      setActiveCampaign(active || null);
    };

    checkCampaigns();
    const interval = setInterval(checkCampaigns, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeCampaign || !activeCampaign.endDate) {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const diff = new Date(activeCampaign.endDate).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        setActiveCampaign(null);
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      const parts = [];
      if (hours > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);
      setTimeLeft(parts.join(' '));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeCampaign]);

  return (
    <>
      {activeCampaign && (
        <>
          <div 
            style={{
              backgroundColor: activeCampaign.type === 'flash_sale' ? '#dc2626' : '#121212',
              color: '#fff',
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              padding: '0.45rem 1rem',
              textAlign: 'center',
              fontWeight: '700',
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              zIndex: 1001,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.75rem',
              fontFamily: 'Outfit, sans-serif',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}
          >
            <span>{activeCampaign.title} — Save {activeCampaign.discountValue}{activeCampaign.discountType === 'percentage' ? '%' : '₹'} Off Selected Pieces!</span>
            {timeLeft && (
              <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.1rem 0.5rem', borderRadius: '2px', fontFamily: 'monospace', fontSize: '0.7rem' }}>
                Ends in: {timeLeft}
              </span>
            )}
          </div>
          <style>{`
            .navbar { top: 28px !important; }
            .main-content { margin-top: 28px !important; }
            .categories-drawer { top: 28px !important; height: calc(100% - 28px) !important; }
          `}</style>
        </>
      )}
      <nav className={`navbar ${isSolid ? 'scrolled' : ''}`}>
        <div className="container nav-container">
          <div className="nav-left">
            <button className="sandwich-menu-btn" onClick={() => setIsMenuDrawerOpen(true)}>
              <Menu size={24} />
            </button>
            <Link to="/" className="brand-logo mobile-logo">AURA</Link>
          </div>

          <div className="nav-center desktop-logo-container">
            <Link to="/" className="brand-logo desktop-logo">AURA</Link>
          </div>

          <div className="nav-right">
            <div ref={searchContainerRef} className="nav-search-container">
              <button 
                className={`icon-btn search-trigger-btn ${isSearchOpen ? 'hide' : ''}`} 
                onClick={() => setIsSearchOpen(true)}
              >
                <Search size={20} />
              </button>
              
              <form onSubmit={handleSearchSubmit} className={`minimal-search-wrapper ${isSearchOpen ? 'open' : ''}`}>
                <Search size={16} className="minimal-search-icon" />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  className="minimal-search-input" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <button type="submit" style={{ display: 'none' }} />
                <button type="button" className="minimal-search-close" onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}><X size={16} /></button>
                
                {isSearchOpen && (
                  <div className="minimal-search-dropdown">
                    {searchQuery.trim() === '' ? (
                      <div className="minimal-search-suggestions">
                        <span className="suggestions-title">Popular Searches</span>
                        <div className="suggestions-pills">
                          {popularSearches.map(tag => (
                            <button
                              key={tag}
                              type="button"
                              className="suggestion-pill"
                              onClick={() => {
                                setSearchQuery(tag);
                              }}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : searchQuery.trim().length < 2 ? (
                      <div className="minimal-no-results" style={{ fontSize: '0.8rem', color: 'var(--color-gray)' }}>
                        Type at least 2 characters...
                      </div>
                    ) : searchLoading ? (
                      <div className="minimal-skeleton-container">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="minimal-skeleton-item">
                            <div className="skeleton-image shimmer" />
                            <div className="skeleton-info">
                              <div className="skeleton-line title shimmer" />
                              <div className="skeleton-line price shimmer" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(product => (
                        <Link 
                          key={product.id} 
                          to={`/product/${product.id}`} 
                          className="minimal-result-item"
                          onClick={() => {
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          <div className="result-img-wrapper">
                            <img src={product.image} alt={product.name} />
                          </div>
                          <div className="minimal-result-info">
                            <h4>{product.name}</h4>
                            <p>{formatPrice(product)}</p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="minimal-no-results">
                        No products found.
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
            <Link to={user ? "/account" : "/auth"} className="icon-btn"><User size={20} /></Link>
            <Link to="/cart" className="icon-btn cart-btn">
              <ShoppingBag size={20} />
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </Link>
          </div>
        </div>
      </nav>

      {/* Categories Sliding Drawer (Sandwich Menu sidebar) */}
      <div 
        className={`categories-drawer-overlay ${isMenuDrawerOpen ? 'open' : ''}`} 
        onClick={() => setIsMenuDrawerOpen(false)}
      >
        <div className="categories-drawer" onClick={e => e.stopPropagation()}>
          <div className="categories-drawer-header">
            <button className="drawer-close-btn" onClick={() => setIsMenuDrawerOpen(false)}>
              <X size={20} />
            </button>
            <span className="drawer-title">CATEGORIES</span>
            <div style={{ width: '20px' }}></div> {/* Symmetry Spacer */}
          </div>
          <div className="categories-drawer-content">
            <ul className="drawer-menu-links">
              <li className="drawer-section-title">Collections</li>
              <li>
                <Link to="/shop/new" onClick={() => setIsMenuDrawerOpen(false)}>
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/shop/all" onClick={() => setIsMenuDrawerOpen(false)}>
                  View All
                </Link>
              </li>
              {customPages.filter(p => p.type === 'collection' || p.type === 'custom' || p.type === 'editorial' || p.type === 'launch' || p.type === 'collab' || p.type === 'seasonal' || p.type === 'sustainability').map(page => (
                <li key={page.id}>
                  <Link to={`/page/${page.slug}`} onClick={() => setIsMenuDrawerOpen(false)}>
                    {page.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/story" onClick={() => setIsMenuDrawerOpen(false)}>
                  Our Story
                </Link>
              </li>

              <li className="drawer-section-title" style={{ marginTop: '1.5rem' }}>Main Categories</li>
              <li>
                <Link to="/shop/shirts" onClick={() => setIsMenuDrawerOpen(false)}>
                  Shirts
                </Link>
              </li>
              <li>
                <Link to="/shop/t-shirts" onClick={() => setIsMenuDrawerOpen(false)}>
                  T-Shirts
                </Link>
              </li>
              <li>
                <Link to="/shop/polo" onClick={() => setIsMenuDrawerOpen(false)}>
                  POLO
                </Link>
              </li>
              <li>
                <Link to="/shop/jeans" onClick={() => setIsMenuDrawerOpen(false)}>
                  Jeans
                </Link>
              </li>
              <li>
                <Link to="/shop/trousers" onClick={() => setIsMenuDrawerOpen(false)}>
                  Trousers
                </Link>
              </li>
              <li>
                <Link to="/shop/linen" onClick={() => setIsMenuDrawerOpen(false)}>
                  Linen Edit
                </Link>
              </li>
              <li>
                <Link to="/shop/cargo-pants" onClick={() => setIsMenuDrawerOpen(false)}>
                  Cargo Pants
                </Link>
              </li>
              <li>
                <Link to="/shop/joggers" onClick={() => setIsMenuDrawerOpen(false)}>
                  Joggers
                </Link>
              </li>
              <li>
                <Link to="/shop/shorts" onClick={() => setIsMenuDrawerOpen(false)}>
                  Shorts
                </Link>
              </li>
              <li>
                <Link to="/shop/overshirts" onClick={() => setIsMenuDrawerOpen(false)}>
                  Overshirts
                </Link>
              </li>
              <li>
                <Link to="/shop/footwear" onClick={() => setIsMenuDrawerOpen(false)}>
                  Footwear
                </Link>
              </li>

              <li className="drawer-section-title" style={{ marginTop: '1.5rem' }}>Limited Offers & Events</li>
              <li>
                <Link 
                  to="/shop/all?filter=sale" 
                  onClick={() => setIsMenuDrawerOpen(false)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-accent)' }}
                >
                  <span>AURA ARCHIVE COLLECTION</span>
                  <span className="drawer-badge-sale">FLAT 50% OFF</span>
                </Link>
              </li>
              {customPages.filter(p => p.type === 'sale' || p.type === 'offer' || p.type === 'vip').map(page => (
                <li key={page.id}>
                  <Link 
                    to={`/page/${page.slug}`} 
                    onClick={() => setIsMenuDrawerOpen(false)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-accent)' }}
                  >
                    <span>{page.title.toUpperCase()}</span>
                    {page.bannerTitle ? <span className="drawer-badge-sale">{page.bannerTitle.toUpperCase()}</span> : <span className="drawer-badge-sale">HOT OFFER</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
