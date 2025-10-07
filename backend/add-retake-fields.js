const mysql = require('mysql2/promise');
require('dotenv').config();

async function addRetakeFields() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'education_website'
    });

    console.log('🔌 Connected to database');

    // Check if columns already exist
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'quizzes' 
      AND COLUMN_NAME IN ('allowRetake', 'retakeCooldownHours')
    `, [process.env.DB_NAME || 'education_website']);

    if (columns.length > 0) {
      console.log('ℹ️  Retake columns already exist, skipping migration');
      return;
    }

    // Add allowRetake column
    await connection.execute(`
      ALTER TABLE quizzes 
      ADD COLUMN allowRetake BOOLEAN DEFAULT FALSE 
      COMMENT 'Whether retakes are allowed for failed attempts'
    `);
    console.log('✅ Added allowRetake column');

    // Add retakeCooldownHours column
    await connection.execute(`
      ALTER TABLE quizzes 
      ADD COLUMN retakeCooldownHours INT DEFAULT 24 
      COMMENT 'Hours to wait before retake is allowed after a failed attempt'
    `);
    console.log('✅ Added retakeCooldownHours column');

    // Add constraint for retakeCooldownHours
    await connection.execute(`
      ALTER TABLE quizzes 
      ADD CONSTRAINT chk_retake_cooldown 
      CHECK (retakeCooldownHours >= 1 AND retakeCooldownHours <= 8760)
    `);
    console.log('✅ Added retake cooldown constraint');

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migration
addRetakeFields()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });