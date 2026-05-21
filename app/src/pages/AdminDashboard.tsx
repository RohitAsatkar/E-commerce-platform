import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../lib/useProducts';
import { getProductCurrency } from '../lib/currency';
import { 
  Search, Filter, X, LogOut, 
  TrendingUp, ShoppingBag, Box, Clock, CheckCircle, 
  AlertCircle, Eye, RefreshCw, Plus, Trash2, ArrowUp, ArrowDown, Globe, Calendar, Compass, Sparkles,
  Monitor, Tablet, Smartphone, Maximize2, Minimize2
} from 'lucide-react';
import './AdminDashboard.css';
import './Home.css';

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
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
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'cms' | 'marketing'>('overview');
  
  // ==========================================
  // CMS & MARKETING STATE DEFINITIONS
  // ==========================================
  const [cmsSubTab, setCmsSubTab] = useState<'visual' | 'static' | 'navigation' | 'media'>('visual');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
  const [cmsPageConfig, setCmsPageConfig] = useState<any>({
    page_id: "homepage_global",
    title: "Main Storefront Homepage",
    slug: "index",
    status: "published",
    seo: {
      meta_title: "AURA | The Art of Minimalist Luxury",
      meta_description: "Discover a curated standard of minimalist apparel. Crafted for those who appreciate understated elegance and architectural lines.",
      open_graph_image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1200"
    },
    blocks: [
      {
        id: "block_hero_01",
        block_type: "HeroBanner",
        order: 1,
        status: "published",
        scheduling: { start_date: "", end_date: "" },
        data: {
          layout: "split",
          title: "AURA / THE NEW MINIMAL",
          subtitle: "FALL / WINTER COLLECTION",
          description: "Discover the new standard of minimalist luxury apparel. Crafted for those who appreciate understated elegance and timeless silhouette.",
          cta_text: "VIEW ALL",
          cta_url: "/shop/all",
          secondary_cta_text: "SHOP ACCESSORIES",
          secondary_cta_url: "/shop/accessories",
          desktop_image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1200",
          mobile_image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600"
        }
      },
      {
        id: "block_promo_slider_01",
        block_type: "PromotionalSlider",
        order: 2,
        status: "published",
        scheduling: { start_date: "", end_date: "" },
        data: {
          variant: "flash_sale_countdown",
          background_color: "#0c0a09",
          countdown_target_timestamp: "2026-06-25T23:59:59Z",
          slides: [{ text: "Mid-Season Preview: Code 'AURA10' for private 10% off.", link_url: "/shop/new" }]
        }
      },
      {
        id: "block_brand_story_01",
        block_type: "BrandStory",
        order: 3,
        status: "published",
        scheduling: { start_date: "", end_date: "" },
        data: {
          subtitle: "OUR ESSENCE",
          title: "THE ART OF SIMPLICITY",
          description: "We believe in architectural silhouettes, pure fabrics, and a curated color palette that brings calm to the wardrobe. Every item is created with meticulous attention to detail.",
          quote: "Simplicity is not the lack of clutter, but the presence of clarity.",
          image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600"
        }
      },
      {
        id: "block_cat_grid_01",
        block_type: "CategoryGrid",
        order: 4,
        status: "published",
        scheduling: { start_date: "", end_date: "" },
        data: {
          title: "Curated Categories",
          categories: [
            { name: "Shirts", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=300" },
            { name: "T-Shirts", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=300" },
            { name: "POLO", image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=300" },
            { name: "Jeans", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=300" },
            { name: "Trousers", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=300" },
            { name: "LINEN", image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=300" },
            { name: "Cargo pants", image: "https://images.unsplash.com/photo-1517423568366-8b83523034fd?auto=format&fit=crop&q=80&w=300" },
            { name: "Joggers", image: "https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&q=80&w=300" },
            { name: "SHORTS", image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=300" },
            { name: "Overshirts", image: "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&q=80&w=300" },
            { name: "Footwear", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=300" }
          ]
        }
      },
      {
        id: "block_editorial_gallery_01",
        block_type: "EditorialGallery",
        order: 5,
        status: "published",
        scheduling: { start_date: "", end_date: "" },
        data: {
          title: "SEASONAL CAPTURES",
          subtitle: "FALL LOOKBOOK HIGHLIGHTS",
          image1: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=600",
          image2: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600",
          image3: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=600"
        }
      },
      {
        id: "block_news_01",
        block_type: "NewsletterSubscribe",
        order: 6,
        status: "published",
        scheduling: { start_date: "", end_date: "" },
        data: {
          title: "JOIN THE DIALOGUE",
          subtitle: "Receive seasonal lookbooks, private previews, and stories about craft directly to your inbox.",
          button_text: "SUBSCRIBE",
          placeholder_text: "ENTER YOUR EMAIL ADDRESS"
        }
      }
    ]
  });
  const [selectedBlockId, setSelectedBlockId] = useState<string>("block_hero_01");

  // Navigation state
  const [navMenus, setNavMenus] = useState<any>({
    header: [
      { id: "nav_1", label: "New Arrivals", url: "/shop/new", badge: "New" },
      { id: "nav_2", label: "View All", url: "/shop/all", badge: "" },
      { id: "nav_3", label: "Our Story", url: "/story", badge: "" }
    ],
    footer: [
      { id: "foot_1", label: "FAQ", url: "/faq" },
      { id: "foot_2", label: "Shipping & Returns", url: "/shipping" },
      { id: "foot_3", label: "Size Guide", url: "/size-guide" }
    ]
  });
  
  // Media state
  const [mediaFiles, setMediaFiles] = useState<any[]>([
    { id: "med_1", name: "hero-desktop.webp", url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600", tag: "banner", size: "240 KB", type: "image/webp" },
    { id: "med_2", name: "minimalist-jacket.webp", url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=600", tag: "product", size: "180 KB", type: "image/webp" },
    { id: "med_3", name: "silver-watch.webp", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600", tag: "product", size: "125 KB", type: "image/webp" }
  ]);
  const [mediaSearch, setMediaSearch] = useState("");
  const [webpQuality, setWebpQuality] = useState(80);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  // Marketing sub-tab
  const [marketingSubTab, setMarketingSubTab] = useState<'promotions' | 'flash_sale' | 'workflows'>('promotions');
  const [promotionsList, setPromotionsList] = useState<any[]>([
    { id: "promo_1", code: "STUDIO26", type: "Percentage", value: 20, limit: 100, singleUse: true, minThreshold: 150, status: "Active" },
    { id: "promo_2", code: "FREESHIP", type: "Free Shipping", value: 0, limit: 500, singleUse: false, minThreshold: 50, status: "Active" }
  ]);
  const [newPromoForm, setNewPromoForm] = useState({
    code: "", type: "Percentage", value: 0, limit: 100, singleUse: false, minThreshold: 0
  });

  // Global Flash Sale state
  const [flashSaleActive, setFlashSaleActive] = useState(false);
  const [flashSalePercentage, setFlashSalePercentage] = useState(15);
  const [flashSaleCountdown, setFlashSaleCountdown] = useState("2026-05-25T23:59:59Z");

  // Automation triggers
  const [automationRules, setAutomationRules] = useState<any[]>([
    { id: "auto_1", event: "cart_abandoned", action: "Send Coupon", payload: '{"discount_code": "RETRIEVED10"}', webhook: "https://api.marketing.aura/v1/abandoned-cart" },
    { id: "auto_2", event: "user_signup", action: "Trigger Welcome Series", payload: '{"campaign_id": "welcome_2026"}', webhook: "https://api.marketing.aura/v1/signup" }
  ]);
  const [newAutomation, setNewAutomation] = useState({
    event: "cart_abandoned", action: "Webhook Delivery", payload: '{"message": "Action payload"}', webhook: ""
  });

  // WYSIWYG / Static pages manager state
  const [staticPages, setStaticPages] = useState<any[]>([
    { id: "page_faq", title: "Frequently Asked Questions", slug: "faq", content: "<h2>Shipping & Delivery</h2><p>Standard shipping takes 3-5 business days.</p>" },
    { id: "page_terms", title: "Terms of Service", slug: "terms", content: "<h2>Terms & Conditions</h2><p>Please review our policy guidelines before placing orders.</p>" }
  ]);
  const [selectedStaticPageId, setSelectedStaticPageId] = useState<string>("page_faq");
  
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
    stock: 100, sku: '', tags: '', currency: 'INR'
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
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  
  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  
  useEffect(() => {
    const checkAdmin = async () => {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setIsAdmin(true);
        fetchOrders();
        setCheckingRole(false);
        return;
      }

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
        currency: product.variants?.[0]?.currency || 'INR'
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
      setProductForm({ name: '', price: 0, category: 'men', is_new: false, image: '', description: '', stock: 100, sku: '', tags: '', currency: 'INR' });
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
        finalImageUrl = await uploadImage(imageFile);
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

  // ==========================================
  // CMS HELPERS
  // ==========================================
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const blocks = [...cmsPageConfig.blocks];
    if (direction === 'up' && index > 0) {
      const temp = blocks[index];
      blocks[index] = blocks[index - 1];
      blocks[index - 1] = temp;
    } else if (direction === 'down' && index < blocks.length - 1) {
      const temp = blocks[index];
      blocks[index] = blocks[index + 1];
      blocks[index + 1] = temp;
    }
    const updated = blocks.map((b, i) => ({ ...b, order: i + 1 }));
    setCmsPageConfig({ ...cmsPageConfig, blocks: updated });
    showToast("Block order updated");
  };

  const handleUpdateBlockData = (blockId: string, field: string, value: any) => {
    const updated = cmsPageConfig.blocks.map((b: any) => {
      if (b.id === blockId) {
        return {
          ...b,
          data: { ...b.data, [field]: value }
        };
      }
      return b;
    });
    setCmsPageConfig({ ...cmsPageConfig, blocks: updated });
  };

  const handleUpdateBlockScheduling = (blockId: string, field: string, value: any) => {
    const updated = cmsPageConfig.blocks.map((b: any) => {
      if (b.id === blockId) {
        return {
          ...b,
          scheduling: { ...b.scheduling, [field]: value }
        };
      }
      return b;
    });
    setCmsPageConfig({ ...cmsPageConfig, blocks: updated });
  };

  const handleDeleteBlock = (blockId: string) => {
    if (window.confirm("Delete this layout block?")) {
      const filtered = cmsPageConfig.blocks.filter((b: any) => b.id !== blockId);
      const reordered = filtered.map((b: any, i: number) => ({ ...b, order: i + 1 }));
      setCmsPageConfig({ ...cmsPageConfig, blocks: reordered });
      if (selectedBlockId === blockId && reordered.length > 0) {
        setSelectedBlockId(reordered[0].id);
      }
      showToast("Block deleted successfully");
    }
  };

  const handleAddBlock = (type: string) => {
    const newId = `block_${type.toLowerCase()}_${Date.now()}`;
    let defaultData = {};
    if (type === 'HeroBanner') {
      defaultData = {
        layout: "split",
        title: "AURA / THE NEW MINIMAL",
        subtitle: "FALL / WINTER COLLECTION",
        description: "Discover the new standard of minimalist luxury apparel. Crafted for those who appreciate understated elegance and timeless silhouette.",
        cta_text: "VIEW ALL",
        cta_url: "/shop/all",
        secondary_cta_text: "SHOP ACCESSORIES",
        secondary_cta_url: "/shop/accessories",
        desktop_image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1200",
        mobile_image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600"
      };
    } else if (type === 'PromotionalSlider') {
      defaultData = {
        variant: "flash_sale_countdown",
        background_color: "#0c0a09",
        countdown_target_timestamp: "2026-06-25T23:59:59Z",
        slides: [{ text: "Mid-Season Preview: Code 'AURA10' for private 10% off.", link_url: "/shop/new" }]
      };
    } else if (type === 'CategoryGrid') {
      defaultData = {
        title: "Curated Categories",
        categories: [
          { name: "Shirts", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=300" },
          { name: "T-Shirts", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=300" },
          { name: "POLO", image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=300" },
          { name: "Jeans", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=300" }
        ]
      };
    } else if (type === 'FeaturedProducts') {
      defaultData = {
        title: "Weekly Curations",
        cta_text: "Shop Curations",
        cta_url: "/shop/all",
        limit: 4
      };
    } else if (type === 'BrandStory') {
      defaultData = {
        subtitle: "OUR ESSENCE",
        title: "THE ART OF SIMPLICITY",
        description: "We believe in architectural silhouettes, pure fabrics, and a curated color palette that brings calm to the wardrobe.",
        quote: "Simplicity is not the lack of clutter, but the presence of clarity.",
        image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600"
      };
    } else if (type === 'EditorialGallery') {
      defaultData = {
        title: "SEASONAL CAPTURES",
        subtitle: "FALL LOOKBOOK HIGHLIGHTS",
        image1: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=600",
        image2: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600",
        image3: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=600"
      };
    } else if (type === 'NewsletterSubscribe') {
      defaultData = {
        title: "JOIN THE DIALOGUE",
        subtitle: "Receive seasonal lookbooks, private previews, and stories about craft directly to your inbox.",
        button_text: "SUBSCRIBE",
        placeholder_text: "ENTER YOUR EMAIL ADDRESS"
      };
    } else if (type === 'Spacer') {
      defaultData = {
        height: 60
      };
    }

    const newBlock = {
      id: newId,
      block_type: type,
      order: cmsPageConfig.blocks.length + 1,
      status: "draft",
      scheduling: { start_date: "", end_date: "" },
      data: defaultData
    };

    setCmsPageConfig({
      ...cmsPageConfig,
      blocks: [...cmsPageConfig.blocks, newBlock]
    });
    setSelectedBlockId(newId);
    showToast(`Added ${type} Block`);
  };

  const handleUpdateSeo = (field: string, value: string) => {
    setCmsPageConfig({
      ...cmsPageConfig,
      seo: {
        ...cmsPageConfig.seo,
        [field]: value
      }
    });
  };

  const handleSaveCmsConfig = () => {
    // Persist configuration locally to sync with storefront page
    localStorage.setItem('aura_cms_homepage', JSON.stringify(cmsPageConfig));
    showToast("CMS configurations synced to store storefront!");
  };

  // ==========================================
  // MARKETING HELPERS
  // ==========================================
  const handleAddPromo = (e: FormEvent) => {
    e.preventDefault();
    if (!newPromoForm.code) {
      showToast("Coupon code required", "error");
      return;
    }
    const newPromo = {
      id: `promo_${Date.now()}`,
      code: newPromoForm.code.toUpperCase(),
      type: newPromoForm.type,
      value: Number(newPromoForm.value),
      limit: Number(newPromoForm.limit),
      singleUse: newPromoForm.singleUse,
      minThreshold: Number(newPromoForm.minThreshold),
      status: "Active"
    };
    setPromotionsList([newPromo, ...promotionsList]);
    setNewPromoForm({
      code: "", type: "Percentage", value: 0, limit: 100, singleUse: false, minThreshold: 0
    });
    showToast(`Promo ${newPromo.code} created!`);
  };

  const handleDeletePromo = (id: string) => {
    if (window.confirm("Delete this promo code?")) {
      setPromotionsList(promotionsList.filter(p => p.id !== id));
      showToast("Promo deleted");
    }
  };

  const handleTogglePromo = (id: string) => {
    setPromotionsList(promotionsList.map(p => {
      if (p.id === id) {
        return { ...p, status: p.status === 'Active' ? 'Inactive' : 'Active' };
      }
      return p;
    }));
    showToast("Promo status updated");
  };

  const handleSaveFlashSale = () => {
    showToast(`Global flash sale ${flashSaleActive ? 'Activated' : 'Deactivated'}!`);
  };

  const handleAddAutomation = (e: FormEvent) => {
    e.preventDefault();
    if (!newAutomation.webhook) {
      showToast("Webhook endpoint required", "error");
      return;
    }
    try {
      JSON.parse(newAutomation.payload);
    } catch(err) {
      showToast("Invalid JSON payload structure", "error");
      return;
    }
    const item = {
      id: `auto_${Date.now()}`,
      event: newAutomation.event,
      action: "Webhook Delivery",
      payload: newAutomation.payload,
      webhook: newAutomation.webhook
    };
    setAutomationRules([item, ...automationRules]);
    setNewAutomation({
      event: "cart_abandoned", action: "Webhook Delivery", payload: '{"message": "Action payload"}', webhook: ""
    });
    showToast("Automation trigger registered");
  };

  const handleDeleteAutomation = (id: string) => {
    if (window.confirm("Remove this automation trigger?")) {
      setAutomationRules(automationRules.filter(a => a.id !== id));
      showToast("Automation trigger deleted");
    }
  };

  // WYSIWYG Editor Mock Helpers
  const handleSaveStaticPage = (id: string, updatedContent: string) => {
    setStaticPages(staticPages.map(page => {
      if (page.id === id) {
        return { ...page, content: updatedContent };
      }
      return page;
    }));
    showToast("Static content changes saved!");
  };

  // Media Optimization Mock Helpers
  const handleMediaUploadSimulation = (file: File) => {
    const optimizedSize = `${Math.round(file.size * (webpQuality / 100) / 1024)} KB`;
    const newMedia = {
      id: `med_${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, "") + ".webp",
      url: URL.createObjectURL(file),
      tag: "user-upload",
      size: optimizedSize,
      type: "image/webp"
    };
    setMediaFiles([newMedia, ...mediaFiles]);
    showToast(`Uploaded and optimized to WebP (${webpQuality}% Quality)!`);
  };

  const handleDeleteMedia = (id: string) => {
    if (window.confirm("Remove asset from media library?")) {
      setMediaFiles(mediaFiles.filter(m => m.id !== id));
      if (selectedMedia?.id === id) setSelectedMedia(null);
      showToast("Asset deleted");
    }
  };
  
  // Navigation helpers
  const handleUpdateNavBadge = (menu: 'header' | 'footer', index: number, badge: string) => {
    const updated = { ...navMenus };
    updated[menu][index].badge = badge;
    setNavMenus(updated);
    showToast("Menu badge updated");
  };

  const handleMoveNavItem = (menu: 'header' | 'footer', index: number, direction: 'up' | 'down') => {
    const updated = { ...navMenus };
    const items = [...updated[menu]];
    if (direction === 'up' && index > 0) {
      const temp = items[index];
      items[index] = items[index - 1];
      items[index - 1] = temp;
    } else if (direction === 'down' && index < items.length - 1) {
      const temp = items[index];
      items[index] = items[index + 1];
      items[index + 1] = temp;
    }
    updated[menu] = items;
    setNavMenus(updated);
    showToast("Navigation order updated");
  };

  const handleAddNavItem = (menu: 'header' | 'footer', label: string, url: string) => {
    if (!label || !url) return;
    const updated = { ...navMenus };
    updated[menu] = [...updated[menu], {
      id: `nav_add_${Date.now()}`,
      label,
      url,
      badge: ""
    }];
    setNavMenus(updated);
    showToast("Navigation link added");
  };

  const handleDeleteNavItem = (menu: 'header' | 'footer', id: string) => {
    const updated = { ...navMenus };
    updated[menu] = updated[menu].filter((item: any) => item.id !== id);
    setNavMenus(updated);
    showToast("Navigation link deleted");
  };


  const renderImageUploadField = (blockId: string, label: string, value: string, fieldName: string) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <span style={{ fontWeight: '600', color: 'var(--color-text)', fontSize: '0.8rem' }}>{label}</span>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', border: '1px solid var(--color-border)', padding: '0.5rem', borderRadius: '2px', backgroundColor: 'rgba(0,0,0,0.01)' }}>
          {value && (
            <img src={value} alt="Thumb" style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '2px', border: '1px solid var(--color-border)' }} />
          )}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  handleUpdateBlockData(blockId, fieldName, url);
                }
              }}
              style={{ fontSize: '0.75rem', maxWidth: '100%' }}
            />
            <input 
              type="text" 
              value={value || ''} 
              placeholder="Or paste image URL"
              onChange={e => handleUpdateBlockData(blockId, fieldName, e.target.value)}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderVisualBlocks = () => {
    return (
      <div className="home-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0', pointerEvents: 'none', width: '100%' }}>
        {cmsPageConfig.blocks.map((block: any) => {
          const isSelected = block.id === selectedBlockId;
          const isScheduled = block.scheduling.start_date || block.scheduling.end_date;
          
          const widthClass = block.data.sectionWidth ? `width-${block.data.sectionWidth}` : 'width-standard';
          const padClass = block.data.sectionPadding ? `pad-${block.data.sectionPadding}` : 'pad-editorial';
          const themeClass = block.data.themeStyle ? `theme-${block.data.themeStyle}` : 'theme-light';
          const alignClass = block.data.textAlign ? `align-${block.data.textAlign}` : 'align-left';
          const gapClass = block.data.columnGap ? `gap-${block.data.columnGap}` : 'gap-standard';
          const hoverClass = block.data.hoverAnimation ? `hover-${block.data.hoverAnimation}` : 'hover-zoom';

          const parallaxStyle = (block.data.parallaxBg && block.data.layout !== 'split' && block.data.desktop_image) ? {
            backgroundAttachment: 'fixed',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover'
          } : {};

          let blockContent = null;

          if (block.block_type === 'HeroBanner') {
            const isSplit = block.data.layout === 'split';
            blockContent = (
              <section className={`cms-hero ${padClass} ${themeClass} ${alignClass}`} style={parallaxStyle as React.CSSProperties}>
                <div className={widthClass}>
                  {isSplit ? (
                    <div className="cms-hero-split" style={{ border: '1px solid var(--color-border)' }}>
                      <div className="cms-hero-left" style={{
                        '--hero-padding-desktop': block.data.sectionWidth === 'narrow' ? '4rem 3rem' : '8rem 6rem'
                      } as React.CSSProperties}>
                        {block.data.subtitle && (
                          <span className="cms-hero-subtitle">
                            {block.data.subtitle}
                          </span>
                        )}
                        <h1 className="cms-hero-title">
                          {block.data.title || 'AURA'}
                        </h1>
                        {block.data.description && (
                          <p className="cms-hero-description">
                            {block.data.description}
                          </p>
                        )}
                        <div className="cms-hero-actions" style={{ justifyContent: block.data.textAlign === 'center' ? 'center' : block.data.textAlign === 'right' ? 'flex-end' : 'flex-start' }}>
                          {block.data.cta_text && (
                            <button className="editorial-btn-primary" style={{ border: 'none', cursor: 'pointer' }}>
                              {block.data.cta_text}
                            </button>
                          )}
                          {block.data.secondary_cta_text && (
                            <button className="editorial-btn-secondary" style={{ border: 'none', cursor: 'pointer' }}>
                              {block.data.secondary_cta_text}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="cms-hero-right">
                        {block.data.desktop_image ? (
                          <img 
                            src={block.data.desktop_image} 
                            alt={block.data.title || 'Campaign'} 
                            className="cms-hero-img"
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', backgroundColor: '#e5e5e5', color: '#a1a1aa', fontSize: '0.8rem' }}>No Image Selected</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="cms-hero-full" style={{ backgroundImage: block.data.desktop_image ? `url(${block.data.desktop_image})` : 'none', minHeight: block.data.sectionPadding === 'compact' ? '50vh' : '85vh', ...parallaxStyle }}>
                      {block.data.desktop_image && <div className="cms-hero-full-overlay"></div>}
                      <div className="cms-hero-full-content">
                        {block.data.subtitle && (
                          <span className="cms-hero-subtitle">
                            {block.data.subtitle}
                          </span>
                        )}
                        <h1 className="cms-hero-full-title">
                          {block.data.title || 'AURA'}
                        </h1>
                        {block.data.description && (
                          <p className="cms-hero-full-description">
                            {block.data.description}
                          </p>
                        )}
                        <div className="cms-hero-actions" style={{ justifyContent: 'center' }}>
                          {block.data.cta_text && (
                            <button className="editorial-btn-primary" style={{ border: 'none', cursor: 'pointer' }}>
                              {block.data.cta_text}
                            </button>
                          )}
                          {block.data.secondary_cta_text && (
                            <button className="editorial-btn-secondary" style={{ border: 'none', cursor: 'pointer' }}>
                              {block.data.secondary_cta_text}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          } else if (block.block_type === 'PromotionalSlider') {
            blockContent = (
              <div style={{ backgroundColor: block.data.background_color || '#0c0a09', color: '#fff', padding: '1.25rem 2rem', textAlign: 'center', fontSize: '0.85rem', letterSpacing: '0.08em', fontFamily: '"Outfit", sans-serif', zIndex: 10 }}>
                <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem' }}>
                  <Sparkles size={14} style={{ color: '#c5a880' }} />
                  <span>{block.data.slides?.[0]?.text}</span>
                </div>
              </div>
            );
          } else if (block.block_type === 'CategoryGrid') {
            blockContent = (
              <section className={`cms-cat-section ${padClass} ${themeClass} ${alignClass}`}>
                <div className={`container ${widthClass}`}>
                  <h2 className="featured-cat-title">
                    {block.data.title || 'Curated Categories'}
                  </h2>
                  <div className={`cms-cat-grid ${gapClass} ${hoverClass}`} style={{ '--grid-cols': block.data.gridColumns || 4 } as React.CSSProperties}>
                    {(block.data.categories || []).map((cat: any, cIdx: number) => {
                      const catObj = typeof cat === 'string' ? { name: cat, image: '' } : cat;
                      return (
                        <div 
                          key={cIdx} 
                          className={`cms-cat-card aspect-${block.data.aspectRatio || 'portrait'}`}
                          style={{ 
                            backgroundImage: catObj.image ? `url(${catObj.image})` : 'none',
                            backgroundColor: catObj.image ? 'transparent' : '#f5f5f4'
                          }}
                        >
                          {catObj.image && <div className="cms-cat-overlay"></div>}
                          <span className="cms-cat-name">
                            {catObj.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          } else if (block.block_type === 'FeaturedProducts') {
            const displayLimit = block.data.limit || 4;
            const displayList = products.slice(0, displayLimit);
            blockContent = (
              <section className={`section new-arrivals ${padClass} ${themeClass} ${alignClass}`}>
                <div className={`container ${widthClass}`}>
                  <div className="section-header mb-8" style={{ display: 'flex', flexDirection: 'column', alignItems: block.data.textAlign === 'center' ? 'center' : block.data.textAlign === 'right' ? 'flex-end' : 'flex-start', gap: '0.5rem' }}>
                    <h2 className="section-title" style={{ margin: 0 }}>
                      {block.data.title || 'Curated Classics'}
                    </h2>
                    <span className="view-all-link">
                      {block.data.cta_text || 'View All Collection'}
                    </span>
                  </div>
                  
                  <div className={`product-grid ${gapClass} ${hoverClass}`} style={{ '--grid-cols': block.data.gridColumns || 4 } as React.CSSProperties}>
                    {displayList.map((product) => (
                      <div key={product.id} className="product-card">
                        <div className={`product-image-wrap aspect-${block.data.aspectRatio || 'portrait'}`} style={{ overflow: 'hidden', backgroundColor: '#f4f4f5', position: 'relative' }}>
                          <img src={product.image} alt={product.name} className="product-image" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {product.is_new && <span className="badge-new">New</span>}
                          <div className="product-quick-add">Quick View</div>
                        </div>
                        <div className="product-info" style={{ marginTop: '1rem' }}>
                          <span className="product-category">
                            {product.category.toUpperCase().replace('-', ' ')}
                          </span>
                          <h3 className="product-name">{product.name}</h3>
                          <p className="product-price">{getProductCurrency(product)}{product.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          } else if (block.block_type === 'BrandStory') {
            blockContent = (
              <section className={`cms-story ${padClass} ${themeClass} ${alignClass}`}>
                <div className={`cms-story-grid ${widthClass}`}>
                  <div className="cms-story-left">
                    {block.data.subtitle && (
                      <span className="cms-story-subtitle">{block.data.subtitle}</span>
                    )}
                    <h2 className="cms-story-title">{block.data.title || 'Brand Story'}</h2>
                    {block.data.quote && (
                      <blockquote className="cms-story-quote">
                        "{block.data.quote}"
                      </blockquote>
                    )}
                    {block.data.description && (
                      <p className="cms-story-description">{block.data.description}</p>
                    )}
                  </div>
                  <div className="cms-story-right">
                    {block.data.image && (
                      <img src={block.data.image} alt="Story" className="cms-story-img" />
                    )}
                  </div>
                </div>
              </section>
            );
          } else if (block.block_type === 'EditorialGallery') {
            blockContent = (
              <section className={`cms-gallery ${padClass} ${themeClass} ${alignClass}`}>
                <div className={`container ${widthClass}`}>
                  <div style={{ textAlign: block.data.textAlign || 'center', marginBottom: '3.5rem' }}>
                    {block.data.subtitle && (
                      <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: '0.8rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--color-accent)', fontWeight: 600 }}>{block.data.subtitle}</span>
                    )}
                    <h3 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '2.5rem', fontWeight: 500, margin: '0.5rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{block.data.title || 'Editorial Gallery'}</h3>
                  </div>
                  <div className={`cms-gallery-grid ${gapClass} ${hoverClass}`} style={{ '--grid-cols': block.data.gridColumns || 3 } as React.CSSProperties}>
                    <div className={`cms-gallery-item aspect-${block.data.aspectRatio || 'portrait'}`}>
                      {block.data.image1 && <img src={block.data.image1} alt="Lookbook 1" className="cms-gallery-img" />}
                    </div>
                    <div className={`cms-gallery-item aspect-${block.data.aspectRatio || 'portrait'}`}>
                      {block.data.image2 && <img src={block.data.image2} alt="Lookbook 2" className="cms-gallery-img" />}
                    </div>
                    <div className={`cms-gallery-item aspect-${block.data.aspectRatio || 'portrait'}`}>
                      {block.data.image3 && <img src={block.data.image3} alt="Lookbook 3" className="cms-gallery-img" />}
                    </div>
                  </div>
                </div>
              </section>
            );
          } else if (block.block_type === 'NewsletterSubscribe') {
            blockContent = (
              <section className={`cms-news ${padClass} ${themeClass} ${alignClass}`}>
                <div className={widthClass} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <h3 className="cms-news-title">{block.data.title || 'JOIN THE CLUB'}</h3>
                  {block.data.subtitle && (
                    <p className="cms-news-subtitle">{block.data.subtitle}</p>
                  )}
                  <div className="cms-news-form">
                    <input type="email" placeholder={block.data.placeholder_text || 'Enter email'} disabled className="cms-news-input" />
                    <button type="button" className="cms-news-btn" style={{ cursor: 'default' }}>
                      {block.data.button_text || 'Subscribe'}
                    </button>
                  </div>
                </div>
              </section>
            );
          } else if (block.block_type === 'Spacer') {
            blockContent = (
              <div style={{ height: `${block.data.height || 60}px` }} />
            );
          }

          return (
            <div 
              key={block.id} 
              onClick={(e) => { e.stopPropagation(); setSelectedBlockId(block.id); }} 
              style={{ 
                border: `2px ${isSelected ? 'solid var(--color-text)' : 'dashed var(--color-border)'}`, 
                position: 'relative', 
                cursor: 'pointer',
                margin: '0.5rem 0',
                transition: 'all 0.15s' 
              }}
            >
              <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.35rem', alignItems: 'center', zIndex: 100 }}>
                {isScheduled && <span style={{ fontSize: '0.6rem', backgroundColor: '#eab308', color: '#000', padding: '0.15rem 0.35rem', fontWeight: '700', borderRadius: '2px' }}>Scheduled</span>}
                <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--color-text)', color: 'var(--color-bg)', padding: '0.15rem 0.35rem', fontWeight: '700', textTransform: 'uppercase' }}>{block.block_type}</span>
              </div>
              {blockContent}
            </div>
          );
        })}
      </div>
    );
  };

  const renderBlockLayoutSettings = (block: any) => {
    const currentWidth = block.data.sectionWidth || 'standard';
    const currentPadding = block.data.sectionPadding || 'editorial';
    const currentColumns = block.data.gridColumns || 4;
    const currentAspectRatio = block.data.aspectRatio || 'portrait';
    const currentAlign = block.data.textAlign || 'left';
    const currentTheme = block.data.themeStyle || 'light';
    const currentGap = block.data.columnGap || 'standard';
    const currentHover = block.data.hoverAnimation || 'zoom';
    const currentParallax = block.data.parallaxBg || false;

    return (
      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem', marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Globe size={13} style={{ color: 'var(--color-accent)' }} /> 
          <span>Sizing & Layout Settings</span>
        </div>

        {/* Section Width Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-gray)' }}>Width Constraint</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            {[
              { id: 'narrow', name: 'Narrow', desc: '800px max' },
              { id: 'standard', name: 'Standard', desc: '1200px max' },
              { id: 'full', name: 'Full-Width', desc: '100% Bleed' }
            ].map(opt => {
              const isSel = currentWidth === opt.id;
              return (
                <div 
                  key={opt.id}
                  onClick={() => handleUpdateBlockData(block.id, 'sectionWidth', opt.id)}
                  style={{
                    border: `1px solid ${isSel ? 'var(--color-text)' : 'var(--color-border)'}`,
                    padding: '0.5rem 0.25rem',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    backgroundColor: isSel ? 'var(--color-text)' : 'transparent',
                    color: isSel ? 'var(--color-bg)' : 'var(--color-text)',
                    transition: 'all 0.15s ease',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: '700' }}>{opt.name}</div>
                  <div style={{ fontSize: '0.55rem', opacity: 0.8 }}>{opt.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section Padding Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-gray)' }}>Vertical Spacing (Padding)</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            {[
              { id: 'compact', name: 'Compact', desc: 'Tight Spacing' },
              { id: 'editorial', name: 'Editorial', desc: 'Balanced' },
              { id: 'grand', name: 'Grand', desc: 'Expansive' }
            ].map(opt => {
              const isSel = currentPadding === opt.id;
              return (
                <div 
                  key={opt.id}
                  onClick={() => handleUpdateBlockData(block.id, 'sectionPadding', opt.id)}
                  style={{
                    border: `1px solid ${isSel ? 'var(--color-text)' : 'var(--color-border)'}`,
                    padding: '0.5rem 0.25rem',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    backgroundColor: isSel ? 'var(--color-text)' : 'transparent',
                    color: isSel ? 'var(--color-bg)' : 'var(--color-text)',
                    transition: 'all 0.15s ease',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: '700' }}>{opt.name}</div>
                  <div style={{ fontSize: '0.55rem', opacity: 0.8 }}>{opt.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Theme Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-gray)' }}>Color Theme Style</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {[
              { id: 'light', name: 'Light Minimal', desc: 'Clean White' },
              { id: 'dark', name: 'Noir Dark', desc: 'Deep Charcoal' },
              { id: 'glass', name: 'Glassmorphism', desc: 'Frosted Glass' },
              { id: 'accent', name: 'Warm Beige', desc: 'Luxury Accent' }
            ].map(opt => {
              const isSel = currentTheme === opt.id;
              return (
                <div 
                  key={opt.id}
                  onClick={() => handleUpdateBlockData(block.id, 'themeStyle', opt.id)}
                  style={{
                    border: `1px solid ${isSel ? 'var(--color-text)' : 'var(--color-border)'}`,
                    padding: '0.5rem 0.25rem',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    backgroundColor: isSel ? 'var(--color-text)' : 'transparent',
                    color: isSel ? 'var(--color-bg)' : 'var(--color-text)',
                    transition: 'all 0.15s ease',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: '700' }}>{opt.name}</div>
                  <div style={{ fontSize: '0.55rem', opacity: 0.8 }}>{opt.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Text Alignment Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-gray)' }}>Text Alignment</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            {[
              { id: 'left', name: 'Left' },
              { id: 'center', name: 'Center' },
              { id: 'right', name: 'Right' }
            ].map(opt => {
              const isSel = currentAlign === opt.id;
              return (
                <button 
                  key={opt.id}
                  type="button"
                  onClick={() => handleUpdateBlockData(block.id, 'textAlign', opt.id)}
                  style={{
                    border: `1px solid ${isSel ? 'var(--color-text)' : 'var(--color-border)'}`,
                    padding: '0.5rem 0',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    backgroundColor: isSel ? 'var(--color-text)' : 'transparent',
                    color: isSel ? 'var(--color-bg)' : 'var(--color-text)',
                    fontFamily: 'inherit'
                  }}
                >
                  {opt.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hero Specific Parallax Option */}
        {block.block_type === 'HeroBanner' && block.data.layout !== 'split' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text)' }}>
            <input 
              type="checkbox" 
              checked={currentParallax} 
              onChange={e => handleUpdateBlockData(block.id, 'parallaxBg', e.target.checked)} 
            />
            Enable Parallax Background Scroll Effect
          </label>
        )}

        {/* Grid specific options */}
        {['CategoryGrid', 'FeaturedProducts', 'EditorialGallery'].includes(block.block_type) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', borderTop: '1px dashed var(--color-border)', paddingTop: '0.85rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-gray)' }}>Desktop Columns</span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {[2, 3, 4, 5, 6].map(cols => {
                  const isSel = currentColumns === cols;
                  return (
                    <button
                      key={cols}
                      type="button"
                      onClick={() => handleUpdateBlockData(block.id, 'gridColumns', cols)}
                      style={{
                        flex: 1,
                        padding: '0.35rem 0',
                        border: `1px solid ${isSel ? 'var(--color-text)' : 'var(--color-border)'}`,
                        backgroundColor: isSel ? 'var(--color-text)' : 'transparent',
                        color: isSel ? 'var(--color-bg)' : 'var(--color-text)',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        borderRadius: '2px',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                    >
                      {cols}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-gray)' }}>Column Spacing (Gap)</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                {[
                  { id: 'compact', name: 'Compact', desc: 'Tight Grid' },
                  { id: 'standard', name: 'Standard', desc: 'Regular Spacing' },
                  { id: 'editorial', name: 'Editorial', desc: 'Spacious' }
                ].map(opt => {
                  const isSel = currentGap === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleUpdateBlockData(block.id, 'columnGap', opt.id)}
                      style={{
                        border: `1px solid ${isSel ? 'var(--color-text)' : 'var(--color-border)'}`,
                        padding: '0.4rem 0.25rem',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        backgroundColor: isSel ? 'var(--color-text)' : 'transparent',
                        color: isSel ? 'var(--color-bg)' : 'var(--color-text)',
                        transition: 'all 0.15s ease',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: '700' }}>{opt.name}</div>
                      <div style={{ fontSize: '0.55rem', opacity: 0.8 }}>{opt.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-gray)' }}>Card Hover Animation</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { id: 'none', name: 'None', desc: 'Static' },
                  { id: 'zoom', name: 'Zoom Image', desc: 'Scales inner img' },
                  { id: 'lift', name: 'Lift Card', desc: 'Translates up' },
                  { id: 'minimal', name: 'Minimal', desc: 'Border Highlight' }
                ].map(opt => {
                  const isSel = currentHover === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleUpdateBlockData(block.id, 'hoverAnimation', opt.id)}
                      style={{
                        border: `1px solid ${isSel ? 'var(--color-text)' : 'var(--color-border)'}`,
                        padding: '0.4rem 0.25rem',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        backgroundColor: isSel ? 'var(--color-text)' : 'transparent',
                        color: isSel ? 'var(--color-bg)' : 'var(--color-text)',
                        transition: 'all 0.15s ease',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: '700' }}>{opt.name}</div>
                      <div style={{ fontSize: '0.55rem', opacity: 0.8 }}>{opt.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-gray)' }}>Media Aspect Ratio</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                {[
                  { id: 'portrait', name: 'Portrait', ratio: '3:4' },
                  { id: 'square', name: 'Square', ratio: '1:1' },
                  { id: 'landscape', name: 'Landscape', ratio: '4:3' }
                ].map(opt => {
                  const isSel = currentAspectRatio === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleUpdateBlockData(block.id, 'aspectRatio', opt.id)}
                      style={{
                        border: `1px solid ${isSel ? 'var(--color-text)' : 'var(--color-border)'}`,
                        padding: '0.4rem 0.25rem',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        backgroundColor: isSel ? 'var(--color-text)' : 'transparent',
                        color: isSel ? 'var(--color-bg)' : 'var(--color-text)',
                        transition: 'all 0.15s ease',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: '700' }}>{opt.name}</div>
                      <div style={{ fontSize: '0.55rem', opacity: 0.8 }}>{opt.ratio}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


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
          <button onClick={() => setActiveTab('cms')} className={`admin-tab-button ${activeTab === 'cms' ? 'active' : ''}`}>CMS Content</button>
          <button onClick={() => setActiveTab('marketing')} className={`admin-tab-button ${activeTab === 'marketing' ? 'active' : ''}`}>Promotions & Marketing</button>
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
                <p className="admin-stat-value">₹{totalRevenue.toFixed(2)}</p>
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
                      const currencySymbol = prod ? getProductCurrency(prod) : '₹';

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
                    const symbol = firstVariant?.currency ? CURRENCIES.find(c => c.code === firstVariant.currency)?.symbol : '₹';
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
                <p className="admin-stat-value">₹{totalRevenue.toFixed(2)}</p>
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
                <p className="admin-stat-value">₹{avgOrderValue.toFixed(2)}</p>
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
                      const currencySymbol = prod ? getProductCurrency(prod) : '₹';

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

        {/* ================= CMS CONTENT MANAGEMENT TAB ================= */}
        {activeTab === 'cms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
            {/* CMS Sub-tabs */}
            <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
              {(['visual', 'static', 'navigation', 'media'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setCmsSubTab(tab)}
                  style={{
                    background: 'none', border: 'none', padding: '0.5rem 0', fontSize: '0.9rem', fontWeight: cmsSubTab === tab ? '700' : '400',
                    color: cmsSubTab === tab ? 'var(--color-text)' : 'var(--color-gray)', borderBottom: cmsSubTab === tab ? '2px solid var(--color-text)' : 'none',
                    cursor: 'pointer', transition: 'all 0.15s', textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}
                >
                  {tab === 'visual' ? 'Storefront Builder' : tab === 'static' ? 'Static & SEO' : tab === 'navigation' ? 'Global Navigation' : 'Media Library'}
                </button>
              ))}
            </div>

            {/* Visual Canvas (Split Screen Workspace) */}
            {cmsSubTab === 'visual' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Left Configurator */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', margin: 0 }}>Layout Blocks Stack</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select id="add-block-select" className="admin-select" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} defaultValue="HeroBanner">
                        <option value="HeroBanner">Hero Banner</option>
                        <option value="PromotionalSlider">Promo Bar</option>
                        <option value="CategoryGrid">Category Grid</option>
                        <option value="FeaturedProducts">Featured Products</option>
                        <option value="BrandStory">Brand Story</option>
                        <option value="EditorialGallery">Editorial Gallery</option>
                        <option value="NewsletterSubscribe">Newsletter Subscribe</option>
                        <option value="Spacer">Layout Spacer</option>
                      </select>
                      <button
                        onClick={() => {
                          const el = document.getElementById('add-block-select') as HTMLSelectElement;
                          if (el) handleAddBlock(el.value);
                        }}
                        className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}
                      >
                        <Plus size={14} /> Add Block
                      </button>
                    </div>
                  </div>

                  {/* List of blocks to edit */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {cmsPageConfig.blocks.map((block: any, idx: number) => {
                      const isSelected = block.id === selectedBlockId;
                      return (
                        <div
                          key={block.id}
                          style={{
                            border: `1px solid ${isSelected ? 'var(--color-text)' : 'var(--color-border)'}`,
                            borderRadius: '4px', padding: '1rem', backgroundColor: isSelected ? 'rgba(0,0,0,0.01)' : 'transparent',
                            display: 'flex', flexDirection: 'column', gap: '0.75rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div onClick={() => setSelectedBlockId(block.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                              <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>#{idx+1} {block.block_type}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-gray)' }}>({block.id})</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                              <button onClick={() => handleMoveBlock(idx, 'up')} disabled={idx === 0} style={{ border: 'none', background: 'transparent', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: 'var(--color-gray)' }}><ArrowUp size={14} /></button>
                              <button onClick={() => handleMoveBlock(idx, 'down')} disabled={idx === cmsPageConfig.blocks.length - 1} style={{ border: 'none', background: 'transparent', cursor: idx === cmsPageConfig.blocks.length - 1 ? 'not-allowed' : 'pointer', color: 'var(--color-gray)' }}><ArrowDown size={14} /></button>
                              <button onClick={() => handleDeleteBlock(block.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc2626', marginLeft: '0.5rem' }}><Trash2 size={14} /></button>
                            </div>
                          </div>

                          {isSelected && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.85rem', fontSize: '0.85rem' }}>
                              {/* Type specific fields */}
                              {block.block_type === 'HeroBanner' && (
                                <>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Title (e.g. AURA / THE NEW MINIMAL)
                                    <input type="text" value={block.data.title || ''} onChange={e => handleUpdateBlockData(block.id, 'title', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Subtitle (e.g. FALL / WINTER COLLECTION)
                                    <input type="text" value={block.data.subtitle || ''} onChange={e => handleUpdateBlockData(block.id, 'subtitle', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Description Paragraph
                                    <textarea rows={3} value={block.data.description || ''} onChange={e => handleUpdateBlockData(block.id, 'description', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', resize: 'vertical', fontFamily: 'inherit' }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Layout Variant
                                    <select value={block.data.layout || 'split'} onChange={e => handleUpdateBlockData(block.id, 'layout', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
                                      <option value="centered">Centered Fullscreen</option>
                                      <option value="split">50/50 Split Screen</option>
                                    </select>
                                  </label>
                                  {renderImageUploadField(block.id, 'Banner Image', block.data.desktop_image, 'desktop_image')}
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Primary CTA Button Text
                                    <input type="text" value={block.data.cta_text || ''} onChange={e => handleUpdateBlockData(block.id, 'cta_text', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Primary CTA Redirection URL
                                    <input type="text" value={block.data.cta_url || ''} onChange={e => handleUpdateBlockData(block.id, 'cta_url', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Secondary CTA Link Text
                                    <input type="text" value={block.data.secondary_cta_text || ''} onChange={e => handleUpdateBlockData(block.id, 'secondary_cta_text', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Secondary CTA Redirection URL
                                    <input type="text" value={block.data.secondary_cta_url || ''} onChange={e => handleUpdateBlockData(block.id, 'secondary_cta_url', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                </>
                              )}

                              {block.block_type === 'PromotionalSlider' && (
                                <>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Slider Banner Text
                                    <input type="text" value={block.data.slides?.[0]?.text || ''} onChange={e => {
                                      const slides = [{ text: e.target.value, link_url: block.data.slides?.[0]?.link_url || '' }];
                                      handleUpdateBlockData(block.id, 'slides', slides);
                                    }} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Banner Redirection URL
                                    <input type="text" value={block.data.slides?.[0]?.link_url || ''} onChange={e => {
                                      const slides = [{ text: block.data.slides?.[0]?.text || '', link_url: e.target.value }];
                                      handleUpdateBlockData(block.id, 'slides', slides);
                                    }} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Background Color Hex
                                    <input type="color" value={block.data.background_color} onChange={e => handleUpdateBlockData(block.id, 'background_color', e.target.value)} style={{ width: '100%', height: '40px', padding: '0.15rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', cursor: 'pointer' }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Countdown Target Date
                                    <input type="datetime-local" value={block.data.countdown_target_timestamp ? block.data.countdown_target_timestamp.substring(0, 16) : ''} onChange={e => handleUpdateBlockData(block.id, 'countdown_target_timestamp', e.target.value ? new Date(e.target.value).toISOString() : '')} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                </>
                              )}

                              {block.block_type === 'CategoryGrid' && (
                                <>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Grid Header
                                    <input type="text" value={block.data.title || ''} onChange={e => handleUpdateBlockData(block.id, 'title', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                                    <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>Curated Categories List</span>
                                    
                                    {(block.data.categories || []).map((cat: any, cIdx: number) => {
                                      const catObj = typeof cat === 'string' ? { name: cat, image: '' } : cat;
                                      return (
                                        <div key={cIdx} style={{ border: '1px solid var(--color-border)', padding: '0.75rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'rgba(0,0,0,0.01)' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: '700', fontSize: '0.75rem' }}>Category Item #{cIdx+1}</span>
                                            <button 
                                              onClick={() => {
                                                const updatedCats = [...block.data.categories];
                                                updatedCats.splice(cIdx, 1);
                                                handleUpdateBlockData(block.id, 'categories', updatedCats);
                                              }}
                                              style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                            >
                                              <Trash2 size={12} /> Delete
                                            </button>
                                          </div>
                                          
                                          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-gray)' }}>Name</span>
                                            <input 
                                              type="text" 
                                              value={catObj.name || ''} 
                                              onChange={e => {
                                                const updatedCats = [...block.data.categories];
                                                updatedCats[cIdx] = { ...catObj, name: e.target.value };
                                                handleUpdateBlockData(block.id, 'categories', updatedCats);
                                              }}
                                              style={{ padding: '0.35rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', fontSize: '0.8rem' }}
                                            />
                                          </label>
                                          
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-gray)', fontWeight: '500' }}>Banner Image</span>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', border: '1px solid var(--color-border)', padding: '0.35rem', backgroundColor: 'var(--color-bg)' }}>
                                              {catObj.image && (
                                                <img src={catObj.image} alt="Banner" style={{ width: '35px', height: '35px', objectFit: 'cover', borderRadius: '2px' }} />
                                              )}
                                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                <input 
                                                  type="file" 
                                                  accept="image/*"
                                                  onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                      const url = URL.createObjectURL(file);
                                                      const updatedCats = [...block.data.categories];
                                                      updatedCats[cIdx] = { ...catObj, image: url };
                                                      handleUpdateBlockData(block.id, 'categories', updatedCats);
                                                    }
                                                  }}
                                                  style={{ fontSize: '0.7rem' }}
                                                />
                                                <input 
                                                  type="text" 
                                                  value={catObj.image || ''} 
                                                  placeholder="Or paste banner image URL"
                                                  onChange={e => {
                                                    const updatedCats = [...block.data.categories];
                                                    updatedCats[cIdx] = { ...catObj, image: e.target.value };
                                                    handleUpdateBlockData(block.id, 'categories', updatedCats);
                                                  }}
                                                  style={{ padding: '0.2rem', fontSize: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    
                                    <button 
                                      onClick={() => {
                                        const updatedCats = [...(block.data.categories || [])];
                                        updatedCats.push({ name: 'New Category', image: '' });
                                        handleUpdateBlockData(block.id, 'categories', updatedCats);
                                      }}
                                      className="btn btn-outline" 
                                      style={{ padding: '0.4rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginTop: '0.25rem' }}
                                    >
                                      <Plus size={12} /> Add Category Item
                                    </button>
                                  </div>
                                </>
                              )}

                              {block.block_type === 'FeaturedProducts' && (
                                <>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Section Header
                                    <input type="text" value={block.data.title} onChange={e => handleUpdateBlockData(block.id, 'title', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>View All Redirection Text
                                    <input type="text" value={block.data.cta_text} onChange={e => handleUpdateBlockData(block.id, 'cta_text', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Max Product Limit
                                    <input type="number" value={block.data.limit} onChange={e => handleUpdateBlockData(block.id, 'limit', Number(e.target.value))} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                </>
                              )}

                              {block.block_type === 'BrandStory' && (
                                <>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Subtitle
                                    <input type="text" value={block.data.subtitle || ''} onChange={e => handleUpdateBlockData(block.id, 'subtitle', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Title
                                    <input type="text" value={block.data.title || ''} onChange={e => handleUpdateBlockData(block.id, 'title', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Description
                                    <textarea rows={3} value={block.data.description || ''} onChange={e => handleUpdateBlockData(block.id, 'description', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', resize: 'vertical', fontFamily: 'inherit' }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Quote Highlight
                                    <input type="text" value={block.data.quote || ''} onChange={e => handleUpdateBlockData(block.id, 'quote', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                  {renderImageUploadField(block.id, 'Story Visual Image', block.data.image, 'image')}
                                </>
                              )}

                              {block.block_type === 'EditorialGallery' && (
                                <>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Gallery Subtitle
                                    <input type="text" value={block.data.subtitle || ''} onChange={e => handleUpdateBlockData(block.id, 'subtitle', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Gallery Title
                                    <input type="text" value={block.data.title || ''} onChange={e => handleUpdateBlockData(block.id, 'title', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                  {renderImageUploadField(block.id, 'Image Panel 1 (Left)', block.data.image1, 'image1')}
                                  {renderImageUploadField(block.id, 'Image Panel 2 (Center)', block.data.image2, 'image2')}
                                  {renderImageUploadField(block.id, 'Image Panel 3 (Right)', block.data.image3, 'image3')}
                                </>
                              )}

                              {block.block_type === 'NewsletterSubscribe' && (
                                <>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Header Title
                                    <input type="text" value={block.data.title || ''} onChange={e => handleUpdateBlockData(block.id, 'title', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Subtitle / Description
                                    <input type="text" value={block.data.subtitle || ''} onChange={e => handleUpdateBlockData(block.id, 'subtitle', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Subscribe Button Text
                                    <input type="text" value={block.data.button_text || ''} onChange={e => handleUpdateBlockData(block.id, 'button_text', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Placeholder Text
                                    <input type="text" value={block.data.placeholder_text || ''} onChange={e => handleUpdateBlockData(block.id, 'placeholder_text', e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                </>
                              )}

                              {block.block_type === 'Spacer' && (
                                <>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Spacer Height (px): {block.data.height || 60}px
                                    <input type="range" min="10" max="200" step="5" value={block.data.height || 60} onChange={e => handleUpdateBlockData(block.id, 'height', Number(e.target.value))} style={{ width: '100%', cursor: 'ew-resize' }} />
                                  </label>
                                </>
                              )}

                              {/* Sizing & Layout Panel */}
                              {renderBlockLayoutSettings(block)}

                              {/* Scheduling Sub-object */}
                              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '0.75rem', marginTop: '1rem' }}>
                                <span style={{ fontWeight: '700', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}><Calendar size={12} /> Campaign Scheduling (Optional)</span>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem' }}>Start Time
                                    <input type="datetime-local" value={block.scheduling.start_date ? block.scheduling.start_date.substring(0, 16) : ''} onChange={e => handleUpdateBlockScheduling(block.id, 'start_date', e.target.value ? new Date(e.target.value).toISOString() : '')} style={{ padding: '0.35rem', border: '1px solid var(--color-border)', fontSize: '0.75rem', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem' }}>End Time
                                    <input type="datetime-local" value={block.scheduling.end_date ? block.scheduling.end_date.substring(0, 16) : ''} onChange={e => handleUpdateBlockScheduling(block.id, 'end_date', e.target.value ? new Date(e.target.value).toISOString() : '')} style={{ padding: '0.35rem', border: '1px solid var(--color-border)', fontSize: '0.75rem', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                                  </label>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Active JSON Contract Valid</span>
                    </div>
                    <button onClick={handleSaveCmsConfig} className="btn btn-primary" style={{ padding: '0.6rem 2rem' }}>Push Dynamic Layout</button>
                  </div>
                </div>

                {/* Right Visual Preview */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', margin: 0 }}>Live Layout Canvas Render</h3>
                      <button 
                        onClick={() => setIsCanvasFullscreen(true)} 
                        title="Enter Fullscreen Preview"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--color-gray)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.25rem',
                          borderRadius: '4px',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-gray)'}
                      >
                        <Maximize2 size={16} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'var(--color-bg)' }}>
                      <button 
                        onClick={() => setPreviewMode('desktop')} 
                        style={{ 
                          padding: '0.45rem 0.9rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.35rem', 
                          fontSize: '0.75rem', 
                          fontWeight: '600', 
                          fontFamily: '"Outfit", sans-serif', 
                          backgroundColor: previewMode === 'desktop' ? 'var(--color-text)' : 'transparent',
                          color: previewMode === 'desktop' ? 'var(--color-bg)' : 'var(--color-text)',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <Monitor size={13} /> Laptop
                      </button>
                      <button 
                        onClick={() => setPreviewMode('tablet')} 
                        style={{ 
                          padding: '0.45rem 0.9rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.35rem', 
                          fontSize: '0.75rem', 
                          fontWeight: '600', 
                          fontFamily: '"Outfit", sans-serif', 
                          backgroundColor: previewMode === 'tablet' ? 'var(--color-text)' : 'transparent',
                          color: previewMode === 'tablet' ? 'var(--color-bg)' : 'var(--color-text)',
                          borderLeft: '1px solid var(--color-border)',
                          borderRight: '1px solid var(--color-border)',
                          borderTop: 'none',
                          borderBottom: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <Tablet size={13} /> Tablet
                      </button>
                      <button 
                        onClick={() => setPreviewMode('mobile')} 
                        style={{ 
                          padding: '0.45rem 0.9rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.35rem', 
                          fontSize: '0.75rem', 
                          fontWeight: '600', 
                          fontFamily: '"Outfit", sans-serif', 
                          backgroundColor: previewMode === 'mobile' ? 'var(--color-text)' : 'transparent',
                          color: previewMode === 'mobile' ? 'var(--color-bg)' : 'var(--color-text)',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <Smartphone size={13} /> Mobile
                      </button>
                    </div>
                  </div>
                  
                  <div 
                    style={{ 
                      width: previewMode === 'desktop' ? '100%' : previewMode === 'tablet' ? '768px' : '375px',
                      maxWidth: '100%',
                      margin: '0 auto',
                      border: previewMode === 'desktop' ? '1px solid var(--color-border)' : '14px solid #1c1917',
                      borderRadius: previewMode === 'desktop' ? '4px' : previewMode === 'tablet' ? '24px' : '36px',
                      backgroundColor: 'var(--color-bg)',
                      overflow: 'hidden',
                      minHeight: '520px',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: previewMode === 'desktop' ? 'none' : '0 25px 50px -12px rgba(0,0,0,0.25)',
                      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative'
                    }}
                  >
                    {/* Top Notch for mobile view */}
                    {previewMode === 'mobile' && (
                      <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', width: '110px', height: '18px', backgroundColor: '#1c1917', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#27272a', marginRight: '6px' }}></span>
                        <span style={{ width: '35px', height: '3px', borderRadius: '2px', backgroundColor: '#27272a' }}></span>
                      </div>
                    )}
                    
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.03)', padding: previewMode === 'mobile' ? '1.15rem 1rem 0.5rem 1rem' : '0.5rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 5 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#eab308' }}></span>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', color: 'var(--color-gray)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        AURA SIMULATOR ({previewMode})
                      </span>
                    </div>
                    <div 
                      className={`preview-container-wrap ${previewMode === 'mobile' ? 'preview-mobile' : previewMode === 'tablet' ? 'preview-tablet' : 'preview-desktop'}`}
                      style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, overflowY: 'auto', maxHeight: previewMode === 'desktop' ? 'none' : '650px' }}
                    >
                      {renderVisualBlocks()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Static Content Pages & SEO Wrapper */}
            {cmsSubTab === 'static' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Static editor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Selected Static Page
                      <select
                        value={selectedStaticPageId}
                        onChange={e => setSelectedStaticPageId(e.target.value)}
                        className="admin-select"
                      >
                        {staticPages.map(p => <option key={p.id} value={p.id}>{p.title} (/{p.slug})</option>)}
                      </select>
                    </label>
                  </div>

                  {(() => {
                    const page = staticPages.find(p => p.id === selectedStaticPageId);
                    if (!page) return null;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Page Title
                          <input type="text" value={page.title} onChange={e => {
                            setStaticPages(staticPages.map(p => p.id === page.id ? { ...p, title: e.target.value } : p));
                          }} style={{ padding: '0.65rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                        </label>
                        
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>URL Slug
                          <input type="text" value={page.slug} onChange={e => {
                            setStaticPages(staticPages.map(p => p.id === page.id ? { ...p, slug: e.target.value } : p));
                          }} style={{ padding: '0.65rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                        </label>

                        {/* Text Editor Container */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <span style={{ fontWeight: '500' }}>Headless Rich-Text Content WYSIWYG Pane</span>
                          <div style={{ border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ backgroundColor: 'rgba(0,0,0,0.03)', padding: '0.5rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                              <button type="button" onClick={() => showToast("Format Bold Applied")} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)' }}>B</button>
                              <button type="button" onClick={() => showToast("Format Italic Applied")} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontStyle: 'italic', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)' }}>I</button>
                              <button type="button" onClick={() => showToast("Format Underline Applied")} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', textDecoration: 'underline', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)' }}>U</button>
                              <button type="button" onClick={() => showToast("Format Heading 2 Added")} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)' }}>H2</button>
                              <button type="button" onClick={() => showToast("Format List Added")} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)' }}>List</button>
                            </div>
                            <textarea
                              value={page.content}
                              onChange={e => handleSaveStaticPage(page.id, e.target.value)}
                              rows={10}
                              style={{ width: '100%', padding: '1rem', border: 'none', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button onClick={() => showToast("Static page saved successfully!")} className="btn btn-primary" style={{ padding: '0.65rem 2rem' }}>Save Page Changes</button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* SEO Panel Wrapper */}
                <div style={{ border: '1px solid var(--color-border)', padding: '1.5rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Globe size={16} /> SEO & Open Graph Tags</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: '500' }}>Meta Title</span>
                      <span style={{ color: (cmsPageConfig.seo.meta_title || '').length > 60 ? '#dc2626' : 'var(--color-gray)' }}>
                        {(cmsPageConfig.seo.meta_title || '').length}/60 chars
                      </span>
                    </div>
                    <input
                      type="text"
                      value={cmsPageConfig.seo.meta_title}
                      onChange={e => handleUpdateSeo('meta_title', e.target.value)}
                      placeholder="Catchy marketing title"
                      style={{ padding: '0.65rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: '500' }}>Meta Description</span>
                      <span style={{ color: (cmsPageConfig.seo.meta_description || '').length > 160 ? '#dc2626' : 'var(--color-gray)' }}>
                        {(cmsPageConfig.seo.meta_description || '').length}/160 chars
                      </span>
                    </div>
                    <textarea
                      value={cmsPageConfig.seo.meta_description}
                      onChange={e => handleUpdateSeo('meta_description', e.target.value)}
                      placeholder="Brief page meta overview summary..."
                      rows={3}
                      style={{ padding: '0.65rem', border: '1px solid var(--color-border)', resize: 'none', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                    />
                  </div>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>Open Graph Image URL
                    <input
                      type="text"
                      value={cmsPageConfig.seo.open_graph_image}
                      onChange={e => handleUpdateSeo('open_graph_image', e.target.value)}
                      placeholder="/media/seo/preview.jpg"
                      style={{ padding: '0.65rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                    />
                  </label>

                  {/* Mock Google Search Preview Card */}
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: '4px', padding: '1rem', backgroundColor: '#f9f9f9', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-gray)', textTransform: 'uppercase', letterSpacing: '0.05rem', display: 'block', marginBottom: '0.5rem' }}>Google SERP Mock Render</span>
                    <span style={{ fontSize: '0.75rem', color: '#1a0dab', display: 'block', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', fontWeight: '500' }}>
                      {cmsPageConfig.seo.meta_title || 'Please fill meta title'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#006621', display: 'block', marginBottom: '0.2rem' }}>
                      https://aura.studio/{cmsPageConfig.slug}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#545454', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {cmsPageConfig.seo.meta_description || 'Please fill meta description details.'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Builder */}
            {cmsSubTab === 'navigation' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Header Menu */}
                <div style={{ border: '1px solid var(--color-border)', padding: '1.5rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Compass size={16} /> Header Navigation</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {navMenus.header.map((item: any, idx: number) => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--color-border)', padding: '0.75rem', borderRadius: '2px', backgroundColor: '#fcfcfc' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-text)' }}>{item.label}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-gray)' }}>{item.url}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Badge"
                            value={item.badge}
                            onChange={e => handleUpdateNavBadge('header', idx, e.target.value)}
                            style={{ padding: '0.25rem 0.5rem', width: '90px', fontSize: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                          />
                          <button onClick={() => handleMoveNavItem('header', idx, 'up')} disabled={idx === 0} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-gray)' }}><ArrowUp size={14} /></button>
                          <button onClick={() => handleMoveNavItem('header', idx, 'down')} disabled={idx === navMenus.header.length - 1} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-gray)' }}><ArrowDown size={14} /></button>
                          <button onClick={() => handleDeleteNavItem('header', item.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={e => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const label = (form.elements.namedItem('nav-label') as HTMLInputElement).value;
                    const url = (form.elements.namedItem('nav-url') as HTMLInputElement).value;
                    handleAddNavItem('header', label, url);
                    form.reset();
                  }} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input name="nav-label" placeholder="Link Label" required style={{ padding: '0.5rem', flex: 1, fontSize: '0.8rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                    <input name="nav-url" placeholder="/shop/category" required style={{ padding: '0.5rem', flex: 1, fontSize: '0.8rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Add Item</button>
                  </form>
                </div>

                {/* Footer Menu */}
                <div style={{ border: '1px solid var(--color-border)', padding: '1.5rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Compass size={16} /> Footer Links</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {navMenus.footer.map((item: any, idx: number) => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--color-border)', padding: '0.75rem', borderRadius: '2px', backgroundColor: '#fcfcfc' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-text)' }}>{item.label}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-gray)' }}>{item.url}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button onClick={() => handleMoveNavItem('footer', idx, 'up')} disabled={idx === 0} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-gray)' }}><ArrowUp size={14} /></button>
                          <button onClick={() => handleMoveNavItem('footer', idx, 'down')} disabled={idx === navMenus.footer.length - 1} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-gray)' }}><ArrowDown size={14} /></button>
                          <button onClick={() => handleDeleteNavItem('footer', item.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={e => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const label = (form.elements.namedItem('nav-label') as HTMLInputElement).value;
                    const url = (form.elements.namedItem('nav-url') as HTMLInputElement).value;
                    handleAddNavItem('footer', label, url);
                    form.reset();
                  }} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input name="nav-label" placeholder="Link Label" required style={{ padding: '0.5rem', flex: 1, fontSize: '0.8rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                    <input name="nav-url" placeholder="/shipping" required style={{ padding: '0.5rem', flex: 1, fontSize: '0.8rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }} />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Add Item</button>
                  </form>
                </div>
              </div>
            )}

            {/* Media Asset Manager */}
            {cmsSubTab === 'media' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                  <div className="admin-search-wrapper" style={{ flex: 1, maxWidth: '400px' }}>
                    <Search size={16} className="admin-search-icon" />
                    <input
                      type="text"
                      placeholder="Search assets by tag/name..."
                      className="admin-search-input"
                      value={mediaSearch}
                      onChange={e => setMediaSearch(e.target.value)}
                    />
                  </div>

                  {/* WebP Auto Encoder controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--color-border)', padding: '0.5rem 1rem', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>WebP Auto-Compression:</span>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={webpQuality}
                      onChange={e => setWebpQuality(Number(e.target.value))}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', fontFamily: 'monospace' }}>{webpQuality}% Quality</span>
                  </div>

                  <div>
                    <input
                      type="file"
                      id="media-uploader-input"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleMediaUploadSimulation(file);
                      }}
                    />
                    <button
                      onClick={() => document.getElementById('media-uploader-input')?.click()}
                      className="btn btn-primary" style={{ padding: '0.65rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Plus size={16} /> Batch Upload
                    </button>
                  </div>
                </div>

                {/* Media Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  {mediaFiles.filter(m => m.name.toLowerCase().includes(mediaSearch.toLowerCase()) || m.tag.toLowerCase().includes(mediaSearch.toLowerCase())).map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedMedia(item)}
                      style={{
                        border: `1px solid ${selectedMedia?.id === item.id ? 'var(--color-text)' : 'var(--color-border)'}`,
                        borderRadius: '4px', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', backgroundColor: '#fafafa'
                      }}
                    >
                      <div style={{ aspectRatio: '4/3', backgroundColor: '#e2e2e2', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', backgroundColor: '#fff' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text)' }}>{item.name}</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-gray)' }}>
                          <span>Size: {item.size}</span>
                          <span style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: '0.05rem 0.25rem', borderRadius: '2px' }}>{item.tag}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Media Drawer Details */}
                {selectedMedia && (
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: '4px', padding: '1.25rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <img src={selectedMedia.url} alt="detail" style={{ width: '80px', height: '80px', objectFit: 'cover', border: '1px solid var(--color-border)' }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-text)' }}>{selectedMedia.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-gray)', margin: 0 }}>Type: {selectedMedia.type} · Size: {selectedMedia.size} · Tag: {selectedMedia.tag}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Edit tag..."
                        value={selectedMedia.tag}
                        onChange={e => {
                          const val = e.target.value;
                          setMediaFiles(mediaFiles.map(m => m.id === selectedMedia.id ? { ...m, tag: val } : m));
                          setSelectedMedia({ ...selectedMedia, tag: val });
                        }}
                        style={{ padding: '0.4rem', border: '1px solid var(--color-border)', fontSize: '0.8rem', width: '120px', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                      />
                      <button onClick={() => handleDeleteMedia(selectedMedia.id)} className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', color: '#dc2626', borderColor: '#dc2626' }}>Delete Asset</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= MARKETING TAB ================= */}
        {activeTab === 'marketing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
            {/* Marketing Sub-tabs */}
            <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
              {(['promotions', 'flash_sale', 'workflows'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setMarketingSubTab(tab)}
                  style={{
                    background: 'none', border: 'none', padding: '0.5rem 0', fontSize: '0.9rem', fontWeight: marketingSubTab === tab ? '700' : '400',
                    color: marketingSubTab === tab ? 'var(--color-text)' : 'var(--color-gray)', borderBottom: marketingSubTab === tab ? '2px solid var(--color-text)' : 'none',
                    cursor: 'pointer', transition: 'all 0.15s', textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}
                >
                  {tab === 'promotions' ? 'Discount Code Engine' : tab === 'flash_sale' ? 'Flash Sale Orchestrator' : 'Automation Workflows'}
                </button>
              ))}
            </div>

            {/* Discount Code Form & List */}
            {marketingSubTab === 'promotions' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Promo Code list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', margin: 0 }}>Active Promotional Rules</h3>
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Rule Details</th>
                          <th>Min Cart Trigger</th>
                          <th>Limits (Global)</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {promotionsList.map(item => (
                          <tr key={item.id}>
                            <td style={{ fontWeight: '700', fontSize: '0.95rem' }}>{item.code}</td>
                            <td>{item.type === 'Percentage' ? `${item.value}% Off Discount` : item.type === 'Fixed' ? `₹${item.value} Off Total` : 'Free Shipping Coupon'}</td>
                            <td>₹{item.minThreshold}</td>
                            <td>{item.limit} uses {item.singleUse ? '(1/user)' : ''}</td>
                            <td>
                              <span
                                onClick={() => handleTogglePromo(item.id)}
                                style={{
                                  padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: '700', borderRadius: '12px', cursor: 'pointer',
                                  backgroundColor: item.status === 'Active' ? '#dcfce7' : '#fee2e2', color: item.status === 'Active' ? '#16a34a' : '#dc2626'
                                }}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td>
                              <button onClick={() => handleDeletePromo(item.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc2626' }}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Rules Creator Form */}
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '4px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: '#fff' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', color: 'var(--color-text)' }}>Create Promo Code</h3>
                  <form onSubmit={handleAddPromo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>Discount Code
                      <input
                        type="text"
                        placeholder="e.g., WINTER30"
                        value={newPromoForm.code}
                        onChange={e => setNewPromoForm({ ...newPromoForm, code: e.target.value })}
                        required
                        style={{ padding: '0.55rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                      />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>Discount Type
                      <select
                        value={newPromoForm.type}
                        onChange={e => setNewPromoForm({ ...newPromoForm, type: e.target.value })}
                        style={{ padding: '0.55rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                      >
                        <option value="Percentage">Percentage Off (%)</option>
                        <option value="Fixed">Fixed Amount (₹)</option>
                        <option value="Free Shipping">Free Shipping</option>
                      </select>
                    </label>

                    {newPromoForm.type !== 'Free Shipping' && (
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>Discount Value
                        <input
                          type="number"
                          value={newPromoForm.value}
                          onChange={e => setNewPromoForm({ ...newPromoForm, value: Number(e.target.value) })}
                          required
                          style={{ padding: '0.55rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                        />
                      </label>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>Min Cart Trigger Value (₹)
                        <input
                          type="number"
                          value={newPromoForm.minThreshold}
                          onChange={e => setNewPromoForm({ ...newPromoForm, minThreshold: Number(e.target.value) })}
                          style={{ padding: '0.55rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                        />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>Global Usage Limit
                        <input
                          type="number"
                          value={newPromoForm.limit}
                          onChange={e => setNewPromoForm({ ...newPromoForm, limit: Number(e.target.value) })}
                          style={{ padding: '0.55rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                        />
                      </label>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-text)' }}>
                      <input
                        type="checkbox"
                        checked={newPromoForm.singleUse}
                        onChange={e => setNewPromoForm({ ...newPromoForm, singleUse: e.target.checked })}
                      />
                      Enforce single-user limit (1 use per account)
                    </label>

                    <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem', marginTop: '0.5rem' }}>Generate Coupon</button>
                  </form>
                </div>
              </div>
            )}

            {/* Flash Sale Orchestrator */}
            {marketingSubTab === 'flash_sale' && (
              <div style={{ border: '1px solid var(--color-border)', padding: '2rem', borderRadius: '4px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '700px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text)' }}><Sparkles size={18} style={{ color: '#eab308' }} /> Flash Sale Orchestrator</h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-gray)' }}>Override regular catalogue pricing site-wide instantly</p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={flashSaleActive}
                      onChange={e => {
                        setFlashSaleActive(e.target.checked);
                        showToast(`Flash sale status: ${e.target.checked ? 'Active' : 'Inactive'}`);
                      }}
                      style={{ transform: 'scale(1.25)', cursor: 'pointer' }}
                    />
                    <span style={{ marginLeft: '0.5rem', fontWeight: '700', fontSize: '0.9rem', color: flashSaleActive ? '#16a34a' : 'var(--color-gray)' }}>{flashSaleActive ? 'ACTIVE' : 'INACTIVE'}</span>
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>Global Markdown Override Percentage (%)
                    <input
                      type="number"
                      value={flashSalePercentage}
                      disabled={!flashSaleActive}
                      onChange={e => setFlashSalePercentage(Number(e.target.value))}
                      style={{ padding: '0.65rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                    />
                  </label>
                  
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>Countdown Expiration Target
                    <input
                      type="datetime-local"
                      value={flashSaleCountdown ? flashSaleCountdown.substring(0, 16) : ''}
                      disabled={!flashSaleActive}
                      onChange={e => setFlashSaleCountdown(e.target.value ? new Date(e.target.value).toISOString() : '')}
                      style={{ padding: '0.65rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                    />
                  </label>
                </div>

                {/* Global Campaign Bar preview mock */}
                <div style={{ border: '1px solid var(--color-border)', padding: '1rem', borderRadius: '4px', backgroundColor: flashSaleActive ? '#09090b' : '#fafafa', color: flashSaleActive ? '#fff' : 'var(--color-gray)', textAlign: 'center', transition: 'all 0.3s' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-gray)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>Storefront Countdown Bar Preview</span>
                  {flashSaleActive ? (
                    <div>
                      <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>MIDNIGHT DEALS: SAVE {flashSalePercentage}% OFF SITE-WIDE!</span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#eab308', fontFamily: 'monospace', marginTop: '0.25rem' }}>
                        Ends in: {flashSaleCountdown ? new Date(flashSaleCountdown).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>Flash Sale banner is currently inactive</span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                  <button onClick={handleSaveFlashSale} className="btn btn-primary" style={{ padding: '0.65rem 2rem' }}>Save & Mutate Catalogue Pricing</button>
                </div>
              </div>
            )}

            {/* Automation Workflows */}
            {marketingSubTab === 'workflows' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Automation trigger list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', margin: 0 }}>Registered Marketing Triggers</h3>
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Event Action</th>
                          <th>System Action</th>
                          <th>Webhook Endpoint</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {automationRules.map(item => (
                          <tr key={item.id}>
                            <td>
                              <span style={{ fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.04)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--color-text)' }}>
                                {item.event}
                              </span>
                            </td>
                            <td>{item.action}</td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--color-gray)', wordBreak: 'break-all' }}>{item.webhook}</td>
                            <td>
                              <button onClick={() => handleDeleteAutomation(item.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc2626' }}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Workflow connector form */}
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '4px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: '#fff' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', color: 'var(--color-text)' }}>Register Trigger Routing</h3>
                  <form onSubmit={handleAddAutomation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>Event Trigger
                      <select
                        value={newAutomation.event}
                        onChange={e => setNewAutomation({ ...newAutomation, event: e.target.value })}
                        style={{ padding: '0.55rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                      >
                        <option value="cart_abandoned">cart_abandoned</option>
                        <option value="user_signup">user_signup</option>
                        <option value="order_completed">order_completed</option>
                        <option value="item_wishlisted">item_wishlisted</option>
                      </select>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>Action Type
                      <input
                        type="text"
                        value={newAutomation.action}
                        disabled
                        style={{ padding: '0.55rem', border: '1px solid var(--color-border)', backgroundColor: 'rgba(0,0,0,0.02)', color: 'var(--color-gray)' }}
                      />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>Webhook Endpoint URL
                      <input
                        type="url"
                        placeholder="https://your-endpoint.com/webhook"
                        value={newAutomation.webhook}
                        onChange={e => setNewAutomation({ ...newAutomation, webhook: e.target.value })}
                        required
                        style={{ padding: '0.55rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                      />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>JSON Payload String
                      <textarea
                        value={newAutomation.payload}
                        onChange={e => setNewAutomation({ ...newAutomation, payload: e.target.value })}
                        rows={4}
                        required
                        style={{ padding: '0.55rem', border: '1px solid var(--color-border)', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8rem', backgroundColor: 'transparent', color: 'var(--color-text)' }}
                      />
                    </label>

                    <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem', marginTop: '0.5rem' }}>Register Trigger Route</button>
                  </form>
                </div>
              </div>
            )}
          </div>
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
                    return prod ? getProductCurrency(prod) : '₹';
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
                    const sym = curr?.symbol || '₹';
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

      {/* Fullscreen Visual Live Canvas Simulator Modal */}
      {isCanvasFullscreen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(252, 251, 250, 0.98)', // Premium, light minimalist wash (similar to Aura branding)
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          color: 'var(--color-text)',
          fontFamily: '"Outfit", sans-serif'
        }}>
          {/* Header Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 2.5rem',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: '#fff',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
              <span style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Aura Fullscreen Canvas Preview</span>
            </div>
            
            {/* Device Toggles */}
            <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'var(--color-bg)' }}>
              <button 
                onClick={() => setPreviewMode('desktop')} 
                style={{ 
                  padding: '0.6rem 1.2rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  fontSize: '0.8rem', 
                  fontWeight: '600', 
                  fontFamily: '"Outfit", sans-serif', 
                  backgroundColor: previewMode === 'desktop' ? 'var(--color-text)' : 'transparent',
                  color: previewMode === 'desktop' ? 'var(--color-bg)' : 'var(--color-text)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <Monitor size={15} /> Laptop (Full Width)
              </button>
              <button 
                onClick={() => setPreviewMode('tablet')} 
                style={{ 
                  padding: '0.6rem 1.2rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  fontSize: '0.8rem', 
                  fontWeight: '600', 
                  fontFamily: '"Outfit", sans-serif', 
                  backgroundColor: previewMode === 'tablet' ? 'var(--color-text)' : 'transparent',
                  color: previewMode === 'tablet' ? 'var(--color-bg)' : 'var(--color-text)',
                  borderLeft: '1px solid var(--color-border)',
                  borderRight: '1px solid var(--color-border)',
                  borderTop: 'none',
                  borderBottom: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <Tablet size={15} /> Tablet (768px)
              </button>
              <button 
                onClick={() => setPreviewMode('mobile')} 
                style={{ 
                  padding: '0.6rem 1.2rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  fontSize: '0.8rem', 
                  fontWeight: '600', 
                  fontFamily: '"Outfit", sans-serif', 
                  backgroundColor: previewMode === 'mobile' ? 'var(--color-text)' : 'transparent',
                  color: previewMode === 'mobile' ? 'var(--color-bg)' : 'var(--color-text)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <Smartphone size={15} /> Mobile (375px)
              </button>
            </div>

            {/* Exit Fullscreen */}
            <button 
              onClick={() => setIsCanvasFullscreen(false)} 
              className="btn btn-outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.2rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer'
              }}
            >
              <Minimize2 size={15} /> Minimize View
            </button>
          </div>

          {/* Simulator Content Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '3rem 1.5rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            backgroundColor: '#f5f5f4'
          }}>
            <div 
              style={{ 
                width: previewMode === 'desktop' ? '1280px' : previewMode === 'tablet' ? '768px' : '375px',
                maxWidth: '100%',
                border: previewMode === 'desktop' ? '1px solid var(--color-border)' : '16px solid #1c1917',
                borderRadius: previewMode === 'desktop' ? '8px' : previewMode === 'tablet' ? '28px' : '40px',
                backgroundColor: 'var(--color-bg)',
                boxShadow: '0 30px 100px rgba(0,0,0,0.12)',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Top Notch for mobile/tablet view */}
              {(previewMode === 'mobile' || previewMode === 'tablet') && (
                <div style={{ 
                  position: 'absolute', 
                  top: '0', 
                  left: '50%', 
                  transform: 'translateX(-50%)', 
                  width: '120px', 
                  height: '18px', 
                  backgroundColor: '#1c1917', 
                  borderBottomLeftRadius: '12px', 
                  borderBottomRightRadius: '12px', 
                  zIndex: 100, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center' 
                }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#27272a', marginRight: '6px' }}></span>
                  <span style={{ width: '40px', height: '3px', borderRadius: '2px', backgroundColor: '#27272a' }}></span>
                </div>
              )}

              {/* Browser bar */}
              <div style={{ 
                backgroundColor: 'rgba(0,0,0,0.02)', 
                padding: (previewMode === 'mobile' || previewMode === 'tablet') ? '1.25rem 1.25rem 0.5rem 1.25rem' : '0.65rem 1.25rem', 
                borderBottom: '1px solid var(--color-border)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                zIndex: 5 
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#eab308' }}></span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
                <span style={{ marginLeft: '0.75rem', fontSize: '0.7rem', color: 'var(--color-gray)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Aura Visual Simulator (Active Config Canvas)
                </span>
              </div>

              {/* Page Visual Blocks */}
              <div 
                className={`preview-container-wrap ${previewMode === 'mobile' ? 'preview-mobile' : previewMode === 'tablet' ? 'preview-tablet' : 'preview-desktop'}`}
                style={{ 
                  padding: '2rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '2rem', 
                  backgroundColor: '#fff' 
                }}
              >
                {renderVisualBlocks()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
