const express  = require('express');
const Razorpay = require('razorpay');
const crypto   = require('crypto');
const { protect } = require('../middleware/auth');
const router   = express.Router();

const getRazorpay = () => new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// POST /api/payment/create-order  — create Razorpay order
router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount } = req.body;  // amount in rupees
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),  // convert to paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`
    });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    res.status(500).json({ message: 'Payment gateway error: ' + err.message });
  }
});

// POST /api/payment/verify  — verify signature after payment
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }
    res.json({ verified: true, paymentId: razorpay_payment_id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
