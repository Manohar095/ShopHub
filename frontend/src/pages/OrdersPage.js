import { useState, useEffect } from 'react';
import api from '../api';
import './OrdersPage.css';

const STATUS_COLORS = {
  placed:     'badge-primary',
  confirmed:  'badge-primary',
  shipped:    'badge-warning',
  delivered:  'badge-success',
  cancelled:  'badge-danger',
};

export default function OrdersPage() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my')
      .then(({ data }) => setOrders(data.orders))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;

  if (!orders.length) return (
    <div className="empty-orders container">
      <div style={{ fontSize: 64 }}>📦</div>
      <h2>No orders yet</h2>
      <p className="text-muted">Your orders will appear here after you make a purchase.</p>
    </div>
  );

  return (
    <div className="container" style={{ padding: '24px 20px 60px' }}>
      <h1 className="page-title">My Orders</h1>
      <div className="orders-list">
        {orders.map(order => (
          <div key={order._id} className="order-card card">
            <div className="order-header">
              <div>
                <p className="text-sm text-muted">Order ID</p>
                <p className="order-id font-500">#{order._id.slice(-8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Date</p>
                <p className="font-500">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Payment</p>
                <p className="font-500 text-sm">{order.paymentMethod.toUpperCase()}</p>
              </div>
              <div>
                <span className={`badge ${STATUS_COLORS[order.status] || 'badge-primary'}`} style={{ fontSize: 13, padding: '5px 12px' }}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="order-items">
              {order.items.map((item, i) => (
                <div key={i} className="order-item">
                  <span className="order-emoji">{item.emoji}</span>
                  <div className="order-item-info">
                    <p className="font-500">{item.name}</p>
                    <p className="text-sm text-muted">Qty: {item.qty} × ₹{item.price?.toLocaleString()}</p>
                  </div>
                  <p className="font-500">₹{(item.price * item.qty).toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="order-footer">
              <p className="text-sm text-muted">📍 {order.deliveryAddress}</p>
              <p className="order-total">Total: <strong>₹{order.totalAmount?.toLocaleString()}</strong></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
