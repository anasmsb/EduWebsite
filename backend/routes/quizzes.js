const express = require('express');
const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const QuizResult = require('../models/QuizResult');
const QuizSession = require('../models/QuizSession');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const quizzes = await Quiz.findAll({
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['title']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: quizzes.length,
      quizzes
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting quizzes'
    });
  }
});

// @desc    Get single quiz
// @route   GET /api/quizzes/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['title']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName']
        }
      ]
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if student is enrolled in the course
    if (req.user.role === 'student') {
      const { CourseEnrollment } = require('../models/index');
      const enrollment = await CourseEnrollment.findOne({
        where: {
          studentId: req.user.id,
          courseId: quiz.courseId
        }
      });
      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: 'You must be enrolled in the course to access this quiz'
        });
      }
    }

    res.status(200).json({
      success: true,
      quiz
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting quiz'
    });
  }
});

// @desc    Create new quiz
// @route   POST /api/quizzes
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const quizData = {
      ...req.body,
      createdById: req.user.id
    };

    const quiz = await Quiz.create(quizData);

    // Update the course to reference this quiz
    await Course.update(
      { quizId: quiz.id },
      { where: { id: quiz.courseId } }
    );

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      quiz
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating quiz'
    });
  }
});

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    // Get the current quiz to compare questions
    const currentQuiz = await Quiz.findByPk(req.params.id);
    if (!currentQuiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Update the quiz
    const [updatedRows] = await Quiz.update(
      req.body,
      {
        where: { id: req.params.id },
        returning: true
      }
    );

    if (updatedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // If questions were modified, update translations to remove references to deleted questions
    if (req.body.questions) {
      const newQuestions = req.body.questions;
      const newQuestionIds = newQuestions.map(q => q.id).filter(id => id);
      
      // Get all translations for this quiz
      const { QuizTranslation } = require('../models');
      const translations = await QuizTranslation.findAll({
        where: { quizId: req.params.id }
      });

      // Update each translation to only include questions that still exist
      for (const translation of translations) {
        if (translation.questions && Array.isArray(translation.questions)) {
          const filteredQuestions = translation.questions.filter(translatedQ => {
            // Keep only translated questions that correspond to existing questions
            return newQuestionIds.includes(translatedQ.id);
          });
          
          // Update the translation with filtered questions
          await translation.update({
            questions: filteredQuestions
          });
        }
      }
    }

    const quiz = await Quiz.findByPk(req.params.id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['title']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName']
        }
      ]
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Quiz updated successfully',
      quiz
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating quiz'
    });
  }
});

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Remove quiz reference from course
    await Course.update(
      { quizId: null },
      { where: { id: quiz.courseId } }
    );

    await quiz.destroy();

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting quiz'
    });
  }
});

// @desc    Get quiz for taking (without answers)
// @route   GET /api/quizzes/:id/take
// @access  Private (Student only)
router.get('/:id/take', protect, authorize('student'), async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['title']
        }
      ]
    });

    if (!quiz || !quiz.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found or not available'
      });
    }

    // Check if student is enrolled in the course
    const { CourseEnrollment } = require('../models/index');
    const enrollment = await CourseEnrollment.findOne({
      where: {
        studentId: req.user.id,
        courseId: quiz.courseId
      }
    });
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in the course to take this quiz'
      });
    }

    // Check attempt limit
    const previousAttempts = await QuizResult.count({
      where: {
        studentId: req.user.id,
        quizId: quiz.id
      }
    });

    if (previousAttempts >= quiz.attempts) {
      return res.status(403).json({
        success: false,
        message: 'You have exceeded the maximum number of attempts for this quiz'
      });
    }

    // Prepare quiz for taking (remove correct answers)
    let questions = quiz.questions.map((q, index) => ({
      id: q.id || index, // Ensure each question has an ID
      question: q.question,
      type: q.type,
      options: q.options.map(opt => ({ text: opt.text })),
      timeLimit: q.timeLimit,
      points: q.points,
      order: q.order || index,
      correctAnswer: undefined // Remove correct answer for security
    }));

    // Always sort by order first for consistency
    questions.sort((a, b) => a.order - b.order);

    // Randomize questions if enabled
    if (quiz.randomizeQuestions) {
      // Create a shuffled copy while preserving IDs
      questions = questions.sort(() => Math.random() - 0.5);
    }

    const quizForTaking = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      timeLimit: quiz.timeLimit,
      totalPoints: quiz.totalPoints,
      passingScore: quiz.passingScore,
      attempts: quiz.attempts,
      randomizeQuestions: quiz.randomizeQuestions,
      questions: questions
    };

    res.status(200).json({
      success: true,
      quiz: quizForTaking,
      attemptNumber: previousAttempts + 1
    });
  } catch (error) {
    console.error('Get quiz for taking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting quiz'
    });
  }
});

// @desc    Submit quiz answers
// @route   POST /api/quizzes/:id/submit
// @access  Private (Student only)
router.post('/:id/submit', protect, authorize('student'), async (req, res) => {
  try {
    const { answers, startedAt, timeSpent } = req.body;

    const quiz = await Quiz.findByPk(req.params.id, {
      include: [
        {
          model: Course,
          as: 'course'
        }
      ]
    });

    if (!quiz || !quiz.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found or not available'
      });
    }

    // Check if student is enrolled
    const { CourseEnrollment } = require('../models/index');
    const enrollment = await CourseEnrollment.findOne({
      where: {
        studentId: req.user.id,
        courseId: quiz.courseId
      }
    });
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in the course to submit this quiz'
      });
    }

    // Check attempt limit
    const previousAttempts = await QuizResult.count({
      where: {
        studentId: req.user.id,
        quizId: quiz.id
      }
    });

    if (previousAttempts >= quiz.attempts) {
      return res.status(403).json({
        success: false,
        message: 'You have exceeded the maximum number of attempts for this quiz'
      });
    }

    // Calculate results
    let score = 0;
    let correctAnswers = 0;
    const gradedAnswers = [];

    const questions = quiz.questions || [];
    
    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.questionId);
      if (question) {
        const isCorrect = answer.selectedAnswer === question.correctAnswer;
        if (isCorrect) {
          correctAnswers++;
          score += question.points || 1;
        }

        gradedAnswers.push({
          questionId: answer.questionId,
          selectedAnswer: answer.selectedAnswer,
          isCorrect,
          points: isCorrect ? (question.points || 1) : 0,
          timeSpent: answer.timeSpent || 0
        });
      }
    }

    const percentage = quiz.totalPoints > 0 ? Math.round((score / quiz.totalPoints) * 100) : 0;
    const isPassed = percentage >= quiz.passingScore;

    // Create result record
    const result = await QuizResult.create({
      studentId: req.user.id,
      quizId: quiz.id,
      courseId: quiz.courseId,
      answers: gradedAnswers,
      score,
      percentage,
      totalQuestions: questions.length,
      correctAnswers,
      totalPoints: quiz.totalPoints,
      timeSpent: timeSpent || 0,
      isPassed,
      attemptNumber: previousAttempts + 1,
      startedAt: new Date(startedAt),
      completedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Quiz submitted successfully',
      result: {
        score,
        percentage,
        correctAnswers,
        totalQuestions: quiz.questions.length,
        isPassed,
        passingScore: quiz.passingScore
      }
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error submitting quiz'
    });
  }
});

// @desc    Start or resume quiz session
// @route   POST /api/quizzes/:id/session/start
// @access  Private (Student only)
router.post('/:id/session/start', protect, authorize('student'), async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, {
      include: [
        {
          model: Course,
          as: 'course'
        }
      ]
    });

    if (!quiz || !quiz.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found or not available'
      });
    }

    // Check if student is enrolled
    const { CourseEnrollment } = require('../models/index');
    const enrollment = await CourseEnrollment.findOne({
      where: {
        studentId: req.user.id,
        courseId: quiz.courseId
      }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in the course to take this quiz'
      });
    }

    // Check if there's an existing active session
    let session = await QuizSession.findOne({
      where: {
        studentId: req.user.id,
        quizId: quiz.id,
        isCompleted: false,
        isExpired: false
      }
    });

    const now = new Date();
    
    if (session) {
      // Check if session has expired
      if (now > session.expiresAt) {
        // Mark session as expired and auto-submit with current answers
        await session.update({
          isExpired: true,
          isCompleted: true
        });

        // Auto-submit the quiz with current progress
        await autoSubmitExpiredQuiz(session, quiz);
        
        return res.status(410).json({
          success: false,
          message: 'Quiz session has expired. Your answers have been auto-submitted.',
          expired: true
        });
      }

      // Update last activity
      await session.update({
        lastActivityAt: now
      });

      // Recreate the ordered questions from stored session data
      let questions = quiz.questions || [];
      questions.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      const questionOrder = session.questionOrder || questions.map((q, index) => ({ originalIndex: index, newIndex: index }));
      const orderedQuestions = questionOrder.map((mapping, displayIndex) => {
        const originalQ = questions[mapping.originalIndex];
        // Use the actual question ID from the database instead of generated ID
        const questionId = originalQ.id.toString();
        
        // Handle different option formats
        let formattedOptions = [];
        if (originalQ.type === 'true-false') {
          formattedOptions = [
            { text: 'True', value: 'true' },
            { text: 'False', value: 'false' }
          ];
        } else if (originalQ.options && Array.isArray(originalQ.options)) {
          // Handle both array of strings and array of objects
          formattedOptions = originalQ.options
            .filter(opt => opt !== null && opt !== undefined) // Filter out null/undefined
            .map((opt, index) => {
              if (typeof opt === 'string' && opt.trim() !== '') {
                return { text: opt, value: opt, index: index };
              } else if (opt && typeof opt === 'object' && opt.text && opt.text.trim() !== '') {
                return { text: opt.text, value: opt.text, index: index };
              } else {
                // For empty strings or malformed objects, create default options
                return { text: `Option ${index + 1}`, value: `option_${index}`, index: index };
              }
            });
          
          // If all options were filtered out or empty, create default options
          if (formattedOptions.length === 0) {
            formattedOptions = Array.from({ length: originalQ.options.length || 4 }, (_, index) => ({
              text: `Option ${index + 1}`,
              value: `option_${index}`,
              index: index
            }));
          }
        } else {
          // No options array, create default for multiple choice
          formattedOptions = Array.from({ length: 4 }, (_, index) => ({
            text: `Option ${index + 1}`,
            value: `option_${index}`,
            index: index
          }));
        }
        
        return {
          id: questionId,
          originalIndex: mapping.originalIndex,
          displayIndex: displayIndex,
          question: originalQ.question,
          type: originalQ.type,
          options: formattedOptions,
          timeLimit: originalQ.timeLimit,
          points: originalQ.points
        };
      });

      return res.status(200).json({
        success: true,
        message: 'Resumed existing quiz session',
        session: {
          sessionToken: session.sessionToken,
          answers: session.answers,
          lockedQuestions: session.lockedQuestions,
          currentQuestion: session.currentQuestion,
          startedAt: session.startedAt,
          expiresAt: session.expiresAt,
          timeRemaining: Math.max(0, Math.floor((session.expiresAt - now) / 1000))
        },
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          timeLimit: quiz.timeLimit,
          totalPoints: quiz.totalPoints,
          passingScore: quiz.passingScore,
          attempts: quiz.attempts,
          questions: orderedQuestions
        }
      });
    }

    // Check attempt limit
    const previousAttempts = await QuizResult.count({
      where: {
        studentId: req.user.id,
        quizId: quiz.id
      }
    });

    if (previousAttempts >= quiz.attempts) {
      return res.status(403).json({
        success: false,
        message: 'You have exceeded the maximum number of attempts for this quiz'
      });
    }

    // Prepare consistent question order for this session
    let questions = quiz.questions || [];
    
    // Always sort by order first for base consistency
    questions.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Randomize questions if enabled (only for new sessions)
    const questionOrder = [];
    if (quiz.randomizeQuestions) {
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      questionOrder.push(...shuffled.map((q, index) => ({ originalIndex: questions.indexOf(q), newIndex: index })));
    } else {
      questionOrder.push(...questions.map((q, index) => ({ originalIndex: index, newIndex: index })));
    }

    // Check for existing quiz attempts and retake eligibility
    const previousResults = await QuizResult.findAll({
      where: {
        studentId: req.user.id,
        quizId: quiz.id
      },
      order: [['completedAt', 'DESC']]
    });

    // Check if student has exceeded attempt limit (excluding retakes)
    const regularAttempts = previousResults.length;
    if (regularAttempts >= quiz.attempts && !quiz.allowRetake) {
      return res.status(403).json({
        success: false,
        message: 'You have exceeded the maximum number of attempts for this quiz'
      });
    }

    // If retakes are allowed, check retake eligibility
    if (quiz.allowRetake && previousResults.length > 0) {
      const lastAttempt = previousResults[0];
      
      // Only allow retake if the last attempt was failed
      if (lastAttempt.isPassed) {
        return res.status(403).json({
          success: false,
          message: 'You have already passed this quiz. Retakes are only allowed for failed attempts.'
        });
      }

      // Check if cooldown period has passed
      const cooldownMs = quiz.retakeCooldownHours * 60 * 60 * 1000;
      const timeSinceLastAttempt = now - new Date(lastAttempt.completedAt);
      
      if (timeSinceLastAttempt < cooldownMs) {
        const remainingHours = Math.ceil((cooldownMs - timeSinceLastAttempt) / (60 * 60 * 1000));
        return res.status(403).json({
          success: false,
          message: `You must wait ${remainingHours} more hour(s) before you can retake this quiz`,
          retakeAvailableAt: new Date(new Date(lastAttempt.completedAt).getTime() + cooldownMs),
          cooldownHours: quiz.retakeCooldownHours
        });
      }
    } else if (!quiz.allowRetake && regularAttempts >= quiz.attempts) {
      return res.status(403).json({
        success: false,
        message: 'You have exceeded the maximum number of attempts for this quiz'
      });
    }

    // Create new session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(now.getTime() + (quiz.timeLimit * 60 * 1000));

    session = await QuizSession.create({
      studentId: req.user.id,
      quizId: quiz.id,
      sessionToken,
      answers: {},
      lockedQuestions: [],
      currentQuestion: 0,
      startedAt: now,
      lastActivityAt: now,
      expiresAt,
      questionOrder: questionOrder // Store the order for this session
    });

    // Apply the stored question order
    const orderedQuestions = questionOrder.map((mapping, displayIndex) => {
      const originalQ = questions[mapping.originalIndex];
      // Use the actual question ID from the database instead of generated ID
      const questionId = originalQ.id.toString();
      
      // Handle different option formats
      let formattedOptions = [];
      if (originalQ.type === 'true-false') {
        formattedOptions = [
          { text: 'True', value: 'true' },
          { text: 'False', value: 'false' }
        ];
      } else if (originalQ.options && Array.isArray(originalQ.options)) {
        // Handle both array of strings and array of objects
        formattedOptions = originalQ.options
          .filter(opt => opt !== null && opt !== undefined) // Filter out null/undefined
          .map((opt, index) => {
            if (typeof opt === 'string' && opt.trim() !== '') {
              return { text: opt, value: opt, index: index };
            } else if (opt && typeof opt === 'object' && opt.text && opt.text.trim() !== '') {
              return { text: opt.text, value: opt.text, index: index };
            } else {
              // For empty strings or malformed objects, create default options
              return { text: `Option ${index + 1}`, value: `option_${index}`, index: index };
            }
          });
        
        // If all options were filtered out or empty, create default options
        if (formattedOptions.length === 0) {
          formattedOptions = Array.from({ length: originalQ.options.length || 4 }, (_, index) => ({
            text: `Option ${index + 1}`,
            value: `option_${index}`,
            index: index
          }));
        }
      } else {
        // No options array, create default for multiple choice
        formattedOptions = Array.from({ length: 4 }, (_, index) => ({
          text: `Option ${index + 1}`,
          value: `option_${index}`,
          index: index
        }));
      }
      
      return {
        id: questionId,
        originalIndex: mapping.originalIndex,
        displayIndex: displayIndex,
        question: originalQ.question,
        type: originalQ.type,
        options: formattedOptions,
        timeLimit: originalQ.timeLimit,
        points: originalQ.points
      };
    });

    res.status(201).json({
      success: true,
      message: 'Quiz session started',
      session: {
        sessionToken: session.sessionToken,
        answers: session.answers,
        lockedQuestions: session.lockedQuestions,
        currentQuestion: session.currentQuestion,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
        timeRemaining: quiz.timeLimit * 60
      },
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        timeLimit: quiz.timeLimit,
        totalPoints: quiz.totalPoints,
        passingScore: quiz.passingScore,
        attempts: quiz.attempts,
        questions: orderedQuestions
      }
    });
  } catch (error) {
    console.error('Start quiz session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error starting quiz session'
    });
  }
});

// @desc    Update quiz session progress
// @route   PUT /api/quizzes/:id/session/update
// @access  Private (Student only)
router.put('/:id/session/update', protect, authorize('student'), async (req, res) => {
  try {
    const { sessionToken, answers, lockedQuestions, currentQuestion } = req.body;

    const session = await QuizSession.findOne({
      where: {
        sessionToken,
        studentId: req.user.id,
        quizId: req.params.id,
        isCompleted: false,
        isExpired: false
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Quiz session not found or already completed'
      });
    }

    const now = new Date();

    // Check if session has expired
    if (now > session.expiresAt) {
      await session.update({
        isExpired: true,
        isCompleted: true
      });

      const quiz = await Quiz.findByPk(req.params.id);
      await autoSubmitExpiredQuiz(session, quiz);

      return res.status(410).json({
        success: false,
        message: 'Quiz session has expired. Your answers have been auto-submitted.',
        expired: true
      });
    }

    // Update session
    await session.update({
      answers: answers || session.answers,
      lockedQuestions: lockedQuestions || session.lockedQuestions,
      currentQuestion: currentQuestion !== undefined ? currentQuestion : session.currentQuestion,
      lastActivityAt: now
    });

    res.status(200).json({
      success: true,
      message: 'Session updated successfully',
      timeRemaining: Math.max(0, Math.floor((session.expiresAt - now) / 1000))
    });
  } catch (error) {
    console.error('Update quiz session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating quiz session'
    });
  }
});

// @desc    Complete quiz session and submit
// @route   POST /api/quizzes/:id/session/complete
// @access  Private (Student only)
router.post('/:id/session/complete', protect, authorize('student'), async (req, res) => {
  try {
    const { sessionToken, answers } = req.body;

    const session = await QuizSession.findOne({
      where: {
        sessionToken,
        studentId: req.user.id,
        quizId: req.params.id,
        isCompleted: false
      },
      include: [
        {
          model: Quiz,
          as: 'quiz',
          include: [
            {
              model: Course,
              as: 'course'
            }
          ]
        }
      ]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Quiz session not found or already completed'
      });
    }

    const quiz = session.quiz;
    const now = new Date();

    // Mark session as completed
    await session.update({
      isCompleted: true,
      answers: answers || session.answers
    });

    // Calculate and save results
    const result = await calculateAndSaveResults(session, quiz, answers || session.answers);

    res.status(200).json({
      success: true,
      message: 'Quiz submitted successfully',
      result: {
        score: result.score,
        percentage: result.percentage,
        correctAnswers: result.correctAnswers,
        totalQuestions: result.totalQuestions,
        isPassed: result.isPassed,
        passingScore: quiz.passingScore
      }
    });
  } catch (error) {
    console.error('Complete quiz session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error completing quiz session'
    });
  }
});

// Helper function to auto-submit expired quiz
async function autoSubmitExpiredQuiz(session, quiz) {
  try {
    const result = await calculateAndSaveResults(session, quiz, session.answers);
    console.log(`Auto-submitted expired quiz for session ${session.sessionToken}`);
    return result;
  } catch (error) {
    console.error('Auto-submit expired quiz error:', error);
  }
}

// Helper function to calculate and save quiz results
async function calculateAndSaveResults(session, quiz, answers) {
  let score = 0;
  let correctAnswers = 0;
  const gradedAnswers = [];

  // Get the original quiz data with correct answers for grading
  const fullQuiz = await Quiz.findByPk(session.quizId);
  const originalQuestions = fullQuiz.questions || [];
  
  // Sort original questions by order for consistency
  originalQuestions.sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Apply the same question order from session
  const questionOrder = session.questionOrder || originalQuestions.map((q, index) => ({ originalIndex: index, newIndex: index }));
  
  for (const mapping of questionOrder) {
    const originalQuestion = originalQuestions[mapping.originalIndex];
    const questionId = originalQuestion.id.toString(); // Use actual question ID
    const legacyQuestionId = `q_${mapping.originalIndex}`; // Legacy format for compatibility
    
    // Try to get answer using new format first, then fall back to legacy format
    let answer = answers[questionId] || answers[legacyQuestionId];
    
    let isCorrect = false;
    
    // Handle different correct answer formats
    if (answer !== null && answer !== undefined && answer !== '') {
      if (originalQuestion.type === 'true-false') {
        // For true/false, answer is now an index (0 for True, 1 for False)
        const answerIndex = parseInt(answer);
        isCorrect = answerIndex === originalQuestion.correctAnswer;
      } else {
        // For multiple choice, answer is an index (as string)
        const answerIndex = parseInt(answer);
        
        if (typeof originalQuestion.correctAnswer === 'number') {
          // Direct index comparison
          isCorrect = answerIndex === originalQuestion.correctAnswer;
        } else if (typeof originalQuestion.correctAnswer === 'string') {
          // If correct answer is stored as string, find its index in options
          const correctIndex = originalQuestion.options?.indexOf(originalQuestion.correctAnswer);
          isCorrect = answerIndex === correctIndex;
        }
      }
    }
    
    if (isCorrect) {
      correctAnswers++;
      score += originalQuestion.points || 1;
    }

    gradedAnswers.push({
      questionId: questionId,
      selectedAnswer: answer || null,
      isCorrect,
      points: isCorrect ? (originalQuestion.points || 1) : 0,
      timeSpent: 0
    });
  }

  const totalPoints = fullQuiz.totalPoints > 0 ? fullQuiz.totalPoints : originalQuestions.reduce((sum, q) => sum + (q.points || 1), 0);
  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  const isPassed = percentage >= fullQuiz.passingScore;

  // Get previous attempts count
  const previousAttempts = await QuizResult.count({
    where: {
      studentId: session.studentId,
      quizId: session.quizId
    }
  });

  const now = new Date();
  const timeSpent = Math.floor((now - session.startedAt) / 1000);

  const result = await QuizResult.create({
    studentId: session.studentId,
    quizId: session.quizId,
    courseId: fullQuiz.courseId,
    answers: gradedAnswers,
    score,
    percentage,
    totalQuestions: originalQuestions.length,
    correctAnswers,
    totalPoints: totalPoints,
    timeSpent,
    isPassed,
    attemptNumber: previousAttempts + 1,
    startedAt: session.startedAt,
    completedAt: now
  });

  return result;
}

module.exports = router;