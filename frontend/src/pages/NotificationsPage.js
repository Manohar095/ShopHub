import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import './NotificationsPage.css';

const TYPE_ICONS = { restock: '🔔', order: '📦', promo: '🎁', system: 'ℹ️' };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/notifications')
      .then(({ data }) => setNotifications(data.notifications))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All marked as read');
  };

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  };

  const deleteNotif = async (id) => {
    await api.delete(`/notifications/${id}`);
    setNotifications(prev => prev.filter(n => n._id !== id));
  };

  const unread = notifications.filter(n => !n.read).length;

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><div className="spinner"/></div>;

  return (
    <div className="container notif-page">
      <div className="notif-header">
        <h1 className="page-title">
          Notifications
          {unread > 0 && <span className="notif-count-badge">{unread}</span>}
        </h1>
        {unread > 0 && (
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>Mark all as read</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-notif">
          <div style={{ fontSize: 64 }}>🔔</div>
          <h2>No notifications yet</h2>
          <p className="text-muted">We'll notify you about restocks, orders and more.</p>
        </div>
      ) : (
        <div className="notif-list">
          {notifications.map(notif => (
            <div key={notif._id} className={`notif-item card ${!notif.read ? 'unread' : ''}`} onClick={() => markRead(notif._id)}>
              <div className="notif-icon">{TYPE_ICONS[notif.type] || '🔔'}</div>
              <div className="notif-body">
                <div className="notif-title">{notif.title}</div>
                <div className="notif-message">{notif.message}</div>
                <div className="notif-time text-sm text-muted">
                  {new Date(notif.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                </div>
                {notif.product && (
                  <button className="btn btn-outline btn-sm notif-shop-btn" onClick={e => { e.stopPropagation(); navigate(`/product/${notif.product._id || notif.product}`); }}>
                    Shop Now →
                  </button>
                )}
              </div>
              {!notif.read && <div className="unread-dot" />}
              <button className="notif-delete" onClick={e => { e.stopPropagation(); deleteNotif(notif._id); }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
