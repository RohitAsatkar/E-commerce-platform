import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../lib/useProducts';
import { formatPrice } from '../lib/currency';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { products } = useProducts();

  const searchResults = searchQuery.trim() === '' 
    ? [] 
    : products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const location = useLocation();
  const { user } = useAuth();
  const isHome = location.pathname === '/';
  const isSolid = isScrolled || !isHome;

  return (
    <nav className={`navbar ${isSolid ? 'scrolled' : ''}`}>
      <div className="container nav-container">
        <div className="nav-left">
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <ul className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
            <li><Link to="/shop/new" onClick={() => setIsMobileMenuOpen(false)}>New Arrivals</Link></li>
            <li><Link to="/shop/men" onClick={() => setIsMobileMenuOpen(false)}>Men</Link></li>
            <li><Link to="/story" onClick={() => setIsMobileMenuOpen(false)}>Our Story</Link></li>
          </ul>
        </div>

        <div className="nav-center">
          <Link to="/" className="brand-logo">AURA</Link>
        </div>

        <div className="nav-right">
          <div className="nav-search-container">
            {!isSearchOpen ? (
              <button className="icon-btn" onClick={() => setIsSearchOpen(true)}><Search size={20} /></button>
            ) : (
              <div className="minimal-search-wrapper">
                <Search size={16} className="minimal-search-icon" />
                <input 
                  type="text" 
                  className="minimal-search-input" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <button className="minimal-search-close" onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}><X size={16} /></button>
                
                {searchQuery.trim() !== '' && (
                  <div className="minimal-search-dropdown">
                    {searchResults.length > 0 ? (
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
                          <img src={product.image} alt={product.name} />
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
              </div>
            )}
          </div>
          <Link to={user ? "/account" : "/auth"} className="icon-btn"><User size={20} /></Link>
          <Link to="/cart" className="icon-btn cart-btn">
            <ShoppingBag size={20} />
            <span className="cart-count">2</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
