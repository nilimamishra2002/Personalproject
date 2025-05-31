
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const router = express.Router();
require('dotenv').config();



// Payment schema and model
const PaymentSchema = new mongoose.Schema({
  razorpay_order_id: String,
  razorpay_payment_id: String,
  razorpay_signature: String,
});
const Payment = mongoose.model('Payment', PaymentSchema);

// Razorpay instance using .env
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
router.post('/create-order', async (req, res) => {
   const amount = req.body?.amount;// amount in paise, sent from frontend
  if (!amount) return res.status(400).send('Amount is required');

  const options = {
     amount,
    currency: 'INR',
    receipt: 'receipt_order_' + Date.now(),
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating order');
  }
});


// Verify Razorpay payment
router.post('/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET);
  hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
  const digest = hmac.digest('hex');

  if (digest === razorpay_signature) {
    const payment = new Payment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    await payment.save();

    // Send confirmation email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: req.body.email || 'user@example.com', // can be dynamic
      subject: 'Payment Successful',
      text: `Your payment was successful. Payment ID: ${razorpay_payment_id}`,
    });

    res.json({ message: 'Payment verified and stored successfully' });
  } else {
    res.status(400).json({ message: 'Invalid payment signature' });
  }
});

module.exports = router;

