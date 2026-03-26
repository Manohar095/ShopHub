const express = require('express');
const Review  = require('../models/Review');
const Product = require('../models/Product');
const Order   = require('../models/Order');
const { protect } = require('../middleware/auth');
const router  = express.Router();

// GET /api/reviews/:productId
router.get('/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/reviews/:productId
router.post('/:productId', protect, async (req, res) => {
  try {
    const { rating, title, body } = req.body;
    if (!rating || !title || !body) return res.status(400).json({ message: 'All fields required' });
    const existing = await Review.findOne({ product: req.params.productId, user: req.user._id });
    if (existing) return res.status(400).json({ message: 'You already reviewed this product' });
    const verified = await Order.findOne({ user: req.user._id, 'items.product': req.params.productId, status: { $in: ['delivered'] } });
    const review = await Review.create({
      product: req.params.productId,
      user:    req.user._id,
      userName: req.user.name,
      rating, title, body,
      verified: !!verified
    });
    const all = await Review.find({ product: req.params.productId });
    const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
    await Product.findByIdAndUpdate(req.params.productId, { rating: Math.round(avg * 10) / 10, reviewCount: all.length });
    res.status(201).json({ review });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/reviews/:id/helpful
router.post('/:id/helpful', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    const idx = review.helpful.indexOf(req.user._id);
    if (idx === -1) review.helpful.push(req.user._id);
    else review.helpful.splice(idx, 1);
    await review.save();
    res.json({ helpful: review.helpful.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/reviews/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Not found' });
    if (review.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not allowed' });
    await review.deleteOne();
    res.json({ message: 'Review deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
