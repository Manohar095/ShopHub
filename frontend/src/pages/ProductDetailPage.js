import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import NotifyModal from '../components/NotifyModal';
import ReviewSection from '../components/ReviewSection';
import './ProductDetailPage.css';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [notify, setNotify]     = useState(false);
  const [qty, setQty]           = useState(1);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(({ data }) => { setProduct(data.product); setLoading(false); })
      .catch(() => { toast.error('Product not found'); navigate('/'); });
  }, [id, navigate]);

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><div className="spinner"/></div>;
  if (!product) return null;

  const discount = Math.round(((product.origPrice - product.price) / product.origPrice) * 100);
  const stockPct = product.maxStock > 0 ? Math.round((product.stock / product.maxStock) * 100) : 0;
  const stockColor = stockPct > 50 ? 'var(--success)' : stockPct > 15 ? 'var(--warning)' : 'var(--danger)';
  const mainImage = product.images?.[activeImg];

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  const handleBuyNow = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    navigate('/checkout');
  };

  return (
    <div className="container pdp-page">
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

      <div className="pdp-layout">
        {/* Image Gallery */}
        <div className="pdp-gallery">
          <div className="pdp-main-img">
            {mainImage
              ? <img src={mainImage.startsWith('http') ? mainImage : `http://localhost:5000${mainImage}`} alt={product.name} />
              : <span className="pdp-emoji">{product.emoji}</span>
            }
            {discount > 0 && <span className="pdp-discount-tag">{discount}% off</span>}
          </div>
          {product.images?.length > 1 && (
            <div className="pdp-thumbs">
              {product.images.map((img, i) => (
                <div key={i} className={`pdp-thumb ${activeImg === i ? 'active' : ''}`} onClick={() => setActiveImg(i)}>
                  <img src={img} alt={`view ${i+1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="pdp-info">
          <p className="pdp-brand">{product.brand}</p>
          <h1 className="pdp-title">{product.name}</h1>

          {/* Rating row */}
          <div className="pdp-rating-row">
            <span className="rating-pill">★ {product.rating}</span>
            <span className="text-sm text-muted">({product.reviewCount?.toLocaleString()} reviews)</span>
            {product.soldLastMonth > 0 && (
              <span className="bought-badge">🔥 {product.soldLastMonth} bought last month</span>
            )}
          </div>

          {/* Price */}
          <div className="pdp-price-box">
            <span className="pdp-price">₹{product.price.toLocaleString()}</span>
            <span className="pdp-orig">₹{product.origPrice.toLocaleString()}</span>
            {discount > 0 && <span className="pdp-save">Save ₹{(product.origPrice - product.price).toLocaleString()}</span>}
          </div>

          {/* Stock */}
          {product.stock > 0 ? (
            <div className="pdp-stock">
              <div className="stock-bar"><div className="stock-fill" style={{ width:`${stockPct}%`, background: stockColor }} /></div>
              {product.stock <= 10
                ? <p className="text-sm" style={{ color:'var(--danger)' }}>Only {product.stock} left in stock!</p>
                : <p className="text-sm" style={{ color:'var(--success)' }}>In Stock ({product.stock} available)</p>
              }
            </div>
          ) : (
            <div className="pdp-soldout">
              <span className="badge badge-danger" style={{ fontSize:14, padding:'6px 14px' }}>Sold Out</span>
            </div>
          )}

          {/* Qty + Buttons */}
          {product.stock > 0 ? (
            <>
              <div className="pdp-qty-row">
                <span className="text-sm text-muted">Qty:</span>
                <div className="qty-controls">
                  <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q-1))}>−</button>
                  <span className="qty-val">{qty}</span>
                  <button className="qty-btn" onClick={() => setQty(q => Math.min(product.stock, q+1))}>+</button>
                </div>
              </div>
              <div className="pdp-actions">
                <button className="btn btn-outline pdp-cart-btn" onClick={handleAddToCart}>🛒 Add to Cart</button>
                <button className="btn btn-primary pdp-buy-btn" onClick={handleBuyNow}>⚡ Buy Now</button>
              </div>
            </>
          ) : (
            <button className="btn pdp-notify-full" onClick={() => {
              if (!user) { toast.error('Please login first'); navigate('/login'); return; }
              setNotify(true);
            }}>🔔 Notify Me When Available</button>
          )}

          {/* Highlights */}
          {product.highlights?.length > 0 && (
            <div className="pdp-highlights">
              <h3>Highlights</h3>
              <ul>{product.highlights.map((h, i) => <li key={i}>✓ {h}</li>)}</ul>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="pdp-section card">
        <h2 className="pdp-section-title">Product Description</h2>
        <p className="pdp-description">{product.description}</p>
      </div>

      {/* Specifications */}
      {product.specs?.length > 0 && (
        <div className="pdp-section card">
          <h2 className="pdp-section-title">Specifications</h2>
          <table className="specs-table">
            <tbody>
              {product.specs.map((s, i) => (
                <tr key={i}>
                  <td className="spec-key">{s.key}</td>
                  <td className="spec-val">{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reviews */}
      <ReviewSection productId={id} />

      {notify && <NotifyModal productId={product._id} productName={product.name} onClose={() => setNotify(false)} />}
    </div>
  );
}
