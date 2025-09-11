const axios = require('axios');

// Test user data
const testUserData = {
  name: "John Doe",
  email: "john.doe@gmail.com",
  phoneNumber: "9876543210",
  dept: "CSE",
  year: "3",
  gender: "Male",
  password: "testpassword123"
};

async function testPaymentEndpoints() {
  try {
    console.log('🧪 Testing Payment Endpoints...\n');

    // Test 1: Create Order
    console.log('1. Testing Create Order endpoint...');
    const createOrderResponse = await axios.post('http://localhost:8080/api/v1/payment/create-order', {
      userData: testUserData
    });

    if (createOrderResponse.status === 200) {
      console.log('✅ Create Order endpoint working');
      console.log('Order ID:', createOrderResponse.data.order.id);
      console.log('Amount:', createOrderResponse.data.order.amount);
      
      // Note: We can't test the verify payment endpoint without actual Razorpay payment
      // since it requires valid payment signatures
      console.log('\n✅ Payment backend is ready for integration!');
      console.log('\nNext steps:');
      console.log('- Visit http://localhost:5173/auth/payment-signup');
      console.log('- Test the complete payment flow with Razorpay test mode');
      
    } else {
      console.log('❌ Create Order endpoint failed');
    }

  } catch (error) {
    console.error('❌ Error testing endpoints:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data?.message || error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testPaymentEndpoints();
