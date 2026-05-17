import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useProducts } from '../lib/useProducts';
import { formatPrice, getProductCurrency } from '../lib/currency';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, loading } = useProducts();
  const [size, setSize] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const product = products.find(p => p.id === id);

  if (loading) return <div className="section container text-center" style={{ paddingTop: '120px' }}>Loading...</div>;
  if (!product) {
    return <div className="section container text-center" style={{ paddingTop: '120px' }}><h2>Product not found</h2></div>;
  }

  const handleAddToCart = async () => {
    if (!size) {
      alert('Please select a size');
      return;
    }
    if (!user) {
      alert('Please sign in to add to cart.');
      navigate('/auth');
      return;
    }
    setAdding(true);
    try {
      const { error } = await supabase.from('cart_items').insert({
        user_id: user.id,
        product_id: product.id,
        quantity: 1,
        size: size
      });
      if (error) throw error;
      alert('Added to cart!');
    } catch (err: any) {
      alert('Error adding to cart: ' + err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="section" style={{ paddingTop: '120px' }}>
      <div className="container">
        <div className="flex" style={{ gap: '4rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ position: 'relative', paddingBottom: '133%', backgroundColor: '#f5f5f5', overflow: 'hidden' }}>
              <img 
                src={product.image} 
                alt={product.name} 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
          </div>
          
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{product.name}</h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--color-gray)', marginBottom: '2rem' }}>{formatPrice(product)}</p>
            
            <p style={{ lineHeight: '1.8', marginBottom: '2rem' }}>{product.description}</p>
            
            <div style={{ marginBottom: '2rem' }}>
              <div className="flex justify-between items-center mb-2">
                <span style={{ textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '0.05em' }}>Size</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-gray)', cursor: 'pointer', textDecoration: 'underline' }}>Size Guide</span>
              </div>
              <div className="flex gap-4">
                {(Array.isArray(product.variants) && product.variants.length > 0
                  ? product.variants.map((v: any) => v.size)
                  : ['S', 'M', 'L', 'XL']
                ).map((s: string) => {
                  const variant = Array.isArray(product.variants) ? product.variants.find((v: any) => v.size === s) : null;
                  const sizePrice = variant?.priceAdjust ? product.price + variant.priceAdjust : product.price;
                  const sym = getProductCurrency(product);
                  return (
                    <button 
                      key={s} 
                      onClick={() => setSize(s)}
                      title={variant?.priceAdjust ? `${sym}${sizePrice.toFixed(2)}` : ''}
                      style={{ 
                        minWidth: '3rem', 
                        height: '3rem', 
                        padding: '0 0.75rem',
                        border: `1px solid ${size === s ? 'var(--color-text)' : 'var(--color-border)'}`,
                        backgroundColor: size === s ? 'var(--color-text)' : 'transparent',
                        color: size === s ? 'var(--color-bg)' : 'var(--color-text)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={handleAddToCart} disabled={adding}>
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-gray)', textAlign: 'center' }}>Free shipping and returns on all orders.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
