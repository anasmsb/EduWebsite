const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

/**
 * Comprehensive Database Initialization and Setup
 * 
 * This file consolidates all database creation, migration, and seeding functionality:
 * - Database creation
 * - Table creation with proper constraints and indexes
 * - Sample data seeding
 * - Directory structure setup
 * - Environment validation
 */

class DatabaseManager {
  constructor() {
    this.dbConfig = {
      name: process.env.DB_NAME || 'education_website',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '7710',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql'
    };
    
    this.sequelize = null;
    this.sequelizeWithoutDB = null;
  }

  /**
   * Initialize the complete database setup process
   */
  async initialize() {
    try {
      console.log('🚀 Starting Education Website Database Initialization...\n');
      
      // Step 1: Validate environment
      await this.validateEnvironment();
      
      // Step 2: Create database if it doesn't exist
      await this.createDatabase();
      
      // Step 3: Connect to the database
      await this.connectToDatabase();
      
      // Step 4: Create all tables with constraints and indexes
      await this.createTables();
      
      // Step 5: Seed initial data
      await this.seedDatabase();
      
      // Step 6: Setup required directories
      await this.setupDirectories();
      
      // Step 7: Cleanup and final verification
      await this.finalVerification();
      
      // Step 8: Cleanup initialization connections (server will create its own)
      await this.cleanup();
      
      console.log('\n🎉 Database initialization completed successfully!');
      console.log('📧 Admin: admin@demo.com / password123');
      console.log('📧 Student: student@demo.com / password123');
      
    } catch (error) {
      console.error('\n❌ Database initialization failed:', error);
      await this.cleanup();
      process.exit(1);
    }
  }

  /**
   * Validate environment and prerequisites
   */
  async validateEnvironment() {
    console.log('🔍 Validating environment...');
    
    // Check required packages
    const requiredPackages = ['sequelize', 'mysql2', 'bcryptjs', 'dotenv'];
    for (const pkg of requiredPackages) {
      try {
        require(pkg);
        console.log(`  ✅ ${pkg} - OK`);
      } catch (error) {
        throw new Error(`Missing required package: ${pkg}. Run: npm install ${pkg}`);
      }
    }
    
    // Validate database connection parameters
    if (!this.dbConfig.user) {
      throw new Error('Database user not specified. Set DB_USER environment variable.');
    }
    
    console.log(`  ✅ Database config - Host: ${this.dbConfig.host}:${this.dbConfig.port}`);
    console.log(`  ✅ Database config - User: ${this.dbConfig.user}`);
    console.log(`  ✅ Database config - Database: ${this.dbConfig.name}`);
  }

  /**
   * Create database if it doesn't exist
   */
  async createDatabase() {
    console.log('\n📦 Creating database...');
    
    // Connect without specifying database
    this.sequelizeWithoutDB = new Sequelize(
      '', // No database specified
      this.dbConfig.user,
      this.dbConfig.password,
      {
        host: this.dbConfig.host,
        port: this.dbConfig.port,
        dialect: this.dbConfig.dialect,
        logging: false
      }
    );

    try {
      await this.sequelizeWithoutDB.authenticate();
      console.log('  ✅ MySQL connection established');
      
      // Create database if it doesn't exist
      await this.sequelizeWithoutDB.query(
        `CREATE DATABASE IF NOT EXISTS \`${this.dbConfig.name}\` 
         CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      );
      console.log(`  ✅ Database '${this.dbConfig.name}' created or verified`);
      
    } catch (error) {
      throw new Error(`Failed to create database: ${error.message}`);
    } finally {
      if (this.sequelizeWithoutDB) {
        await this.sequelizeWithoutDB.close();
      }
    }
  }

  /**
   * Connect to the specific database
   */
  async connectToDatabase() {
    console.log('\n🔌 Connecting to database...');
    
    this.sequelize = new Sequelize(
      this.dbConfig.name,
      this.dbConfig.user,
      this.dbConfig.password,
      {
        host: this.dbConfig.host,
        port: this.dbConfig.port,
        dialect: this.dbConfig.dialect,
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        define: {
          timestamps: true,
          underscored: false,
        },
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

    await this.sequelize.authenticate();
    console.log('  ✅ Connected to database successfully');
  }

  /**
   * Create all database tables with proper structure, constraints, and indexes
   */
  async createTables() {
    console.log('\n📋 Creating database tables...');

    const tables = [
      {
        name: 'users',
        query: `
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
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `
      },
      {
        name: 'courses',
        query: `
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
            INDEX idx_created (createdAt),
            FULLTEXT(title, description, category)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `
      },
      {
        name: 'quizzes',
        query: `
          CREATE TABLE IF NOT EXISTS quizzes (
            id INT PRIMARY KEY AUTO_INCREMENT,
            title VARCHAR(100) NOT NULL,
            description VARCHAR(500) NULL,
            courseId INT NOT NULL,
            createdById INT NOT NULL,
            questions JSON DEFAULT (JSON_ARRAY()),
            passingScore INT DEFAULT 70,
            totalPoints INT DEFAULT 0,
            timeLimit INT DEFAULT 30 COMMENT 'Total quiz time limit in minutes',
            attempts INT DEFAULT 1,
            isActive BOOLEAN DEFAULT TRUE,
            randomizeQuestions BOOLEAN DEFAULT FALSE,
            showResults BOOLEAN DEFAULT TRUE,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
            INDEX idx_course (courseId),
            INDEX idx_creator (createdById),
            INDEX idx_active (isActive),
            INDEX idx_created (createdAt)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `
      },
      {
        name: 'quiz_results',
        query: `
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
            timeSpent INT NOT NULL DEFAULT 0 COMMENT 'Total time spent in seconds',
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
            INDEX idx_completed (completedAt),
            INDEX idx_created (createdAt),
            INDEX idx_student_quiz (studentId, quizId),
            CONSTRAINT chk_percentage CHECK (percentage >= 0 AND percentage <= 100),
            CONSTRAINT chk_score CHECK (score >= 0)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `
      },
      {
        name: 'quiz_sessions',
        query: `
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
            INDEX idx_completed (isCompleted),
            INDEX idx_last_activity (lastActivityAt)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `
      },
      {
        name: 'course_enrollments',
        query: `
          CREATE TABLE IF NOT EXISTS course_enrollments (
            studentId INT NOT NULL,
            courseId INT NOT NULL,
            enrolledAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            progress INT DEFAULT 0 COMMENT 'Progress percentage 0-100',
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (studentId, courseId),
            FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
            INDEX idx_student (studentId),
            INDEX idx_course (courseId),
            INDEX idx_enrolled (enrolledAt),
            CONSTRAINT chk_progress CHECK (progress >= 0 AND progress <= 100)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `
      },
      {
        name: 'languages',
        query: `
          CREATE TABLE IF NOT EXISTS languages (
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
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `
      },
      {
        name: 'quiz_translations',
        query: `
          CREATE TABLE IF NOT EXISTS quiz_translations (
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
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `
      }
    ];

    // Create each table
    for (const table of tables) {
      await this.sequelize.query(table.query);
      console.log(`  ✅ ${table.name} table created`);
    }

    // Add course-quiz relationship constraint after both tables exist
    try {
      await this.sequelize.query(`
        ALTER TABLE courses 
        ADD CONSTRAINT fk_courses_quiz 
        FOREIGN KEY (quizId) REFERENCES quizzes(id) 
        ON DELETE SET NULL ON UPDATE CASCADE;
      `);
      console.log('  ✅ Course-Quiz relationship constraint added');
    } catch (error) {
      // Constraint might already exist, ignore
      console.log('  ℹ️  Course-Quiz relationship constraint already exists');
    }

    console.log('  ✅ All tables created successfully');
  }

  /**
   * Seed the database with initial sample data
   */
  async seedDatabase() {
    console.log('\n🌱 Seeding database with initial data...');

    // Check if data already exists
    const [userResults] = await this.sequelize.query(
      `SELECT COUNT(*) as count FROM users WHERE email = 'admin@demo.com'`
    );
    
    const [languageResults] = await this.sequelize.query(
      `SELECT COUNT(*) as count FROM languages`
    );

    let adminId = null;

    if (userResults[0].count > 0) {
      console.log('  ℹ️  Sample users already exist, skipping user seeding');
      // Get existing admin ID for language creation
      const [adminResults] = await this.sequelize.query(`
        SELECT id FROM users WHERE email = 'admin@demo.com' LIMIT 1
      `);
      adminId = adminResults[0].id;
    } else {
      // Hash password for sample users
      const hashedPassword = await bcrypt.hash('password123', 12);
      console.log('  ✅ Password hashed for sample users');

      // Create admin user
      const [adminResult] = await this.sequelize.query(`
        INSERT INTO users (username, email, password, firstName, lastName, role, createdAt, updatedAt)
        VALUES ('admin', 'admin@demo.com', ?, 'Admin', 'User', 'admin', NOW(), NOW())
      `, { 
        replacements: [hashedPassword]
      });
      console.log('  ✅ Admin user created');

      // Create sample students
      await this.sequelize.query(`
        INSERT INTO users (username, email, password, firstName, lastName, role, createdAt, updatedAt)
        VALUES 
          ('john_doe', 'student@demo.com', ?, 'John', 'Doe', 'student', NOW(), NOW()),
          ('jane_smith', 'jane@demo.com', ?, 'Jane', 'Smith', 'student', NOW(), NOW())
      `, { 
        replacements: [hashedPassword, hashedPassword]
      });
      console.log('  ✅ Sample students created');

      adminId = adminResult;

      // Create sample courses
      const [courseResult1] = await this.sequelize.query(`
        INSERT INTO courses (title, description, instructorId, category, level, duration, isPublished, tags, createdAt, updatedAt)
        VALUES (
          'Introduction to Web Development',
          'Learn the fundamentals of web development including HTML, CSS, and JavaScript. Perfect for beginners who want to start their journey in web development.',
          ?,
          'Programming',
          'Beginner', 
          180,
          TRUE,
          JSON_ARRAY('HTML', 'CSS', 'JavaScript', 'Web Development', 'Frontend'),
          NOW(),
          NOW()
        )
      `, { replacements: [adminId] });

      const [courseResult2] = await this.sequelize.query(`
        INSERT INTO courses (title, description, instructorId, category, level, duration, isPublished, tags, createdAt, updatedAt)
        VALUES (
          'Advanced JavaScript Concepts',
          'Dive deep into advanced JavaScript topics including closures, prototypes, async programming, and modern ES6+ features.',
          ?,
          'Programming',
          'Advanced', 
          240,
          TRUE,
          JSON_ARRAY('JavaScript', 'ES6', 'Async Programming', 'Advanced'),
          NOW(),
          NOW()
        )
      `, { replacements: [adminId] });

      console.log('  ✅ Sample courses created');
    }

    // Always check and create default languages (regardless of user data)
    if (languageResults[0].count === 0) {
      // Create default languages
      await this.sequelize.query(`
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
      console.log('  ✅ Default languages created');
    } else {
      console.log('  ℹ️  Languages already exist, skipping language seeding');
    }

    // Continue with quiz and other seeding only if users were just created
    if (userResults[0].count === 0) {
    const [courseResult1] = await this.sequelize.query(`
      INSERT INTO courses (title, description, instructorId, category, level, duration, isPublished, tags, createdAt, updatedAt)
      VALUES (
        'Introduction to Web Development',
        'Learn the fundamentals of web development including HTML, CSS, and JavaScript. Perfect for beginners who want to start their journey in web development.',
        ?,
        'Programming',
        'Beginner', 
        180,
        TRUE,
        JSON_ARRAY('HTML', 'CSS', 'JavaScript', 'Web Development', 'Frontend'),
        NOW(),
        NOW()
      )
    `, { replacements: [adminId] });

    const [courseResult2] = await this.sequelize.query(`
      INSERT INTO courses (title, description, instructorId, category, level, duration, isPublished, tags, createdAt, updatedAt)
      VALUES (
        'Advanced JavaScript Concepts',
        'Dive deep into advanced JavaScript topics including closures, prototypes, async programming, and modern ES6+ features.',
        ?,
        'Programming',
        'Advanced', 
        240,
        TRUE,
        JSON_ARRAY('JavaScript', 'ES6', 'Async Programming', 'Advanced'),
        NOW(),
        NOW()
      )
    `, { replacements: [adminId] });

    console.log('  ✅ Sample courses created');

    // Create comprehensive quiz questions
    const webDevQuestions = JSON.stringify([
      {
        question: 'What does HTML stand for?',
        type: 'multiple-choice',
        options: [
          { text: 'HyperText Markup Language', isCorrect: true },
          { text: 'Home Tool Markup Language', isCorrect: false },
          { text: 'Hyperlinks and Text Markup Language', isCorrect: false },
          { text: 'HyperText Making Language', isCorrect: false }
        ],
        correctAnswer: 'HyperText Markup Language',
        explanation: 'HTML stands for HyperText Markup Language, the standard markup language for creating web pages.',
        points: 10,
        timeLimit: 60,
        order: 1
      },
      {
        question: 'CSS is used for styling web pages.',
        type: 'true-false',
        options: [
          { text: 'true', isCorrect: true },
          { text: 'false', isCorrect: false }
        ],
        correctAnswer: 'true',
        explanation: 'CSS (Cascading Style Sheets) is indeed used for styling and formatting web pages.',
        points: 5,
        timeLimit: 30,
        order: 2
      },
      {
        question: 'Which HTML tag is used for the largest heading?',
        type: 'dropdown',
        options: [
          { text: '<h1>', isCorrect: true },
          { text: '<h6>', isCorrect: false },
          { text: '<header>', isCorrect: false },
          { text: '<heading>', isCorrect: false }
        ],
        correctAnswer: '<h1>',
        explanation: 'The <h1> tag represents the largest heading in HTML, with <h6> being the smallest.',
        points: 8,
        timeLimit: 45,
        order: 3
      },
      {
        question: 'JavaScript is a compiled programming language.',
        type: 'true-false',
        options: [
          { text: 'true', isCorrect: false },
          { text: 'false', isCorrect: true }
        ],
        correctAnswer: 'false',
        explanation: 'JavaScript is an interpreted language, not a compiled one. It runs directly in browsers and other JavaScript engines.',
        points: 7,
        timeLimit: 40,
        order: 4
      }
    ]);

    const jsQuestions = JSON.stringify([
      {
        question: 'What is a closure in JavaScript?',
        type: 'multiple-choice',
        options: [
          { text: 'A function that has access to variables in its outer scope', isCorrect: true },
          { text: 'A way to close browser windows', isCorrect: false },
          { text: 'A method to end loops', isCorrect: false },
          { text: 'A type of variable declaration', isCorrect: false }
        ],
        correctAnswer: 'A function that has access to variables in its outer scope',
        explanation: 'A closure gives you access to an outer function\'s scope from an inner function.',
        points: 15,
        timeLimit: 90,
        order: 1
      },
      {
        question: 'Which keyword is used to declare a constant in ES6?',
        type: 'dropdown',
        options: [
          { text: 'const', isCorrect: true },
          { text: 'let', isCorrect: false },
          { text: 'var', isCorrect: false },
          { text: 'final', isCorrect: false }
        ],
        correctAnswer: 'const',
        explanation: 'The const keyword declares a read-only reference to a value.',
        points: 10,
        timeLimit: 60,
        order: 2
      }
    ]);

    // Create quizzes
    const [quizResult1] = await this.sequelize.query(`
      INSERT INTO quizzes (title, description, courseId, createdById, questions, passingScore, timeLimit, totalPoints, createdAt, updatedAt)
      VALUES (
        'Web Development Fundamentals Quiz',
        'Test your understanding of HTML, CSS, and JavaScript basics',
        ?,
        ?,
        ?,
        75,
        20,
        30,
        NOW(),
        NOW()
      )
    `, { replacements: [courseResult1, adminId, webDevQuestions] });

    const [quizResult2] = await this.sequelize.query(`
      INSERT INTO quizzes (title, description, courseId, createdById, questions, passingScore, timeLimit, totalPoints, createdAt, updatedAt)
      VALUES (
        'Advanced JavaScript Assessment',
        'Advanced concepts including closures, prototypes, and ES6+ features',
        ?,
        ?,
        ?,
        80,
        25,
        25,
        NOW(),
        NOW()
      )
    `, { replacements: [courseResult2, adminId, jsQuestions] });

    console.log('  ✅ Sample quizzes created');

    // Link courses to their quizzes
    await this.sequelize.query(`
      UPDATE courses SET quizId = ? WHERE id = ?
    `, { replacements: [quizResult1, courseResult1] });

    await this.sequelize.query(`
      UPDATE courses SET quizId = ? WHERE id = ?
    `, { replacements: [quizResult2, courseResult2] });

    console.log('  ✅ Course-quiz relationships established');

    // Create some sample enrollments
    const [students] = await this.sequelize.query(`
      SELECT id FROM users WHERE role = 'student' LIMIT 2
    `);

    if (students.length > 0) {
      await this.sequelize.query(`
        INSERT INTO course_enrollments (studentId, courseId, progress, enrolledAt, createdAt, updatedAt)
        VALUES 
          (?, ?, 25, NOW(), NOW(), NOW()),
          (?, ?, 0, NOW(), NOW(), NOW())
      `, { 
        replacements: [
          students[0].id, courseResult1,
          students[0].id, courseResult2
        ] 
      });
      console.log('  ✅ Sample course enrollments created');
    }

    }

    console.log('  ✅ Database seeding completed');
  }

  /**
   * Setup required directories for file uploads and other resources
   */
  async setupDirectories() {
    console.log('\n📁 Setting up required directories...');

    const directories = [
      'uploads',
      'uploads/videos',
      'uploads/thumbnails',
      'uploads/profiles',
      'logs',
      'temp'
    ];

    for (const dir of directories) {
      const dirPath = path.join(__dirname, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`  ✅ Created directory: ${dir}`);
      } else {
        console.log(`  ✅ Directory exists: ${dir}`);
      }
    }

    // Create .gitkeep files to preserve empty directories
    const gitkeepDirs = ['uploads/videos', 'uploads/thumbnails', 'uploads/profiles'];
    for (const dir of gitkeepDirs) {
      const gitkeepPath = path.join(__dirname, dir, '.gitkeep');
      if (!fs.existsSync(gitkeepPath)) {
        fs.writeFileSync(gitkeepPath, '# This file keeps this directory in git\n');
      }
    }

    console.log('  ✅ Directory structure setup completed');
  }

  /**
   * Final verification of the database setup
   */
  async finalVerification() {
    console.log('\n🔍 Performing final verification...');

    // Verify table creation
    const [tables] = await this.sequelize.query("SHOW TABLES");
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    const expectedTables = ['users', 'courses', 'quizzes', 'quiz_results', 'quiz_sessions', 'course_enrollments', 'languages', 'quiz_translations'];
    const missingTables = expectedTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(', ')}`);
    }
    console.log(`  ✅ All ${expectedTables.length} tables verified`);

    // Verify sample data
    const [userCount] = await this.sequelize.query("SELECT COUNT(*) as count FROM users");
    const [courseCount] = await this.sequelize.query("SELECT COUNT(*) as count FROM courses");
    const [quizCount] = await this.sequelize.query("SELECT COUNT(*) as count FROM quizzes");
    
    console.log(`  ✅ Users: ${userCount[0].count}`);
    console.log(`  ✅ Courses: ${courseCount[0].count}`);
    console.log(`  ✅ Quizzes: ${quizCount[0].count}`);

    // Verify constraints
    const [constraints] = await this.sequelize.query(`
      SELECT TABLE_NAME, CONSTRAINT_NAME, CONSTRAINT_TYPE 
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE CONSTRAINT_SCHEMA = '${this.dbConfig.name}' 
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    `);
    console.log(`  ✅ Foreign key constraints: ${constraints.length}`);

    console.log('  ✅ Verification completed successfully');
  }

  /**
   * Cleanup connections and resources
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up connections...');
    
    if (this.sequelize) {
      await this.sequelize.close();
      console.log('  ✅ Database connection closed');
      this.sequelize = null;
    }
    
    if (this.sequelizeWithoutDB) {
      await this.sequelizeWithoutDB.close();
      console.log('  ✅ Initial connection closed');
      this.sequelizeWithoutDB = null;
    }
  }

  /**
   * Get the initialized Sequelize instance
   */
  getSequelizeInstance() {
    return this.sequelize;
  }
}

// Export for programmatic use
module.exports = DatabaseManager;

// Run initialization if called directly
if (require.main === module) {
  const dbManager = new DatabaseManager();
  
  // Handle process termination gracefully
  process.on('SIGINT', async () => {
    console.log('\n\n⚠️  Process interrupted');
    await dbManager.cleanup();
    process.exit(1);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\n⚠️  Process terminated');
    await dbManager.cleanup();
    process.exit(1);
  });

  // Start initialization
  dbManager.initialize()
    .then(() => {
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('\n❌ Initialization failed:', error);
      await dbManager.cleanup();
      process.exit(1);
    });
}