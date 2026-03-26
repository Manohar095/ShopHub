import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import './HomePage.css';

const CATEGORIES = ['All','Electronics','Fashion','Home','Beauty','Sports','Books','Toys'];
const SORTS = [
  { value: '',           label: 'Relevance'   },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating',     label: 'Top Rated'   },
  { value: 'newest',     label: 'Newest First' },
];

export default function HomePage() {
  const { user }               = useAuth();
  const [searchParams]         = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [category, setCategory] = useState('All');
  const [sort, setSort]        = useState('');
  const [wishlistIds, setWishlistIds] = useState([]);

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
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
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

  const handleWishlistToggle = (productId) => {
    setWishlistIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  return (
    <div className="home-page">
      {/* Hero Banner */}
      {!searchTerm && (
        <div className="hero-banner">
          <div className="container">
            <h1 className="hero-title">India's Best Online Store</h1>
            <p className="hero-sub">Millions of products. Unbeatable prices. Fast delivery.</p>
            <div className="hero-badges">
              <span>🚚 Free Delivery</span>
              <span>🔄 Easy Returns</span>
              <span>🔒 Secure Payments</span>
              <span>⭐ Top Brands</span>
            </div>
          </div>
        </div>
      )}

      <div className="container">
        {/* Category tabs */}
        <div className="category-bar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-tab ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >{cat}</button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <p className="results-count">
            {searchTerm ? `Results for "${searchTerm}"` : category === 'All' ? 'All Products' : category}
            {!loading && <span className="text-muted"> — {products.length} items</span>}
          </p>
          <select className="sort-select form-input" value={sort} onChange={e => setSort(e.target.value)} style={{ width: 'auto' }}>
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p className="text-muted" style={{ marginTop: 16 }}>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 64 }}>🔍</div>
            <h3>No products found</h3>
            <p className="text-muted">Try a different search or category</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <ProductCard
                key={product._id}
                product={product}
                wishlistIds={wishlistIds}
                onWishlistToggle={handleWishlistToggle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
