const crypto = require("crypto");

const verifyTransaction = async (req, res, next) => {
  if (!req.body.status) {
    next();
  } else {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.TEST_RAZORPAY_SECRET_KEY)
      .update(body)
      .digest("hex");
    
    if (expectedSignature === razorpay_signature) {
      next();
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid signature" 
      });
    }
  }
};

module.exports = { verifyTransaction };
