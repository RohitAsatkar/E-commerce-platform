import { Link } from 'react-router-dom';
import { useProducts } from '../lib/useProducts';
import { formatPrice } from '../lib/currency';
import './Home.css';

const Home = () => {
  const { products } = useProducts();
  const featuredProducts = products.slice(0, 4);

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
            <Link to="/shop/women" className="btn btn-outline" style={{ color: '#fff', borderColor: '#fff' }}>Shop Women</Link>
            <Link to="/shop/men" className="btn btn-primary" style={{ backgroundColor: '#fff', color: '#000' }}>Shop Men</Link>
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

      {/* Featured Categories */}
      <section className="section featured-categories">
        <div className="container">
          <div className="category-grid">
            <Link to="/shop/women" className="category-card">
              <div className="category-image" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800)' }}></div>
              <div className="category-content">
                <h3>Women</h3>
                <span>Shop Now</span>
              </div>
            </Link>
            <Link to="/shop/men" className="category-card">
              <div className="category-image" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=800)' }}></div>
              <div className="category-content">
                <h3>Men</h3>
                <span>Shop Now</span>
              </div>
            </Link>
            <Link to="/shop/accessories" className="category-card">
              <div className="category-image" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800)' }}></div>
              <div className="category-content">
                <h3>Accessories</h3>
                <span>Shop Now</span>
              </div>
            </Link>
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
