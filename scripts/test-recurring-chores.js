// Test script for recurring chores functionality
const fetch = require('node-fetch');

async function testRecurringChores() {
  try {
    console.log('Testing recurring chores automation...');

    // Test the automation API
    const response = await fetch('http://localhost:3001/api/automation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'processRecurringChores'
      })
    });

    const result = await response.json();
    console.log('Automation API response:', result);

    // Test health check
    const healthResponse = await fetch('http://localhost:3001/api/automation');
    const healthResult = await healthResponse.json();
    console.log('Health check response:', healthResult);

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testRecurringChores();