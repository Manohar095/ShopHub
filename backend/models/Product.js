const mongoose = require('mongoose');

const specSchema = new mongoose.Schema({
  key:   { type: String },
  value: { type: String }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  brand:       { type: String, required: true },
  description: { type: String, required: true },
  highlights:  [{ type: String }],
  specs:       [specSchema],
  price:       { type: Number, required: true, min: 0 },
  origPrice:   { type: Number, required: true, min: 0 },
  category:    { type: String, required: true, enum: ['Electronics','Fashion','Home','Beauty','Sports','Books','Toys'] },
  images:      [{ type: String }],
  emoji:       { type: String, default: '📦' },
  stock:       { type: Number, required: true, default: 0, min: 0 },
  maxStock:    { type: Number, required: true, default: 100 },
  rating:      { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  soldLastMonth: { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
  notifyList:  [{ type: String }]
}, { timestamps: true });

productSchema.virtual('discount').get(function () {
  return Math.round(((this.origPrice - this.price) / this.origPrice) * 100);
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
