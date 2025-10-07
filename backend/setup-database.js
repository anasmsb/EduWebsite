const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

/**
 * COMPREHENSIVE DATABASE SETUP AND INITIALIZATION
 * 
 * This file consolidates ALL database-related functionality:
 * - Database creation
 * - Complete table schema with ALL latest fields
 * - Proper constraints, indexes, and foreign keys
 * - Sample data seeding
 * - Directory structure setup
 * - Database verification
 * 
 * Latest Updates:
 * - Quiz retake functionality (allowRetake, retakeCooldownHours)
 * - Multilingual support (languages, quiz_translations)
 * - Session management for quizzes
 * - Complete course enrollment tracking
 */

class DatabaseSetup {
  constructor() {
    this.config = {
      name: process.env.DB_NAME || 'education_website',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '7710',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306
    };
    
    this.sequelize = null;
    this.tempConnection = null;
  }

  /**
   * Main initialization process
   */
  async run() {
    try {
      console.log('╔════════════════════════════════════════════════════════════════╗');
      console.log('║  EDUCATION WEBSITE - DATABASE SETUP                            ║');
      console.log('╚════════════════════════════════════════════════════════════════╝\n');
      
      await this.validateEnvironment();
      await this.createDatabase();
      await this.connectToDatabase();
      await this.createAllTables();
      await this.verifySchema();
      await this.seedInitialData();
      await this.setupDirectories();
      await this.finalVerification();
      await this.cleanup();
      
      console.log('\n╔════════════════════════════════════════════════════════════════╗');
      console.log('║  ✅ DATABASE SETUP COMPLETED SUCCESSFULLY!                     ║');
      console.log('╚════════════════════════════════════════════════════════════════╝');
      console.log('\n📧 Admin Login: admin@demo.com / password123');
      console.log('📧 Student Login: student@demo.com / password123\n');
      
      return true;
    } catch (error) {
      console.error('\n❌ Setup Failed:', error.message);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Validate environment and dependencies
   */
  async validateEnvironment() {
    console.log('🔍 Step 1: Validating Environment\n');
    
    const packages = ['sequelize', 'mysql2', 'bcryptjs', 'dotenv'];
    for (const pkg of packages) {
      try {
        require(pkg);
        console.log(`  ✓ ${pkg.padEnd(15)} - OK`);
      } catch {
        throw new Error(`Missing package: ${pkg}. Run: npm install`);
      }
    }
    
    console.log(`\n  Database: ${this.config.name}`);
    console.log(`  Host:     ${this.config.host}:${this.config.port}`);
    console.log(`  User:     ${this.config.user}\n`);
  }

  /**
   * Create database if it doesn't exist
   */
  async createDatabase() {
    console.log('📦 Step 2: Creating Database\n');
    
    this.tempConnection = new Sequelize('', this.config.user, this.config.password, {
      host: this.config.host,
      port: this.config.port,
      dialect: 'mysql',
      logging: false
    });

    await this.tempConnection.authenticate();
    console.log('  ✓ MySQL connection established');
    
    await this.tempConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${this.config.name}\` 
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`  ✓ Database '${this.config.name}' ready\n`);
    
    await this.tempConnection.close();
    this.tempConnection = null;
  }

  /**
   * Connect to the database
   */
  async connectToDatabase() {
    console.log('🔌 Step 3: Connecting to Database\n');
    
    this.sequelize = new Sequelize(
      this.config.name,
      this.config.user,
      this.config.password,
      {
        host: this.config.host,
        port: this.config.port,
        dialect: 'mysql',
        logging: false,
        pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
      }
    );

    await this.sequelize.authenticate();
    console.log('  ✓ Connected successfully\n');
  }

  /**
   * Create ALL database tables with complete schema
   */
  async createAllTables() {
    console.log('📋 Step 4: Creating Database Schema\n');

    // USERS TABLE
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(30) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        role ENUM('student', 'admin') DEFAULT 'student',
        profilePicture VARCHAR(255) DEFAULT '',
        dateOfBirth DATETIME NULL,
        phone VARCHAR(255) NULL,
        isActive BOOLEAN DEFAULT TRUE,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_email (email),
        INDEX idx_username (username),
        INDEX idx_role (role),
        INDEX idx_active (isActive)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ users');

    // COURSES TABLE
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        instructorId INT NOT NULL,
        category VARCHAR(255) NOT NULL,
        level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
        duration INT NOT NULL COMMENT 'Duration in minutes',
        thumbnail VARCHAR(255) DEFAULT '',
        videos JSON DEFAULT (JSON_ARRAY()),
        quizId INT NULL,
        isPublished BOOLEAN DEFAULT FALSE,
        tags JSON DEFAULT (JSON_ARRAY()),
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (instructorId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_instructor (instructorId),
        INDEX idx_category (category),
        INDEX idx_level (level),
        INDEX idx_published (isPublished),
        FULLTEXT(title, description, category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ courses');

    // QUIZZES TABLE (with retake fields)
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(100) NOT NULL,
        description VARCHAR(500) NULL,
        courseId INT NOT NULL,
        createdById INT NOT NULL,
        questions JSON DEFAULT (JSON_ARRAY()),
        passingScore INT DEFAULT 70,
        totalPoints INT DEFAULT 0,
        timeLimit INT DEFAULT 30 COMMENT 'Total quiz time in minutes',
        attempts INT DEFAULT 1,
        isActive BOOLEAN DEFAULT TRUE,
        randomizeQuestions BOOLEAN DEFAULT FALSE,
        showResults BOOLEAN DEFAULT TRUE,
        allowRetake BOOLEAN DEFAULT FALSE COMMENT 'Allow retakes for failed attempts',
        retakeCooldownHours INT DEFAULT 24 COMMENT 'Hours before retake allowed',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_course (courseId),
        INDEX idx_creator (createdById),
        INDEX idx_active (isActive),
        CONSTRAINT chk_retake_cooldown CHECK (retakeCooldownHours >= 1 AND retakeCooldownHours <= 8760)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ quizzes');

    // QUIZ_RESULTS TABLE
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS quiz_results (
        id INT PRIMARY KEY AUTO_INCREMENT,
        studentId INT NOT NULL,
        quizId INT NOT NULL,
        courseId INT NOT NULL,
        answers JSON DEFAULT (JSON_ARRAY()),
        score INT NOT NULL DEFAULT 0,
        percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        totalQuestions INT NOT NULL DEFAULT 0,
        correctAnswers INT NOT NULL DEFAULT 0,
        totalPoints INT NOT NULL DEFAULT 0,
        timeSpent INT NOT NULL DEFAULT 0 COMMENT 'Time in seconds',
        isPassed BOOLEAN NOT NULL DEFAULT FALSE,
        attemptNumber INT DEFAULT 1,
        startedAt DATETIME NOT NULL,
        completedAt DATETIME NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_student (studentId),
        INDEX idx_quiz (quizId),
        INDEX idx_course (courseId),
        INDEX idx_passed (isPassed),
        INDEX idx_student_quiz (studentId, quizId),
        CONSTRAINT chk_percentage CHECK (percentage >= 0 AND percentage <= 100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ quiz_results');

    // QUIZ_SESSIONS TABLE
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS quiz_sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        studentId INT NOT NULL,
        quizId INT NOT NULL,
        sessionToken VARCHAR(255) NOT NULL UNIQUE,
        answers JSON DEFAULT (JSON_OBJECT()),
        lockedQuestions JSON DEFAULT (JSON_ARRAY()),
        currentQuestion INT DEFAULT 0,
        questionOrder JSON DEFAULT (JSON_ARRAY()),
        startedAt DATETIME NOT NULL,
        lastActivityAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        expiresAt DATETIME NOT NULL,
        isCompleted BOOLEAN DEFAULT FALSE,
        isExpired BOOLEAN DEFAULT FALSE,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_student (studentId),
        INDEX idx_quiz (quizId),
        INDEX idx_session_token (sessionToken),
        INDEX idx_expires_at (expiresAt),
        INDEX idx_completed (isCompleted)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ quiz_sessions');

    // COURSE_ENROLLMENTS TABLE
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS course_enrollments (
        studentId INT NOT NULL,
        courseId INT NOT NULL,
        enrolledAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        progress INT DEFAULT 0 COMMENT 'Progress 0-100',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        PRIMARY KEY (studentId, courseId),
        FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_student (studentId),
        INDEX idx_course (courseId),
        CONSTRAINT chk_progress CHECK (progress >= 0 AND progress <= 100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ course_enrollments');

    // LANGUAGES TABLE
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS languages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(10) NOT NULL UNIQUE,
        nativeName VARCHAR(100) NOT NULL,
        direction ENUM('ltr', 'rtl') DEFAULT 'ltr',
        isActive BOOLEAN DEFAULT TRUE,
        isDefault BOOLEAN DEFAULT FALSE,
        flag VARCHAR(255) NULL COMMENT 'Flag image path',
        createdById INT NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_code (code),
        INDEX idx_active (isActive),
        INDEX idx_default (isDefault)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ languages');

    // QUIZ_TRANSLATIONS TABLE
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS quiz_translations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        quizId INT NOT NULL,
        languageId INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        description VARCHAR(500) NULL,
        questions JSON DEFAULT (JSON_ARRAY()) COMMENT 'Translated questions',
        createdById INT NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (languageId) REFERENCES languages(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE KEY unique_quiz_language (quizId, languageId),
        INDEX idx_quiz (quizId),
        INDEX idx_language (languageId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  ✓ quiz_translations');

    // Add course-quiz foreign key
    try {
      await this.sequelize.query(`
        ALTER TABLE courses 
        ADD CONSTRAINT fk_courses_quiz 
        FOREIGN KEY (quizId) REFERENCES quizzes(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log('  ✓ Course-Quiz relationship');
    } catch {
      console.log('  ℹ  Course-Quiz relationship exists');
    }

    console.log('\n  ✅ All 8 tables created successfully\n');
  }

  /**
   * Verify schema is correct
   */
  async verifySchema() {
    console.log('🔍 Step 5: Verifying Schema\n');

    const [tables] = await this.sequelize.query("SHOW TABLES");
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    const expected = ['users', 'courses', 'quizzes', 'quiz_results', 'quiz_sessions', 
                      'course_enrollments', 'languages', 'quiz_translations'];
    const missing = expected.filter(t => !tableNames.includes(t));
    
    if (missing.length > 0) {
      throw new Error(`Missing tables: ${missing.join(', ')}`);
    }
    
    console.log(`  ✓ All ${expected.length} tables verified`);

    // Verify retake fields exist in quizzes
    const [columns] = await this.sequelize.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'quizzes' 
      AND COLUMN_NAME IN ('allowRetake', 'retakeCooldownHours')
    `, { replacements: [this.config.name] });
    
    if (columns.length === 2) {
      console.log('  ✓ Quiz retake fields present');
    } else {
      throw new Error('Missing retake fields in quizzes table');
    }

    // Verify foreign keys
    const [fks] = await this.sequelize.query(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE CONSTRAINT_SCHEMA = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    `, { replacements: [this.config.name] });
    
    console.log(`  ✓ ${fks[0].count} foreign key constraints\n`);
  }

  /**
   * Seed initial data
   */
  async seedInitialData() {
    console.log('🌱 Step 6: Seeding Initial Data\n');

    // Check if admin exists
    const [existing] = await this.sequelize.query(
      "SELECT COUNT(*) as count FROM users WHERE email = 'admin@demo.com'"
    );

    if (existing[0].count > 0) {
      console.log('  ℹ  Data already exists, skipping seed\n');
      return;
    }

    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create users
    await this.sequelize.query(`
      INSERT INTO users (username, email, password, firstName, lastName, role, createdAt, updatedAt)
      VALUES 
        ('admin', 'admin@demo.com', ?, 'Admin', 'User', 'admin', NOW(), NOW()),
        ('john_doe', 'student@demo.com', ?, 'John', 'Doe', 'student', NOW(), NOW()),
        ('jane_smith', 'jane@demo.com', ?, 'Jane', 'Smith', 'student', NOW(), NOW())
    `, { replacements: [hashedPassword, hashedPassword, hashedPassword] });
    console.log('  ✓ Users created (3)');

    const [admin] = await this.sequelize.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    const adminId = admin[0].id;

    // Create languages
    await this.sequelize.query(`
      INSERT INTO languages (name, code, nativeName, direction, isActive, isDefault, flag, createdById, createdAt, updatedAt)
      VALUES 
        ('English', 'en', 'English', 'ltr', TRUE, TRUE, '/flags/en.png', ?, NOW(), NOW()),
        ('Arabic', 'ar', 'العربية', 'rtl', TRUE, FALSE, '/flags/ar.png', ?, NOW(), NOW()),
        ('Urdu', 'ur', 'اردو', 'rtl', TRUE, FALSE, '/flags/ur.png', ?, NOW(), NOW())
    `, { replacements: [adminId, adminId, adminId] });
    console.log('  ✓ Languages created (3)');

    // Create courses
    await this.sequelize.query(`
      INSERT INTO courses (title, description, instructorId, category, level, duration, isPublished, tags, createdAt, updatedAt)
      VALUES 
        ('Introduction to Web Development', 
         'Learn HTML, CSS, and JavaScript fundamentals for web development.', 
         ?, 'Programming', 'Beginner', 180, TRUE, 
         JSON_ARRAY('HTML', 'CSS', 'JavaScript'), NOW(), NOW()),
        ('Advanced JavaScript', 
         'Master advanced JavaScript concepts including closures, promises, and async/await.', 
         ?, 'Programming', 'Advanced', 240, TRUE, 
         JSON_ARRAY('JavaScript', 'ES6', 'Advanced'), NOW(), NOW())
    `, { replacements: [adminId, adminId] });
    console.log('  ✓ Courses created (2)');

    // Create quizzes with retake enabled
    const [courses] = await this.sequelize.query("SELECT id FROM courses ORDER BY id LIMIT 2");
    
    await this.sequelize.query(`
      INSERT INTO quizzes (title, description, courseId, createdById, questions, passingScore, timeLimit, totalPoints, allowRetake, retakeCooldownHours, createdAt, updatedAt)
      VALUES 
        ('Web Dev Fundamentals Quiz', 
         'Test your knowledge of HTML, CSS, and JavaScript basics', 
         ?, ?, JSON_ARRAY(), 70, 20, 100, TRUE, 24, NOW(), NOW()),
        ('Advanced JS Assessment', 
         'Challenge yourself with advanced JavaScript questions', 
         ?, ?, JSON_ARRAY(), 80, 30, 150, TRUE, 48, NOW(), NOW())
    `, { replacements: [courses[0].id, adminId, courses[1].id, adminId] });
    console.log('  ✓ Quizzes created (2)');

    console.log('\n  ✅ Seed data complete\n');
  }

  /**
   * Setup required directories
   */
  async setupDirectories() {
    console.log('📁 Step 7: Setting Up Directories\n');

    const dirs = [
      'uploads/videos',
      'uploads/thumbnails',
      'uploads/profiles',
      'logs',
      'temp'
    ];

    for (const dir of dirs) {
      const fullPath = path.join(__dirname, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`  ✓ Created: ${dir}`);
      } else {
        console.log(`  ✓ Exists: ${dir}`);
      }
    }
    console.log();
  }

  /**
   * Final verification
   */
  async finalVerification() {
    console.log('✅ Step 8: Final Verification\n');

    const [users] = await this.sequelize.query("SELECT COUNT(*) as count FROM users");
    const [courses] = await this.sequelize.query("SELECT COUNT(*) as count FROM courses");
    const [quizzes] = await this.sequelize.query("SELECT COUNT(*) as count FROM quizzes");
    const [languages] = await this.sequelize.query("SELECT COUNT(*) as count FROM languages");

    console.log(`  Users:     ${users[0].count}`);
    console.log(`  Courses:   ${courses[0].count}`);
    console.log(`  Quizzes:   ${quizzes[0].count}`);
    console.log(`  Languages: ${languages[0].count}\n`);
  }

  /**
   * Cleanup connections
   */
  async cleanup() {
    if (this.sequelize) {
      await this.sequelize.close();
      this.sequelize = null;
    }
    if (this.tempConnection) {
      await this.tempConnection.close();
      this.tempConnection = null;
    }
  }
}

// Export for programmatic use
module.exports = DatabaseSetup;

// Run if called directly
if (require.main === module) {
  const setup = new DatabaseSetup();
  
  process.on('SIGINT', async () => {
    console.log('\n\n⚠️  Interrupted');
    await setup.cleanup();
    process.exit(1);
  });

  setup.run()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
