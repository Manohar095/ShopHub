const express  = require('express');
const Product  = require('../models/Product');
const Order    = require('../models/Order');
const Notification = require('../models/Notification');
const User     = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { upload, cloudinary } = require('../middleware/upload');
const router   = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let filter = { isActive: true };
    if (category && category !== 'All') filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };
    let sortObj = {};
    if (sort === 'price_asc')  sortObj = { price: 1 };
    if (sort === 'price_desc') sortObj = { price: -1 };
    if (sort === 'rating')     sortObj = { rating: -1 };
    if (sort === 'newest')     sortObj = { createdAt: -1 };
    if (sort === 'popular')    sortObj = { soldLastMonth: -1 };
    const products = await Product.find(filter).sort(sortObj).select('-notifyList');
    res.json({ products });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('-notifyList');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ product });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, adminOnly, upload.array('images', 5), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files?.length) data.images = req.files.map(f => `/uploads/${f.filename}`);
    if (typeof data.highlights === 'string') data.highlights = JSON.parse(data.highlights);
    if (typeof data.specs === 'string')      data.specs = JSON.parse(data.specs);
    const product = await Product.create(data);
    res.status(201).json({ product });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', protect, adminOnly, upload.array('images', 5), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files?.length) {
      const newImages = req.files.map(f => `/uploads/${f.filename}`);
      const existing  = data.existingImages ? JSON.parse(data.existingImages) : [];
      data.images = [...existing, ...newImages];
    }
    if (typeof data.highlights === 'string') data.highlights = JSON.parse(data.highlights);
    if (typeof data.specs === 'string')      data.specs = JSON.parse(data.specs);
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (Number(data.stock) > 0 && product.notifyList?.length > 0) {
      await sendRestockNotifications(product);
      await Product.findByIdAndUpdate(req.params.id, { notifyList: [] });
    }
    res.json({ product });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Product removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/notify', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const user = await User.findById(req.user._id);
    if (!product.notifyList.includes(user.email)) {
      product.notifyList.push(user.email);
      await product.save();
    }
    await Notification.create({
      user: req.user._id, type: 'restock',
      title: 'Restock Alert Set',
      message: `We will notify you when "${product.name}" is back in stock.`,
      product: product._id
    });
    res.json({ message: 'You will be notified when back in stock!' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/seed/load', protect, adminOnly, async (req, res) => {
  try {
    await Product.deleteMany({});
    await Product.insertMany(sampleProducts);
    res.json({ message: `${sampleProducts.length} products seeded!` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

async function sendRestockNotifications(product) {
  try {
    const users = await User.find({ email: { $in: product.notifyList } });
    for (const user of users) {
      await Notification.create({
        user: user._id, type: 'restock',
        title: 'Back in Stock!',
        message: `"${product.name}" by ${product.brand} is now available. Hurry — limited stock!`,
        product: product._id
      });
    }
  } catch (e) { console.error('Notification error:', e.message); }
}

const sampleProducts = [
  { name:'Samsung 65" 4K Smart TV', brand:'Samsung', description:'Crystal clear 4K UHD display with HDR support and built-in streaming apps including Netflix, Prime and YouTube.', highlights:['4K UHD with HDR10+','Built-in Netflix, Prime, YouTube','Voice control with Bixby & Alexa','3 HDMI, 2 USB ports'], specs:[{key:'Display',value:'65 inch 4K UHD'},{key:'Refresh Rate',value:'60Hz'},{key:'Sound',value:'20W Stereo'},{key:'Warranty',value:'1 Year'}], price:42999, origPrice:65000, category:'Electronics', emoji:'📺', stock:15, maxStock:50, rating:4.3, reviewCount:12400, soldLastMonth:47 },
  { name:'boAt Airdopes 141 TWS Earbuds', brand:'boAt', description:'True wireless earbuds with 42 hours total playback and BEAST mode for gaming with low latency.', highlights:['42 Hours playback','BEAST Mode (60ms latency)','IPX4 Water Resistant','Type-C charging'], specs:[{key:'Driver',value:'8mm'},{key:'Battery',value:'42 hours'},{key:'Connectivity',value:'Bluetooth 5.2'}], price:1299, origPrice:2990, category:'Electronics', emoji:'🎧', stock:200, maxStock:500, rating:4.2, reviewCount:45600, soldLastMonth:312 },
  { name:'iPhone 15 Silicone Case', brand:'Apple', description:'Premium silicone case with MagSafe compatibility and soft microfibre lining for iPhone 15.', highlights:['MagSafe compatible','Microfibre lining','Slim fit design'], specs:[{key:'Material',value:'Silicone'},{key:'Compatibility',value:'iPhone 15'},{key:'Weight',value:'38g'}], price:1499, origPrice:2000, category:'Electronics', emoji:'📱', stock:0, maxStock:300, rating:4.6, reviewCount:8900, soldLastMonth:0 },
  { name:'Logitech MX Keys Keyboard', brand:'Logitech', description:'Advanced wireless keyboard with smart backlit keys supporting up to 3 devices simultaneously.', highlights:['3-device support','Smart backlit keys','USB-C rechargeable'], specs:[{key:'Connectivity',value:'Bluetooth & USB'},{key:'Battery',value:'10 days backlit'}], price:6495, origPrice:9995, category:'Electronics', emoji:'⌨️', stock:3, maxStock:100, rating:4.7, reviewCount:4200, soldLastMonth:28 },
  { name:"Men's Slim Fit Stretch Jeans", brand:"Levi's", description:'Premium stretch denim jeans for all-day comfort with slim fit and classic 5-pocket styling.', highlights:['Stretch denim','Slim fit','Machine washable'], specs:[{key:'Material',value:'98% Cotton, 2% Elastane'},{key:'Fit',value:'Slim'}], price:1699, origPrice:3500, category:'Fashion', emoji:'👖', stock:80, maxStock:200, rating:4.1, reviewCount:6800, soldLastMonth:95 },
  { name:"Women's Anarkali Kurti Set", brand:'Biba', description:'Elegant floral printed cotton anarkali kurti set with palazzo pants and dupatta.', highlights:['Pure cotton','3-piece set','Festive floral print'], specs:[{key:'Material',value:'100% Cotton'},{key:'Set',value:'Kurti + Palazzo + Dupatta'}], price:1299, origPrice:2500, category:'Fashion', emoji:'👗', stock:0, maxStock:150, rating:4.5, reviewCount:7800, soldLastMonth:0 },
  { name:'Nike Air Max 270 Sneakers', brand:'Nike', description:'Iconic Air Max cushioning with large heel Air unit for maximum comfort and breathable mesh upper.', highlights:['Max Air cushioning','Breathable mesh','8 colour options'], specs:[{key:'Upper',value:'Mesh'},{key:'Sole',value:'Air Max + Rubber'},{key:'Weight',value:'310g'}], price:7995, origPrice:11000, category:'Sports', emoji:'👟', stock:25, maxStock:80, rating:4.7, reviewCount:22100, soldLastMonth:63 },
  { name:'Prestige 5-Piece Cookware Set', brand:'Prestige', description:'Hard anodized non-stick cookware set, induction compatible and dishwasher safe with 5-year warranty.', highlights:['Hard anodized coating','Induction compatible','Dishwasher safe','5-year warranty'], specs:[{key:'Material',value:'Hard Anodized Aluminium'},{key:'Pieces',value:'5'},{key:'Warranty',value:'5 Years'}], price:2799, origPrice:5500, category:'Home', emoji:'🍳', stock:40, maxStock:60, rating:4.4, reviewCount:5400, soldLastMonth:38 },
  { name:'Philips Air Purifier AC1215', brand:'Philips', description:'True HEPA air purifier removes 99.97% of allergens and fine dust. Auto mode adjusts to air quality.', highlights:['True HEPA filter','99.97% allergen removal','Auto mode','333 sq ft coverage'], specs:[{key:'Coverage',value:'333 sq ft'},{key:'Filter',value:'HEPA + Carbon'},{key:'Power',value:'57W'}], price:8499, origPrice:14000, category:'Home', emoji:'💨', stock:0, maxStock:40, rating:4.5, reviewCount:3100, soldLastMonth:0 },
  { name:'Minimalist 10% Vitamin C Serum', brand:'Minimalist', description:'Brightening serum with stable Vitamin C that reduces dark spots and boosts radiance for all skin types.', highlights:['10% Ethyl Ascorbic Acid','Reduces dark spots','Fragrance free','All skin types'], specs:[{key:'Key Ingredient',value:'10% Vitamin C'},{key:'Volume',value:'30ml'},{key:'Skin Type',value:'All'}], price:599, origPrice:999, category:'Beauty', emoji:'🧴', stock:5, maxStock:300, rating:4.6, reviewCount:18900, soldLastMonth:287 },
  { name:'Lakme Absolute Matte Lipstick', brand:'Lakme', description:'Transfer-proof matte lipstick enriched with Vitamin E for moisturised lips lasting up to 8 hours.', highlights:['Transfer-proof','8-hour wear','Vitamin E enriched','50+ shades'], specs:[{key:'Finish',value:'Matte'},{key:'Longevity',value:'8 hours'},{key:'Weight',value:'3.7g'}], price:499, origPrice:799, category:'Beauty', emoji:'💄', stock:150, maxStock:400, rating:4.3, reviewCount:9200, soldLastMonth:178 },
  { name:'Nivia Pro Yoga Mat 6mm', brand:'Nivia', description:'Eco-friendly TPE yoga mat with 6mm cushioning and anti-slip textured surface. Includes carrying strap.', highlights:['6mm thickness','Anti-slip surface','Eco-friendly TPE','Carrying strap included'], specs:[{key:'Material',value:'TPE'},{key:'Thickness',value:'6mm'},{key:'Size',value:'183 x 61 cm'}], price:799, origPrice:1500, category:'Sports', emoji:'🧘', stock:60, maxStock:100, rating:4.2, reviewCount:4600, soldLastMonth:54 }
];

module.exports = router;
