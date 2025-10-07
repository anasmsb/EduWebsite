require('dotenv').config();
const jwt = require('jsonwebtoken');
const { User } = require('./models');

async function createFreshToken() {
  try {
    // Get user from database
    const user = await User.findOne({ where: { email: 'admin@demo.com' } });
    if (!user) {
      console.log('User not found');
      return;
    }
    
    // Create fresh token with current JWT_SECRET
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    
    console.log('Fresh token:', token);
    
    // Verify it immediately
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded:', decoded);
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

createFreshToken();