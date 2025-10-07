const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class QuizSession extends Model {}

QuizSession.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  quizId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'quizzes',
      key: 'id'
    }
  },
  sessionToken: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  answers: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  lockedQuestions: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  currentQuestion: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  questionOrder: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  lastActivityAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isExpired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  sequelize,
  modelName: 'QuizSession',
  tableName: 'quiz_sessions',
  timestamps: true
});

module.exports = QuizSession;