const jwt = require('jsonwebtoken');
require('dotenv').config();

// Test token generation
const testId = 1;
const token = jwt.sign({ id: testId }, process.env.JWT_SECRET, {
  expiresIn: '7d',
});

console.log('Generated token:', token);

// Test token verification
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Decoded token:', decoded);
} catch (error) {
  console.error('Token verification failed:', error);
}