import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import './ProductCard.css';

const BG_COLORS = ['bg-blue','bg-purple','bg-pink','bg-green','bg-orange','bg-tan'];

function getBg(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return BG_COLORS[Math.abs(hash) % BG_COLORS.length];
}

export default function ProductCard({ product, wishlistIds = [], onWishlistToggle }) {
  const { addToCart } = useCart();
  const { user }      = useAuth();
  const navigate      = useNavigate();
  const inWishlist    = wishlistIds.includes(product._id);
  const stockPct      = product.maxStock > 0 ? Math.round((product.stock / product.maxStock) * 100) : 0;
  const discount      = Math.round(((product.origPrice - product.price) / product.origPrice) * 100);
  const stockColor    = stockPct > 50 ? '#c9a96e' : stockPct > 15 ? '#c9a96e' : '#e74c3c';
  const bg            = getBg(product.name);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  const handleNotify = (e) => {
    e.stopPropagation();
    if (!user) { toast.error('Please login first'); navigate('/login'); return; }
    api.post(`/products/${product._id}/notify`)
      .then(() => toast.success('You will be notified when back in stock!'))
      .catch(err => toast.error(err.response?.data?.message || 'Error'));
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!user) { toast.error('Please login to save wishlist'); return; }
    try {
      await api.post(`/wishlist/${product._id}`);
      onWishlistToggle?.(product._id);
      toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist!');
    } catch { toast.error('Something went wrong'); }
  };

  return (
    <div className="product-card" onClick={() => navigate(`/product/${product._id}`)}>

      {/* Image area */}
      <div className={`product-thumb ${bg}`}>
        {product.images?.length > 0
          ? <img src={product.images[0].startsWith('http') ? product.images[0] : `http://localhost:5000${product.images[0]}`} alt={product.name} className="product-img" />
          : <span className="product-emoji">{product.emoji}</span>
        }
        {discount > 0 && <span className="discount-tag">{discount}% off</span>}
        <button className={`wish-btn ${inWishlist ? 'active' : ''}`} onClick={handleWishlist}>
          {inWishlist ? '♥' : '♡'}
        </button>
      </div>

      {/* Card body */}
      <div className="product-body">
        {product.soldLastMonth > 0 && (
          <div className="bought-pill">🔥 {product.soldLastMonth} bought</div>
        )}
        <p className="product-brand">{product.brand}</p>
        <h3 className="product-name">{product.name}</h3>

        <div className="rating-row">
          <span className="rating-pill">★ {product.rating}</span>
          <span className="review-count">({(product.reviewCount || 0).toLocaleString()})</span>
        </div>

        <div className="price-row">
          <span className="price">₹{product.price.toLocaleString()}</span>
          <span className="orig-price">₹{product.origPrice.toLocaleString()}</span>
        </div>

        {product.stock > 0 ? (
          <div className="stock-section">
            <div className="stock-bar">
              <div className="stock-fill" style={{ width: `${stockPct}%`, background: stockColor }} />
            </div>
            <p className="stock-label" style={{ color: product.stock <= 10 ? '#e74c3c' : undefined }}>
              {product.stock <= 10 ? `Only ${product.stock} left!` : `${product.stock} in stock`}
            </p>
          </div>
        ) : (
          <div className="sold-out-badge">Sold Out</div>
        )}

        {product.stock > 0 ? (
          <button className="add-btn" onClick={handleAddToCart}>🛒 Add to Cart</button>
        ) : (
          <button className="notify-btn" onClick={handleNotify}>🔔 Notify Me</button>
        )}
      </div>
    </div>
  );
}
