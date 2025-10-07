const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Quiz extends Model {}

Quiz.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.STRING(500),
    validate: {
      len: [0, 500]
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
  questions: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  passingScore: {
    type: DataTypes.INTEGER,
    defaultValue: 70,
    validate: {
      min: 0,
      max: 100
    }
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  timeLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    validate: {
      min: 5
    },
    comment: 'Total quiz time limit in minutes'
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  randomizeQuestions: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  showResults: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  allowRetake: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether retakes are allowed for failed attempts'
  },
  retakeCooldownHours: {
    type: DataTypes.INTEGER,
    defaultValue: 24,
    validate: {
      min: 1,
      max: 8760 // Max 1 year in hours
    },
    comment: 'Hours to wait before retake is allowed after a failed attempt'
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Quiz',
  tableName: 'quizzes',
  hooks: {
    beforeSave: (quiz) => {
      if (quiz.questions && quiz.questions.length > 0) {
        quiz.totalPoints = quiz.questions.reduce((total, question) => total + (question.points || 1), 0);
      }
    }
  }
});

module.exports = Quiz;