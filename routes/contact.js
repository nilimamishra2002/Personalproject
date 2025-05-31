const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Optional: Only if contact requires authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// GET Contact Form
router.get('/', (req, res) => {
  res.render('contact', { successMessage: null, errorMessage: null });
});

// POST Contact Form
router.post('/', /*ensureAuthenticated,*/ async (req, res) => {
  const { name, email, phone, message } = req.body;

  // Validate input (basic)
  if (!name || !email || !message) {
    return res.render('contact', {
      errorMessage: 'Name, email, and message are required!',
      successMessage: null,
    });
  }

  // Configure Transporter (Gmail with App Password)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use App Password
    },
  });

  const mailOptions = {
    from: `"${name}" <${email}>`, // Better format
    to: process.env.EMAIL_USER,
    subject: 'New Contact Form Submission',
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not Provided'}\n\nMessage:\n${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.render('contact', {
      successMessage: 'Message sent successfully!',
      errorMessage: null,
    });
  } catch (error) {
    console.error('Email sending error:', error.message);
    res.render('contact', {
      errorMessage: 'Failed to send message. Please try again later.',
      successMessage: null,
    });
  }
});

module.exports = router;
