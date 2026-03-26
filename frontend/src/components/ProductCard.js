import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import './ProductCard.css';

export default function ProductCard({ product, wishlistIds = [], onWishlistToggle }) {
  const { addToCart }       = useCart();
  const { user }            = useAuth();
  const navigate            = useNavigate();
  const inWishlist          = wishlistIds.includes(product._id);
  const stockPct            = product.maxStock > 0 ? Math.round((product.stock / product.maxStock) * 100) : 0;
  const discount            = Math.round(((product.origPrice - product.price) / product.origPrice) * 100);
  const stockColor          = stockPct > 50 ? 'var(--success)' : stockPct > 15 ? 'var(--warning)' : 'var(--danger)';

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
    <div className="product-card card" onClick={() => navigate(`/product/${product._id}`)}>
      <button className={`wish-btn ${inWishlist ? 'active' : ''}`} onClick={handleWishlist}>
        {inWishlist ? '♥' : '♡'}
      </button>

      <div className="product-thumb">
        {product.images?.length > 0
          ? <img src={product.images[0].startsWith('http') ? product.images[0] : `http://localhost:5000${product.images[0]}`} alt={product.name} className="product-img" />
          : <span className="product-emoji">{product.emoji}</span>
        }
        {discount > 0 && <span className="discount-tag">{discount}% off</span>}
        {product.soldLastMonth > 0 && (
          <span className="sold-tag">🔥 {product.soldLastMonth} bought</span>
        )}
      </div>

      <div className="product-body">
        <p className="product-brand text-sm text-muted">{product.brand}</p>
        <h3 className="product-name">{product.name}</h3>

        <div className="rating-row">
          <span className="rating-pill">★ {product.rating}</span>
          <span className="text-sm text-muted">({(product.reviewCount || product.reviews || 0).toLocaleString()})</span>
        </div>

        <div className="price-row">
          <span className="price">₹{product.price.toLocaleString()}</span>
          <span className="orig-price text-sm text-muted">₹{product.origPrice.toLocaleString()}</span>
        </div>

        {product.stock > 0 ? (
          <div className="stock-section">
            <div className="stock-bar">
              <div className="stock-fill" style={{ width:`${stockPct}%`, background:stockColor }} />
            </div>
            {product.stock <= 10
              ? <p className="text-sm" style={{ color:'var(--danger)' }}>Only {product.stock} left!</p>
              : <p className="text-sm text-muted">{product.stock} in stock</p>
            }
          </div>
        ) : (
          <div className="sold-out-row"><span className="badge badge-danger">Sold Out</span></div>
        )}

        {product.stock > 0 ? (
          <button className="btn btn-outline w-full add-btn" onClick={handleAddToCart}>🛒 Add to Cart</button>
        ) : (
          <button className="btn w-full notify-btn" onClick={handleNotify}>🔔 Notify Me</button>
        )}
      </div>
    </div>
  );
}
