const express = require('express');
const { Op } = require('sequelize');
const { Language, User } = require('../models');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Get all languages
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;
    const whereClause = active === 'true' ? { isActive: true } : {};
    
    const languages = await Language.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['isDefault', 'DESC'], ['name', 'ASC']]
    });

    res.json({ languages });
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ message: 'Failed to fetch languages' });
  }
});

// Get language by ID
router.get('/:id', async (req, res) => {
  try {
    const language = await Language.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!language) {
      return res.status(404).json({ message: 'Language not found' });
    }

    res.json({ language });
  } catch (error) {
    console.error('Error fetching language:', error);
    res.status(500).json({ message: 'Failed to fetch language' });
  }
});

// Create a new language (admin only)
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { name, code, nativeName, direction, flag, isActive, isDefault } = req.body;

    // Check if language code already exists
    const existingLanguage = await Language.findOne({ where: { code } });
    if (existingLanguage) {
      return res.status(400).json({ message: 'Language code already exists' });
    }

    const language = await Language.create({
      name,
      code: code.toLowerCase(),
      nativeName,
      direction: direction || 'ltr',
      flag,
      isActive: isActive !== undefined ? isActive : true,
      isDefault: isDefault || false,
      createdById: req.user.id
    });

    const languageWithCreator = await Language.findByPk(language.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.status(201).json({ 
      message: 'Language created successfully',
      language: languageWithCreator 
    });
  } catch (error) {
    console.error('Error creating language:', error);
    res.status(500).json({ message: 'Failed to create language' });
  }
});

// Update language (admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const language = await Language.findByPk(req.params.id);
    if (!language) {
      return res.status(404).json({ message: 'Language not found' });
    }

    const { name, code, nativeName, direction, flag, isActive, isDefault } = req.body;

    // Check if language code already exists (excluding current language)
    if (code && code !== language.code) {
      const existingLanguage = await Language.findOne({ 
        where: { 
          code: code.toLowerCase(),
          id: { [Op.ne]: req.params.id }
        } 
      });
      if (existingLanguage) {
        return res.status(400).json({ message: 'Language code already exists' });
      }
    }

    await language.update({
      name: name || language.name,
      code: code ? code.toLowerCase() : language.code,
      nativeName: nativeName || language.nativeName,
      direction: direction || language.direction,
      flag: flag !== undefined ? flag : language.flag,
      isActive: isActive !== undefined ? isActive : language.isActive,
      isDefault: isDefault !== undefined ? isDefault : language.isDefault
    });

    const updatedLanguage = await Language.findByPk(language.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.json({ 
      message: 'Language updated successfully',
      language: updatedLanguage 
    });
  } catch (error) {
    console.error('Error updating language:', error);
    res.status(500).json({ message: 'Failed to update language' });
  }
});

// Delete language (admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const language = await Language.findByPk(req.params.id);
    if (!language) {
      return res.status(404).json({ message: 'Language not found' });
    }

    if (language.isDefault) {
      return res.status(400).json({ message: 'Cannot delete the default language' });
    }

    await language.destroy();

    res.json({ message: 'Language deleted successfully' });
  } catch (error) {
    console.error('Error deleting language:', error);
    res.status(500).json({ message: 'Failed to delete language' });
  }
});

// Set default language (admin only)
router.put('/:id/set-default', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const language = await Language.findByPk(req.params.id);
    if (!language) {
      return res.status(404).json({ message: 'Language not found' });
    }

    // Unset all other defaults first
    await Language.update({ isDefault: false }, { where: { isDefault: true } });
    
    // Set this language as default
    await language.update({ isDefault: true, isActive: true });

    res.json({ message: 'Default language updated successfully' });
  } catch (error) {
    console.error('Error setting default language:', error);
    res.status(500).json({ message: 'Failed to set default language' });
  }
});

module.exports = router;