const sequelize = require('../config/database');
const User = require('./User');
const Course = require('./Course');
const Quiz = require('./Quiz');
const QuizResult = require('./QuizResult');
const QuizSession = require('./QuizSession');
const Language = require('./Language');
const QuizTranslation = require('./QuizTranslation');

// Define associations
User.hasMany(Course, { foreignKey: 'instructorId', as: 'courses' });
Course.belongsTo(User, { foreignKey: 'instructorId', as: 'instructor' });

Course.hasOne(Quiz, { foreignKey: 'courseId', as: 'quiz' });
Quiz.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

User.hasMany(Quiz, { foreignKey: 'createdById', as: 'createdQuizzes' });
Quiz.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });

User.hasMany(QuizResult, { foreignKey: 'studentId', as: 'quizResults' });
QuizResult.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

Quiz.hasMany(QuizResult, { foreignKey: 'quizId', as: 'results' });
QuizResult.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });

Course.hasMany(QuizResult, { foreignKey: 'courseId', as: 'results' });
QuizResult.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Quiz Sessions associations
User.hasMany(QuizSession, { foreignKey: 'studentId', as: 'quizSessions' });
QuizSession.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

Quiz.hasMany(QuizSession, { foreignKey: 'quizId', as: 'sessions' });
QuizSession.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });

// Language associations
User.hasMany(Language, { foreignKey: 'createdById', as: 'createdLanguages' });
Language.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });

// Quiz Translation associations
Quiz.hasMany(QuizTranslation, { foreignKey: 'quizId', as: 'translations' });
QuizTranslation.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });

Language.hasMany(QuizTranslation, { foreignKey: 'languageId', as: 'quizTranslations' });
QuizTranslation.belongsTo(Language, { foreignKey: 'languageId', as: 'language' });

User.hasMany(QuizTranslation, { foreignKey: 'createdById', as: 'createdTranslations' });
QuizTranslation.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });

// Create a junction table for course enrollments
const CourseEnrollment = sequelize.define('CourseEnrollment', {
  enrolledAt: {
    type: sequelize.Sequelize.DATE,
    defaultValue: sequelize.Sequelize.NOW
  },
  progress: {
    type: sequelize.Sequelize.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  }
}, {
  tableName: 'course_enrollments'
});

// CourseEnrollment associations
CourseEnrollment.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
CourseEnrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

User.hasMany(CourseEnrollment, { foreignKey: 'studentId', as: 'enrollments' });
Course.hasMany(CourseEnrollment, { foreignKey: 'courseId', as: 'enrollments' });

User.belongsToMany(Course, { through: CourseEnrollment, foreignKey: 'studentId', as: 'enrolledCourses' });
Course.belongsToMany(User, { through: CourseEnrollment, foreignKey: 'courseId', as: 'enrolledStudents' });

module.exports = {
  sequelize,
  User,
  Course,
  Quiz,
  QuizResult,
  QuizSession,
  CourseEnrollment,
  Language,
  QuizTranslation
};