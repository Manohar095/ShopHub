const express = require('express');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');
const router  = express.Router();

// GET /api/wishlist
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json({ wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/wishlist/:productId  — toggle
router.post('/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const pid  = req.params.productId;
    const idx  = user.wishlist.indexOf(pid);
    if (idx === -1) {
      user.wishlist.push(pid);
    } else {
      user.wishlist.splice(idx, 1);
    }
    await user.save();
    res.json({ wishlist: user.wishlist, added: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
