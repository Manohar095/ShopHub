import { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './Modal.css';

export default function NotifyModal({ productId, productName, onClose }) {
  const { user }          = useAuth();
  const navigate          = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login first'); navigate('/login'); onClose(); return; }
    setLoading(true);
    try {
      const { data } = await api.post(`/products/${productId}/notify`);
      toast.success(data.message);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-icon">🔔</div>
        <h2 className="modal-title">Notify Me</h2>
        <p className="modal-desc">
          We'll send a notification to your account the moment <strong>{productName}</strong> is back in stock.
        </p>
        {user ? (
          <form onSubmit={handleSubmit}>
            <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
              Notification will be sent to: <strong>{user.email}</strong>
            </p>
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Setting alert...' : '🔔 Notify Me When Available'}
            </button>
          </form>
        ) : (
          <div>
            <p className="text-sm text-muted" style={{ marginBottom: 16 }}>Please login to set a restock alert.</p>
            <button className="btn btn-primary w-full" onClick={() => { navigate('/login'); onClose(); }}>
              Login to Set Alert
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
