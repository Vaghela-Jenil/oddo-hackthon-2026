const http = require('http');

// Test data - password must have uppercase, lowercase, number, and special char
const testData = {
  name: 'Test User',
  email: 'testuser123@example.com',
  password: 'Test@123456',
  confirmPassword: 'Test@123456'
};

const postData = JSON.stringify(testData);

console.log('🧪 Testing Signup Endpoint...');
console.log('📍 Target: http://localhost:8000/api/auth/signup');
console.log('📦 Payload:', testData);
console.log('');

const options = {
  method: 'POST',
  hostname: 'localhost',
  port: 8000,
  path: '/api/auth/signup',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('✅ Response Received:');
    console.log('   Status:', res.statusCode);
    console.log('   Headers:', res.headers);
    console.log('   Body:', responseData);
    
    if (res.statusCode === 201) {
      console.log('\n✨ SUCCESS! Signup endpoint is working correctly!');
    } else if (res.statusCode === 400 || res.statusCode === 4040) {
      console.log('\n⚠️  Server returned an error. Check the response body above.');
    } else {
      console.log('\n❌ Unexpected status code:', res.statusCode);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
  console.error('   Make sure the server is running on port 8000!');
});

req.write(postData);
req.end();
