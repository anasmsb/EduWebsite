const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('education_website', 'root', '7710', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

async function fixLanguagesTable() {
  try {
    console.log('🔧 Dropping and recreating languages table...');
    
    // Drop the table
    await sequelize.query('DROP TABLE IF EXISTS quiz_translations');
    await sequelize.query('DROP TABLE IF EXISTS languages');
    console.log('✅ Old tables dropped');
    
    // Recreate with correct structure
    await sequelize.query(`
      CREATE TABLE languages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(10) NOT NULL UNIQUE,
        nativeName VARCHAR(100) NOT NULL,
        direction ENUM('ltr', 'rtl') DEFAULT 'ltr',
        isActive BOOLEAN DEFAULT TRUE,
        isDefault BOOLEAN DEFAULT FALSE,
        flag VARCHAR(255) NULL COMMENT 'URL or path to flag image',
        createdById INT NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_code (code),
        INDEX idx_active (isActive),
        INDEX idx_default (isDefault),
        INDEX idx_creator (createdById)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    await sequelize.query(`
      CREATE TABLE quiz_translations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        quizId INT NOT NULL,
        languageId INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        description VARCHAR(500) NULL,
        questions JSON DEFAULT (JSON_ARRAY()) COMMENT 'Translated questions array',
        createdById INT NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (languageId) REFERENCES languages(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE KEY unique_quiz_language (quizId, languageId),
        INDEX idx_quiz (quizId),
        INDEX idx_language (languageId),
        INDEX idx_creator (createdById)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Tables recreated with correct structure');
    
    // Create default languages
    const adminResult = await sequelize.query('SELECT id FROM users WHERE email = "admin@demo.com" LIMIT 1');
    const adminId = adminResult[0][0].id;
    
    await sequelize.query(`
      INSERT INTO languages (name, code, nativeName, direction, isActive, isDefault, flag, createdById, createdAt, updatedAt)
      VALUES 
        ('English', 'en', 'English', 'ltr', TRUE, TRUE, '/flags/en.png', ?, NOW(), NOW()),
        ('Spanish', 'es', 'Español', 'ltr', TRUE, FALSE, '/flags/es.png', ?, NOW(), NOW()),
        ('French', 'fr', 'Français', 'ltr', TRUE, FALSE, '/flags/fr.png', ?, NOW(), NOW()),
        ('German', 'de', 'Deutsch', 'ltr', TRUE, FALSE, '/flags/de.png', ?, NOW(), NOW()),
        ('Arabic', 'ar', 'العربية', 'rtl', TRUE, FALSE, '/flags/ar.png', ?, NOW(), NOW()),
        ('Chinese', 'zh', '中文', 'ltr', TRUE, FALSE, '/flags/zh.png', ?, NOW(), NOW())
    `, {
      replacements: [adminId, adminId, adminId, adminId, adminId, adminId]
    });
    
    console.log('✅ Default languages created');
    
    await sequelize.close();
    console.log('🎉 Languages table fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing table:', error);
    await sequelize.close();
  }
}

fixLanguagesTable();