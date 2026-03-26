const express = require('express');
const Order   = require('../models/Order');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');
const router  = express.Router();

// POST /api/orders  — place order (reduces stock)
router.post('/', protect, async (req, res) => {
  try {
    const { items, paymentMethod, deliveryAddress, razorpayOrderId, razorpayPaymentId } = req.body;
    if (!items?.length) return res.status(400).json({ message: 'No items in order' });
    if (!deliveryAddress) return res.status(400).json({ message: 'Delivery address required' });

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.productId}` });
      if (product.stock < item.qty) return res.status(400).json({ message: `Insufficient stock for ${product.name}` });

      // Deduct stock
      product.stock -= item.qty;
      await product.save();

      orderItems.push({ product: product._id, name: product.name, emoji: product.emoji, price: product.price, qty: item.qty });
      totalAmount += product.price * item.qty;
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      razorpayOrderId,
      razorpayPaymentId,
      deliveryAddress
    });

    res.status(201).json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/my  — user's own orders
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('items.product', 'name emoji');
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders  — all orders (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email').populate('items.product', 'name');
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/status  — update status (admin)
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
