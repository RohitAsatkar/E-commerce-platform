import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useProducts } from '../lib/useProducts';
import { getProductCurrency } from '../lib/currency';
import { Trash2, Plus, Minus } from 'lucide-react';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    if (newQty < 1) return;
    setUpdatingId(itemId);
    try {
      const { error } = await supabase.from('cart_items').update({ quantity: newQty }).eq('id', itemId);
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
    setUpdatingId(itemId);
    try {
      const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
      if (error) throw error;
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err: any) {
      alert('Error removing item: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const currSymbol = cartItems.length > 0 ? getProductCurrency(cartItems[0].product) : '$';

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
    <div className="section" style={{ paddingTop: '120px', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        <h1 className="mb-8" style={{ fontSize: '2.5rem' }}>Your Cart</h1>
        
        {cartItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ fontSize: '1.1rem', color: 'var(--color-gray)', marginBottom: '2rem' }}>Your cart is empty.</p>
            <button className="btn btn-primary" onClick={() => navigate('/shop')}>Continue Shopping</button>
          </div>
        ) : (
          <div className="flex" style={{ gap: '4rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 60%' }}>
              {/* Header */}
              <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1rem', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', alignItems: 'center', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--color-gray)' }}>
                <span>Product</span>
                <span style={{ textAlign: 'center' }}>Quantity</span>
                <span style={{ textAlign: 'right' }}>Total</span>
                <span style={{ width: '32px' }}></span>
              </div>
              
              {/* Cart Items */}
              {cartItems.map((item) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', alignItems: 'center', padding: '1.25rem 0', borderBottom: '1px solid var(--color-border)', opacity: updatingId === item.id ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                  {/* Product Info */}
                  <div className="flex gap-4">
                    <img src={item.product.image} alt={item.product.name} style={{ width: '80px', height: '106px', objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                      <h3 style={{ fontSize: '0.95rem', marginBottom: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</h3>
                      <p style={{ color: 'var(--color-gray)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Size: {item.size}</p>
                      <p style={{ color: 'var(--color-gray)', fontSize: '0.8rem' }}>{getProductCurrency(item.product)}{item.product.price.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0' }}>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || updatingId === item.id}
                      style={{ width: '32px', height: '32px', border: '1px solid var(--color-border)', background: 'transparent', cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: item.quantity <= 1 ? 0.3 : 1, color: 'var(--color-text)' }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ width: '40px', textAlign: 'center', fontSize: '0.95rem', fontWeight: '500', border: '1px solid var(--color-border)', borderLeft: 'none', borderRight: 'none', height: '32px', lineHeight: '32px' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      disabled={updatingId === item.id}
                      style={{ width: '32px', height: '32px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text)' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div style={{ textAlign: 'right', fontWeight: '500' }}>
                    {getProductCurrency(item.product)}{(item.product.price * item.quantity).toFixed(2)}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={updatingId === item.id}
                    title="Remove item"
                    style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b91c1c', opacity: 0.7, transition: 'opacity 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Order Summary */}
            <div style={{ flex: '1 1 30%', alignSelf: 'flex-start', position: 'sticky', top: '120px' }}>
              <div style={{ backgroundColor: 'var(--color-bg)', padding: '2rem', border: '1px solid var(--color-border)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Order Summary</h2>
                <div className="flex justify-between mb-4">
                  <span style={{ color: 'var(--color-gray)' }}>Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
                  <span>{currSymbol}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span style={{ color: 'var(--color-gray)' }}>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between mb-8" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  <span>Total</span>
                  <span>{currSymbol}{subtotal.toFixed(2)}</span>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginBottom: '0.75rem' }} onClick={() => navigate('/checkout')}>
                  Checkout
                </button>
                <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => navigate('/shop')}>
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
