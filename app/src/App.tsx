import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.tsx';
import Footer from './components/Footer.tsx';
import Home from './pages/Home.tsx';
import ProductListing from './pages/ProductListing.tsx';
import ProductDetail from './pages/ProductDetail.tsx';
import Cart from './pages/Cart.tsx';
import Checkout from './pages/Checkout.tsx';
import UserAccount from './pages/UserAccount.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import BrandStory from './pages/BrandStory.tsx';
import Auth from './pages/Auth.tsx';
import CustomDynamicPage from './pages/CustomDynamicPage.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/shop" element={<ProductListing />} />
              <Route path="/shop/:category" element={<ProductListing />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/account" element={<UserAccount />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/story" element={<BrandStory />} />
              <Route path="/page/:slug" element={<CustomDynamicPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
