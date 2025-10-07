const express = require('express');
const QuizResult = require('../models/QuizResult');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');
const { sequelize } = require('../models/index');
const { Op } = require('sequelize');

const router = express.Router();

// @desc    Get quiz results for student
// @route   GET /api/results/my-results
// @access  Private (Student only)
router.get('/my-results', protect, authorize('student'), async (req, res) => {
  try {
    const results = await QuizResult.findAll({
      where: { studentId: req.user.id },
      include: [
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['title']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['title']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: results.length,
      results
    });
  } catch (error) {
    console.error('Get student results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting results'
    });
  }
});

// @desc    Get all quiz results for admin
// @route   GET /api/results/all
// @access  Private (Admin only)
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const results = await QuizResult.findAll({
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['firstName', 'lastName', 'username', 'email']
        },
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['title']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['title']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: results.length,
      results
    });
  } catch (error) {
    console.error('Get all results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting all results'
    });
  }
});

// @desc    Get detailed result by ID for student
// @route   GET /api/results/:id
// @access  Private (Student only)
router.get('/:id', protect, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Students can only see their own results
    if (req.user.role === 'student') {
      query.studentId = req.user.id;
    }

    const result = await QuizResult.findOne({
      where: query,
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['firstName', 'lastName', 'username']
        },
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['title', 'questions', 'showResults']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['title']
        }
      ]
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // If quiz doesn't allow showing results, limit what students can see
    if (req.user.role === 'student' && !result.quiz.showResults) {
      return res.status(200).json({
        success: true,
        result: {
          _id: result._id,
          score: result.score,
          percentage: result.percentage,
          isPassed: result.isPassed,
          completedAt: result.completedAt
        }
      });
    }

    res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting result'
    });
  }
});

// @desc    Get all quiz results (Admin)
// @route   GET /api/results
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { course, quiz, student, page = 1, limit = 10 } = req.query;
    
    // Build query
    let query = {};
    if (course) query.course = course;
    if (quiz) query.quiz = quiz;
    if (student) query.student = student;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const results = await QuizResult.findAll({
      where: query,
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['firstName', 'lastName', 'username', 'email']
        },
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['title']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['title']
        }
      ],
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit: parseInt(limit)
    });

    const total = await QuizResult.count({ where: query });

    res.status(200).json({
      success: true,
      count: results.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      results
    });
  } catch (error) {
    console.error('Get all results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting results'
    });
  }
});

// @desc    Get results summary statistics
// @route   GET /api/results/admin/summary
// @access  Private (Admin only)
router.get('/admin/summary', protect, authorize('admin'), async (req, res) => {
  try {
    const totalResults = await QuizResult.count();
    const passedResults = await QuizResult.count({ where: { isPassed: true } });
    const failedResults = totalResults - passedResults;

    // Average score across all quizzes
    const avgScoreResult = await QuizResult.findAll({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('percentage')), 'averageScore']
      ]
    });
    const avgScore = avgScoreResult[0] ? [{ averageScore: avgScoreResult[0].dataValues.averageScore }] : [{ averageScore: 0 }];

    // Results by course
    const resultsByCourse = await QuizResult.findAll({
      attributes: [
        'courseId',
        [sequelize.fn('COUNT', sequelize.col('QuizResult.id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('percentage')), 'averageScore'],
        [sequelize.fn('SUM', sequelize.case().when(sequelize.col('isPassed'), 1).else(0)), 'passCount']
      ],
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['title']
        }
      ],
      group: ['courseId', 'course.id', 'course.title']
    });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivity = await QuizResult.count({
      where: {
        createdAt: {
          [Op.gte]: sevenDaysAgo
        }
      }
    });

    res.status(200).json({
      success: true,
      summary: {
        totalResults,
        passedResults,
        failedResults,
        passRate: totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0,
        averageScore: avgScore.length > 0 ? Math.round(avgScore[0].averageScore) : 0,
        recentActivity,
        resultsByCourse
      }
    });
  } catch (error) {
    console.error('Get results summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting results summary'
    });
  }
});

// @desc    Get student performance details
// @route   GET /api/results/student/:studentId
// @access  Private (Admin only)
router.get('/student/:studentId', protect, authorize('admin'), async (req, res) => {
  try {
    const results = await QuizResult.findAll({
      where: { studentId: req.params.studentId },
      include: [
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['title']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['title']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No results found for this student'
      });
    }

    // Calculate student statistics
    const totalQuizzes = results.length;
    const passedQuizzes = results.filter(r => r.isPassed).length;
    const averageScore = results.reduce((sum, r) => sum + r.percentage, 0) / totalQuizzes;
    
    res.status(200).json({
      success: true,
      student: results[0].student,
      statistics: {
        totalQuizzes,
        passedQuizzes,
        failedQuizzes: totalQuizzes - passedQuizzes,
        passRate: Math.round((passedQuizzes / totalQuizzes) * 100),
        averageScore: Math.round(averageScore)
      },
      results
    });
  } catch (error) {
    console.error('Get student performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting student performance'
    });
  }
});

// @desc    Delete quiz result
// @route   DELETE /api/results/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await QuizResult.findByPk(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    await result.destroy();

    res.status(200).json({
      success: true,
      message: 'Result deleted successfully'
    });
  } catch (error) {
    console.error('Delete result error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting result'
    });
  }
});

// @desc    Get detailed result with question breakdown for admin
// @route   GET /api/results/admin/details/:id
// @access  Private (Admin only)
router.get('/admin/details/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await QuizResult.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['firstName', 'lastName', 'username', 'email']
        },
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['title', 'questions', 'passingScore', 'totalPoints']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['title']
        }
      ]
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Parse answers and create detailed breakdown
    const answers = result.answers || [];
    const quiz = result.quiz;
    const questions = quiz.questions || [];
    
    // Create question-by-question breakdown
    const questionBreakdown = answers.map((answer, index) => {
      const question = questions.find(q => 
        q.id === answer.questionId || 
        `q_${questions.indexOf(q)}` === answer.questionId
      ) || questions[index];
      
      if (!question) {
        return {
          questionNumber: index + 1,
          question: 'Question not found',
          type: 'unknown',
          studentAnswer: answer.selectedAnswer,
          correctAnswer: 'Unknown',
          isCorrect: answer.isCorrect || false,
          points: answer.points || 0,
          timeSpent: answer.timeSpent || 0
        };
      }
      
      // Get correct answer based on question type and format
      let correctAnswer = 'Unknown';
      if (question.type === 'true-false') {
        correctAnswer = typeof question.correctAnswer === 'number' 
          ? (question.correctAnswer === 0 ? 'false' : 'true')
          : question.correctAnswer;
      } else if (question.type === 'multiple-choice' && question.options) {
        if (typeof question.correctAnswer === 'number') {
          correctAnswer = question.options[question.correctAnswer] || `Option ${question.correctAnswer + 1}`;
        } else {
          correctAnswer = question.correctAnswer;
        }
      } else {
        correctAnswer = question.correctAnswer;
      }
      
      return {
        questionNumber: index + 1,
        question: question.question,
        type: question.type,
        options: question.options,
        studentAnswer: answer.selectedAnswer,
        correctAnswer: correctAnswer,
        isCorrect: answer.isCorrect || false,
        points: answer.points || 0,
        maxPoints: question.points || 1,
        timeSpent: answer.timeSpent || 0
      };
    });

    const detailedResult = {
      ...result.toJSON(),
      questionBreakdown
    };

    res.status(200).json({
      success: true,
      result: detailedResult
    });
  } catch (error) {
    console.error('Get detailed result error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting detailed result'
    });
  }
});

// @desc    Get question analytics for a quiz
// @route   GET /api/results/admin/question-analytics/:quizId
// @access  Private (Admin only)
router.get('/admin/question-analytics/:quizId', protect, authorize('admin'), async (req, res) => {
  try {
    const quizId = req.params.quizId;
    
    // Get the quiz to understand question structure
    const quiz = await Quiz.findByPk(quizId, {
      attributes: ['title', 'questions', 'totalPoints']
    });
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    // Get all results for this quiz
    const results = await QuizResult.findAll({
      where: { quizId },
      attributes: ['answers', 'studentId'],
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['firstName', 'lastName']
        }
      ]
    });
    
    const questions = quiz.questions || [];
    const questionAnalytics = [];
    
    // Analyze each question
    questions.forEach((question, qIndex) => {
      const questionId = `q_${qIndex}`;
      const questionData = {
        questionNumber: qIndex + 1,
        question: question.question,
        type: question.type,
        options: question.options,
        correctAnswer: question.correctAnswer,
        maxPoints: question.points || 1,
        totalAttempts: 0,
        correctAttempts: 0,
        averageTime: 0,
        averagePoints: 0,
        optionStats: {},
        difficulty: 'Medium' // Will calculate based on success rate
      };
      
      let totalTime = 0;
      let totalPoints = 0;
      const optionCounts = {};
      
      // Analyze all student responses to this question
      results.forEach(result => {
        const answers = result.answers || [];
        const questionAnswer = answers.find(a => 
          a.questionId === questionId || 
          a.questionId === question.id
        );
        
        if (questionAnswer) {
          questionData.totalAttempts++;
          
          if (questionAnswer.isCorrect) {
            questionData.correctAttempts++;
          }
          
          totalTime += questionAnswer.timeSpent || 0;
          totalPoints += questionAnswer.points || 0;
          
          // Count option selections
          const selectedOption = questionAnswer.selectedAnswer;
          if (selectedOption) {
            optionCounts[selectedOption] = (optionCounts[selectedOption] || 0) + 1;
          }
        }
      });
      
      // Calculate averages and percentages
      if (questionData.totalAttempts > 0) {
        questionData.averageTime = Math.round(totalTime / questionData.totalAttempts);
        questionData.averagePoints = (totalPoints / questionData.totalAttempts).toFixed(1);
        questionData.successRate = ((questionData.correctAttempts / questionData.totalAttempts) * 100).toFixed(1);
        
        // Determine difficulty based on success rate
        const successRate = parseFloat(questionData.successRate);
        if (successRate >= 80) {
          questionData.difficulty = 'Easy';
        } else if (successRate >= 60) {
          questionData.difficulty = 'Medium';
        } else {
          questionData.difficulty = 'Hard';
        }
        
        // Convert option counts to percentages
        Object.keys(optionCounts).forEach(option => {
          questionData.optionStats[option] = {
            count: optionCounts[option],
            percentage: ((optionCounts[option] / questionData.totalAttempts) * 100).toFixed(1)
          };
        });
      }
      
      questionAnalytics.push(questionData);
    });
    
    // Calculate overall quiz analytics
    const overallStats = {
      totalQuestions: questions.length,
      totalAttempts: results.length,
      averageSuccessRate: questionAnalytics.reduce((sum, q) => sum + parseFloat(q.successRate || 0), 0) / questions.length,
      hardestQuestion: questionAnalytics.reduce((min, q) => 
        parseFloat(q.successRate || 0) < parseFloat(min.successRate || 100) ? q : min, 
        { successRate: 100 }
      ),
      easiestQuestion: questionAnalytics.reduce((max, q) => 
        parseFloat(q.successRate || 0) > parseFloat(max.successRate || 0) ? q : max, 
        { successRate: 0 }
      )
    };
    
    res.status(200).json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title
      },
      overallStats,
      questionAnalytics
    });
  } catch (error) {
    console.error('Get question analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting question analytics'
    });
  }
});

module.exports = router;