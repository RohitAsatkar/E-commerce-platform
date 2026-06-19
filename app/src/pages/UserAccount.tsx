import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useProducts } from '../lib/useProducts';
import { getProductCurrency } from '../lib/currency';
import { User, MapPin, Package, Shield, LogOut, ChevronRight, Edit3, Check, X, Eye, EyeOff, ShoppingBag, Plus } from 'lucide-react';
import './UserAccount.css';

type Section = 'overview' | 'orders' | 'profile' | 'addresses' | 'security';

const UserAccount = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { products } = useProducts();
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null); // null, 'new', or existing ID
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: '', last_name: '', address: '', city: '', postal_code: ''
  });
  const [addressForm, setAddressForm] = useState({
    recipient_name: '',
    phone: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    address_type: 'Home',
    is_default: false
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Address PIN lookup states
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isPinAutofilled, setIsPinAutofilled] = useState(false);

  // Password change
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }

    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      if (data) {
        setProfileForm({
          first_name: data.first_name || '', last_name: data.last_name || '',
          address: data.address || '', city: data.city || '', postal_code: data.postal_code || ''
        });
      }
    };

    const fetchOrders = async () => {
      const { data } = await supabase.from('orders')
        .select('*, order_items(*)').eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setOrders(data || []);
    };

    fetchProfile();
    fetchOrders();
  }, [user, navigate]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        first_name: profileForm.first_name, last_name: profileForm.last_name,
      }).eq('id', user.id);
      if (error) throw error;
      setProfile({ ...profile, first_name: profileForm.first_name, last_name: profileForm.last_name });
      setEditingProfile(false);
      showToast('Profile updated successfully!');
    } catch (err: any) {
      showToast('Error: ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  const getParsedAddresses = (): any[] => {
    if (!profile?.address) return [];
    try {
      if (profile.address.trim().startsWith('[')) {
        return JSON.parse(profile.address);
      } else {
        return [{
          id: 'default',
          recipient_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Default Recipient',
          street_address: profile.address,
          city: profile.city || '',
          postal_code: profile.postal_code || '',
          phone: '',
          state: '',
          country: 'India',
          address_type: 'Home',
          is_default: true
        }];
      }
    } catch (e) {
      return [];
    }
  };

  const handleSaveAddress = async () => {
    if (!user) return;
    
    if (!addressForm.recipient_name || !addressForm.street_address || !addressForm.city || !addressForm.postal_code) {
      showToast('Please fill all required fields.', 'error');
      return;
    }

    setSaving(true);
    try {
      const currentList = getParsedAddresses();
      let updatedList = [...currentList];

      if (editingAddressId === 'new') {
        const newAddress = {
          ...addressForm,
          id: 'addr_' + Math.random().toString(36).substr(2, 9),
          is_default: currentList.length === 0 ? true : addressForm.is_default
        };

        if (newAddress.is_default) {
          updatedList = updatedList.map(a => ({ ...a, is_default: false }));
        }
        updatedList.push(newAddress);
      } else if (editingAddressId) {
        updatedList = updatedList.map(a => {
          if (a.id === editingAddressId) {
            return { ...a, ...addressForm };
          }
          return a;
        });

        if (addressForm.is_default) {
          updatedList = updatedList.map(a => ({
            ...a,
            is_default: a.id === editingAddressId
          }));
        }
      }

      const defaultAddr = updatedList.find(a => a.is_default) || updatedList[0];
      const { error } = await supabase.from('profiles').update({
        address: JSON.stringify(updatedList),
        city: defaultAddr?.city || '',
        postal_code: defaultAddr?.postal_code || ''
      }).eq('id', user.id);

      if (error) throw error;

      setProfile({
        ...profile,
        address: JSON.stringify(updatedList),
        city: defaultAddr?.city || '',
        postal_code: defaultAddr?.postal_code || ''
      });

      setEditingAddressId(null);
      showToast(editingAddressId === 'new' ? 'Address added successfully!' : 'Address updated successfully!');
    } catch (err: any) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this address?')) return;
    setSaving(true);
    try {
      const currentList = getParsedAddresses();
      let updatedList = currentList.filter(a => a.id !== id);

      if (currentList.find(a => a.id === id)?.is_default && updatedList.length > 0) {
        updatedList[0].is_default = true;
      }

      const defaultAddr = updatedList.find(a => a.is_default) || updatedList[0];
      const { error } = await supabase.from('profiles').update({
        address: updatedList.length > 0 ? JSON.stringify(updatedList) : null,
        city: defaultAddr?.city || null,
        postal_code: defaultAddr?.postal_code || null
      }).eq('id', user.id);

      if (error) throw error;

      setProfile({
        ...profile,
        address: updatedList.length > 0 ? JSON.stringify(updatedList) : null,
        city: defaultAddr?.city || null,
        postal_code: defaultAddr?.postal_code || null
      });

      showToast('Address deleted successfully!');
    } catch (err: any) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    if (!user) return;
    setSaving(true);
    try {
      const currentList = getParsedAddresses();
      const updatedList = currentList.map(a => ({
        ...a,
        is_default: a.id === id
      }));

      const defaultAddr = updatedList.find(a => a.is_default);
      const { error } = await supabase.from('profiles').update({
        address: JSON.stringify(updatedList),
        city: defaultAddr?.city || '',
        postal_code: defaultAddr?.postal_code || ''
      }).eq('id', user.id);

      if (error) throw error;

      setProfile({
        ...profile,
        address: JSON.stringify(updatedList),
        city: defaultAddr?.city || '',
        postal_code: defaultAddr?.postal_code || ''
      });

      showToast('Default address updated!');
    } catch (err: any) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEditingAddress = (addr: any) => {
    setEditingAddressId(addr.id);
    setPinError(null);
    setPinLoading(false);
    setIsPinAutofilled(!!addr.postal_code && addr.postal_code.trim().length === 6);
    setAddressForm({
      recipient_name: addr.recipient_name || '',
      phone: addr.phone || '',
      street_address: addr.street_address || '',
      city: addr.city || '',
      state: addr.state || '',
      postal_code: addr.postal_code || '',
      country: addr.country || 'India',
      address_type: addr.address_type || 'Home',
      is_default: addr.is_default || false
    });
  };

  const startAddingAddress = () => {
    setEditingAddressId('new');
    setPinError(null);
    setPinLoading(false);
    setIsPinAutofilled(false);
    setAddressForm({
      recipient_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
      phone: '',
      street_address: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'India',
      address_type: 'Home',
      is_default: false
    });
  };

  const handlePostalCodeChange = async (pincode: string) => {
    const sanitized = pincode.replace(/\D/g, '').slice(0, 6);
    setAddressForm(prev => ({ ...prev, postal_code: sanitized }));
    setPinError(null);

    if (sanitized.length === 6) {
      setPinLoading(true);
      try {
        // Try apibharat.com first (CORS support on production origins)
        const res = await fetch(`https://api.apibharat.com/v1/pincode/${sanitized}`);
        const data = await res.json();

        if (data && data.success && data.data) {
          const district = data.data.district;
          const state = data.data.state;
          setAddressForm(prev => ({
            ...prev,
            city: district,
            state: state
          }));
          setIsPinAutofilled(true);
          setPinError(null);
        } else {
          // Fallback to postalpincode.in
          const fallbackRes = await fetch(`https://api.postalpincode.in/pincode/${sanitized}`);
          const fallbackData = await fallbackRes.json();

          if (fallbackData && fallbackData[0] && fallbackData[0].Status === 'Success') {
            const postOfficeArray = fallbackData[0].PostOffice;
            if (postOfficeArray && postOfficeArray.length > 0) {
              const district = postOfficeArray[0].District;
              const state = postOfficeArray[0].State;
              setAddressForm(prev => ({
                ...prev,
                city: district,
                state: state
              }));
              setIsPinAutofilled(true);
              setPinError(null);
            } else {
              setPinError('Invalid PIN code.');
              setIsPinAutofilled(false);
              setAddressForm(prev => ({ ...prev, city: '', state: '' }));
            }
          } else {
            setPinError('Invalid PIN code.');
            setIsPinAutofilled(false);
            setAddressForm(prev => ({ ...prev, city: '', state: '' }));
          }
        }
      } catch (err) {
        // Fallback to postalpincode.in if apibharat fails
        try {
          const fallbackRes = await fetch(`https://api.postalpincode.in/pincode/${sanitized}`);
          const fallbackData = await fallbackRes.json();

          if (fallbackData && fallbackData[0] && fallbackData[0].Status === 'Success') {
            const postOfficeArray = fallbackData[0].PostOffice;
            if (postOfficeArray && postOfficeArray.length > 0) {
              const district = postOfficeArray[0].District;
              const state = postOfficeArray[0].State;
              setAddressForm(prev => ({
                ...prev,
                city: district,
                state: state
              }));
              setIsPinAutofilled(true);
              setPinError(null);
            } else {
              setPinError('Invalid PIN code.');
              setIsPinAutofilled(false);
              setAddressForm(prev => ({ ...prev, city: '', state: '' }));
            }
          } else {
            setPinError('Invalid PIN code.');
            setIsPinAutofilled(false);
            setAddressForm(prev => ({ ...prev, city: '', state: '' }));
          }
        } catch (fallbackErr) {
          setPinError('Invalid PIN code.');
          setIsPinAutofilled(false);
          setAddressForm(prev => ({ ...prev, city: '', state: '' }));
        }
      } finally {
        setPinLoading(false);
      }
    } else {
      setIsPinAutofilled(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error'); return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Passwords do not match', 'error'); return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (error) throw error;
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      showToast('Password changed successfully!');
    } catch (err: any) {
      showToast('Error: ' + err.message, 'error');
    } finally { setChangingPassword(false); }
  };

  const handleLogout = async () => {
    localStorage.removeItem('cart_promo_code');
    localStorage.removeItem('cart_gift_wrap');
    localStorage.removeItem('aura_cms_homepage');
    await signOut();
    navigate('/');
  };

  const resetProfileForm = () => {
    if (profile) setProfileForm({
      first_name: profile.first_name || '', last_name: profile.last_name || '',
      address: profile.address || '', city: profile.city || '', postal_code: profile.postal_code || ''
    });
  };

  if (!user) return null;

  const totalSpent = orders.reduce((s, o) => s + Number(o.total), 0);
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—';
  const initials = ((profile?.first_name?.[0] || '') + (profile?.last_name?.[0] || '') || user.email?.[0] || 'U').toUpperCase();

  const navItems: { id: Section; icon: any; label: string }[] = [
    { id: 'overview', icon: User, label: 'Overview' },
    { id: 'orders', icon: Package, label: 'Orders' },
    { id: 'profile', icon: Edit3, label: 'Profile' },
    { id: 'addresses', icon: MapPin, label: 'Addresses' },
    { id: 'security', icon: Shield, label: 'Security' },
  ];

  return (
    <div className="account-page">
      {/* Toast */}
      {toast && (
        <div className={`account-toast ${toast.type}`}>
          {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
          {toast.message}
        </div>
      )}

      <div className="container" style={{ maxWidth: '1100px' }}>
        {/* Header */}
        <div className="account-header">
          <div className="account-avatar">{initials}</div>
          <div>
            <h1 className="account-title">
              {profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : 'My Account'}
            </h1>
            <p className="account-subtitle">{user.email}</p>
          </div>
        </div>

        <div className="account-layout">
          {/* Sidebar */}
          <nav className="account-nav">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`account-nav-item ${activeSection === item.id ? 'active' : ''}`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                <ChevronRight size={14} className="nav-chevron" />
              </button>
            ))}
            {profile?.role === 'admin' && (
              <>
                <div className="account-nav-divider" />
                <Link to="/admin" className="account-nav-item admin-link">
                  <Shield size={18} />
                  <span>Admin Panel</span>
                  <ChevronRight size={14} className="nav-chevron" />
                </Link>
              </>
            )}
            <button onClick={handleLogout} className="account-nav-item logout-btn">
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </nav>

          {/* Content */}
          <div className="account-content">

            {/* ===== OVERVIEW ===== */}
            {activeSection === 'overview' && (
              <>
                <div className="account-stats-grid">
                  <div className="stat-card">
                    <Package size={22} style={{ color: 'var(--color-accent)' }} />
                    <div className="stat-value">{orders.length}</div>
                    <div className="stat-label">Total Orders</div>
                  </div>
                  <div className="stat-card">
                    <ShoppingBag size={22} style={{ color: 'var(--color-accent)' }} />
                    <div className="stat-value">₹{totalSpent.toFixed(0)}</div>
                    <div className="stat-label">Total Spent</div>
                  </div>
                  <div className="stat-card">
                    <User size={22} style={{ color: 'var(--color-accent)' }} />
                    <div className="stat-value" style={{ fontSize: '1rem' }}>{memberSince}</div>
                    <div className="stat-label">Member Since</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <h2 className="section-heading">Quick Actions</h2>
                <div className="quick-actions">
                  <button onClick={() => setActiveSection('profile')} className="quick-action-card">
                    <Edit3 size={20} />
                    <span>Edit Profile</span>
                  </button>
                  <button onClick={() => setActiveSection('addresses')} className="quick-action-card">
                    <MapPin size={20} />
                    <span>Manage Address</span>
                  </button>
                  <button onClick={() => setActiveSection('orders')} className="quick-action-card">
                    <Package size={20} />
                    <span>View Orders</span>
                  </button>
                  <button onClick={() => setActiveSection('security')} className="quick-action-card">
                    <Shield size={20} />
                    <span>Change Password</span>
                  </button>
                </div>

                {/* Recent Orders */}
                {orders.length > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.5rem' }}>
                      <h2 className="section-heading" style={{ marginBottom: 0 }}>Recent Orders</h2>
                      <button onClick={() => setActiveSection('orders')} className="view-all-btn">View All →</button>
                    </div>
                    <div className="order-list" style={{ marginTop: '1rem' }}>
                      {orders.slice(0, 3).map(order => (
                        <div key={order.id} className="order-card-mini">
                          <div className="order-card-mini-left">
                            <p className="order-id">#{order.id.split('-')[0]}</p>
                            <p className="order-date">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="order-card-mini-center">
                            <span className={`order-status-badge ${order.status?.toLowerCase()}`}>{order.status}</span>
                          </div>
                          <div className="order-card-mini-right">
                            <p className="order-total">₹{Number(order.total).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Profile Completion */}
                {(!profile?.first_name || !profile?.address) && (
                  <div className="completion-banner">
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Complete Your Profile</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-gray)' }}>Add your details to speed up checkout and receive personalized recommendations.</p>
                    </div>
                    <button onClick={() => setActiveSection(profile?.first_name ? 'addresses' : 'profile')} className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', whiteSpace: 'nowrap' }}>Complete Now</button>
                  </div>
                )}
              </>
            )}

            {/* ===== ORDERS ===== */}
            {activeSection === 'orders' && (
              <>
                <h2 className="section-heading">Order History</h2>
                {orders.length === 0 ? (
                  <div className="empty-state">
                    <Package size={48} strokeWidth={1} />
                    <p>No orders yet</p>
                    <span>Your order history will appear here once you place your first order.</span>
                    <button onClick={() => navigate('/shop')} className="btn btn-primary" style={{ marginTop: '1.5rem', padding: '0.75rem 2rem' }}>Start Shopping</button>
                  </div>
                ) : (
                  <div className="order-list">
                    {orders.map(order => (
                      <div key={order.id} className={`order-card ${expandedOrder === order.id ? 'expanded' : ''}`}>
                        <button className="order-card-header" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                          <div className="order-header-left">
                            <p className="order-id">Order #{order.id.split('-')[0]}</p>
                            <p className="order-date">{new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          </div>
                          <div className="order-header-right">
                            <span className={`order-status-badge ${order.status?.toLowerCase()}`}>{order.status}</span>
                            <p className="order-total">₹{Number(order.total).toFixed(2)}</p>
                            <ChevronRight size={16} className={`order-chevron ${expandedOrder === order.id ? 'rotated' : ''}`} />
                          </div>
                        </button>
                        {expandedOrder === order.id && (
                          <div className="order-card-body">
                            {order.order_items.map((item: any) => {
                              const product = products.find(p => p.id === item.product_id);
                              if (!product) return null;
                              return (
                                <div key={item.id} className="order-item">
                                  <img src={product.image} alt={product.name} className="order-item-image" />
                                  <div className="order-item-info">
                                    <p className="order-item-name">{product.name}</p>
                                    <p className="order-item-details">Size: {item.size} · Qty: {item.quantity}</p>
                                  </div>
                                  <p className="order-item-price">{getProductCurrency(product)}{Number(item.price_at_time).toFixed(2)}</p>
                                </div>
                              );
                            })}
                            <div className="order-card-footer">
                              <p>Shipped to: {order.shipping_address}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ===== PROFILE ===== */}
            {activeSection === 'profile' && (
              <>
                <div className="section-header-row">
                  <h2 className="section-heading" style={{ marginBottom: 0 }}>Profile Details</h2>
                  {!editingProfile && <button onClick={() => setEditingProfile(true)} className="edit-btn"><Edit3 size={14} /> Edit</button>}
                </div>

                {editingProfile ? (
                  <div className="form-card">
                    <div className="form-grid">
                      <label className="form-label">First Name
                        <input type="text" value={profileForm.first_name} onChange={e => setProfileForm({...profileForm, first_name: e.target.value})} className="form-input" placeholder="John" />
                      </label>
                      <label className="form-label">Last Name
                        <input type="text" value={profileForm.last_name} onChange={e => setProfileForm({...profileForm, last_name: e.target.value})} className="form-input" placeholder="Doe" />
                      </label>
                      <label className="form-label full-width">Email
                        <input type="email" value={user.email || ''} disabled className="form-input disabled" />
                        <span className="form-hint">Email cannot be changed</span>
                      </label>
                    </div>
                    <div className="form-actions">
                      <button onClick={handleSaveProfile} disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
                      <button onClick={() => { setEditingProfile(false); resetProfileForm(); }} className="btn btn-outline">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="info-card">
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">First Name</span>
                        <span className="info-value">{profile?.first_name || '—'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Last Name</span>
                        <span className="info-value">{profile?.last_name || '—'}</span>
                      </div>
                      <div className="info-item full-width">
                        <span className="info-label">Email</span>
                        <span className="info-value">{user.email}</span>
                      </div>
                      <div className="info-item full-width">
                        <span className="info-label">Member Since</span>
                        <span className="info-value">{memberSince}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ===== ADDRESSES ===== */}
            {activeSection === 'addresses' && (
              <>
                {editingAddressId ? (
                  <>
                    <div className="section-header-row">
                      <h2 className="section-heading" style={{ marginBottom: 0 }}>
                        {editingAddressId === 'new' ? 'Add New Address' : 'Edit Address'}
                      </h2>
                    </div>

                     <div className="form-card animate-fade-in" style={{ marginTop: '1rem' }}>
                       <div className="form-grid">
                         <label className="form-label">Recipient Name *
                           <input 
                             type="text" 
                             value={addressForm.recipient_name} 
                             onChange={e => setAddressForm({...addressForm, recipient_name: e.target.value})} 
                             className="form-input" 
                             placeholder="John Doe" 
                             required 
                           />
                         </label>
                         <label className="form-label">Phone Number
                           <input 
                             type="text" 
                             value={addressForm.phone} 
                             onChange={e => setAddressForm({...addressForm, phone: e.target.value})} 
                             className="form-input" 
                             placeholder="+91 98765 43210" 
                           />
                         </label>

                         <label className="form-label" style={{ position: 'relative' }}>PIN Code *
                           <input 
                             type="text" 
                             value={addressForm.postal_code} 
                             onChange={e => handlePostalCodeChange(e.target.value)} 
                             className={`form-input ${pinError ? 'error' : ''}`}
                             placeholder="e.g. 400001" 
                             maxLength={6}
                             required 
                           />
                           {pinLoading && <span className="pin-status-msg loading">Fetching details...</span>}
                           {pinError && <span className="pin-status-msg error">{pinError}</span>}
                         </label>
                         <label className="form-label">Country
                           <input 
                             type="text" 
                             value={addressForm.country} 
                             onChange={e => setAddressForm({...addressForm, country: e.target.value})} 
                             className="form-input" 
                             placeholder="India" 
                           />
                         </label>

                         <label className="form-label">City *
                           <input 
                             type="text" 
                             value={addressForm.city} 
                             onChange={e => !isPinAutofilled && setAddressForm({...addressForm, city: e.target.value})} 
                             className={`form-input ${isPinAutofilled ? 'readonly' : ''}`}
                             placeholder={pinLoading ? "Fetching..." : "Mumbai"}
                             readOnly={isPinAutofilled}
                             required 
                           />
                           {isPinAutofilled && <span className="pin-autofill-hint">Autofilled from PIN</span>}
                         </label>
                         <label className="form-label">State / Region
                           <input 
                             type="text" 
                             value={addressForm.state} 
                             onChange={e => !isPinAutofilled && setAddressForm({...addressForm, state: e.target.value})} 
                             className={`form-input ${isPinAutofilled ? 'readonly' : ''}`}
                             placeholder={pinLoading ? "Fetching..." : "Maharashtra"}
                             readOnly={isPinAutofilled}
                           />
                           {isPinAutofilled && <span className="pin-autofill-hint">Autofilled from PIN</span>}
                         </label>

                         <label className="form-label full-width">Street Address *
                           <input 
                             type="text" 
                             value={addressForm.street_address} 
                             onChange={e => setAddressForm({...addressForm, street_address: e.target.value})} 
                             className="form-input" 
                             placeholder="Flat/House No., Building, Street Name" 
                             required 
                           />
                         </label>
                          <div className="form-label full-width" style={{ marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-gray)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'block' }}>Address Type</span>
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            {(['Home', 'Work', 'Other'] as const).map(type => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setAddressForm({...addressForm, address_type: type})}
                                style={{
                                  padding: '0.5rem 1.25rem',
                                  fontSize: '0.85rem',
                                  borderRadius: '4px',
                                  border: '1px solid',
                                  borderColor: addressForm.address_type === type ? 'var(--color-text)' : 'var(--color-border)',
                                  backgroundColor: addressForm.address_type === type ? 'var(--color-text)' : 'transparent',
                                  color: addressForm.address_type === type ? 'var(--color-bg)' : 'var(--color-text)',
                                  cursor: 'pointer',
                                  fontWeight: 500,
                                  transition: 'all 0.15s'
                                }}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>

                        <label className="form-label full-width" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                          <input 
                            type="checkbox" 
                            checked={addressForm.is_default} 
                            disabled={editingAddressId !== 'new' && addressForm.is_default}
                            onChange={e => setAddressForm({...addressForm, is_default: e.target.checked})}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>Set as default shipping address</span>
                        </label>
                      </div>

                      <div className="form-actions" style={{ marginTop: '2rem' }}>
                        <button 
                          onClick={handleSaveAddress} 
                          disabled={saving} 
                          className="btn btn-primary"
                        >
                          {saving ? 'Saving...' : 'Save Address'}
                        </button>
                        <button 
                          onClick={() => setEditingAddressId(null)} 
                          className="btn btn-outline"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2 className="section-heading" style={{ marginBottom: 0 }}>Shipping Addresses</h2>
                      <button 
                        onClick={startAddingAddress} 
                        className="btn btn-primary" 
                        style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}
                      >
                        + Add Address
                      </button>
                    </div>

                    {getParsedAddresses().length === 0 ? (
                      <div className="empty-state" style={{ padding: '3rem 2rem', border: '1px dashed var(--color-border)', borderRadius: '6px', marginTop: '1rem' }}>
                        <MapPin size={48} strokeWidth={1} style={{ color: 'var(--color-gray)' }} />
                        <p>No addresses saved yet</p>
                        <span>Save multiple delivery addresses for faster and smoother checkouts.</span>
                        <button onClick={startAddingAddress} className="btn btn-primary" style={{ marginTop: '1.5rem', padding: '0.6rem 1.5rem' }}>
                          Add Your First Address
                        </button>
                      </div>
                    ) : (
                      <div className="addresses-grid">
                        {getParsedAddresses().map((addr: any) => (
                          <div 
                            key={addr.id} 
                            className={`address-card ${addr.is_default ? 'default-address' : ''}`}
                            style={{ 
                              border: '1px solid var(--color-border)', 
                              borderRadius: '6px', 
                              padding: '1.25rem', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              justifyContent: 'space-between',
                              backgroundColor: 'var(--color-bg)',
                              position: 'relative'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <span className="address-card-badge type">
                                  {addr.address_type || 'Home'}
                                </span>
                                {addr.is_default && (
                                  <span className="address-card-badge default">
                                    Default
                                  </span>
                                )}
                              </div>

                              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>{addr.recipient_name}</h3>
                              {addr.phone && <p style={{ fontSize: '0.85rem', color: 'var(--color-gray)', margin: '0 0 0.5rem 0' }}>📞 {addr.phone}</p>}
                              <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', margin: '0 0 0.25rem 0', lineHeight: '1.4' }}>{addr.street_address}</p>
                              <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', margin: 0 }}>
                                {addr.city}, {addr.state ? `${addr.state}, ` : ''}{addr.postal_code}
                              </p>
                              <p style={{ fontSize: '0.85rem', color: 'var(--color-gray)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {addr.country || 'India'}
                              </p>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--color-border)', marginTop: '1.25rem', paddingTop: '1.0rem', alignItems: 'center' }}>
                              <button 
                                onClick={() => startEditingAddress(addr)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--color-text)',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  padding: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <Edit3 size={12} /> Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteAddress(addr.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#d32f2f',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  padding: 0
                                }}
                              >
                                Delete
                              </button>
                              {!addr.is_default && (
                                <button 
                                  onClick={() => handleSetDefaultAddress(addr.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-accent)',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    padding: 0,
                                    marginLeft: 'auto'
                                  }}
                                >
                                  Set Default
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        <div 
                          onClick={startAddingAddress}
                          className="address-card"
                          style={{ 
                            border: '1px dashed var(--color-border)', 
                            borderRadius: '6px', 
                            padding: '2rem 1.25rem', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            minHeight: '180px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Plus size={24} style={{ color: 'var(--color-gray)', marginBottom: '0.5rem' }} />
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>Add New Address</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-gray)', marginTop: '0.25rem' }}>Save another shipping location</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="info-note" style={{ marginTop: '2rem' }}>
                  <p>💡 Your saved addresses will be available as quick select autofill suggestions during checkout.</p>
                </div>
              </>
            )}

            {/* ===== SECURITY ===== */}
            {activeSection === 'security' && (
              <>
                <h2 className="section-heading">Account Security</h2>

                <div className="form-card">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Change Password</h3>
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <label className="form-label">New Password
                      <div className="password-input-wrap">
                        <input type={showPassword ? 'text' : 'password'} value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="form-input" placeholder="Min. 6 characters" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                      </div>
                    </label>
                    <label className="form-label">Confirm New Password
                      <input type={showPassword ? 'text' : 'password'} value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="form-input" placeholder="Re-enter new password" />
                    </label>
                  </div>
                  <div className="form-actions">
                    <button onClick={handleChangePassword} disabled={changingPassword || !passwordForm.newPassword} className="btn btn-primary">{changingPassword ? 'Updating...' : 'Update Password'}</button>
                  </div>
                </div>

                <div className="form-card" style={{ marginTop: '2rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Account Information</h3>
                  <div className="info-grid" style={{ marginTop: '1rem' }}>
                    <div className="info-item">
                      <span className="info-label">Account Email</span>
                      <span className="info-value">{user.email}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Account ID</span>
                      <span className="info-value" style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{user.id.split('-')[0]}...</span>
                    </div>
                  </div>
                </div>

                <div className="danger-zone">
                  <h3>Danger Zone</h3>
                  <p>Once you delete your account, there is no going back. Please be certain.</p>
                  <button className="btn-danger" onClick={() => alert('Please contact support to delete your account.')}>Delete Account</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAccount;
