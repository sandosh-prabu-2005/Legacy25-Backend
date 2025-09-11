const Razorpay = require("razorpay");
const razorpayInstance = require("../utils/razorpay");
const { nanoid } = require("nanoid");
const Transactions = require("../models/transactions");
const UserModel = require("../models/users");
const catchAsyncError = require("../middlewares/catchAsyncError");
const sendEmail = require("../utils/email");
const crypto = require("crypto");

const createOrder = catchAsyncError(async (req, res) => {
  // Accept userData for registration, but always use fixed amount
  const { userData } = req.body;
  try {
    console.log("[PAYMENT] Incoming create order request", req.body);
    const options = {
      amount: 300 * 100, // ₹300 in paise
      currency: "INR",
      receipt: `rcpt_${nanoid(32)}`,
      notes: userData ? { email: userData.email, name: userData.name } : {},
    };
    console.log("[PAYMENT] Creating Razorpay order with options:", options);
    const order = await razorpayInstance.orders.create(options);
    console.log("[PAYMENT] Razorpay order created:", order);
    res.status(200).json({
      message: "Order created successfully",
      order: order,
      success: true,
    });
  } catch (error) {
    // Log full error details for debugging
    console.error("[PAYMENT] Error in createOrder:", error);
    if (error && error.error && error.error.description) {
      console.error("[PAYMENT] Razorpay error description:", error.error.description);
    }
    res.status(500).json({ 
      error: error && error.error && error.error.description ? error.error.description : "Failed to create order", 
      success: false 
    });
  }
});

const verifyPaymentAndCreateUser = catchAsyncError(async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      currency,
      userData,
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.TEST_RAZORPAY_SECRET_KEY)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        message: "Payment verification failed",
        success: false,
      });
    }

    // Check if user already exists
    let existingUser = await UserModel.findOne({ email: userData.email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already registered and verified. Please login instead.",
      });
    }

    // Remove unverified user if exists
    if (existingUser && !existingUser.isVerified) {
      await UserModel.findOneAndDelete({ email: userData.email, isVerified: false });
    }

    // Create new user
    const user = new UserModel({
      name: userData.name,
      year: userData.year,
      dept: userData.dept,
      email: userData.email,
      password: userData.password,
      gender: userData.gender,
      phoneNumber: userData.phoneNumber,
      role: "user",
    });

    const verificationToken = user.generateVerificationToken();
    await user.save();

    // Store transaction
    const transactionData = new Transactions({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      amount,
      currency,
      status: true,
      userId: user._id,
    });
    await transactionData.save();

    // Send verification email
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email/${verificationToken}`;
    
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Legacy 2025!</h2>
        <p>Thank you for your payment of ₹${amount}. Your registration has been successful!</p>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verifyUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
          Verify Email Address
        </a>
        <p>If the button doesn't work, copy and paste this link in your browser:</p>
        <p style="word-break: break-all;">${verifyUrl}</p>
        <p>Transaction ID: ${razorpay_payment_id}</p>
        <p>This link will expire in 24 hours.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">If you didn't make this request, please ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "Legacy 2025 - Payment Successful & Email Verification",
        message,
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't fail the registration if email fails
    }

    return res.status(200).json({
      message: "Payment verified and account created successfully! Please check your email for verification.",
      success: true,
      transactionId: transactionData._id,
      userId: user._id,
    });
  } catch (error) {
    console.error("Payment verification error:", error.message);
    return res.status(500).json({
      message: "Internal server error during payment verification",
      success: false,
    });
  }
});

const getTransactionStatus = catchAsyncError(async (req, res) => {
  const { orderId } = req.params;
  
  try {
    const transaction = await Transactions.findOne({ orderId }).populate('userId', 'name email');
    
    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Transaction found",
      success: true,
      transaction,
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({
      message: "Failed to fetch transaction",
      success: false,
    });
  }
});

module.exports = { 
  createOrder, 
  verifyPaymentAndCreateUser, 
  getTransactionStatus 
};
