const fetch = require('node-fetch');

async function testCoupon() {
  try {
    const response = await fetch('http://localhost:9005/api/billing/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        familyId: 'test-family-id',
        familyName: 'Test Family',
        email: 'test@example.com',
        interval: 'monthly',
        plan: 'premium',
        couponCode: 'TEST20'
      }),
    });

    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testCoupon();