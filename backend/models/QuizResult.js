const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class QuizResult extends Model {}

QuizResult.init({
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
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  answers: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    }
  },
  totalQuestions: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  correctAnswers: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  timeSpent: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Total time spent in seconds'
  },
  isPassed: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  attemptNumber: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'QuizResult',
  tableName: 'quiz_results',
  indexes: [
    {
      fields: ['studentId', 'quizId', 'attemptNumber']
    },
    {
      fields: ['courseId', 'createdAt']
    }
  ]
});

module.exports = QuizResult;