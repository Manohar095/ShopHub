import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import './HomePage.css';

const CATEGORIES = ['All','Electronics','Fashion','Home','Beauty','Sports','Books','Toys'];
const SORTS = [
  { value: '',           label: 'Relevance' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'popular',   label: 'Most Popular' },
  { value: 'newest',    label: 'Newest First' },
];
const BRANDS = ['Samsung','Apple','Nike','boAt','Logitech',"Levi's",'Prestige','Minimalist','Lakme','Nivia','Philips','Biba'];

export default function HomePage() {
  const { user }                          = useAuth();
  const [searchParams]                    = useSearchParams();
  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [category, setCategory]           = useState('All');
  const [sort, setSort]                   = useState('');
  const [wishlistIds, setWishlistIds]     = useState([]);
  const [minRating, setMinRating]         = useState(0);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [inStockOnly, setInStockOnly]     = useState(false);
  const [priceMax, setPriceMax]           = useState(100000);

  const searchTerm = searchParams.get('search') || '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'All') params.set('category', category);
      if (searchTerm) params.set('search', searchTerm);
      if (sort) params.set('sort', sort);
      const { data } = await api.get(`/products?${params}`);
      setProducts(data.products);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, [category, searchTerm, sort]);

  const fetchWishlist = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/wishlist');
      setWishlistIds(data.wishlist.map(p => p._id || p));
    } catch {}
  }, [user]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const handleWishlistToggle = (id) => {
    setWishlistIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleBrand = (brand) => {
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  };

  const filteredProducts = products.filter(p => {
    if (minRating > 0 && p.rating < minRating) return false;
    if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;
    if (inStockOnly && p.stock === 0) return false;
    if (p.price > priceMax) return false;
    return true;
  });

  return (
    <div className="home-layout">

      {/* LEFT SIDEBAR — Filters */}
      <aside className="filter-sidebar">
        <div className="sidebar-logo-area">
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:'#1a1a1a' }}>
            Shop<span style={{ color:'#c9a96e' }}>Hub</span>
          </span>
        </div>

        {/* Price Range */}
        <div className="filter-block">
          <div className="filter-block-header">
            <span className="filter-title">Price Range</span>
            <span className="filter-reset" onClick={() => setPriceMax(100000)}>Reset</span>
          </div>
          <p className="filter-sub">Up to ₹{priceMax.toLocaleString()}</p>
          <input
            type="range" min={500} max={100000} step={500}
            value={priceMax}
            onChange={e => setPriceMax(+e.target.value)}
            style={{ width:'100%', accentColor:'#2563eb', margin:'10px 0' }}
          />
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span className="price-pill">₹500</span>
            <span className="price-pill">₹{priceMax.toLocaleString()}</span>
          </div>
        </div>

        {/* Star Rating */}
        <div className="filter-block">
          <div className="filter-block-header">
            <span className="filter-title">Star Rating</span>
          </div>
          {[5,4,3,2].map(star => (
            <label key={star} className="filter-check-row">
              <input
                type="checkbox"
                checked={minRating === star}
                onChange={() => setMinRating(prev => prev === star ? 0 : star)}
                style={{ accentColor:'#2563eb', width:15, height:15 }}
              />
              <span style={{ color:'#f59e0b', fontSize:14 }}>{'★'.repeat(star)}{'☆'.repeat(5-star)}</span>
              <span className="filter-sub">{star}+ Stars</span>
            </label>
          ))}
        </div>

        {/* Brands */}
        <div className="filter-block">
          <div className="filter-block-header">
            <span className="filter-title">Brand</span>
            <span className="filter-reset" onClick={() => setSelectedBrands([])}>Reset</span>
          </div>
          {BRANDS.map(brand => (
            <label key={brand} className="filter-check-row">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                style={{ accentColor:'#2563eb', width:15, height:15 }}
              />
              <span style={{ fontSize:13, color:'#444' }}>{brand}</span>
            </label>
          ))}
        </div>

        {/* Delivery */}
        <div className="filter-block">
          <div className="filter-block-header">
            <span className="filter-title">Delivery Options</span>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="delivery-btn active">Standard</button>
            <button className="delivery-btn">Express</button>
          </div>
        </div>

        {/* Availability */}
        <div className="filter-block">
          <div className="filter-block-header">
            <span className="filter-title">Availability</span>
          </div>
          <label className="filter-check-row">
            <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)} style={{ accentColor:'#2563eb', width:15, height:15 }} />
            <span style={{ fontSize:13, color:'#444' }}>In Stock Only</span>
          </label>
          <label className="filter-check-row">
            <input type="checkbox" checked={!inStockOnly} onChange={e => setInStockOnly(!e.target.checked)} style={{ accentColor:'#2563eb', width:15, height:15 }} />
            <span style={{ fontSize:13, color:'#444' }}>Include Out of Stock</span>
          </label>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="home-main">

        {/* BENTO HERO — only when no search */}
        {!searchTerm && (
          <div className="bento-grid">
            {/* Hero Banner */}
            <div className="bcard bcard-hero">
              <div className="hero-text-block">
                <div className="hero-offer-badge">NEW ARRIVALS 2026</div>
                <div className="hero-big-text">
                  Shop the Finest.<br />
                  <span style={{ color:'#c9a96e' }}>Save the Most.</span>
                </div>
                <button className="hero-cta">Get Discount →</button>
              </div>
              <div className="hero-emoji-stack">🎧📺👟</div>
            </div>

            {/* Seasonal Card */}
            <div className="bcard bcard-yellow">
              <div>
                <div className="yellow-label">SEASON PICKS</div>
                <div className="yellow-title">Summer's<br />Weekend</div>
                <div className="yellow-sub">keep it fresh</div>
              </div>
              <div className="arrow-link">↗</div>
            </div>
          </div>
        )}

        {/* CATEGORY TABS */}
        <div className="category-bar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-tab ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >{cat}</button>
          ))}
        </div>

        {/* TOOLBAR */}
        <div className="toolbar">
          <div>
            <p className="results-count">
              {searchTerm ? `Results for "${searchTerm}"` : category === 'All' ? 'All Products' : category}
            </p>
            {!loading && (
              <p className="results-sub">{filteredProducts.length} items found</p>
            )}
          </div>
          <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* PRODUCTS GRID */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p style={{ marginTop:16, color:'#888' }}>Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize:64 }}>🔍</div>
            <h3>No products found</h3>
            <p style={{ color:'#888' }}>Try adjusting filters or search terms</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <ProductCard
                key={product._id}
                product={product}
                wishlistIds={wishlistIds}
                onWishlistToggle={handleWishlistToggle}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
