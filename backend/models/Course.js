const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Course extends Model {}

Course.init({
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
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 1000]
    }
  },
  instructorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  level: {
    type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
    defaultValue: 'Beginner'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duration in minutes'
  },
  thumbnail: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  videos: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  quizId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'quizzes',
      key: 'id'
    }
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  sequelize,
  modelName: 'Course',
  tableName: 'courses',
  indexes: [
    {
      type: 'FULLTEXT',
      fields: ['title', 'description', 'category']
    }
  ]
});

module.exports = Course;