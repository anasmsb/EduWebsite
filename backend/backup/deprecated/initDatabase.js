/*
 * DEPRECATED: This file is replaced by setupDatabase.js
 * Please use: node setupDatabase.js
 * 
 * This file remains for compatibility but should not be used for new setups.
 */

const { sequelize, User, Course, Quiz } = require('./models');

const initializeDatabase = async () => {
  try {
    console.log('⚠️  WARNING: This initialization method is deprecated!');
    console.log('🔄 Please use: node setupDatabase.js for clean database setup');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Sync database (create tables if they don't exist)
    await sequelize.sync();
    console.log('Database synchronized.');
    
    // Check if data already exists
    const existingAdmin = await User.findOne({ where: { email: 'admin@demo.com' } });
    if (existingAdmin) {
      console.log('Demo data already exists. Skipping initialization.');
      return;
    }
    
    // Create admin user
    const admin = await User.create({
      username: 'admin',
      email: 'admin@demo.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });
    
    // Create student user
    const student = await User.create({
      username: 'student',
      email: 'student@demo.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Student',
      role: 'student'
    });
    
    // Create sample course
    const course = await Course.create({
      title: 'Introduction to Web Development',
      description: 'Learn the basics of web development including HTML, CSS, and JavaScript.',
      instructorId: admin.id,
      category: 'Programming',
      level: 'Beginner',
      duration: 120, // 2 hours
      isPublished: true,
      videos: [
        // No sample videos - admin can upload real videos through the interface
      ],
      tags: ['HTML', 'CSS', 'JavaScript', 'Beginner']
    });
    
    // Create sample quiz
    const quiz = await Quiz.create({
      title: 'Web Development Basics Quiz',
      description: 'Test your knowledge of HTML and CSS basics',
      courseId: course.id,
      createdById: admin.id,
      passingScore: 70,
      timeLimit: 15, // 15 minutes
      questions: [
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
      ]
    });
    
    // Update course with quiz reference
    await Course.update(
      { quizId: quiz.id },
      { where: { id: course.id } }
    );
    
    console.log('✅ Database initialized successfully!');
    console.log('📧 Admin email: admin@demo.com');
    console.log('🔑 Admin password: password123');
    console.log('📧 Student email: student@demo.com');
    console.log('🔑 Student password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
};

initializeDatabase();