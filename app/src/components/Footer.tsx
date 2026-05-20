import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h2 className="footer-logo">AURA</h2>
            <p className="footer-desc">Redefining elegance with minimalist luxury apparel tailored for the modern individual.</p>
          </div>
          
          <div className="footer-links">
            <h3>Shop</h3>
            <ul>
              <li><Link to="/shop/new">New Arrivals</Link></li>
              <li><Link to="/shop/all">View All</Link></li>
              <li><Link to="/shop/accessories">Accessories</Link></li>
            </ul>
          </div>
          
          <div className="footer-links">
            <h3>Support</h3>
            <ul>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/shipping">Shipping & Returns</Link></li>
              <li><Link to="/size-guide">Size Guide</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>
          
          <div className="footer-newsletter">
            <h3>Newsletter</h3>
            <p>Subscribe to receive updates, access to exclusive deals, and more.</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" required />
              <button type="submit">Subscribe</button>
            </form>
            <div className="social-links mt-4">
              <a href="#">Instagram</a>
              <a href="#">Facebook</a>
              <a href="#">Twitter</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom flex justify-between items-center">
          <p>&copy; {new Date().getFullYear()} AURA. All rights reserved.</p>
          <div className="payment-methods">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>Amex</span>
            <span>Apple Pay</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
