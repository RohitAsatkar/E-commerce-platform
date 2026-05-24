import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useProducts } from '../lib/useProducts';
import { getProductCurrency } from '../lib/currency';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [addressInfo, setAddressInfo] = useState({ firstName: '', lastName: '', address: '', city: '', postal: '', email: '' });
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [giftWrap, setGiftWrap] = useState(false);

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
            postal: defaultAddr.postal_code || '',
            email: profileData.email || user.email || ''
          });
        } else {
          setAddressInfo({
            firstName: profileData.first_name || '',
            lastName: profileData.last_name || '',
            address: profileData.address || '',
            city: profileData.city || '',
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
      const shippingAddress = `${addressInfo.firstName} ${addressInfo.lastName}, ${addressInfo.address}, ${addressInfo.city}, ${addressInfo.postal}`;
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

  const inputStyle = {
    padding: '1rem', border: '1px solid var(--color-border)',
    backgroundColor: 'transparent', color: 'var(--color-text)', outline: 'none',
    fontFamily: 'inherit', fontSize: '0.95rem', width: '100%'
  };

  if (loading) return <div className="section container text-center" style={{ paddingTop: '120px' }}>Loading checkout...</div>;
  if (cartItems.length === 0) return <div className="section container text-center" style={{ paddingTop: '120px' }}>Your cart is empty.</div>;

  return (
    <div className="section" style={{ paddingTop: '120px', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <h1 className="mb-8" style={{ fontSize: '2.5rem' }}>Checkout</h1>
        
        <div className="flex" style={{ gap: '3rem', flexWrap: 'wrap' }}>
          {/* Left - Form */}
          <div style={{ flex: '1 1 55%' }}>
            <form onSubmit={handlePlaceOrder} style={{ display: 'grid', gap: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Contact Information</h2>
                <input type="email" placeholder="Email" value={addressInfo.email} onChange={e => setAddressInfo({...addressInfo, email: e.target.value})} required style={inputStyle} />
              </div>
              
              <div>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Shipping Address</h2>
                {savedAddresses.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-gray)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      Select a Saved Address
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
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
                                postal: addr.postal_code,
                                email: addressInfo.email
                              });
                            }}
                            style={{
                              padding: '0.75rem 1rem',
                              fontSize: '0.85rem',
                              borderRadius: '4px',
                              border: '1px solid',
                              borderColor: isSelected ? 'var(--color-text)' : 'var(--color-border)',
                              backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                              color: 'var(--color-text)',
                              textAlign: 'left',
                              cursor: 'pointer',
                              minWidth: '200px',
                              flexShrink: 0,
                              transition: 'all 0.15s'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                              <span>{addr.recipient_name}</span>
                              <span style={{ color: 'var(--color-gray)', fontSize: '0.7rem' }}>{addr.address_type}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-gray)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {addr.street_address}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-gray)' }}>
                              {addr.city}, {addr.postal_code}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {addressInfo.firstName && addressInfo.address && (
                  <p style={{ fontSize: '0.8rem', color: '#2e7d32', marginBottom: '1rem', padding: '0.5rem 0.75rem', backgroundColor: '#e8f5e9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>✓ Shipping form is populated. You can edit details below if needed.</span>
                    <button type="button" onClick={() => setAddressInfo({ firstName: '', lastName: '', address: '', city: '', postal: '', email: addressInfo.email })} style={{ background: 'none', border: 'none', color: '#d32f2f', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>Clear All</button>
                  </p>
                )}
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                  <input type="text" placeholder="First Name" value={addressInfo.firstName} onChange={e => setAddressInfo({...addressInfo, firstName: e.target.value})} required style={inputStyle} />
                  <input type="text" placeholder="Last Name" value={addressInfo.lastName} onChange={e => setAddressInfo({...addressInfo, lastName: e.target.value})} required style={inputStyle} />
                  <input type="text" placeholder="Address" value={addressInfo.address} onChange={e => setAddressInfo({...addressInfo, address: e.target.value})} required style={{ ...inputStyle, gridColumn: 'span 2' }} />
                  <input type="text" placeholder="City" value={addressInfo.city} onChange={e => setAddressInfo({...addressInfo, city: e.target.value})} required style={inputStyle} />
                  <input type="text" placeholder="Postal Code" value={addressInfo.postal} onChange={e => setAddressInfo({...addressInfo, postal: e.target.value})} required style={inputStyle} />
                </div>
              </div>
              
              <div>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Payment</h2>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <input type="text" placeholder="Card Number" required style={inputStyle} />
                  <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                    <input type="text" placeholder="MM/YY" required style={inputStyle} />
                    <input type="text" placeholder="CVC" required style={inputStyle} />
                  </div>
                </div>
              </div>
              
              <button type="submit" className="btn btn-primary" disabled={processing} style={{ marginTop: '1rem', padding: '1rem' }}>
                {processing ? 'Processing...' : `Place Order — ${currSymbol}${finalTotal.toFixed(2)}`}
              </button>
            </form>
          </div>

          {/* Right - Order Summary */}
          <div style={{ flex: '1 1 35%', alignSelf: 'flex-start', position: 'sticky', top: '120px' }}>
            <div style={{ border: '1px solid var(--color-border)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Order Summary</h2>
              
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 mb-4" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={item.product.image} alt={item.product.name} style={{ width: '56px', height: '70px', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: 'var(--color-text)', color: 'var(--color-bg)', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.quantity}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-gray)' }}>Size: {item.size}</p>
                  </div>
                  <p style={{ fontSize: '0.9rem', fontWeight: '500', flexShrink: 0 }}>{getProductCurrency(item.product)}{(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}

              <div className="flex justify-between mb-2" style={{ marginTop: '1rem' }}>
                <span style={{ color: 'var(--color-gray)', fontSize: '0.9rem' }}>Subtotal</span>
                <span style={{ fontSize: '0.9rem' }}>{currSymbol}{subtotal.toFixed(2)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between mb-2" style={{ color: '#2e7d32', fontSize: '0.9rem', fontWeight: 500 }}>
                  <span>Discount ({appliedPromo})</span>
                  <span>-{currSymbol}{discount.toFixed(2)}</span>
                </div>
              )}

              {giftWrap && (
                <div className="flex justify-between mb-2" style={{ fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--color-gray)' }}>Gift Wrapping</span>
                  <span>+{currSymbol}{giftWrapCost.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between mb-4">
                <span style={{ color: 'var(--color-gray)', fontSize: '0.9rem' }}>Shipping</span>
                <span style={{ fontSize: '0.9rem' }}>
                  {subtotal >= freeShippingThreshold ? (
                    <span style={{ color: '#2e7d32', fontWeight: 500 }}>Free Express</span>
                  ) : (
                    <span>Free</span>
                  )}
                </span>
              </div>
              
              <div className="flex justify-between" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                <span>Total</span>
                <span>{currSymbol}{finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
