import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    name:    user?.name    || '',
    phone:   user?.phone   || '',
    address: user?.address || '',
  });
  const [loading, setLoading] = useState(false);
  const [pwForm, setPwForm]   = useState({ current: '', newPw: '', confirm: '' });

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/auth/profile', form);
      // Update local user
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, name: form.name }));
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = { padding: 28, marginBottom: 20 };
  const sectionTitle = { fontSize: 17, fontWeight: 700, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--gray-100)' };

  return (
    <div className="container" style={{ maxWidth: 680, padding: '32px 20px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>My Profile</h1>

      {/* Avatar */}
      <div className="card" style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--primary)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 700, flexShrink: 0,
        }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{user?.name}</h2>
          <p style={{ color: 'var(--gray-600)', fontSize: 14 }}>{user?.email}</p>
          <span className={`badge ${user?.role === 'admin' ? 'badge-primary' : 'badge-success'}`} style={{ marginTop: 6 }}>
            {user?.role === 'admin' ? '⚙️ Admin' : '🛍️ Customer'}
          </span>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="card" style={cardStyle}>
        <h2 style={sectionTitle}>Edit Profile</h2>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" value={user?.email} disabled
              style={{ background: 'var(--gray-100)', cursor: 'not-allowed' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input className="form-input" placeholder="+91 98765 43210" value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Default Delivery Address</label>
            <textarea className="form-input" rows={3} placeholder="House No, Street, City, State, PIN"
              value={form.address} onChange={e => setForm({...form, address: e.target.value})}
              style={{ resize: 'vertical' }} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : '💾 Save Changes'}
          </button>
        </form>
      </div>

      {/* Account Info */}
      <div className="card" style={cardStyle}>
        <h2 style={sectionTitle}>Account Info</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Account Type', value: user?.role === 'admin' ? 'Administrator' : 'Customer' },
            { label: 'Email Verified', value: '✅ Verified' },
            { label: 'Member Since', value: 'ShopHub Member' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 14 }}>
              <span style={{ color: 'var(--gray-600)' }}>{row.label}</span>
              <span style={{ fontWeight: 600 }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
