import { Link } from 'react-router-dom';
import { useProducts } from '../lib/useProducts';
import { formatPrice } from '../lib/currency';
import './Home.css';

const FEATURED_CATEGORIES = [
  { name: 'Shirts', slug: 'shirts', image: 'https://images.unsplash.com/photo-1620012253295-c05518e99309?auto=format&fit=crop&q=80&w=400', badge: 'New' },
  { name: 'T-Shirts', slug: 't-shirts', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=400' },
  { name: 'Polo', slug: 'polo', image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&q=80&w=400' },
  { name: 'Jeans', slug: 'jeans', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=400', badge: 'Classic' },
  { name: 'Trousers', slug: 'trousers', image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=400' },
  { name: 'Linen', slug: 'linen', image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&q=80&w=400', badge: 'Premium' },
  { name: 'Cargo Pants', slug: 'cargo-pants', image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=400' },
  { name: 'Joggers', slug: 'joggers', image: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&q=80&w=400' },
  { name: 'Shorts', slug: 'shorts', image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=400' },
  { name: 'Overshirts', slug: 'overshirts', image: 'https://images.unsplash.com/photo-1590330297626-d7aff25a0431?auto=format&fit=crop&q=80&w=400', badge: 'Trending' },
  { name: 'Footwear', slug: 'footwear', image: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&q=80&w=400', badge: 'New Launch' }
];

const Home = () => {
  const { products } = useProducts();
  
  // Show the 4 newest products marked as "New Arrival", falling back to newest overall if needed
  const newArrivalsList = products.filter(p => p.is_new);
  const featuredProducts = newArrivalsList.length > 0 
    ? newArrivalsList.slice(0, 4) 
    : products.slice(0, 4);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg" style={{ backgroundImage: 'url(/images/hero.png)' }}></div>
        <div className="hero-overlay"></div>
        <div className="container hero-content text-center">
          <span className="hero-badge animate-fade-up">Fall / Winter Collection</span>
          <h1 className="hero-title animate-fade-up delay-1">Redefining Elegance</h1>
          <p className="hero-subtitle animate-fade-up delay-2">Discover the new standard of minimalist luxury apparel.</p>
          <div className="hero-actions animate-fade-up delay-3">
            <Link to="/shop/men" className="btn btn-outline" style={{ color: '#fff', borderColor: '#fff' }}>Shop Men</Link>
            <Link to="/shop/accessories" className="btn btn-primary" style={{ backgroundColor: '#fff', color: '#000' }}>Shop Accessories</Link>
          </div>
        </div>
      </section>

      {/* Featured Categories Grid Section */}
      <section className="featured-cat-section">
        <div className="container">
          <h2 className="featured-cat-title">Featured Categories</h2>
          <div className="featured-cat-grid">
            {FEATURED_CATEGORIES.map(cat => (
              <Link key={cat.slug} to={`/shop/${cat.slug}`} className="featured-cat-card">
                <div className="featured-cat-header">
                  <span className="featured-cat-name">{cat.name}</span>
                  {cat.badge && (
                    <span className={`featured-cat-badge ${cat.badge.toLowerCase() === 'new' ? 'new' : ''}`}>
                      {cat.badge}
                    </span>
                  )}
                </div>
                <div className="featured-cat-image-wrapper">
                  <img src={cat.image} alt={cat.name} className="featured-cat-img" />
                  <div className="featured-cat-shadow" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Press / Social Proof */}
      <section className="press-section">
        <div className="container">
          <p className="press-title">As Featured In</p>
          <div className="press-logos">
            <span>VOGUE</span>
            <span>GQ</span>
            <span>Harper's BAZAAR</span>
            <span>ELLE</span>
            <span>Esquire</span>
          </div>
        </div>
      </section>



      {/* New Arrivals Section */}
      <section className="section new-arrivals">
        <div className="container">
          <div className="section-header text-center mb-8">
            <h2 className="section-title">New Arrivals</h2>
            <Link to="/shop/new" className="view-all-link">View All Collection</Link>
          </div>
          
          <div className="product-grid">
            {featuredProducts.map(product => (
              <Link to={`/product/${product.id}`} key={product.id} className="product-card">
                <div className="product-image-wrap">
                  <img src={product.image} alt={product.name} className="product-image" />
                  {product.is_new && <span className="badge-new">New</span>}
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-price">{formatPrice(product)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Story Teaser */}
      <section className="story-teaser flex items-center">
        <div className="story-image flex-1" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=1200)' }}></div>
        <div className="story-content flex-1">
          <h2 className="mb-4">The AURA Philosophy</h2>
          <p className="mb-8">We believe that true luxury lies in simplicity. Every piece we create is a testament to meticulous craftsmanship, sustainable practices, and timeless design. Join us in embracing a wardrobe that speaks volumes through whispers.</p>
          <Link to="/story" className="btn btn-outline">Read Our Story</Link>
        </div>
      </section>

      {/* Enhanced Newsletter Block */}
      <section className="section newsletter-block text-center">
        <div className="container" style={{ maxWidth: '600px' }}>
          <h2 className="mb-2">Join the AURA Club</h2>
          <p className="mb-8" style={{ color: 'var(--color-gray)' }}>Subscribe to receive early access to new collections and exclusive editorial content.</p>
          <form className="flex gap-4" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Email Address" required style={{ flex: 1, padding: '1rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent' }} />
            <button type="submit" className="btn btn-primary">Subscribe</button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;
