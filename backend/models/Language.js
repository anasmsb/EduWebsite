const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Language extends Model {}

Language.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    validate: {
      len: [2, 10]
    }
  },
  nativeName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  direction: {
    type: DataTypes.ENUM('ltr', 'rtl'),
    defaultValue: 'ltr'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  flag: {
    type: DataTypes.STRING(255),
    comment: 'URL or path to flag image'
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
  modelName: 'Language',
  tableName: 'languages',
  hooks: {
    beforeSave: async (language) => {
      // If this language is being set as default, unset all other defaults
      if (language.isDefault) {
        await Language.update(
          { isDefault: false },
          { where: { isDefault: true } }
        );
      }
    }
  }
});

module.exports = Language;