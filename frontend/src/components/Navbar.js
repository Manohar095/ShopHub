import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api';
import toast from 'react-hot-toast';
import './Navbar.css';

export default function Navbar() {
  const { user, logout }   = useAuth();
  const { totalItems }     = useCart();
  const navigate           = useNavigate();
  const [search, setSearch]         = useState('');
  const [menuOpen, setMenuOpen]     = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    api.get('/notifications').then(({ data }) => setUnreadCount(data.unreadCount)).catch(() => {});
    const interval = setInterval(() => {
      api.get('/notifications').then(({ data }) => setUnreadCount(data.unreadCount)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/?search=${encodeURIComponent(search)}`);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🛍️</span>
          <span className="logo-text">ShopHub</span>
        </Link>

        <form className="navbar-search" onSubmit={handleSearch}>
          <input type="text" placeholder="Search products, brands and more..." value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="search-btn">🔍</button>
        </form>

        <div className="navbar-actions">
          {user ? (
            <>
              <Link to="/notifications" className="cart-btn" title="Notifications">
                🔔
                {unreadCount > 0 && <span className="cart-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </Link>
              <div className="user-menu">
                <button className="user-btn" onClick={() => setMenuOpen(o => !o)}>
                  <span className="user-avatar">{user.name[0].toUpperCase()}</span>
                  <span className="hide-mobile">{user.name.split(' ')[0]}</span>
                  <span style={{ fontSize: 11 }}>▾</span>
                </button>
                {menuOpen && (
                  <div className="dropdown">
                    <Link to="/profile"  onClick={() => setMenuOpen(false)}>👤 My Profile</Link>
                    <Link to="/orders"   onClick={() => setMenuOpen(false)}>📦 My Orders</Link>
                    <Link to="/notifications" onClick={() => setMenuOpen(false)}>
                      🔔 Notifications {unreadCount > 0 && <span style={{ background:'var(--accent)', color:'#fff', borderRadius:'50%', padding:'1px 6px', fontSize:11, marginLeft:4 }}>{unreadCount}</span>}
                    </Link>
                    {user.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)}>⚙️ Admin Panel</Link>}
                    <button onClick={handleLogout} className="dropdown-logout">🚪 Logout</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-links">
              <Link to="/login"    className="btn btn-outline btn-sm hide-mobile">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </div>
          )}
          <Link to="/cart" className="cart-btn">
            🛒
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>
        </div>
      </div>
    </nav>
  );
}
