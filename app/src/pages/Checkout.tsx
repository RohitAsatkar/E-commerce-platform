import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useProducts } from '../lib/useProducts';
import { getProductCurrency } from '../lib/currency';
import { Mail, MapPin, Banknote, ShieldCheck, Lock, Loader2 } from 'lucide-react';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [addressInfo, setAddressInfo] = useState({ firstName: '', lastName: '', address: '', city: '', state: '', postal: '', email: '' });
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [giftWrap, setGiftWrap] = useState(false);

  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isPinAutofilled, setIsPinAutofilled] = useState(false);

  useEffect(() => {
    const promo = localStorage.getItem('cart_promo_code');
    const wrap = localStorage.getItem('cart_gift_wrap');
    if (promo) setAppliedPromo(promo);
    if (wrap) setGiftWrap(wrap === 'true');
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (productsLoading) return;

    const fetchData = async () => {
      // Fetch profile to auto-fill
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData) {
        let addresses: any[] = [];
        if (profileData.address) {
          try {
            if (profileData.address.trim().startsWith('[')) {
              addresses = JSON.parse(profileData.address);
            } else {
              addresses = [{
                id: 'default',
                recipient_name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Default Recipient',
                street_address: profileData.address,
                city: profileData.city || '',
                postal_code: profileData.postal_code || '',
                phone: '',
                state: '',
                country: 'India',
                address_type: 'Home',
                is_default: true
              }];
            }
          } catch (e) {}
        }
        
        setSavedAddresses(addresses);
        
        const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
        if (defaultAddr) {
          const names = (defaultAddr.recipient_name || '').split(' ');
          setAddressInfo({
            firstName: names[0] || '',
            lastName: names.slice(1).join(' ') || '',
            address: defaultAddr.street_address || '',
            city: defaultAddr.city || '',
            state: defaultAddr.state || '',
            postal: defaultAddr.postal_code || '',
            email: profileData.email || user.email || ''
          });
          if (defaultAddr.postal_code && defaultAddr.city && defaultAddr.state) {
            setIsPinAutofilled(true);
          }
        } else {
          setAddressInfo({
            firstName: profileData.first_name || '',
            lastName: profileData.last_name || '',
            address: profileData.address || '',
            city: profileData.city || '',
            state: profileData.state || '',
            postal: profileData.postal_code || '',
            email: profileData.email || user.email || ''
          });
        }
      } else {
        setAddressInfo(prev => ({ ...prev, email: user.email || '' }));
      }

      // Fetch cart items
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
    fetchData();
  }, [user, navigate, products, productsLoading]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const currSymbol = cartItems.length > 0 ? getProductCurrency(cartItems[0].product) : '₹';

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

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || cartItems.length === 0) return;
    setProcessing(true);

    try {
      // 1. Create order
      const shippingAddress = `${addressInfo.firstName} ${addressInfo.lastName}, ${addressInfo.address}, ${addressInfo.city}, ${addressInfo.state}, ${addressInfo.postal}`;
      const { data: orderData, error: orderError } = await supabase.from('orders').insert({
        user_id: user.id,
        total: finalTotal,
        shipping_address: shippingAddress
      }).select().single();

      if (orderError) throw orderError;

      // 2. Create order items
      const orderItemsToInsert = cartItems.map(item => ({
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        size: item.size,
        price_at_time: item.product.price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
      if (itemsError) throw itemsError;

      // 3. Clear cart and storage promo settings
      await supabase.from('cart_items').delete().eq('user_id', user.id);
      localStorage.removeItem('cart_promo_code');
      localStorage.removeItem('cart_gift_wrap');

      alert('Order placed successfully! Redirecting to account...');
      navigate('/account');
    } catch (err: any) {
      alert('Failed to place order: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handlePostalCodeChange = async (pincode: string) => {
    const sanitized = pincode.replace(/\D/g, '').slice(0, 6);
    setAddressInfo(prev => ({ ...prev, postal: sanitized }));
    setPinError(null);

    if (sanitized.length === 6) {
      setPinLoading(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${sanitized}`);
        const data = await res.json();

        if (data && data[0] && data[0].Status === 'Success') {
          const postOfficeArray = data[0].PostOffice;
          if (postOfficeArray && postOfficeArray.length > 0) {
            const district = postOfficeArray[0].District;
            const state = postOfficeArray[0].State;
            setAddressInfo(prev => ({
              ...prev,
              city: district,
              state: state
            }));
            setIsPinAutofilled(true);
            setPinError(null);
          } else {
            setPinError('Invalid PIN code.');
            setIsPinAutofilled(false);
            setAddressInfo(prev => ({ ...prev, city: '', state: '' }));
          }
        } else {
          setPinError('Invalid PIN code.');
          setIsPinAutofilled(false);
          setAddressInfo(prev => ({ ...prev, city: '', state: '' }));
        }
      } catch (err) {
        setPinError('Invalid PIN code.');
        setIsPinAutofilled(false);
        setAddressInfo(prev => ({ ...prev, city: '', state: '' }));
      } finally {
        setPinLoading(false);
      }
    } else {
      setIsPinAutofilled(false);
    }
  };

  if (loading) return <div className="section container text-center" style={{ paddingTop: '120px' }}>Loading checkout...</div>;
  if (cartItems.length === 0) return <div className="section container text-center" style={{ paddingTop: '120px' }}>Your cart is empty.</div>;

  return (
    <div className="checkout-page">
      <div className="container" style={{ maxWidth: '1100px' }}>
        <div className="checkout-title-wrap">
          <h1 className="checkout-title">Checkout</h1>
        </div>
        
        <div className="checkout-grid">
          {/* Left - Form */}
          <div>
            <form onSubmit={handlePlaceOrder} className="checkout-form-grid">
              
              {/* Contact Information */}
              <div className="checkout-section">
                <div className="checkout-section-header">
                  <Mail size={18} />
                  <h2>Contact Information</h2>
                </div>
                <div className="checkout-input-wrapper">
                  <input 
                    type="email" 
                    placeholder="Email Address *" 
                    value={addressInfo.email} 
                    onChange={e => setAddressInfo({...addressInfo, email: e.target.value})} 
                    required 
                    className="checkout-input" 
                  />
                </div>
              </div>
              
              {/* Shipping Address */}
              <div className="checkout-section">
                <div className="checkout-section-header">
                  <MapPin size={18} />
                  <h2>Shipping Address</h2>
                </div>

                {savedAddresses.length > 0 && (
                  <div className="mb-4">
                    <span className="checkout-address-label">Select a Saved Address</span>
                    <div className="checkout-address-scroll">
                      {savedAddresses.map((addr) => {
                        const isSelected = 
                          addressInfo.address === addr.street_address && 
                          addressInfo.city === addr.city && 
                          addressInfo.postal === addr.postal_code;
                        
                        return (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => {
                              const names = (addr.recipient_name || '').split(' ');
                              setAddressInfo({
                                firstName: names[0] || '',
                                lastName: names.slice(1).join(' ') || '',
                                address: addr.street_address,
                                city: addr.city,
                                state: addr.state || '',
                                postal: addr.postal_code,
                                email: addressInfo.email
                              });
                              if (addr.postal_code && addr.city && addr.state) {
                                setIsPinAutofilled(true);
                              } else {
                                setIsPinAutofilled(false);
                              }
                            }}
                            className={`checkout-address-tile ${isSelected ? 'selected' : ''}`}
                          >
                            <div className="checkout-tile-header">
                              <span className="checkout-tile-name">{addr.recipient_name}</span>
                              <span className="checkout-tile-type">{addr.address_type}</span>
                            </div>
                            <div className="checkout-tile-details">
                              {addr.street_address}<br />
                              {addr.city}, {addr.postal_code}
                            </div>
                            {isSelected && <div className="checkout-tile-selected-indicator" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {addressInfo.firstName && addressInfo.address && (
                  <div className="checkout-alert-banner success">
                    <span>✓ Shipping form is populated. You can edit details below if needed.</span>
                    <button 
                      type="button" 
                      onClick={() => { 
                        setAddressInfo({ firstName: '', lastName: '', address: '', city: '', state: '', postal: '', email: addressInfo.email }); 
                        setIsPinAutofilled(false); 
                        setPinError(null); 
                      }} 
                      className="checkout-clear-btn"
                    >
                      Clear All
                    </button>
                  </div>
                )}

                <div className="checkout-form-grid-2">
                  <div className="checkout-input-wrapper">
                    <input 
                      type="text" 
                      placeholder="First Name *" 
                      value={addressInfo.firstName} 
                      onChange={e => setAddressInfo({...addressInfo, firstName: e.target.value})} 
                      required 
                      className="checkout-input" 
                    />
                  </div>
                  <div className="checkout-input-wrapper">
                    <input 
                      type="text" 
                      placeholder="Last Name *" 
                      value={addressInfo.lastName} 
                      onChange={e => setAddressInfo({...addressInfo, lastName: e.target.value})} 
                      required 
                      className="checkout-input" 
                    />
                  </div>
                  
                  <div className="checkout-input-wrapper" style={{ gridColumn: 'span 2' }}>
                    <input 
                      type="text" 
                      placeholder="PIN Code *" 
                      value={addressInfo.postal} 
                      onChange={e => handlePostalCodeChange(e.target.value)} 
                      maxLength={6}
                      required 
                      className={`checkout-input ${pinError ? 'error' : ''}`}
                    />
                    {pinLoading && <span className="checkout-input-status loading">Fetching...</span>}
                    {pinError && <span className="checkout-input-status error">{pinError}</span>}
                  </div>

                  <div className="checkout-input-wrapper" style={{ gridColumn: 'span 2' }}>
                    <input 
                      type="text" 
                      placeholder="Address (Street, Area) *" 
                      value={addressInfo.address} 
                      onChange={e => setAddressInfo({...addressInfo, address: e.target.value})} 
                      required 
                      className="checkout-input" 
                    />
                  </div>
                  
                  <div className="checkout-input-wrapper">
                    <input 
                      type="text" 
                      placeholder={pinLoading ? "Fetching..." : "City *"} 
                      value={addressInfo.city} 
                      onChange={e => !isPinAutofilled && setAddressInfo({...addressInfo, city: e.target.value})} 
                      readOnly={isPinAutofilled}
                      required 
                      className={`checkout-input ${isPinAutofilled ? 'readonly' : ''}`}
                    />
                    {isPinAutofilled && <span className="checkout-input-autofill-badge">Autofilled</span>}
                  </div>

                  <div className="checkout-input-wrapper">
                    <input 
                      type="text" 
                      placeholder={pinLoading ? "Fetching..." : "State / Region *"} 
                      value={addressInfo.state} 
                      onChange={e => !isPinAutofilled && setAddressInfo({...addressInfo, state: e.target.value})} 
                      readOnly={isPinAutofilled}
                      required 
                      className={`checkout-input ${isPinAutofilled ? 'readonly' : ''}`}
                    />
                    {isPinAutofilled && <span className="checkout-input-autofill-badge">Autofilled</span>}
                  </div>
                </div>
              </div>
              
              {/* Payment Section */}
              <div className="checkout-section">
                <div className="checkout-section-header">
                  <Banknote size={18} />
                  <h2>Payment Method</h2>
                </div>
                <div className="checkout-payment-option">
                  <input 
                    type="radio" 
                    id="cod-payment" 
                    name="payment-method" 
                    className="checkout-payment-radio" 
                    defaultChecked 
                    disabled 
                  />
                  <div className="checkout-payment-details">
                    <label htmlFor="cod-payment" className="checkout-payment-title">Cash on Delivery (COD)</label>
                    <p className="checkout-payment-desc">
                      Pay with cash upon delivery. Please keep exact change ready when your order is delivered.
                    </p>
                    <div className="checkout-payment-badge">
                      <ShieldCheck size={12} />
                      <span>Verified COD Option</span>
                    </div>
                  </div>
                </div>
              </div>

              
              <button type="submit" className="checkout-submit-btn" disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 size={16} />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Place Order — {currSymbol}{finalTotal.toFixed(2)}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right - Order Summary */}
          <div className="checkout-summary-wrap">
            <div className="checkout-summary-card">
              <h2 className="checkout-summary-heading">Order Summary</h2>
              
              {cartItems.map((item) => (
                <div key={item.id} className="checkout-product-item">
                  <div className="checkout-product-img-wrap">
                    <img src={item.product.image} alt={item.product.name} className="checkout-product-img" />
                    <span className="checkout-product-qty-badge">{item.quantity}</span>
                  </div>
                  <div className="checkout-product-info">
                    <p className="checkout-product-name">{item.product.name}</p>
                    <p className="checkout-product-size">Size: {item.size}</p>
                  </div>
                  <p className="checkout-product-price">{getProductCurrency(item.product)}{(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}

              <div className="checkout-calc-block">
                <div className="checkout-calc-row">
                  <span className="checkout-calc-label">Subtotal</span>
                  <span className="checkout-calc-value">{currSymbol}{subtotal.toFixed(2)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="checkout-calc-row discount">
                    <span className="checkout-calc-label">Discount ({appliedPromo})</span>
                    <span className="checkout-calc-value">-{currSymbol}{discount.toFixed(2)}</span>
                  </div>
                )}

                {giftWrap && (
                  <div className="checkout-calc-row">
                    <span className="checkout-calc-label">Gift Wrapping</span>
                    <span className="checkout-calc-value">+{currSymbol}{giftWrapCost.toFixed(2)}</span>
                  </div>
                )}

                <div className="checkout-calc-row">
                  <span className="checkout-calc-label">Shipping</span>
                  <span className="checkout-calc-value">
                    {subtotal >= freeShippingThreshold ? (
                      <span style={{ color: '#2e7d32', fontWeight: 500 }}>Free Express</span>
                    ) : (
                      <span>Free</span>
                    )}
                  </span>
                </div>
                
                <div className="checkout-calc-row total">
                  <span>Total</span>
                  <span>{currSymbol}{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
