import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useProducts } from '../lib/useProducts';
import { getProductCurrency } from '../lib/currency';
import { Trash2, Plus, Minus, Tag, Gift, Truck, ShieldCheck, Clock } from 'lucide-react';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Custom Cart Enhancements State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [giftWrap, setGiftWrap] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const savedPromo = localStorage.getItem('cart_promo_code');
    const savedGift = localStorage.getItem('cart_gift_wrap');
    if (savedPromo) setAppliedPromo(savedPromo);
    if (savedGift) setGiftWrap(savedGift === 'true');
  }, []);

  useEffect(() => {
    if (appliedPromo) {
      localStorage.setItem('cart_promo_code', appliedPromo);
    } else {
      localStorage.removeItem('cart_promo_code');
    }
  }, [appliedPromo]);

  useEffect(() => {
    localStorage.setItem('cart_gift_wrap', String(giftWrap));
  }, [giftWrap]);

  const handleApplyPromo = () => {
    setPromoMessage(null);
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;
    
    if (code === 'WELCOME10') {
      setAppliedPromo('WELCOME10');
      setPromoMessage({ text: 'Promo code WELCOME10 (10% OFF) applied successfully!', type: 'success' });
      setPromoCodeInput('');
    } else if (code === 'LUXURY20') {
      setAppliedPromo('LUXURY20');
      setPromoMessage({ text: 'Promo code LUXURY20 (20% OFF) applied successfully!', type: 'success' });
      setPromoCodeInput('');
    } else if (code === 'FREE500') {
      setAppliedPromo('FREE500');
      setPromoMessage({ text: 'Promo code FREE500 (Flat ₹500 / $7 OFF) applied successfully!', type: 'success' });
      setPromoCodeInput('');
    } else {
      setPromoMessage({ text: 'Invalid promo code. Try WELCOME10, LUXURY20 or FREE500.', type: 'error' });
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoMessage({ text: 'Promo code removed.', type: 'success' });
  };

  const fetchCart = async () => {
    if (!user) return;
    const { data } = await supabase.from('cart_items').select('*').eq('user_id', user.id);
    if (data) {
      const mapped = data.map((item: any) => ({
        ...item,
        product: products.find(p => p.id === item.product_id) || products[0]
      }));
      setCartItems(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (productsLoading) return;
    fetchCart();
  }, [user, products, productsLoading]);

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    if (!user || newQty < 1) return;
    setUpdatingId(itemId);
    try {
      const { error } = await supabase.from('cart_items').update({ quantity: newQty }).eq('id', itemId).eq('user_id', user.id);
      if (error) throw error;
      setCartItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, quantity: newQty } : item
      ));
    } catch (err: any) {
      alert('Error updating quantity: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!user) return;
    setUpdatingId(itemId);
    try {
      const { error } = await supabase.from('cart_items').delete().eq('id', itemId).eq('user_id', user.id);
      if (error) throw error;
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err: any) {
      alert('Error removing item: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const currSymbol = cartItems.length > 0 ? getProductCurrency(cartItems[0].product) : '₹';
  
  // Custom Cart Enhancements Calculation
  const giftWrapCost = currSymbol === '₹' ? 250 : 5;
  const freeShippingThreshold = currSymbol === '₹' ? 10000 : 150;
  
  // Calculate Promo Discount
  let discount = 0;
  if (appliedPromo === 'WELCOME10') {
    discount = subtotal * 0.10;
  } else if (appliedPromo === 'LUXURY20') {
    discount = subtotal * 0.20;
  } else if (appliedPromo === 'FREE500') {
    discount = currSymbol === '₹' ? 500 : 7;
    if (discount > subtotal) discount = subtotal;
  }

  const finalTotal = Math.max(0, subtotal - discount + (giftWrap ? giftWrapCost : 0));
  const progressPercent = Math.min((subtotal / freeShippingThreshold) * 100, 100);
  const remainingForFreeShipping = freeShippingThreshold - subtotal;

  if (loading) return <div className="section container text-center" style={{ paddingTop: '120px' }}>Loading...</div>;

  if (!user) {
    return (
      <div className="section container text-center" style={{ paddingTop: '120px' }}>
        <h2>Please sign in to view your cart</h2>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/auth')}>Sign In</button>
      </div>
    );
  }

  return (
    <div className="section" style={{ paddingTop: '140px', minHeight: '90vh', backgroundColor: '#fafafa' }}>
      <div className="container" style={{ maxWidth: '1200px' }}>
        
        {/* Cart Title & Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 300, fontFamily: 'var(--font-heading)', margin: 0 }}>Shopping Bag</h1>
          <span style={{ fontSize: '0.95rem', color: 'var(--color-gray)', letterSpacing: '0.05em' }}>
            {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>

        {cartItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem 0', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
            <p style={{ fontSize: '1.2rem', color: 'var(--color-gray)', marginBottom: '2rem', fontWeight: 300 }}>Your shopping bag is currently empty.</p>
            <button className="btn btn-primary" style={{ padding: '0.85rem 2.5rem' }} onClick={() => navigate('/shop')}>Explore Collection</button>
          </div>
        ) : (
          <div className="cart-split-layout">
            
            {/* Left Side: Cart Items list & Options */}
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              
              {/* Cart Items List */}
              <div style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                {cartItems.map((item, idx) => (
                  <div 
                    key={item.id} 
                    style={{ 
                      display: 'flex', 
                      gap: '1.5rem', 
                      padding: '2rem', 
                      borderBottom: idx === cartItems.length - 1 ? 'none' : '1px solid var(--color-border)', 
                      opacity: updatingId === item.id ? 0.6 : 1, 
                      transition: 'all 0.2s ease',
                      flexWrap: 'wrap'
                    }}
                  >
                    {/* Item Image */}
                    <div 
                      onClick={() => navigate(`/product/${item.product.id}`)}
                      style={{ width: '100px', height: '133px', cursor: 'pointer', overflow: 'hidden', backgroundColor: '#f0f0f0', flexShrink: 0, border: '1px solid rgba(0,0,0,0.05)' }}
                    >
                      <img 
                        src={item.product.image} 
                        alt={item.product.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} 
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    </div>

                    {/* Item Details */}
                    <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', minWidth: '200px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.5rem' }}>
                        <h3 
                          onClick={() => navigate(`/product/${item.product.id}`)}
                          style={{ fontSize: '1.1rem', fontWeight: 500, margin: 0, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {item.product.name}
                        </h3>
                        <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                          {getProductCurrency(item.product)}{(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--color-gray)', marginBottom: '1.25rem' }}>
                        <span>Size: <strong style={{ color: 'var(--color-text)' }}>{item.size}</strong></span>
                        <span>Price: <strong style={{ color: 'var(--color-text)' }}>{getProductCurrency(item.product)}{item.product.price.toFixed(2)}</strong></span>
                      </div>

                      {/* Interactive Controls Line */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '1rem' }}>
                        {/* Quantity Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: '2px', height: '36px' }}>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updatingId === item.id}
                            style={{ width: '36px', height: '100%', border: 'none', background: 'transparent', cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: item.quantity <= 1 ? 0.3 : 0.8, color: 'var(--color-text)' }}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ width: '36px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600, borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={updatingId === item.id}
                            style={{ width: '36px', height: '100%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8, color: 'var(--color-text)' }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Remove item button */}
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={updatingId === item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            color: '#b91c1c',
                            fontWeight: 500,
                            padding: '0.5rem',
                            borderRadius: '4px',
                            transition: 'background-color 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(185, 28, 28, 0.05)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Trash2 size={14} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Luxury Options Card */}
              <div style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1.25rem 0' }}>Bag Options</h3>
                
                {/* Gift Wrap */}
                <div 
                  style={{
                    border: '1px solid var(--color-border)',
                    padding: '1.25rem',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'border-color 0.15s'
                  }}
                  onClick={() => setGiftWrap(!giftWrap)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-text)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                >
                  <input
                    type="checkbox"
                    checked={giftWrap}
                    onChange={(e) => setGiftWrap(e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: '18px', height: '18px', marginTop: '3px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      <Gift size={14} style={{ color: 'var(--color-accent)' }} />
                      <span>Luxury Gift Wrapping & Signature Storage Box</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)' }}>
                        (+{currSymbol}{giftWrapCost.toFixed(2)})
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-gray)', margin: 0, lineHeight: '1.4' }}>
                      Your items will be presented in our premium gold-embossed matte black box, wrapped in silk tissue, with a custom handwritten calligraphy greeting card.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Sticky Checkout Summary Card */}
            <div style={{ position: 'sticky', top: '120px', display: 'grid', gap: '1.5rem' }}>
              
              {/* Free Shipping Progress Indicator (in summary) */}
              <div style={{
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Truck size={18} style={{ color: progressPercent >= 100 ? '#2e7d32' : 'var(--color-accent)' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {progressPercent >= 100 ? 'Free Premium Shipping Unlocked!' : `Add ${currSymbol}${remainingForFreeShipping.toFixed(2)} for Free Shipping`}
                  </span>
                </div>
                <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: progressPercent >= 100 ? '#2e7d32' : 'var(--color-accent)', transition: 'width 0.4s ease' }} />
                </div>
              </div>

              {/* Order Summary Detail */}
              <div style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '2rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 1.5rem 0', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                  Summary
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--color-gray)' }}>
                    <span>Subtotal</span>
                    <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{currSymbol}{subtotal.toFixed(2)}</span>
                  </div>

                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#2e7d32', fontWeight: 500 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Tag size={12} /> Discount ({appliedPromo})
                      </span>
                      <span>-{currSymbol}{discount.toFixed(2)}</span>
                    </div>
                  )}

                  {giftWrap && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--color-gray)' }}>
                      <span>Gift Wrapping</span>
                      <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>+{currSymbol}{giftWrapCost.toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--color-gray)' }}>
                    <span>Shipping</span>
                    <span>
                      {subtotal >= freeShippingThreshold ? (
                        <span style={{ color: '#2e7d32', fontWeight: 500 }}>Free Express</span>
                      ) : (
                        <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>Calculated at checkout</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Promo Code Toggle/Input */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-gray)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Promo Code
                  </p>
                  {appliedPromo ? (
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(46, 125, 50, 0.04)', border: '1px dashed #2e7d32', borderRadius: '3px', justifyContent: 'space-between' }}>
                      <span style={{ color: '#2e7d32', fontSize: '0.8rem', fontWeight: 600 }}>{appliedPromo} Applied</span>
                      <button type="button" onClick={handleRemovePromo} style={{ background: 'none', border: 'none', color: '#d32f2f', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="e.g. WELCOME10"
                        value={promoCodeInput}
                        onChange={e => setPromoCodeInput(e.target.value)}
                        style={{ padding: '0.45rem 0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', fontFamily: 'inherit', fontSize: '0.8rem', outline: 'none', flex: 1 }}
                      />
                      <button type="button" onClick={handleApplyPromo} style={{ padding: '0.45rem 1rem', backgroundColor: 'var(--color-text)', color: 'var(--color-bg)', border: 'none', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>Apply</button>
                    </div>
                  )}
                  {promoMessage && (
                    <p style={{ fontSize: '0.75rem', color: promoMessage.type === 'success' ? '#2e7d32' : '#d32f2f', marginTop: '0.4rem', margin: '0.4rem 0 0 0' }}>
                      {promoMessage.text}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem', marginBottom: '1.5rem', fontWeight: '600', fontSize: '1.15rem' }}>
                  <span>Total</span>
                  <span>{currSymbol}{finalTotal.toFixed(2)}</span>
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '1rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} 
                  onClick={() => navigate('/checkout')}
                >
                  <span>Proceed to Checkout</span>
                </button>
                
                <button 
                  className="btn btn-outline" 
                  style={{ width: '100%', marginTop: '0.75rem', padding: '0.85rem' }} 
                  onClick={() => navigate('/shop')}
                >
                  Continue Shopping
                </button>
              </div>

              {/* Professional Trust Marks */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'center' }}>
                <div style={{ border: '1px solid var(--color-border)', padding: '1rem', borderRadius: '4px', backgroundColor: 'var(--color-bg)' }}>
                  <ShieldCheck size={20} style={{ color: 'var(--color-accent)', margin: '0 auto 0.5rem auto' }} />
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.15rem' }}>Secure Checkout</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>Fully SSL Encrypted</div>
                </div>
                <div style={{ border: '1px solid var(--color-border)', padding: '1rem', borderRadius: '4px', backgroundColor: 'var(--color-bg)' }}>
                  <Clock size={20} style={{ color: 'var(--color-accent)', margin: '0 auto 0.5rem auto' }} />
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.15rem' }}>Easy Returns</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-gray)' }}>30-Day Guarantee</div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
