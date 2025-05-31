
const express = require('express');
const path = require('path');
const session = require('express-session');
const ejsMate = require('ejs-mate');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo');

const User = require('./models/user'); // Your user model with passport-local-mongoose plugin
const paymentRoutes = require("./routes/payment");
const contactRoutes=require("./routes/contact");
require('dotenv').config();
//mongodb://127.0.0.1:27017/mypersonalmeal
mongoose.connect(process.env.ATLASDB_URL)
  .then(() => console.log("AtlasDB connected"))
  .catch(err => console.log(err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.ATLASDB_URL }),
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true
  }
}));

app.use(flash());


app.use(passport.initialize());
app.use(passport.session());

// Passport configuration using passport-local-mongoose
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Prevent caching for authenticated routes (optional, you had this)
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});


app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// Middleware to expose user object to views
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});



function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// Routes

app.get('/register', (req, res) => {
  res.render('register');
});

// Register route
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // Check if user with email already exists (optional, since username is default username)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error', 'User with this email already exists');
      return res.redirect('/register');
    }

    // Create new user and register (passport-local-mongoose will hash password)
    const newUser = new User({ username, email });
     const registeredUser = await User.register(newUser, password);
    
        req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome to Mypersonalmeal!");
      res.redirect("/");
    });

  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/register");
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

// Login route using passport-local-mongoose strategy
app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

// Logout route
app.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) {
      console.error(err);
      req.flash('error', 'Logout failed');
      return next(err);
    }
    req.flash('success', 'Logged out successfully');
    res.redirect('/');
  });
});




const dishes = [
  { name: 'Idli Sambar', price: 40 },
  { name: 'Bada', price: 30 },
  { name: 'Upma', price: 35 },
  { name: 'Aloo paratha', price: 45 },
  { name: 'Chole bhature', price: 70 },
  { name: 'Pakodi', price: 25 },
  { name: 'Chenapoda', price: 60 },
  { name: 'Rasagolla', price: 20 },
  { name: 'Gulabjamun', price: 25 },
  { name: 'Steam Rice', price: 50 },
  { name: 'Dalma', price: 55 },
  { name: 'Chiken Kasa', price: 90 },
  { name: 'Khichdi', price: 65 },
  { name: 'Mutton Curry', price: 150 },
  { name: 'Paneer Butter Masala', price: 120 },
  { name: 'Rice & Fish Curry', price: 100 },
  { name: 'Vegetable Pulao', price: 80 },
  { name: 'Roti Sabzi', price: 40 }
];

// Home
app.get('/', (req, res) => {
  res.render('index', {
    error: req.query.error || null,
    success: req.query.success || null,
    modalToOpen: req.query.modal || null,
  });
});


// Order page
app.get('/order', (req, res) => {
  const cart = req.session.cart || [];

  const dishesWithQuantities = dishes.map(dish => {
    const cartItem = cart.find(item => item.name === dish.name);
    return {
      ...dish,
      quantity: cartItem ? cartItem.quantity : 0
    };
  });

  res.render('order', {  dishes: dishesWithQuantities });
});




app.post('/order', (req, res) => {
  const newOrder = {
    name: req.body.name,
    quantity: parseInt(req.body.quantity),
    price: parseFloat(req.body.price)
  };

  if (!req.session.cart) req.session.cart = [];

  // Check if item already exists to update quantity
  const existing = req.session.cart.find(item => item.name === newOrder.name);
  if (existing) {
    existing.quantity += newOrder.quantity;
  } else {
    req.session.cart.push(newOrder);
  }

  res.redirect('/cart');
});


// Handle cart submission
app.post('/cart', ensureAuthenticated,(req, res) => {
  const quantities = req.body;

  const dishPrices = {
    'Idli_Sambar': 40,
    'Bada': 30,
    'Upma': 35,
    'Aloo_paratha': 45,
    'Chole_bhature': 70,
    'Pakodi': 25,
    'Chenapoda': 60,
    'Rasagolla': 20,
    'Gulabjamun': 25,
    'Steam_Rice': 50,
    'Dalma': 55,
    'Chiken_Kasa': 90,
    'Khichdi': 65,
    'Mutton_Curry': 150,
    'Paneer_Butter_Masala': 120,
    'Rice_&_Fish_Curry': 100,
    'Vegetable_Pulao': 80,
    'Roti_Sabzi': 40
  };

  let subtotal = 0;
  const orderedItems = [];

  for (const key in quantities) {
    const quantity = parseInt(quantities[key], 10);
    if (quantity > 0) {
      const dishName = key.replace('quantity_', '');
      const price = dishPrices[dishName];
      if (price !== undefined) {
        const itemTotal = price * quantity;
        subtotal += itemTotal;
        orderedItems.push({
          name: dishName.replace(/_/g, ' '),
          price,
          quantity,
          total: itemTotal
        });
      }
    }
  }

  // Calculate taxes and charges
  const gst = +(subtotal * 0.05).toFixed(2);
  const serviceCharge = +(subtotal * 0.05).toFixed(2);
  const delivery = 40;

  // Initial total without discount
  let total = +(subtotal + gst + serviceCharge + delivery).toFixed(2);

  // Initialize discount
  let discount = 0;

  // Apply discount if coupon is applied
  if (req.session.appliedCoupon === 'mypersonalmeal') {
    discount = total * 0.10;  // 10% discount
    total = +(total - discount).toFixed(2);
  }
  const amountInPaise = Math.round((total || 0) * 100);

  // Save values in session
  req.session.orderedItems = orderedItems;
  req.session.subtotal = subtotal;
  req.session.gst = gst;
  req.session.serviceCharge = serviceCharge;
  req.session.delivery = delivery;
  req.session.total = total;
  req.session.discount = discount;

  // Render cart with all variables including discount
  res.render('cart', {
    orderedItems,
    subtotal,
    gst,
    serviceCharge,
    delivery,
    discount,
    total,
    appliedCoupon: req.session.appliedCoupon || '',
     RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
     amountInPaise,
     userEmail:req.user.email
     
  });
});

// Cart page
app.get('/cart', ensureAuthenticated,(req, res) => {
  const cart = req.session.cart || [];

  let subtotal = 0;
  const orderedItems = cart.map(item => {
    const total = item.price * item.quantity;
    subtotal += total;
    return {
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total
    };
  });

  const gst = +(subtotal * 0.05).toFixed(2);
  const serviceCharge = +(subtotal * 0.05).toFixed(2);
  const delivery = 40;

  let total = +(subtotal + gst + serviceCharge + delivery).toFixed(2);

  let discount = 0;
  if (req.session.appliedCoupon === 'mypersonalmeal') {
    discount = total * 0.10;
    total = +(total - discount).toFixed(2);
  }
  const amountInPaise = Math.round((total || 0) * 100);

  res.render('cart', {
    orderedItems,
    subtotal,
    gst,
    serviceCharge,
    delivery,
    discount,
    total,
    appliedCoupon: req.session.appliedCoupon || '',
     RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ,
     amountInPaise,
     userEmail:req.user.email
  });
});



// Coupon apply
app.post('/apply-coupon',ensureAuthenticated, (req, res) => {
  const couponCode = req.body.couponCode;

  // Retrieve stored values from session
  let subtotal = req.session.subtotal || 0;
  let gst = req.session.gst || +(subtotal * 0.05).toFixed(2);
  let serviceCharge = req.session.serviceCharge || +(subtotal * 0.05).toFixed(2);
  let delivery = req.session.delivery || 40;

  // Calculate total before discount
  let total = +(subtotal + gst + serviceCharge + delivery).toFixed(2);

  let discount = 0;

  if (couponCode === 'mypersonalmeal') {
    discount = total * 0.10; // 10% discount
    total = +(total - discount).toFixed(2);
    req.session.appliedCoupon = couponCode;  // store applied coupon in session
  } else {
    req.session.appliedCoupon = null;
  }
  const amountInPaise = Math.round((total || 0) * 100);

  req.session.discount = discount;
  req.session.total = total;

  res.render('cart', {
    orderedItems: req.session.orderedItems || [],
    subtotal,
    gst,
    serviceCharge,
    delivery,
    discount,
    total,
    appliedCoupon: req.session.appliedCoupon || '',
     RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ,
     amountInPaise,
     userEmail:req.user.email
  });
});


app.post('/remove-coupon',ensureAuthenticated, (req, res) => {
  req.session.discount = 0;
  req.session.appliedCoupon = null;

  // Recalculate total without discount
  const subtotal = req.session.subtotal || 0;
  const gst = req.session.gst || +(subtotal * 0.05).toFixed(2);
  const serviceCharge = req.session.serviceCharge || +(subtotal * 0.05).toFixed(2);
  const delivery = req.session.delivery || 40;

  const total = +(subtotal + gst + serviceCharge + delivery).toFixed(2);
  const amountInPaise = Math.round((total || 0) * 100);
  req.session.total = total;

  res.render('cart', {
    orderedItems: req.session.orderedItems || [],
    subtotal,
    gst,
    serviceCharge,
    delivery,
    discount: 0,
    total,
    appliedCoupon: '',
  rRAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ,
  amountInPaise,
  userEmail:req.user.email
  });
});

app.use('/payment', paymentRoutes);
app.use('/contact',contactRoutes);

// Start server
app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
