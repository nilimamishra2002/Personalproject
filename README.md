# MyPersonalMeal 🍴

A personalized meal ordering platform built with **Node.js, Express, and EJS**, featuring **Razorpay test payment gateway integration** for a smooth checkout experience.  

---
## 🌐 Live Demo
You can explore the deployed app here:  
👉 [MyPersonalMeal Live on Render](https://atmypersonalmeal-sc64.onrender.com/)

## 🚀 Features
- User-friendly meal ordering system with dynamic menus.
- Secure **Razorpay payment gateway (test mode)** integration for seamless transactions.
- Backend powered by **Node.js + Express**.
- Templating with **EJS** for dynamic rendering.
- Modular and scalable project structure for future enhancements.

---

## 🛠️ Tech Stack
- **Frontend:** EJS, CSS, Bootstrap
- **Backend:** Node.js, Express.js
- **Payments:** Razorpay (test mode)
- **Database (optional/future):** MongoDB
- **Deployment:** (Add if deployed – e.g., Vercel, Render, or Heroku)

---

## 💳 Razorpay Test Payment Integration
This project integrates **Razorpay Checkout.js** in test mode.  

- After selecting a meal, users proceed to payment.  
- On clicking **“Pay Now”**, the app creates an order via backend (`/payment/create-order`).  
- The Razorpay checkout popup is triggered with test card/UPI/wallet options.  

## 📂 Project Structure
Personalproject/
│-- public/ # Static files
│-- views/ # EJS templates
│-- routes/ # Express routes
│-- server.js # Entry point
│-- package.json

---

## ⚡ Setup & Run
Clone the repo and install dependencies:
```bash
git clone https://github.com/nilimamishra2002/Personalproject.git
cd Personalproject
npm install
Start the server:
node server.js
