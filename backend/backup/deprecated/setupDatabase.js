const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const setupDatabase = async () => {
  try {
    console.log('🚀 Setting up Education Website Database...');
    
    // First connect without specifying database to create it
    const sequelizeWithoutDB = new Sequelize(
      '', // No database specified
      process.env.DB_USER || 'root',
      process.env.DB_PASS || '7710',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false
      }
    );

    // Create database if it doesn't exist
    const databaseName = process.env.DB_NAME || 'education_website';
    await sequelizeWithoutDB.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\`;`);
    console.log(`✅ Database '${databaseName}' created or already exists`);
    await sequelizeWithoutDB.close();

    // Now connect to the specific database
    const sequelize = new Sequelize(
      databaseName,
      process.env.DB_USER || 'root',
      process.env.DB_PASS || '7710',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
        define: {
          timestamps: true,
          underscored: false,
        },
      }
    );

    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Define all tables with IF NOT EXISTS logic
    console.log('📋 Creating tables...');

    // Users table
    await sequelize.query(`
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
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Users table created');

    // Courses table
    await sequelize.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Courses table created');

    // Quizzes table
    await sequelize.query(`
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
        INDEX idx_active (isActive)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Quizzes table created');

    // Add foreign key constraint to courses table for quizId (after quizzes table exists)
    await sequelize.query(`
      ALTER TABLE courses 
      ADD CONSTRAINT fk_courses_quiz 
      FOREIGN KEY (quizId) REFERENCES quizzes(id) 
      ON DELETE SET NULL ON UPDATE CASCADE;
    `).catch(() => {
      // Ignore error if constraint already exists
    });

    // Quiz Results table
    await sequelize.query(`
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
        INDEX idx_completed (completedAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Quiz Results table created');

    // Quiz Sessions table (for temporary quiz progress storage)
    await sequelize.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Quiz Sessions table created');

    // Course Enrollments table (junction table for many-to-many)
    await sequelize.query(`
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
        CONSTRAINT chk_progress CHECK (progress >= 0 AND progress <= 100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Course Enrollments table created');

    console.log('🎯 All tables created successfully!');

    // Create sample data if it doesn't exist
    const [userResults] = await sequelize.query(`SELECT COUNT(*) as count FROM users WHERE email = 'admin@demo.com'`);
    
    if (userResults[0].count === 0) {
      console.log('📝 Creating sample data...');
      
      // Hash password manually since we're using raw SQL
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      // Create admin user
      const [adminResult] = await sequelize.query(`
        INSERT INTO users (username, email, password, firstName, lastName, role, createdAt, updatedAt)
        VALUES ('admin', 'admin@demo.com', ?, 'Admin', 'User', 'admin', NOW(), NOW())
      `, { 
        replacements: [hashedPassword]
      });
      
      // Create student user  
      await sequelize.query(`
        INSERT INTO users (username, email, password, firstName, lastName, role, createdAt, updatedAt)
        VALUES ('student', 'student@demo.com', ?, 'John', 'Student', 'student', NOW(), NOW())
      `, { 
        replacements: [hashedPassword]
      });
      
      const adminId = adminResult;
      
      // Create sample course
      const [courseResult] = await sequelize.query(`
        INSERT INTO courses (title, description, instructorId, category, level, duration, isPublished, tags, createdAt, updatedAt)
        VALUES (
          'Introduction to Web Development',
          'Learn the basics of web development including HTML, CSS, and JavaScript.',
          ?,
          'Programming',
          'Beginner', 
          120,
          TRUE,
          JSON_ARRAY('HTML', 'CSS', 'JavaScript', 'Beginner'),
          NOW(),
          NOW()
        )
      `, {
        replacements: [adminId]
      });
      
      const courseId = courseResult;
      
      // Create sample quiz
      const quizQuestions = JSON.stringify([
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
          timeLimit: 45,
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
          explanation: 'The <h1> tag represents the largest heading in HTML.',
          points: 8,
          timeLimit: 40,
          order: 3
        }
      ]);
      
      const [quizResult] = await sequelize.query(`
        INSERT INTO quizzes (title, description, courseId, createdById, questions, passingScore, timeLimit, totalPoints, createdAt, updatedAt)
        VALUES (
          'Web Development Basics Quiz',
          'Test your knowledge of HTML and CSS basics',
          ?,
          ?,
          ?,
          70,
          15,
          23,
          NOW(),
          NOW()
        )
      `, {
        replacements: [courseId, adminId, quizQuestions]
      });
      
      const quizId = quizResult;
      
      // Update course with quiz reference (ensure both directions match)
      await sequelize.query(`
        UPDATE courses SET quizId = ? WHERE id = ?
      `, {
        replacements: [quizId, courseId]
      });
      
      // Ensure quiz points to correct course
      await sequelize.query(`
        UPDATE quizzes SET courseId = ? WHERE id = ?
      `, {
        replacements: [courseId, quizId]
      });
      
      console.log('✅ Sample data created successfully!');
      console.log('📧 Admin credentials: admin@demo.com / password123');
      console.log('📧 Student credentials: student@demo.com / password123');
    } else {
      console.log('📝 Sample data already exists, skipping creation');
    }

    await sequelize.close();
    console.log('🎉 Database setup completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

setupDatabase();