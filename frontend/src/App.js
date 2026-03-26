import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import ProductDetailPage from './pages/ProductDetailPage';
import NotificationsPage from './pages/NotificationsPage';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}
function AdminRoute({ children }) {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/" />;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/"                element={<HomePage />} />
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/register"        element={<RegisterPage />} />
            <Route path="/cart"            element={<CartPage />} />
            <Route path="/product/:id"     element={<ProductDetailPage />} />
            <Route path="/checkout"        element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
            <Route path="/orders"          element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
            <Route path="/profile"         element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/notifications"   element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
            <Route path="/admin"           element={<AdminRoute><AdminPage /></AdminRoute>} />
          </Routes>
          <Toaster position="bottom-center" toastOptions={{ style: { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize:'14px' } }} />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
