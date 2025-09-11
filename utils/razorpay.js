const Razorpay = require('razorpay');

const razorpayInstance = new Razorpay({
  key_id: process.env.TEST_RAZORPAY_KEY_ID,
  key_secret: process.env.TEST_RAZORPAY_SECRET_KEY,
});

module.exports = razorpayInstance;
