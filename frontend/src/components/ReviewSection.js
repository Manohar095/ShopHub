import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './ReviewSection.css';

const STARS = [1, 2, 3, 4, 5];

export default function ReviewSection({ productId }) {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ rating: 5, title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/reviews/${productId}`)
      .then(({ data }) => setReviews(data.reviews))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to review'); navigate('/login'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/reviews/${productId}`, form);
      setReviews(prev => [data.review, ...prev]);
      setShowForm(false);
      setForm({ rating: 5, title: '', body: '' });
      toast.success('Review submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review');
    } finally { setSubmitting(false); }
  };

  const handleHelpful = async (reviewId) => {
    if (!user) { toast.error('Please login'); return; }
    try {
      const { data } = await api.post(`/reviews/${reviewId}/helpful`);
      setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, helpful: Array(data.helpful).fill('') } : r));
    } catch {}
  };

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;
  const ratingCounts = [5,4,3,2,1].map(star => ({ star, count: reviews.filter(r => r.rating === star).length }));

  return (
    <div className="review-section card pdp-section">
      <h2 className="pdp-section-title">Customer Reviews</h2>

      {reviews.length > 0 && (
        <div className="review-summary">
          <div className="avg-rating-box">
            <span className="avg-number">{avgRating}</span>
            <div className="avg-stars">{STARS.map(s => <span key={s} className={s <= Math.round(avgRating) ? 'star filled' : 'star'}>★</span>)}</div>
            <span className="text-sm text-muted">{reviews.length} reviews</span>
          </div>
          <div className="rating-bars">
            {ratingCounts.map(({ star, count }) => (
              <div key={star} className="rating-bar-row">
                <span className="bar-label">{star} ★</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: reviews.length ? `${(count/reviews.length)*100}%` : '0%' }} /></div>
                <span className="bar-count text-sm text-muted">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="btn btn-outline write-review-btn" onClick={() => {
        if (!user) { toast.error('Please login to write a review'); navigate('/login'); return; }
        setShowForm(s => !s);
      }}>
        {showForm ? '✕ Cancel' : '✏️ Write a Review'}
      </button>

      {showForm && (
        <form className="review-form card" onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Your Review</h3>
          <div className="form-group">
            <label className="form-label">Rating</label>
            <div className="star-picker">
              {STARS.map(s => (
                <span key={s} className={`star-pick ${s <= form.rating ? 'filled' : ''}`} onClick={() => setForm({ ...form, rating: s })}>★</span>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Review Title</label>
            <input className="form-input" placeholder="Summarise your experience..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Your Review</label>
            <textarea className="form-input" rows={4} placeholder="Tell others what you think about this product..." value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : reviews.length === 0 ? (
        <div className="no-reviews">
          <p style={{ fontSize: 32 }}>💬</p>
          <p className="font-500">No reviews yet</p>
          <p className="text-sm text-muted">Be the first to review this product!</p>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map(review => (
            <div key={review._id} className="review-card">
              <div className="review-header">
                <div className="reviewer-avatar">{review.userName?.[0]?.toUpperCase()}</div>
                <div className="reviewer-info">
                  <div className="reviewer-name">{review.userName}</div>
                  <div className="review-meta">
                    <div className="review-stars">{STARS.map(s => <span key={s} className={s <= review.rating ? 'star filled' : 'star'}>★</span>)}</div>
                    {review.verified && <span className="verified-badge">✅ Verified Purchase</span>}
                    <span className="review-date text-sm text-muted">{new Date(review.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</span>
                  </div>
                </div>
              </div>
              <h4 className="review-title">{review.title}</h4>
              <p className="review-body">{review.body}</p>
              <button className="helpful-btn" onClick={() => handleHelpful(review._id)}>
                👍 Helpful ({review.helpful?.length || 0})
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
