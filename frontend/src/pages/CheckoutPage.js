import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import './CheckoutPage.css';

const PAYMENT_METHODS = [
  { id: 'upi',        label: 'UPI', desc: 'GPay / PhonePe / Paytm', icon: '📱' },
  { id: 'card',       label: 'Credit / Debit Card',    desc: 'Visa, Mastercard, Rupay', icon: '💳' },
  { id: 'netbanking', label: 'Net Banking', desc: 'All major banks supported', icon: '🏦' },
  { id: 'cod',        label: 'Cash on Delivery', desc: 'Pay when you receive', icon: '💵' },
];

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useCart();
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [address, setAddress]   = useState(user?.address || '');
  const [method, setMethod]     = useState('upi');
  const [loading, setLoading]   = useState(false);

  const handlePlaceOrder = async () => {
    if (!address.trim()) { toast.error('Please enter a delivery address'); return; }
    setLoading(true);
    try {
      if (method === 'cod') {
        await placeOrder(null, null);
      } else {
        await startRazorpay();
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const startRazorpay = async () => {
    const { data } = await api.post('/payment/create-order', { amount: totalPrice });

    return new Promise((resolve, reject) => {
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'ShopHub',
        description: 'Order Payment',
        order_id: data.orderId,
        handler: async (response) => {
          try {
            await api.post('/payment/verify', response);
            await placeOrder(data.orderId, response.razorpay_payment_id);
            resolve();
          } catch (err) { reject(err); }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: '#1a4fa0' },
        modal: { ondismiss: () => reject(new Error('Payment cancelled')) }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  };

  const placeOrder = async (razorpayOrderId, razorpayPaymentId) => {
    const items = cart.map(i => ({ productId: i._id, qty: i.qty }));
    await api.post('/orders', {
      items,
      paymentMethod: method,
      deliveryAddress: address,
      razorpayOrderId,
      razorpayPaymentId,
    });
    clearCart();
    toast.success('🎉 Order placed successfully!');
    navigate('/orders');
  };

  if (!cart.length) { navigate('/cart'); return null; }

  return (
    <div className="container" style={{ padding: '24px 20px' }}>
      <h1 className="page-title">Checkout</h1>
      <div className="checkout-layout">

        {/* Left: Address + Payment */}
        <div>
          {/* Delivery Address */}
          <div className="checkout-section card">
            <h2 className="section-heading">📍 Delivery Address</h2>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Enter your full delivery address including pincode..."
              value={address}
              onChange={e => setAddress(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Payment Methods */}
          <div className="checkout-section card" style={{ marginTop: 16 }}>
            <h2 className="section-heading">💳 Payment Method</h2>
            <div className="payment-options">
              {PAYMENT_METHODS.map(pm => (
                <label key={pm.id} className={`payment-option ${method === pm.id ? 'selected' : ''}`}>
                  <input type="radio" name="payment" value={pm.id} checked={method === pm.id} onChange={() => setMethod(pm.id)} />
                  <span className="pm-icon">{pm.icon}</span>
                  <div>
                    <p className="pm-label">{pm.label}</p>
                    <p className="pm-desc text-muted text-sm">{pm.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Order summary */}
        <div className="checkout-summary card">
          <h2 className="section-heading">🧾 Order Summary</h2>
          <div className="checkout-items">
            {cart.map(item => (
              <div key={item._id} className="checkout-item">
                <span className="checkout-emoji">{item.emoji}</span>
                <div className="checkout-item-info">
                  <p className="checkout-item-name">{item.name}</p>
                  <p className="text-sm text-muted">Qty: {item.qty}</p>
                </div>
                <span className="checkout-item-price">₹{(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="checkout-total-rows">
            <div className="summary-row"><span>Subtotal</span><span>₹{totalPrice.toLocaleString()}</span></div>
            <div className="summary-row"><span>Delivery</span><span style={{ color: 'var(--success)' }}>FREE</span></div>
          </div>
          <div className="checkout-grand-total">
            <span>Total to Pay</span>
            <span>₹{totalPrice.toLocaleString()}</span>
          </div>
          <button className="btn btn-primary w-full btn-lg" onClick={handlePlaceOrder} disabled={loading} style={{ marginTop: 20 }}>
            {loading ? 'Processing...' : method === 'cod' ? '📦 Place Order' : `💳 Pay ₹${totalPrice.toLocaleString()}`}
          </button>
          <p className="text-sm text-muted" style={{ textAlign: 'center', marginTop: 10 }}>🔒 Secure payment powered by Razorpay</p>
        </div>
      </div>
    </div>
  );
}
