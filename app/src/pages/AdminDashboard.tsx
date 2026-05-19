import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../lib/useProducts';
import { getProductCurrency } from '../lib/currency';
import { 
  Search, Filter, ChevronRight, X, Shield, LogOut, 
  TrendingUp, ShoppingBag, Box, Clock, CheckCircle, 
  AlertCircle, Eye, RefreshCw 
} from 'lucide-react';
import './AdminDashboard.css';

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
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const { products, refreshProducts } = useProducts();
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('overview');
  
  // Search, Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');

  // Selected Order for Detail Drawer
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  // Product Form State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: '', price: 0, category: 'shirts', is_new: false, image: '', description: '',
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
        // Automatically delete any legacy women products from Supabase
        supabase.from('products').delete().eq('category', 'women').then(() => {
          refreshProducts();
        });
      } else {
        setIsAdmin(false);
      }
      setCheckingRole(false);
    };
    
    checkAdmin();
  }, [user]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (ordersError) throw ordersError;

      if (ordersData) {
        setOrders(ordersData);
        
        // Fetch profiles associated with these orders
        const userIds = Array.from(new Set(ordersData.map((o: any) => o.user_id)));
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);
          
          if (profilesData) {
            const profileMap: Record<string, any> = {};
            profilesData.forEach((p: any) => {
              profileMap[p.id] = p;
            });
            setProfiles(profileMap);
          }
        }

        // Fetch order items to display items list in detail drawer
        const orderIds = ordersData.map((o: any) => o.id);
        if (orderIds.length > 0) {
          const { data: itemsData } = await supabase
            .from('order_items')
            .select('*')
            .in('order_id', orderIds);
          if (itemsData) {
            setOrderItems(itemsData);
          }
        }
      }
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      showToast("Failed to load orders: " + error.message, "error");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
        
      if (error) throw error;
      
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      }
      showToast(`Order status updated to ${newStatus}`);
    } catch (err: any) {
      showToast(`Failed to update status: ${err.message}`, "error");
    }
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

      if (imageFile) {
        setUploadingImage(true);
        finalImageUrl = await uploadImage(imageFile);
        setUploadingImage(false);
      }

      if (!finalImageUrl) {
        showToast('Please upload an image or provide an image URL.', 'error');
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
        showToast('Product updated successfully!');
      } else {
        const id = 'p_' + Date.now();
        const { error } = await supabase.from('products').insert({ id, ...payload });
        if (error) throw error;
        showToast('New product added successfully!');
      }
      
      await refreshProducts();
      setShowProductModal(false);
    } catch (err: any) {
      showToast("Error saving product: " + err.message, 'error');
    } finally {
      setSavingProduct(false);
      setUploadingImage(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        showToast("Error deleting product: " + error.message, 'error');
      } else {
        showToast("Product deleted successfully!");
        await refreshProducts();
      }
    }
  };

  // Stats calculation
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const pendingCount = orders.filter(o => o.status === 'Processing').length;
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Search & Filter execution for Orders
  const filteredOrders = orders.filter((order: any) => {
    const profile = profiles[order.user_id] || {};
    const name = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase();
    const email = (profile.email || '').toLowerCase();
    const id = order.id.toLowerCase();
    const address = (order.shipping_address || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = 
      id.includes(query) || 
      name.includes(query) || 
      email.includes(query) || 
      address.includes(query);

    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  }).sort((a: any, b: any) => {
    if (sortBy === 'Newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'Oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === 'Price: High to Low') return Number(b.total) - Number(a.total);
    if (sortBy === 'Price: Low to High') return Number(a.total) - Number(b.total);
    return 0;
  });

  return (
    <div className="admin-dashboard">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: '100px', right: '24px', zIndex: 5000,
          backgroundColor: toastType === 'success' ? '#16a34a' : '#dc2626',
          color: '#fff', padding: '0.85rem 1.5rem', borderRadius: '4px',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          animation: 'toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          {toastType === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{toastMessage}</span>
        </div>
      )}

      <div className="container" style={{ maxWidth: '1200px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)' }}>Admin Dashboard</h1>
            <p style={{ color: 'var(--color-gray)', fontSize: '0.95rem', marginTop: '0.25rem' }}>Store authority controls & analytics</p>
          </div>
          <button onClick={() => signOut()} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="admin-tab-bar">
          <button onClick={() => setActiveTab('overview')} className={`admin-tab-button ${activeTab === 'overview' ? 'active' : ''}`}>Overview</button>
          <button onClick={() => setActiveTab('products')} className={`admin-tab-button ${activeTab === 'products' ? 'active' : ''}`}>Product Management</button>
          <button onClick={() => setActiveTab('orders')} className={`admin-tab-button ${activeTab === 'orders' ? 'active' : ''}`}>Order Management</button>
        </div>

        {/* ================= OVERVIEW TAB ================= */}
        {activeTab === 'overview' && (
          <>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">Total Revenue</span>
                  <TrendingUp size={20} style={{ color: 'var(--color-accent)' }} />
                </div>
                <p className="admin-stat-value">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="admin-stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">Total Orders</span>
                  <ShoppingBag size={20} style={{ color: 'var(--color-accent)' }} />
                </div>
                <p className="admin-stat-value">{orders.length}</p>
              </div>
              <div className="admin-stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">Products Active</span>
                  <Box size={20} style={{ color: 'var(--color-accent)' }} />
                </div>
                <p className="admin-stat-value">{products.length}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>Recent Orders</h2>
              <button onClick={() => setActiveTab('orders')} className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>View All Orders</button>
            </div>
            
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Detail</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-gray)' }}>No orders yet.</td></tr>
                  ) : (
                    orders.slice(0, 5).map((order: any) => {
                      const p = profiles[order.user_id] || {};
                      const customerName = p.first_name ? `${p.first_name} ${p.last_name || ''}` : 'Customer';
                      const firstItem = orderItems.find(item => item.order_id === order.id);
                      const prod = firstItem ? products.find(prod => prod.id === firstItem.product_id) : null;
                      const currencySymbol = prod ? getProductCurrency(prod) : '$';

                      return (
                        <tr key={order.id}>
                          <td style={{ fontWeight: 600 }}>#{order.id.split('-')[0]}</td>
                          <td>
                            <div className="admin-customer-info">
                              <span className="admin-customer-name">{customerName}</span>
                              <span className="admin-customer-email">{p.email || 'No email'}</span>
                            </div>
                          </td>
                          <td>{new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                          <td>
                            <span className={`order-status-badge status-${order.status?.toLowerCase()}`}>
                              {order.status}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{currencySymbol}{Number(order.total).toFixed(2)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ================= PRODUCT MANAGEMENT TAB ================= */}
        {activeTab === 'products' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>Product Catalog</h2>
              <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>+ Add Product</button>
            </div>
            
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const firstVariant = p.variants?.[0];
                    const symbol = firstVariant?.currency ? CURRENCIES.find(c => c.code === firstVariant.currency)?.symbol : '$';
                    return (
                      <tr key={p.id}>
                        <td><img src={p.image} alt={p.name} style={{ width: '44px', height: '56px', objectFit: 'cover' }} /></td>
                        <td style={{ fontWeight: '500' }}>{p.name}</td>
                        <td>{symbol}{p.price}</td>
                        <td style={{ color: (p.stock || 0) < 10 ? '#dc2626' : 'inherit', fontWeight: (p.stock || 0) < 10 ? '600' : 'normal' }}>
                          {p.stock ?? 100}
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleOpenModal(p)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', fontSize: '0.9rem' }}>Edit</button>
                            <button onClick={() => handleDeleteProduct(p.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', fontSize: '0.9rem' }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ================= ORDER MANAGEMENT TAB ================= */}
        {activeTab === 'orders' && (
          <>
            {/* Orders Statistics Banner */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">Total Revenue</span>
                  <TrendingUp size={20} style={{ color: '#16a34a' }} />
                </div>
                <p className="admin-stat-value">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="admin-stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">Orders Handled</span>
                  <ShoppingBag size={20} style={{ color: 'var(--color-accent)' }} />
                </div>
                <p className="admin-stat-value">{orders.length}</p>
              </div>
              <div className="admin-stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">AOV (Avg Value)</span>
                  <Box size={20} style={{ color: 'var(--color-accent)' }} />
                </div>
                <p className="admin-stat-value">${avgOrderValue.toFixed(2)}</p>
              </div>
              <div className="admin-stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="admin-stat-label">Processing / Pending</span>
                  <Clock size={20} style={{ color: '#d97706' }} />
                </div>
                <p className="admin-stat-value" style={{ color: pendingCount > 0 ? '#d97706' : 'inherit' }}>{pendingCount}</p>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="admin-control-bar">
              <div className="admin-search-wrapper">
                <Search size={16} className="admin-search-icon" />
                <input 
                  type="text" 
                  placeholder="Search Order ID, Customer name or address..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="admin-search-input"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray)' }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="admin-filters">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Filter size={15} style={{ color: 'var(--color-gray)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-gray)' }}>Filter:</span>
                </div>
                <select 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value)}
                  className="admin-select"
                >
                  <option value="All">All Statuses</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value)}
                  className="admin-select"
                >
                  <option value="Newest">Newest First</option>
                  <option value="Oldest">Oldest First</option>
                  <option value="Price: High to Low">Price: High to Low</option>
                  <option value="Price: Low to High">Price: Low to High</option>
                </select>
                
                <button 
                  onClick={fetchOrders}
                  disabled={loadingOrders}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid var(--color-border)', padding: '0.8rem 1rem', cursor: 'pointer', background: 'transparent', color: 'var(--color-text)' }}
                  title="Reload Orders Data"
                >
                  <RefreshCw size={14} className={loadingOrders ? 'spin-animation' : ''} />
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Detail</th>
                    <th>Shipping Address</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-gray)' }}>
                        No orders match your search parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order: any) => {
                      const p = profiles[order.user_id] || {};
                      const customerName = p.first_name ? `${p.first_name} ${p.last_name || ''}` : 'Customer';
                      const firstItem = orderItems.find(item => item.order_id === order.id);
                      const prod = firstItem ? products.find(prod => prod.id === firstItem.product_id) : null;
                      const currencySymbol = prod ? getProductCurrency(prod) : '$';

                      return (
                        <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedOrder(order)}>
                          <td style={{ fontWeight: 600 }}>#{order.id.split('-')[0]}</td>
                          <td>
                            <div className="admin-customer-info">
                              <span className="admin-customer-name">{customerName}</span>
                              <span className="admin-customer-email">{p.email || 'No email'}</span>
                            </div>
                          </td>
                          <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.shipping_address}>
                            {order.shipping_address}
                          </td>
                          <td>{new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                          <td onClick={e => e.stopPropagation()}>
                            <select
                              value={order.status || 'Processing'}
                              onChange={e => handleUpdateStatus(order.id, e.target.value)}
                              className={`order-status-badge status-${order.status?.toLowerCase()}`}
                              style={{ border: 'none', padding: '0.35rem 0.5rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}
                            >
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td style={{ fontWeight: 600 }}>{currencySymbol}{Number(order.total).toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={() => setSelectedOrder(order)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', border: 'none', background: 'transparent', color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                            >
                              <Eye size={14} />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ================= ORDER DETAILS SLIDE-OUT DRAWER ================= */}
      {selectedOrder && (
        <div className="admin-drawer-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-drawer" onClick={e => e.stopPropagation()}>
            <div className="admin-drawer-header">
              <div>
                <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>Order Details</h2>
                <p style={{ color: 'var(--color-gray)', fontSize: '0.85rem', marginTop: '0.15rem' }}>ID: #{selectedOrder.id}</p>
              </div>
              <button className="admin-drawer-close" onClick={() => setSelectedOrder(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="admin-drawer-section">
              <h3 className="admin-drawer-section-title">Order Status</h3>
              <div className="status-change-wrapper">
                <span className={`order-status-badge status-${selectedOrder.status?.toLowerCase()}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  {selectedOrder.status}
                </span>
                <select
                  value={selectedOrder.status || 'Processing'}
                  onChange={e => handleUpdateStatus(selectedOrder.id, e.target.value)}
                  className="admin-select"
                  style={{ flex: 1 }}
                >
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="admin-drawer-section">
              <h3 className="admin-drawer-section-title">Customer Information</h3>
              <div className="admin-drawer-grid">
                <div className="admin-drawer-item">
                  <span className="admin-drawer-label">Full Name</span>
                  <span className="admin-drawer-value">
                    {profiles[selectedOrder.user_id]?.first_name ? `${profiles[selectedOrder.user_id].first_name} ${profiles[selectedOrder.user_id].last_name || ''}` : 'Customer'}
                  </span>
                </div>
                <div className="admin-drawer-item">
                  <span className="admin-drawer-label">Email Address</span>
                  <span className="admin-drawer-value">{profiles[selectedOrder.user_id]?.email || 'No email'}</span>
                </div>
                <div className="admin-drawer-item" style={{ gridColumn: 'span 2' }}>
                  <span className="admin-drawer-label">Shipping Destination</span>
                  <span className="admin-drawer-value" style={{ lineHeight: '1.4' }}>{selectedOrder.shipping_address}</span>
                </div>
              </div>
            </div>

            <div className="admin-drawer-section" style={{ flex: 1 }}>
              <h3 className="admin-drawer-section-title">Items List</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
                {orderItems.filter(item => item.order_id === selectedOrder.id).map((item: any) => {
                  const prod = products.find(p => p.id === item.product_id);
                  if (!prod) return null;
                  return (
                    <div key={item.id} className="drawer-order-item">
                      <img src={prod.image} alt={prod.name} className="drawer-order-item-img" />
                      <div className="drawer-order-item-details">
                        <p className="drawer-order-item-name">{prod.name}</p>
                        <p className="drawer-order-item-sub">Size: {item.size} · Qty: {item.quantity}</p>
                      </div>
                      <p className="drawer-order-item-price">
                        {getProductCurrency(prod)}{(Number(item.price_at_time) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Total Charge</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                  {(() => {
                    const firstItem = orderItems.find(item => item.order_id === selectedOrder.id);
                    const prod = firstItem ? products.find(p => p.id === firstItem.product_id) : null;
                    return prod ? getProductCurrency(prod) : '$';
                  })()}{Number(selectedOrder.total).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= PRODUCT FORM MODAL ================= */}
      {showProductModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', padding: '2.5rem', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.75rem', fontFamily: 'var(--font-heading)' }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSaveProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>Name
                <input type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} required style={{ padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontWeight: '500' }}>Price</span>
                <div style={{ display: 'flex', gap: '0' }}>
                  <select value={productForm.currency} onChange={e => setProductForm({...productForm, currency: e.target.value})} style={{ padding: '0.75rem', border: '1px solid var(--color-border)', borderRight: 'none', backgroundColor: 'rgba(0,0,0,0.03)', color: 'var(--color-text)', fontWeight: '600', width: '90px' }}>
                    {CURRENCIES.map(c => <option key={c.code} value={c.code} style={{ backgroundColor: 'var(--color-bg)' }}>{c.symbol} {c.code}</option>)}
                  </select>
                  <input type="number" step="0.01" value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} required style={{ padding: '0.75rem', border: '1px solid var(--color-border)', flex: 1, backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                </div>
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>Category
                <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} required style={{ padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}>
                  <option value="shirts" style={{ backgroundColor: 'var(--color-bg)' }}>Shirts</option>
                  <option value="t-shirts" style={{ backgroundColor: 'var(--color-bg)' }}>T-Shirts</option>
                  <option value="polo" style={{ backgroundColor: 'var(--color-bg)' }}>POLO</option>
                  <option value="jeans" style={{ backgroundColor: 'var(--color-bg)' }}>Jeans</option>
                  <option value="trousers" style={{ backgroundColor: 'var(--color-bg)' }}>Trousers</option>
                  <option value="linen" style={{ backgroundColor: 'var(--color-bg)' }}>LINEN</option>
                  <option value="cargo-pants" style={{ backgroundColor: 'var(--color-bg)' }}>Cargo Pants</option>
                  <option value="joggers" style={{ backgroundColor: 'var(--color-bg)' }}>Joggers</option>
                  <option value="shorts" style={{ backgroundColor: 'var(--color-bg)' }}>SHORTS</option>
                  <option value="overshirts" style={{ backgroundColor: 'var(--color-bg)' }}>Overshirts</option>
                  <option value="footwear" style={{ backgroundColor: 'var(--color-bg)' }}>Footwear</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>SKU
                <input type="text" value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} style={{ padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>Stock Level
                <input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: Number(e.target.value)})} required style={{ padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
              </label>
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontWeight: '500' }}>Size Variants</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {ALL_SIZES.map(size => {
                    const curr = CURRENCIES.find(c => c.code === productForm.currency);
                    const sym = curr?.symbol || '$';
                    return (
                      <div key={size} style={{ border: `1px solid ${selectedSizes[size]?.enabled ? 'var(--color-text)' : 'var(--color-border)'}`, padding: '0.75rem', minWidth: '110px', backgroundColor: selectedSizes[size]?.enabled ? 'rgba(0,0,0,0.02)' : 'transparent', transition: 'all 0.15s' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: selectedSizes[size]?.enabled ? '600' : '400' }}>
                          <input type="checkbox" checked={selectedSizes[size]?.enabled || false} onChange={e => setSelectedSizes(prev => ({ ...prev, [size]: { ...prev[size], enabled: e.target.checked } }))} />
                          {size}
                        </label>
                        {selectedSizes[size]?.enabled && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-gray)' }}>Price adjust ({sym})</span>
                            <input type="number" step="0.01" value={selectedSizes[size]?.priceAdjust || 0} onChange={e => setSelectedSizes(prev => ({ ...prev, [size]: { ...prev[size], priceAdjust: Number(e.target.value) } }))} style={{ width: '100%', padding: '0.35rem', border: '1px solid var(--color-border)', marginTop: '0.25rem', fontSize: '0.85rem', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-gray)', marginTop: '0.15rem', display: 'block' }}>Final: {sym}{(productForm.price + (selectedSizes[size]?.priceAdjust || 0)).toFixed(2)}</span>
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
                    <button type="button" onClick={() => setImageMode('upload')} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', border: '1px solid var(--color-border)', background: imageMode === 'upload' ? 'var(--color-text)' : 'transparent', color: imageMode === 'upload' ? 'var(--color-bg)' : 'var(--color-text)', cursor: 'pointer', borderRadius: '2px' }}>Upload File</button>
                    <button type="button" onClick={() => setImageMode('url')} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', border: '1px solid var(--color-border)', background: imageMode === 'url' ? 'var(--color-text)' : 'transparent', color: imageMode === 'url' ? 'var(--color-bg)' : 'var(--color-text)', cursor: 'pointer', borderRadius: '2px' }}>Paste URL</button>
                  </div>
                </div>
                
                {imageMode === 'upload' ? (
                  <div
                    onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--color-text)'; }}
                    onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                    onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--color-border)'; const f = e.dataTransfer.files[0]; if (f) handleImageFileChange(f); }}
                    style={{ border: '2px dashed var(--color-border)', padding: '2rem', textAlign: 'center', cursor: 'pointer', position: 'relative', backgroundColor: 'rgba(0,0,0,0.01)', transition: 'border-color 0.2s' }}
                    onClick={() => document.getElementById('product-image-input')?.click()}
                  >
                    <input id="product-image-input" type="file" accept="image/*" onChange={e => handleImageFileChange(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                    {imagePreview ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'center' }}>
                        <img src={imagePreview} alt="Preview" style={{ width: '80px', height: '100px', objectFit: 'cover', borderRadius: '2px' }} />
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{imageFile ? imageFile.name : 'Current image'}</p>
                          <p style={{ color: 'var(--color-gray)', fontSize: '0.8rem' }}>{imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : 'Click or drag to replace'}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>Click to upload or drag & drop</p>
                        <p style={{ color: 'var(--color-gray)', fontSize: '0.8rem' }}>PNG, JPG, WEBP up to 5MB</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <input type="url" placeholder="https://example.com/image.jpg" value={productForm.image} onChange={e => setProductForm({...productForm, image: e.target.value})} style={{ padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                )}
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>Tags (comma separated)
                <input type="text" placeholder="e.g., summer, featured, casual" value={productForm.tags} onChange={e => setProductForm({...productForm, tags: e.target.value})} style={{ padding: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>Description
                <textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} rows={4} required style={{ padding: '0.75rem', border: '1px solid var(--color-border)', resize: 'vertical', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
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
