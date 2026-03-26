# 🛍️ ShopHub — Complete Setup Guide for Beginners
## Run your own e-commerce website locally in VS Code

---

## 📋 WHAT YOU WILL GET
- Full e-commerce website (like Flipkart/Meesho)
- Product listing with search & filters
- Shopping cart & wishlist
- Razorpay payment gateway (UPI, Card, Net Banking, COD)
- Live stock tracking + "Notify Me" for sold-out items
- User login/register
- Admin panel to manage products & orders
- Email notifications for restock

---

## 🖥️ STEP 1 — Install Required Software

Install these (free) — one time only:

### 1.1 Install Node.js
👉 Go to: https://nodejs.org
- Download the **LTS version** (green button)
- Run the installer, click Next → Next → Install
- To verify: Open terminal in VS Code → type `node -v` → should show version number

### 1.2 Install MongoDB (Database)
👉 Go to: https://www.mongodb.com/try/download/community
- Download **MongoDB Community Server**
- Install it with default settings
- Also install **MongoDB Compass** (GUI tool to see your data)
  👉 https://www.mongodb.com/try/download/compass

---

## 📁 STEP 2 — Open Project in VS Code

1. Extract the downloaded `shophub` folder anywhere (e.g., Desktop)
2. Open **VS Code**
3. Click **File → Open Folder** → select the `shophub` folder
4. You should see two folders: `backend` and `frontend`

---

## ⚙️ STEP 3 — Set Up the Backend

Open the **VS Code Terminal** (press `` Ctrl + ` ``)

### 3.1 Go to backend folder
```
cd backend
```

### 3.2 Install backend packages
```
npm install
```
(This downloads all required packages — takes 1-2 minutes)

### 3.3 Create your environment file
```
copy .env.example .env
```
(On Mac/Linux: `cp .env.example .env`)

### 3.4 Open `.env` file and fill in your details:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/shophub
JWT_SECRET=shophub_secret_key_2024_change_this
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_here
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:3000
```

> 💡 For now, the website will work without Razorpay keys (using test mode)
> 💡 MongoDB URI doesn't need to change if running locally

### 3.5 Start the backend server
```
npm run dev
```
✅ You should see:
```
✅ MongoDB connected
🚀 Server running at http://localhost:5000
```

---

## 🎨 STEP 4 — Set Up the Frontend

Open a **NEW terminal tab** in VS Code (click the + button in terminal)

### 4.1 Go to frontend folder
```
cd frontend
```

### 4.2 Install frontend packages
```
npm install
```
(Takes 2-5 minutes — downloads React and all libraries)

### 4.3 Start the frontend
```
npm start
```
✅ Your browser will automatically open: **http://localhost:3000**

---

## 🌱 STEP 5 — Load Sample Products (Admin)

### 5.1 Create an Admin account
1. Go to http://localhost:3000/register
2. Register with any email and password
3. Open **MongoDB Compass**
4. Connect to: `mongodb://localhost:27017`
5. Open database: `shophub` → collection: `users`
6. Find your user → click Edit → change `"role": "customer"` to `"role": "admin"` → Save

### 5.2 Load sample products
1. Login to your website
2. Click your name in navbar → **Admin Panel**
3. Click **"🌱 Load Sample Data"** button
4. 12 sample products will be loaded!

---

## 💳 STEP 6 — Set Up Razorpay (Payment Gateway)

### 6.1 Create Razorpay account
1. Go to: https://razorpay.com
2. Sign up (free)
3. Go to **Settings → API Keys**
4. Generate **Test Mode** keys
5. Copy **Key ID** and **Key Secret**

### 6.2 Add keys to .env
```
RAZORPAY_KEY_ID=rzp_test_your_key_here
RAZORPAY_KEY_SECRET=your_secret_here
```

### 6.3 Add Key ID to frontend
In `frontend/src/pages/CheckoutPage.js`, find:
```
key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'YOUR_KEY_ID',
```
Replace `YOUR_KEY_ID` with your actual Razorpay Key ID

---

## 📧 STEP 7 — Set Up Email Notifications (Optional)

For the "Notify Me" feature to send actual emails:

1. Go to your Gmail account
2. Enable **2-Step Verification**
3. Go to: https://myaccount.google.com/apppasswords
4. Create an App Password for "Mail"
5. Copy the 16-character password

Add to `.env`:
```
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop  (your app password)
```

---

## 🚀 RUNNING THE WEBSITE

Every time you want to run the website:

**Terminal 1 (Backend):**
```
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```
cd frontend
npm start
```

Then open: **http://localhost:3000**

---

## 📱 WEBSITE FEATURES

| Feature | Where to find |
|---------|--------------|
| Browse products | Home page |
| Search products | Search bar in navbar |
| Filter by category | Category tabs |
| Add to cart | Product card → Add to Cart |
| Wishlist | Heart button on product card |
| Checkout | Cart → Proceed to Checkout |
| My orders | Profile menu → My Orders |
| Admin panel | Profile menu → Admin Panel |
| Add products | Admin → Products → + Add Product |
| View orders | Admin → Orders tab |

---

## ❗ COMMON PROBLEMS & FIXES

**Problem: "npm not found"**
→ Node.js was not installed. Restart VS Code after installing.

**Problem: "MongoDB connection error"**
→ MongoDB service is not running.
→ Windows: Search "Services" → find "MongoDB" → Start it
→ Mac: Run `brew services start mongodb-community`

**Problem: Port 3000 or 5000 already in use**
→ Change port in .env: `PORT=5001`

**Problem: White screen / errors in browser**
→ Open browser Console (F12) → check error message → ask for help!

---

## 📂 PROJECT STRUCTURE

```
shophub/
├── backend/                  ← Node.js + Express API
│   ├── models/               ← Database schemas (User, Product, Order)
│   ├── routes/               ← API endpoints
│   ├── middleware/           ← Auth protection
│   ├── server.js             ← Main server file
│   └── .env                  ← Your secret keys (never share this!)
│
└── frontend/                 ← React website
    ├── src/
    │   ├── pages/            ← All website pages
    │   ├── components/       ← Reusable parts (Navbar, ProductCard)
    │   ├── context/          ← Global state (Cart, Auth)
    │   └── api.js            ← API connection
    └── public/               ← index.html
```

---

## 🎯 NEXT STEPS (After testing locally)

1. **Add real product images** — replace emojis with actual image URLs
2. **Deploy online** — use Vercel (frontend) + Railway/Render (backend) + MongoDB Atlas (database)
3. **Custom domain** — buy a domain and connect it
4. **Add more features** — product reviews, discount codes, SMS notifications

---

**Need help?** Share the error message and I'll help you fix it! 🙌
