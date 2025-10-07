const mysql = require('mysql2/promise');

async function createDatabase() {
  try {
    // Create connection without specifying database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '7710'
    });

    // Create database
    await connection.execute('CREATE DATABASE IF NOT EXISTS education_website');
    console.log('Database "education_website" created successfully');
    
    await connection.end();
  } catch (error) {
    console.error('Error creating database:', error);
  }
}

createDatabase();