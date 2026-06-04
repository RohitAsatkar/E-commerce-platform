import { useParams, Link } from 'react-router-dom';
import { useProducts } from '../lib/useProducts';
import { formatPrice } from '../lib/currency';
import { useState, useEffect } from 'react';
import { getActiveProductSale } from '../lib/sales';
import { supabase } from '../lib/supabase';

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'all': "Explore the complete AURA collection. Our clothing features clean architectural silhouettes, premium organic textiles, and circular design principles tailored for the modern individual.",
  'new': "Discover our latest arrivals. The newest capsule releases showcasing quiet luxury cuts, Responsibly Milled Silk (RMS), and premium organic cotton designs.",
  'shirts': "Browse our collection of men's minimalist shirts, made from long-staple organic cotton. From classic button-downs to casual overshirts, each piece balances architectural structure and everyday comfort.",
  't-shirts': "Elevate your basics with our premium organic cotton tees. Featuring heavyweight structure, relaxed fits, and meticulous double-needle stitching.",
  'jeans': "Sustainably crafted denim jeans with a modern straight-leg silhouette, made using eco-friendly water-saving indigo wash techniques.",
  'overshirt': "Heavyweight corduroy, denim, and organic cotton overshirts built for versatile layering and transitional weather.",
  'trousers': "Tailored minimalist trousers engineered from organic linen and virgin wool blends, designed for architectural elegance.",
  'cargo-pants': "Elevate utilitarian style with our tailored cargo pants. Constructed from lightweight, premium organic twill with structural pocket styling.",
  'sweaters': "Luxurious knitwear and sweaters spun from certified organic cotton, merino wool, and premium natural fibers.",
  'jackets': "Minimalist jackets and outerwear, from water-resistant bomber jackets to premium sheepskin leather coats.",
  'footwear': "Handcrafted footwear combining classic tapered silhouettes with Blake-stitched leather soles and calf suede comfort.",
  'luxe': "The absolute peak of quiet luxury garments. Crafted from high-density cashmere, RMS certified silk, and premium virgin wool.",
  'men': "Elevate your wardrobe with the AURA Men's collection. Clean tailoring, premium organic cotton, GOTS-certified linens, and structural layer dynamics designed for understated modern style.",
  'linen': "Discover breezy, lightweight garments crafted from certified organic European flax. Perfect for warm climates and relaxed resort layering."
};

const ProductListing = () => {
  const { category } = useParams<{ category: string }>();
  const { products, loading } = useProducts();
  const [sortOption, setSortOption] = useState('Featured');

  const [gridColumns, setGridColumns] = useState(() => {
    const saved = localStorage.getItem('aura_shop_grid_columns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return { desktop: 4, tablet: 2, mobile: 1 };
  });

  useEffect(() => {
    const fetchGridSettings = async () => {
      try {
        const { data } = await supabase
          .from('storefront_config')
          .select('config')
          .eq('id', 'shop_grid_settings')
          .maybeSingle();
        if (data && data.config) {
          setGridColumns(data.config);
          localStorage.setItem('aura_shop_grid_columns', JSON.stringify(data.config));
        }
      } catch (err) {
        console.error("Failed to load grid settings from cloud:", err);
      }
    };
    fetchGridSettings();
  }, []);

  const [filterCategories] = useState<{ name: string; slug: string }[]>(() => {
    const saved = localStorage.getItem('aura_shop_filters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { name: 'ALL', slug: 'all' },
      { name: 'NEW', slug: 'new' },
      { name: 'SHIRTS', slug: 'shirts' },
      { name: 'T-SHIRTS', slug: 't-shirts' },
      { name: 'JEANS', slug: 'jeans' },
      { name: 'OVERSHIRT', slug: 'overshirt' },
      { name: 'TROUSERS', slug: 'trousers' },
      { name: 'CARGO PANTS', slug: 'cargo-pants' },
      { name: 'SWEATERS', slug: 'sweaters' },
      { name: 'JACKETS', slug: 'jackets' },
      { name: 'FOOTWEAR', slug: 'footwear' },
      { name: 'LUXE', slug: 'luxe' }
    ];
  });
  
  let displayedProducts = products;
  let title = 'All Products';

  const currentCategorySlug = category || 'all';

  if (currentCategorySlug !== 'all') {
    if (currentCategorySlug === 'new') {
      displayedProducts = products.filter(p => p.is_new);
      title = 'New Arrivals';
    } else if (currentCategorySlug === 'men') {
      const apparelCategories = ['shirts', 't-shirts', 'polo', 'jeans', 'trousers', 'linen', 'cargo-pants', 'joggers', 'shorts', 'overshirts'];
      displayedProducts = products.filter(p => apparelCategories.includes((p.category || '').toLowerCase()));
      title = "Men's Collection";
    } else {
      displayedProducts = products.filter(p => {
        const prodCat = (p.category || '').toLowerCase().replace(/\s+/g, '-');
        return prodCat === currentCategorySlug;
      });
      const activeCat = filterCategories.find(c => c.slug === currentCategorySlug);
      if (activeCat) {
        title = activeCat.name;
      } else {
        title = currentCategorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }
    }
  }

  // Update dynamic page head titles and meta descriptions for SEO
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${title} | AURA Minimalist Apparel`;

    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', `Browse our curated collection of luxury minimalist ${title.toLowerCase()}. Designed with clean lines and premium organic fabrics.`);

    // Inject CollectionPage and ItemList JSON-LD Schema
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `${title} | AURA Minimalist Apparel`,
      "description": `Browse our curated collection of luxury minimalist ${title.toLowerCase()}. Designed with clean lines and premium organic fabrics.`,
      "url": window.location.href,
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": displayedProducts.length,
        "itemListElement": displayedProducts.map((p: any, idx: number) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "url": `${window.location.origin}/product/${p.id}`,
          "name": p.name
        }))
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'aura-collection-schema';
    script.innerHTML = JSON.stringify(schemaData);
    document.head.appendChild(script);

    return () => {
      document.title = originalTitle;
      if (metaDesc) {
        if (originalDesc) {
          metaDesc.setAttribute('content', originalDesc);
        } else {
          metaDesc.remove();
        }
      }
      const existingScript = document.getElementById('aura-collection-schema');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [title, displayedProducts]);

  // Handle user sort selection
  if (sortOption === 'Price: Low to High') {
    displayedProducts = [...displayedProducts].sort((a, b) => {
      const saleA = getActiveProductSale(a);
      const saleB = getActiveProductSale(b);
      const priceA = saleA ? saleA.salePrice : a.price;
      const priceB = saleB ? saleB.salePrice : b.price;
      return priceA - priceB;
    });
  } else if (sortOption === 'Price: High to Low') {
    displayedProducts = [...displayedProducts].sort((a, b) => {
      const saleA = getActiveProductSale(a);
      const saleB = getActiveProductSale(b);
      const priceA = saleA ? saleA.salePrice : a.price;
      const priceB = saleB ? saleB.salePrice : b.price;
      return priceB - priceA;
    });
  }

  if (loading) return <div className="product-listing-section container text-center">Loading products...</div>;

  return (
    <div className="product-listing-section">
      <div className="container">
        {/* Category Header Layout */}
        <div className="product-listing-header">
          <h1 className="product-listing-title">{title}</h1>
          <p className="category-description-text">
            {CATEGORY_DESCRIPTIONS[currentCategorySlug] || `Browse our curated collection of luxury minimalist ${title.toLowerCase()}. Designed with clean lines and premium organic fabrics.`}
          </p>
        </div>
        
        {/* Category Toggles Row */}
        <div className="category-toggles-container">
          <div className="category-toggles-track">
            {filterCategories.map(cat => {
              const isActive = currentCategorySlug === cat.slug;
              return (
                <Link
                  key={cat.slug}
                  to={`/shop/${cat.slug}`}
                  className={`category-toggle-btn ${isActive ? 'active' : ''}`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between items-center mb-8" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
          <p style={{ color: 'var(--color-gray)' }}>{displayedProducts.length} Results</p>
          <div className="flex gap-4">
            <select 
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
              style={{ background: 'transparent', border: 'none', fontFamily: 'inherit', color: 'inherit', outline: 'none', cursor: 'pointer' }}
            >
              <option value="Featured">Sort by: Featured</option>
              <option value="Price: Low to High">Sort by: Price: Low to High</option>
              <option value="Price: High to Low">Sort by: Price: High to Low</option>
            </select>
          </div>
        </div>

        <div 
          className="product-grid"
          style={{
            ['--grid-cols-desktop' as any]: gridColumns.desktop,
            ['--grid-cols-tablet' as any]: gridColumns.tablet,
            ['--grid-cols-mobile' as any]: gridColumns.mobile,
          }}
        >
          {displayedProducts.map(product => {
            const activeSale = getActiveProductSale(product);
            const hasSale = activeSale !== null;

            return (
              <Link to={`/product/${product.id}`} key={product.id} className="product-card">
                <div className="product-image-wrap">
                  <img src={product.image} alt={product.name} className="product-image" />
                  {product.is_new && <span className="badge-new">New</span>}
                  {hasSale && (
                    <span 
                      className="badge-sale" 
                      style={{ 
                        backgroundColor: '#dc2626', 
                        color: '#fff', 
                        position: 'absolute', 
                        top: '12px', 
                        right: '12px', 
                        padding: '0.2rem 0.6rem', 
                        fontSize: '0.7rem', 
                        fontWeight: '700', 
                        textTransform: 'uppercase', 
                        borderRadius: '2px', 
                        zIndex: 10,
                        letterSpacing: '0.05em',
                        fontFamily: 'Outfit, sans-serif'
                      }}
                    >
                      {activeSale.campaign.type === 'flash_sale' ? 'FLASH' : 'SALE'} -{activeSale.campaign.discountValue}%
                    </span>
                  )}
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  {hasSale ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <p className="product-price" style={{ color: '#dc2626', fontWeight: '700', margin: 0 }}>{formatPrice(product, activeSale.salePrice)}</p>
                      <p style={{ textDecoration: 'line-through', color: 'var(--color-gray)', fontSize: '0.8rem', margin: 0 }}>{formatPrice(product)}</p>
                    </div>
                  ) : (
                    <p className="product-price">{formatPrice(product)}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductListing;
