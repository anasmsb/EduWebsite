const express = require('express');
const { Op } = require('sequelize');
const { QuizTranslation, Quiz, Language, User, Course } = require('../models');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Get translations for a specific quiz
router.get('/quiz/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    
    const translations = await QuizTranslation.findAll({
      where: { quizId },
      include: [
        {
          model: Language,
          as: 'language',
          attributes: ['id', 'name', 'code', 'nativeName', 'direction', 'flag']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['language', 'name', 'ASC']]
    });

    res.json({ translations });
  } catch (error) {
    console.error('Error fetching quiz translations:', error);
    res.status(500).json({ message: 'Failed to fetch quiz translations' });
  }
});

// Get all translations for a language
router.get('/language/:languageId', async (req, res) => {
  try {
    const { languageId } = req.params;
    
    const translations = await QuizTranslation.findAll({
      where: { languageId },
      include: [
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['id', 'title', 'description'],
          include: [
            {
              model: Course,
              as: 'course',
              attributes: ['id', 'title']
            }
          ]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['quiz', 'title', 'ASC']]
    });

    res.json({ translations });
  } catch (error) {
    console.error('Error fetching language translations:', error);
    res.status(500).json({ message: 'Failed to fetch language translations' });
  }
});

// Get specific translation
router.get('/:id', async (req, res) => {
  try {
    const translation = await QuizTranslation.findByPk(req.params.id, {
      include: [
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['id', 'title', 'description', 'questions'],
          include: [
            {
              model: Course,
              as: 'course',
              attributes: ['id', 'title']
            }
          ]
        },
        {
          model: Language,
          as: 'language',
          attributes: ['id', 'name', 'code', 'nativeName', 'direction', 'flag']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!translation) {
      return res.status(404).json({ message: 'Translation not found' });
    }

    res.json({ translation });
  } catch (error) {
    console.error('Error fetching translation:', error);
    res.status(500).json({ message: 'Failed to fetch translation' });
  }
});

// Create or update translation (admin only)
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { quizId, languageId, title, description, questions } = req.body;

    // Verify quiz exists
    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Verify language exists
    const language = await Language.findByPk(languageId);
    if (!language) {
      return res.status(404).json({ message: 'Language not found' });
    }

    // Check if translation already exists
    let translation = await QuizTranslation.findOne({
      where: { quizId, languageId }
    });

    if (translation) {
      // Update existing translation
      await translation.update({
        title,
        description,
        questions: questions || []
      });
    } else {
      // Create new translation
      translation = await QuizTranslation.create({
        quizId,
        languageId,
        title,
        description,
        questions: questions || [],
        createdById: req.user.id
      });
    }

    const translationWithDetails = await QuizTranslation.findByPk(translation.id, {
      include: [
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['id', 'title', 'description'],
          include: [
            {
              model: Course,
              as: 'course',
              attributes: ['id', 'title']
            }
          ]
        },
        {
          model: Language,
          as: 'language',
          attributes: ['id', 'name', 'code', 'nativeName', 'direction', 'flag']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.status(201).json({ 
      message: 'Translation saved successfully',
      translation: translationWithDetails 
    });
  } catch (error) {
    console.error('Error saving translation:', error);
    res.status(500).json({ message: 'Failed to save translation' });
  }
});

// Update translation (admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const translation = await QuizTranslation.findByPk(req.params.id);
    if (!translation) {
      return res.status(404).json({ message: 'Translation not found' });
    }

    const { title, description, questions } = req.body;

    await translation.update({
      title: title || translation.title,
      description: description !== undefined ? description : translation.description,
      questions: questions || translation.questions
    });

    const updatedTranslation = await QuizTranslation.findByPk(translation.id, {
      include: [
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['id', 'title', 'description'],
          include: [
            {
              model: Course,
              as: 'course',
              attributes: ['id', 'title']
            }
          ]
        },
        {
          model: Language,
          as: 'language',
          attributes: ['id', 'name', 'code', 'nativeName', 'direction', 'flag']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.json({ 
      message: 'Translation updated successfully',
      translation: updatedTranslation 
    });
  } catch (error) {
    console.error('Error updating translation:', error);
    res.status(500).json({ message: 'Failed to update translation' });
  }
});

// Delete translation (admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const translation = await QuizTranslation.findByPk(req.params.id);
    if (!translation) {
      return res.status(404).json({ message: 'Translation not found' });
    }

    await translation.destroy();

    res.json({ message: 'Translation deleted successfully' });
  } catch (error) {
    console.error('Error deleting translation:', error);
    res.status(500).json({ message: 'Failed to delete translation' });
  }
});

// Get quiz with translation for taking
router.get('/quiz/:quizId/language/:languageId', async (req, res) => {
  try {
    const { quizId, languageId } = req.params;

    // Get the original quiz
    const quiz = await Quiz.findByPk(quizId, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title']
        }
      ]
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Get the translation
    const translation = await QuizTranslation.findOne({
      where: { quizId, languageId },
      include: [
        {
          model: Language,
          as: 'language',
          attributes: ['id', 'name', 'code', 'nativeName', 'direction', 'flag']
        }
      ]
    });

    if (!translation) {
      return res.status(404).json({ message: 'Translation not found for this language' });
    }

    // Merge original quiz with translation
    const translatedQuiz = {
      ...quiz.toJSON(),
      title: translation.title,
      description: translation.description,
      questions: translation.questions,
      language: translation.language
    };

    res.json({ quiz: translatedQuiz });
  } catch (error) {
    console.error('Error fetching translated quiz:', error);
    res.status(500).json({ message: 'Failed to fetch translated quiz' });
  }
});

// Clean up orphaned translation questions (admin only)
router.post('/quiz/:quizId/cleanup', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { quizId } = req.params;

    // Get the original quiz
    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const originalQuestionIds = quiz.questions.map(q => q.id);

    // Get all translations for this quiz
    const translations = await QuizTranslation.findAll({
      where: { quizId }
    });

    let cleanedCount = 0;

    // Clean up each translation
    for (const translation of translations) {
      if (translation.questions && Array.isArray(translation.questions)) {
        const originalLength = translation.questions.length;
        const cleanedQuestions = translation.questions.filter(tq => 
          originalQuestionIds.includes(tq.id)
        );
        
        if (cleanedQuestions.length !== originalLength) {
          await translation.update({
            questions: cleanedQuestions
          });
          cleanedCount++;
        }
      }
    }

    res.json({ 
      message: `Cleaned up ${cleanedCount} translations`,
      cleanedTranslations: cleanedCount
    });
  } catch (error) {
    console.error('Error cleaning translations:', error);
    res.status(500).json({ message: 'Failed to clean up translations' });
  }
});

module.exports = router;
