const fetch = require('node-fetch');

async function testAPI() {
  try {
    // First login
    console.log('Attempting login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@demo.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (loginData.token) {
      // Now test courses endpoint
      console.log('Testing courses endpoint...');
      const coursesResponse = await fetch('http://localhost:5000/api/courses', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const coursesData = await coursesResponse.json();
      console.log('Courses response:', coursesData);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();