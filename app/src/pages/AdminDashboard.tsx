import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../lib/useProducts';

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];

const AdminDashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const { products, refreshProducts } = useProducts();
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'products'>('overview');
  
  // Product Form State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: '', price: 0, category: 'men', is_new: false, image: '', description: '',
    stock: 100, sku: '', tags: '', currency: 'USD'
  });
  const [selectedSizes, setSelectedSizes] = useState<Record<string, { enabled: boolean; priceAdjust: number }>>({
    XS: { enabled: false, priceAdjust: 0 },
    S: { enabled: true, priceAdjust: 0 },
    M: { enabled: true, priceAdjust: 0 },
    L: { enabled: true, priceAdjust: 0 },
    XL: { enabled: false, priceAdjust: 0 },
    XXL: { enabled: false, priceAdjust: 0 },
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  
  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setCheckingRole(false);
        setIsAdmin(false);
        return;
      }
      
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      
      if (data && data.role === 'admin') {
        setIsAdmin(true);
        fetchOrders();
      } else {
        setIsAdmin(false);
      }
      setCheckingRole(false);
    };
    
    checkAdmin();
  }, [user]);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError(error.message);
    }
    setLoggingIn(false);
  };

  if (checkingRole) {
    return <div className="section container text-center" style={{ paddingTop: '120px', minHeight: '80vh' }}>Verifying credentials...</div>;
  }

  if (!user) {
    return (
      <div className="section" style={{ paddingTop: '120px', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="container" style={{ maxWidth: '400px' }}>
          <h1 className="text-center mb-8" style={{ fontSize: '2rem' }}>Admin Secure Login</h1>
          {loginError && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{loginError}</div>}
          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="email" placeholder="Admin Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '1rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent' }} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '1rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent' }} />
            <button type="submit" className="btn btn-primary" disabled={loggingIn}>{loggingIn ? 'Authenticating...' : 'Secure Login'}</button>
          </form>
        </div>
      </div>
    );
  }

  if (user && !isAdmin) {
    return (
      <div className="section container text-center" style={{ paddingTop: '120px', minHeight: '80vh' }}>
        <h2 style={{ color: 'var(--color-accent)' }}>Access Denied</h2>
        <p className="mt-4 mb-8">You do not have administrator privileges to view this dashboard.</p>
        <button onClick={() => signOut()} className="btn btn-outline">Sign Out & Switch Account</button>
      </div>
    );
  }

  const handleImageFileChange = (file: File | null) => {
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `products/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });
    
    if (uploadError) throw new Error('Image upload failed: ' + uploadError.message);
    
    const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleOpenModal = (product: any = null) => {
    setImageFile(null);
    setImagePreview(null);
    setImageMode('upload');
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name, price: product.price, category: product.category, is_new: product.is_new,
        image: product.image, description: product.description,
        stock: product.stock ?? 100, sku: product.sku || '', tags: (product.tags || []).join(', '),
        currency: product.variants?.[0]?.currency || 'USD'
      });
      setImagePreview(product.image);
      // Restore size selections from saved variants
      const restored: Record<string, { enabled: boolean; priceAdjust: number }> = {};
      ALL_SIZES.forEach(s => { restored[s] = { enabled: false, priceAdjust: 0 }; });
      if (Array.isArray(product.variants)) {
        product.variants.forEach((v: any) => {
          if (v.size && restored[v.size] !== undefined) {
            restored[v.size] = { enabled: true, priceAdjust: v.priceAdjust || 0 };
          }
        });
      }
      setSelectedSizes(restored);
    } else {
      setEditingProduct(null);
      setProductForm({ name: '', price: 0, category: 'men', is_new: false, image: '', description: '', stock: 100, sku: '', tags: '', currency: 'USD' });
      setSelectedSizes({
        XS: { enabled: false, priceAdjust: 0 },
        S: { enabled: true, priceAdjust: 0 },
        M: { enabled: true, priceAdjust: 0 },
        L: { enabled: true, priceAdjust: 0 },
        XL: { enabled: false, priceAdjust: 0 },
        XXL: { enabled: false, priceAdjust: 0 },
      });
    }
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      let finalImageUrl = productForm.image;

      // Upload image if a new file was selected
      if (imageFile) {
        setUploadingImage(true);
        finalImageUrl = await uploadImage(imageFile);
        setUploadingImage(false);
      }

      if (!finalImageUrl) {
        alert('Please upload an image or provide an image URL.');
        setSavingProduct(false);
        return;
      }

      const tagsArray = productForm.tags.split(',').map(t => t.trim()).filter(Boolean);
      const variantsArray = ALL_SIZES
        .filter(s => selectedSizes[s]?.enabled)
        .map(s => ({ size: s, priceAdjust: selectedSizes[s]?.priceAdjust || 0, currency: productForm.currency }));
      
      const payload = {
        name: productForm.name,
        price: Number(productForm.price),
        category: productForm.category,
        is_new: productForm.is_new,
        image: finalImageUrl,
        description: productForm.description,
        stock: Number(productForm.stock),
        sku: productForm.sku,
        tags: tagsArray,
        variants: variantsArray
      };

      if (editingProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const id = 'p' + Math.floor(Math.random() * 1000000);
        const { error } = await supabase.from('products').insert({ id, ...payload });
        if (error) throw error;
      }
      
      await refreshProducts();
      setShowProductModal(false);
    } catch (err: any) {
      alert("Error saving product: " + err.message);
    } finally {
      setSavingProduct(false);
      setUploadingImage(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        alert("Error deleting product: " + error.message);
      } else {
        await refreshProducts();
      }
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);

  return (
    <div className="section" style={{ paddingTop: '120px', minHeight: '80vh', backgroundColor: '#f9f9f9', color: '#111' }}>
      <div className="container" style={{ maxWidth: '1200px' }}>
        <h1 className="mb-8" style={{ fontSize: '2.5rem' }}>Admin Dashboard</h1>
        
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid #e0e0e0' }}>
          <button onClick={() => setActiveTab('overview')} style={{ padding: '1rem 0', background: 'none', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'overview' ? 'bold' : 'normal', borderBottom: activeTab === 'overview' ? '2px solid #111' : 'none' }}>Overview</button>
          <button onClick={() => setActiveTab('products')} style={{ padding: '1rem 0', background: 'none', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'products' ? 'bold' : 'normal', borderBottom: activeTab === 'products' ? '2px solid #111' : 'none' }}>Product Management</button>
        </div>

        {activeTab === 'overview' ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
              <div style={{ backgroundColor: '#fff', padding: '2rem', border: '1px solid #e0e0e0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '1rem', color: '#757575', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Revenue</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>${totalRevenue.toFixed(2)}</p>
              </div>
              <div style={{ backgroundColor: '#fff', padding: '2rem', border: '1px solid #e0e0e0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '1rem', color: '#757575', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Orders</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{orders.length}</p>
              </div>
              <div style={{ backgroundColor: '#fff', padding: '2rem', border: '1px solid #e0e0e0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '1rem', color: '#757575', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Products</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{products.length}</p>
              </div>
            </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Recent Orders</h2>
            <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '1rem' }}>Order ID</th>
                    <th style={{ padding: '1rem' }}>Customer</th>
                    <th style={{ padding: '1rem' }}>Date</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center' }}>No orders yet.</td></tr>
                  ) : (
                    orders.map((order: any) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        <td style={{ padding: '1rem' }}>#{order.id.split('-')[0]}</td>
                        <td style={{ padding: '1rem' }}>{order.user_id.split('-')[0]}</td>
                        <td style={{ padding: '1rem' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '1rem' }}><span style={{ backgroundColor: order.status === 'Processing' ? '#e6dfd8' : '#111', color: order.status === 'Processing' ? '#111' : '#fff', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>{order.status}</span></td>
                        <td style={{ padding: '1rem' }}>${order.total}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Product Catalog</h2>
              <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>+ Add Product</button>
            </div>
            <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '1rem' }}>Image</th>
                    <th style={{ padding: '1rem' }}>Name</th>
                    <th style={{ padding: '1rem' }}>Price</th>
                    <th style={{ padding: '1rem' }}>Stock</th>
                    <th style={{ padding: '1rem' }}>Category</th>
                    <th style={{ padding: '1rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '1rem' }}><img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover' }} /></td>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>{p.name}</td>
                      <td style={{ padding: '1rem' }}>{(p.variants?.[0]?.currency ? CURRENCIES.find(c => c.code === p.variants[0].currency)?.symbol : '$')}{p.price}</td>
                      <td style={{ padding: '1rem', color: (p.stock || 0) < 10 ? 'red' : 'inherit' }}>{p.stock ?? 100}</td>
                      <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{p.category}</td>
                      <td style={{ padding: '1rem', display: 'flex', gap: '1rem' }}>
                        <button onClick={() => handleOpenModal(p)} style={{ background: 'none', border: 'none', color: '#111', cursor: 'pointer', textDecoration: 'underline' }}>Edit</button>
                        <button onClick={() => handleDeleteProduct(p.id)} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', textDecoration: 'underline' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showProductModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', padding: '2rem', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '4px' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSaveProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>Name
                <input type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} required style={{ padding: '0.75rem', border: '1px solid #ccc' }} />
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontWeight: '500' }}>Price</span>
                <div style={{ display: 'flex', gap: '0' }}>
                  <select value={productForm.currency} onChange={e => setProductForm({...productForm, currency: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #ccc', borderRight: 'none', backgroundColor: '#f5f5f5', fontWeight: '600', width: '90px' }}>
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
                  </select>
                  <input type="number" step="0.01" value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} required style={{ padding: '0.75rem', border: '1px solid #ccc', flex: 1 }} />
                </div>
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>Category
                <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} required style={{ padding: '0.75rem', border: '1px solid #ccc' }}>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="accessories">Accessories</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>SKU
                <input type="text" value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #ccc' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>Stock Level
                <input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: Number(e.target.value)})} required style={{ padding: '0.75rem', border: '1px solid #ccc' }} />
              </label>
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontWeight: '500' }}>Size Variants</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {ALL_SIZES.map(size => {
                    const curr = CURRENCIES.find(c => c.code === productForm.currency);
                    const sym = curr?.symbol || '$';
                    return (
                      <div key={size} style={{ border: `1px solid ${selectedSizes[size]?.enabled ? '#111' : '#ddd'}`, padding: '0.75rem', minWidth: '110px', backgroundColor: selectedSizes[size]?.enabled ? '#fafafa' : '#fff', transition: 'all 0.15s' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: selectedSizes[size]?.enabled ? '600' : '400' }}>
                          <input type="checkbox" checked={selectedSizes[size]?.enabled || false} onChange={e => setSelectedSizes(prev => ({ ...prev, [size]: { ...prev[size], enabled: e.target.checked } }))} />
                          {size}
                        </label>
                        {selectedSizes[size]?.enabled && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#757575' }}>Price adjust ({sym})</span>
                            <input type="number" step="0.01" value={selectedSizes[size]?.priceAdjust || 0} onChange={e => setSelectedSizes(prev => ({ ...prev, [size]: { ...prev[size], priceAdjust: Number(e.target.value) } }))} style={{ width: '100%', padding: '0.35rem', border: '1px solid #ccc', marginTop: '0.25rem', fontSize: '0.85rem' }} />
                            <span style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.15rem', display: 'block' }}>Final: {sym}{(productForm.price + (selectedSizes[size]?.priceAdjust || 0)).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '500' }}>Product Image</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => setImageMode('upload')} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', border: '1px solid #ccc', background: imageMode === 'upload' ? '#111' : '#fff', color: imageMode === 'upload' ? '#fff' : '#111', cursor: 'pointer', borderRadius: '2px' }}>Upload File</button>
                    <button type="button" onClick={() => setImageMode('url')} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', border: '1px solid #ccc', background: imageMode === 'url' ? '#111' : '#fff', color: imageMode === 'url' ? '#fff' : '#111', cursor: 'pointer', borderRadius: '2px' }}>Paste URL</button>
                  </div>
                </div>
                
                {imageMode === 'upload' ? (
                  <div
                    onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#111'; }}
                    onDragLeave={e => { e.currentTarget.style.borderColor = '#ccc'; }}
                    onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#ccc'; const f = e.dataTransfer.files[0]; if (f) handleImageFileChange(f); }}
                    style={{ border: '2px dashed #ccc', padding: '2rem', textAlign: 'center', cursor: 'pointer', position: 'relative', backgroundColor: '#fafafa', transition: 'border-color 0.2s' }}
                    onClick={() => document.getElementById('product-image-input')?.click()}
                  >
                    <input id="product-image-input" type="file" accept="image/*" onChange={e => handleImageFileChange(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                    {imagePreview ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'center' }}>
                        <img src={imagePreview} alt="Preview" style={{ width: '80px', height: '100px', objectFit: 'cover', borderRadius: '2px' }} />
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{imageFile ? imageFile.name : 'Current image'}</p>
                          <p style={{ color: '#757575', fontSize: '0.8rem' }}>{imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : 'Click or drag to replace'}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>Click to upload or drag & drop</p>
                        <p style={{ color: '#757575', fontSize: '0.8rem' }}>PNG, JPG, WEBP up to 5MB</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <input type="url" placeholder="https://example.com/image.jpg" value={productForm.image} onChange={e => setProductForm({...productForm, image: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #ccc' }} />
                )}
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>Tags (comma separated)
                <input type="text" placeholder="e.g., summer, featured, casual" value={productForm.tags} onChange={e => setProductForm({...productForm, tags: e.target.value})} style={{ padding: '0.75rem', border: '1px solid #ccc' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>Description
                <textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} rows={4} required style={{ padding: '0.75rem', border: '1px solid #ccc', resize: 'vertical' }} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: '1 / -1' }}>
                <input type="checkbox" checked={productForm.is_new} onChange={e => setProductForm({...productForm, is_new: e.target.checked})} />
                Mark as "New Arrival"
              </label>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowProductModal(false)} className="btn btn-outline" style={{ padding: '0.75rem 2rem' }}>Cancel</button>
                <button type="submit" disabled={savingProduct} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>{savingProduct ? 'Saving...' : 'Save Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
