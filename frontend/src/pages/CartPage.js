import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './CartPage.css';

export default function CartPage() {
  const { cart, removeFromCart, updateQty, totalPrice } = useCart();
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const handleCheckout = () => {
    if (!user) { toast.error('Please login to checkout'); navigate('/login'); return; }
    navigate('/checkout');
  };

  if (!cart.length) return (
    <div className="empty-cart container">
      <div style={{ fontSize: 72 }}>🛒</div>
      <h2>Your cart is empty</h2>
      <p className="text-muted">Add products to start shopping</p>
      <Link to="/" className="btn btn-primary btn-lg" style={{ marginTop: 24 }}>Browse Products</Link>
    </div>
  );

  return (
    <div className="container" style={{ padding: '24px 20px' }}>
      <h1 className="page-title">Shopping Cart ({cart.length} items)</h1>

      <div className="cart-layout">
        {/* Items */}
        <div className="cart-items">
          {cart.map(item => (
            <div key={item._id} className="cart-item card">
              <div className="cart-item-thumb">{item.emoji}</div>
              <div className="cart-item-info">
                <p className="text-sm text-muted">{item.brand}</p>
                <h3 className="cart-item-name">{item.name}</h3>
                <p className="cart-item-price">₹{item.price.toLocaleString()}</p>
                <div className="qty-controls">
                  <button className="qty-btn" onClick={() => updateQty(item._id, item.qty - 1)}>−</button>
                  <span className="qty-val">{item.qty}</span>
                  <button className="qty-btn" onClick={() => updateQty(item._id, item.qty + 1)} disabled={item.qty >= item.stock}>+</button>
                  <button className="remove-btn" onClick={() => { removeFromCart(item._id); toast.success('Removed from cart'); }}>🗑 Remove</button>
                </div>
              </div>
              <div className="cart-item-subtotal">
                ₹{(item.price * item.qty).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="cart-summary card">
          <h2 className="summary-title">Order Summary</h2>
          <div className="summary-rows">
            <div className="summary-row"><span>Subtotal</span><span>₹{totalPrice.toLocaleString()}</span></div>
            <div className="summary-row"><span>Delivery</span><span style={{ color: 'var(--success)' }}>FREE</span></div>
            <div className="summary-row"><span>Discount</span><span style={{ color: 'var(--success)' }}>–₹0</span></div>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>₹{totalPrice.toLocaleString()}</span>
          </div>
          <button className="btn btn-primary w-full btn-lg" onClick={handleCheckout} style={{ marginTop: 16 }}>
            Proceed to Checkout →
          </button>
          <Link to="/" className="btn btn-outline w-full" style={{ marginTop: 10 }}>Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
