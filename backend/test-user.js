require('dotenv').config();
const { User } = require('./models');

async function testUser() {
  try {
    const user = await User.findByPk(1);
    console.log('User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('User data:', {
        id: user.id,
        email: user.email,
        firstName: user.firstName
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

testUser();