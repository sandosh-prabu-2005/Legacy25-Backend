const express = require('express');
const { 
  createOrder, 
  verifyPaymentAndCreateUser, 
  getTransactionStatus 
} = require('../controllers/paymentsController');
const { verifyTransaction } = require('../middlewares/verifyTransaction');
const { isAuthenticatedUser } = require('../middlewares/authenticate');

const router = express.Router();

router.route('/payment/create-order').post(createOrder);
router.route('/payment/verify-and-register').post(verifyPaymentAndCreateUser);
router.route('/payment/transaction/:orderId').get(getTransactionStatus);

module.exports = router;
