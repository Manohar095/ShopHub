import { useState, useEffect, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import './AdminPage.css';

const EMPTY_FORM = {
  name: '', brand: '', description: '', price: '', origPrice: '',
  category: 'Electronics', emoji: '📦', stock: '', maxStock: '100',
  rating: '4.0', reviewCount: '0', soldLastMonth: '0',
  highlights: '', specs: ''
};

const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Books', 'Toys'];

export default function AdminPage() {
  const [tab, setTab]                       = useState('products');
  const [products, setProducts]             = useState([]);
  const [orders, setOrders]                 = useState([]);
  const [loading, setLoading]               = useState(true);
  const [form, setForm]                     = useState(EMPTY_FORM);
  const [editId, setEditId]                 = useState(null);
  const [showForm, setShowForm]             = useState(false);
  const [images, setImages]                 = useState([]);
  const [previews, setPreviews]             = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [saving, setSaving]                 = useState(false);
  const fileRef                             = useRef();

  useEffect(() => {
    if (tab === 'products') fetchProducts();
    if (tab === 'orders')   fetchOrders();
  }, [tab]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products');
      setProducts(data.products);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders');
      setOrders(data.orders);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const seedProducts = async () => {
    try {
      const { data } = await api.post('/products/seed/load');
      toast.success(data.message);
      fetchProducts();
    } catch {
      toast.error('Seed failed');
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) { toast.error('Maximum 5 images allowed'); return; }
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();

      formData.append('name',          form.name);
      formData.append('brand',         form.brand);
      formData.append('description',   form.description);
      formData.append('price',         form.price);
      formData.append('origPrice',     form.origPrice);
      formData.append('category',      form.category);
      formData.append('emoji',         form.emoji);
      formData.append('stock',         form.stock);
      formData.append('maxStock',      form.maxStock);
      formData.append('rating',        form.rating);
      formData.append('reviewCount',   form.reviewCount);
      formData.append('soldLastMonth', form.soldLastMonth);

      const highlightsArr = form.highlights
        ? form.highlights.split('\n').map(h => h.trim()).filter(Boolean)
        : [];
      formData.append('highlights', JSON.stringify(highlightsArr));

      const specsArr = form.specs
        ? form.specs.split('\n').filter(Boolean).map(line => {
            const [key, ...rest] = line.split(':');
            return { key: key.trim(), value: rest.join(':').trim() };
          })
        : [];
      formData.append('specs', JSON.stringify(specsArr));

      images.forEach(img => formData.append('images', img));

      if (editId) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (editId) {
        await api.put(`/products/${editId}`, formData, config);
        toast.success('Product updated successfully!');
      } else {
        await api.post('/products', formData, config);
        toast.success('Product added successfully!');
      }

      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditId(null);
      setImages([]);
      setPreviews([]);
      setExistingImages([]);
      fetchProducts();

    } catch (err) {
      console.error('Save error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Save failed — check console F12');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p) => {
    setForm({
      name: p.name, brand: p.brand, description: p.description,
      price: p.price, origPrice: p.origPrice, category: p.category,
      emoji: p.emoji || '📦', stock: p.stock, maxStock: p.maxStock,
      rating: p.rating, reviewCount: p.reviewCount || 0,
      soldLastMonth: p.soldLastMonth || 0,
      highlights: (p.highlights || []).join('\n'),
      specs: (p.specs || []).map(s => `${s.key}: ${s.value}`).join('\n')
    });
    setExistingImages(p.images || []);
    setImages([]);
    setPreviews([]);
    setEditId(p._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}"?`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product removed');
      fetchProducts();
    } catch {
      toast.error('Delete failed');
    }
  };

  const removeExistingImage = (url) => {
    setExistingImages(prev => prev.filter(i => i !== url));
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success('Order status updated');
      fetchOrders();
    } catch {
      toast.error('Update failed');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditId(null);
    setImages([]);
    setPreviews([]);
    setExistingImages([]);
  };

  return (
    <div className="container admin-page">

      <div className="admin-header">
        <h1 className="page-title">Admin Panel</h1>
        <div className="admin-tabs">
          <button className={`tab-btn ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>Products</button>
          <button className={`tab-btn ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>Orders</button>
        </div>
      </div>

      {tab === 'products' && (
        <>
          <div className="admin-toolbar">
            <button className="btn btn-primary" onClick={() => { if (showForm) { handleCancel(); } else { handleCancel(); setShowForm(true); } }}>
              {showForm ? 'Cancel' : '+ Add Product'}
            </button>
            <button className="btn btn-outline" onClick={seedProducts}>Load Sample Products</button>
            <span className="text-muted text-sm">{products.length} products</span>
          </div>

          {showForm && (
            <div className="product-form card">
              <h2 className="section-heading">{editId ? 'Edit Product' : 'Add New Product'}</h2>
              <form onSubmit={handleSave}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input className="form-input" placeholder="e.g. Samsung 65 inch TV" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Brand *</label>
                    <input className="form-input" placeholder="e.g. Samsung" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Emoji</label>
                    <input className="form-input" value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sale Price (Rs) *</label>
                    <input type="number" min="0" className="form-input" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Original Price (Rs) *</label>
                    <input type="number" min="0" className="form-input" value={form.origPrice} onChange={e => setForm({ ...form, origPrice: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock *</label>
                    <input type="number" min="0" className="form-input" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Stock</label>
                    <input type="number" min="0" className="form-input" value={form.maxStock} onChange={e => setForm({ ...form, maxStock: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rating (0-5)</label>
                    <input type="number" step="0.1" min="0" max="5" className="form-input" value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Review Count</label>
                    <input type="number" min="0" className="form-input" value={form.reviewCount} onChange={e => setForm({ ...form, reviewCount: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sold Last Month</label>
                    <input type="number" min="0" className="form-input" value={form.soldLastMonth} onChange={e => setForm({ ...form, soldLastMonth: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="form-input" rows={3} placeholder="Describe the product..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Highlights (one per line)</label>
                  <textarea className="form-input" rows={4} placeholder={"4K UHD Display\nBuilt-in Netflix\nVoice Control"} value={form.highlights} onChange={e => setForm({ ...form, highlights: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Specifications (Key: Value — one per line)</label>
                  <textarea className="form-input" rows={4} placeholder={"Display: 65 inch 4K\nWarranty: 1 Year"} value={form.specs} onChange={e => setForm({ ...form, specs: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Product Images (up to 5)</label>
                  <input type="file" ref={fileRef} multiple accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageChange} style={{ display: 'none' }} />
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current.click()}>
                    Choose Images
                  </button>
                  {images.length > 0 && (
                    <p className="text-sm text-muted" style={{ marginTop: 6 }}>{images.length} image(s) selected</p>
                  )}
                  {previews.length > 0 && (
                    <div className="img-previews">
                      {previews.map((p, i) => <img key={i} src={p} alt={`preview ${i + 1}`} className="img-preview" />)}
                    </div>
                  )}
                  {existingImages.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <p className="text-sm text-muted" style={{ marginBottom: 6 }}>Existing images:</p>
                      <div className="img-previews">
                        {existingImages.map((url, i) => (
                          <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                            <img src={url.startsWith('http') ? url : `http://localhost:5000${url}`} alt={`existing ${i + 1}`} className="img-preview" />
                            <button type="button" onClick={() => removeExistingImage(url)} style={{ position: 'absolute', top: 2, right: 2, background: 'red', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer' }}>x</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : editId ? 'Save Changes' : 'Add Product'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={handleCancel}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <p style={{ fontSize: 48 }}>📦</p>
              <p className="font-500" style={{ marginTop: 12 }}>No products yet — click Load Sample Products</p>
            </div>
          ) : (
            <div className="admin-table-wrap card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Sold/Month</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {p.images?.[0]
                            ? <img src={p.images[0].startsWith('http') ? p.images[0] : `http://localhost:5000${p.images[0]}`} alt={p.name} style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--gray-200)', background: 'var(--gray-50)' }} />
                            : <span style={{ fontSize: 28 }}>{p.emoji}</span>
                          }
                          <div>
                            <p className="font-500" style={{ fontSize: 14 }}>{p.name}</p>
                            <p className="text-sm text-muted">{p.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-primary">{p.category}</span></td>
                      <td>
                        <p className="font-500">Rs.{p.price.toLocaleString()}</p>
                        <p className="text-sm text-muted" style={{ textDecoration: 'line-through' }}>Rs.{p.origPrice.toLocaleString()}</p>
                      </td>
                      <td>
                        <span className={`badge ${p.stock === 0 ? 'badge-danger' : p.stock <= 5 ? 'badge-warning' : 'badge-success'}`}>
                          {p.stock === 0 ? 'Sold Out' : p.stock}
                        </span>
                      </td>
                      <td><span style={{ fontSize: 13 }}>{p.soldLastMonth || 0} bought</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => handleEdit(p)}>Edit</button>
                          <button className="btn btn-sm" style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: 'none' }} onClick={() => handleDelete(p._id, p.name)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'orders' && (
        loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ fontSize: 48 }}>🧾</p>
            <p className="font-500" style={{ marginTop: 12 }}>No orders yet</p>
          </div>
        ) : (
          <div className="admin-table-wrap card">
            <table className="admin-table">
              <thead>
                <tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 13 }}>#{o._id.slice(-8).toUpperCase()}</span></td>
                    <td><p className="font-500">{o.user?.name}</p><p className="text-sm text-muted">{o.user?.email}</p></td>
                    <td style={{ fontSize: 13 }}>{o.items.map(i => i.name).join(', ').slice(0, 50)}...</td>
                    <td className="font-500">Rs.{o.totalAmount?.toLocaleString()}</td>
                    <td><span className="badge badge-primary">{o.paymentMethod?.toUpperCase()}</span></td>
                    <td>
                      <select className="form-input" style={{ padding: '5px 8px', fontSize: 13, width: 'auto' }} value={o.status} onChange={e => handleStatusChange(o._id, e.target.value)}>
                        {['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

    </div>
  );
}