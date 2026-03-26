const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:     String,
  emoji:    String,
  price:    Number,
  qty:      { type: Number, required: true, min: 1 }
});

const orderSchema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:          [orderItemSchema],
  totalAmount:    { type: Number, required: true },
  paymentMethod:  { type: String, enum: ['upi','card','netbanking','cod'], required: true },
  paymentStatus:  { type: String, enum: ['pending','paid','failed'], default: 'pending' },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  deliveryAddress: { type: String, required: true },
  status: {
    type: String,
    enum: ['placed','confirmed','shipped','delivered','cancelled'],
    default: 'placed'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
