const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class QuizTranslation extends Model {}

QuizTranslation.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  quizId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'quizzes',
      key: 'id'
    }
  },
  languageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'languages',
      key: 'id'
    }
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
  questions: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Translated questions array'
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
  modelName: 'QuizTranslation',
  tableName: 'quiz_translations',
  indexes: [
    {
      unique: true,
      fields: ['quizId', 'languageId']
    }
  ]
});

module.exports = QuizTranslation;