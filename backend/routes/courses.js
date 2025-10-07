const express = require('express');
const multer = require('multer');
const path = require('path');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const { CourseEnrollment } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/videos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    console.log('GET /api/courses called by user:', req.user?.id, req.user?.role);
    let query = {};
    
    // Students can only see published courses
    if (req.user.role === 'student') {
      query.isPublished = true;
    }

    console.log('Querying courses with query:', query);
    const courses = await Course.findAll({
      where: query,
      include: [
        {
          model: User,
          as: 'instructor',
          attributes: ['firstName', 'lastName', 'username']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log('Found courses:', courses.length);
    console.log('Courses data:', courses.map(c => ({ id: c.id, title: c.title, isPublished: c.isPublished })));

    res.status(200).json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting courses'
    });
  }
});

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'instructor',
          attributes: ['firstName', 'lastName', 'username', 'email']
        },
        {
          model: Quiz,
          as: 'quiz'
        }
      ]
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Students can only see published courses
    if (req.user.role === 'student' && !course.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      course
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting course'
    });
  }
});

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('Creating course with data:', req.body);
    console.log('Admin user ID:', req.user.id);
    
    const courseData = {
      ...req.body,
      instructorId: req.user.id
    };
    
    console.log('Final course data:', courseData);
    const course = await Course.create(courseData);

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    console.error('Create course error:', error);
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    
    if (error.name === 'SequelizeValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating course'
    });
  }
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const [updatedRows] = await Course.update(
      req.body,
      {
        where: { id: req.params.id },
        returning: true
      }
    );

    if (updatedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'instructor',
          attributes: ['firstName', 'lastName', 'username', 'email']
        },
        {
          model: Quiz,
          as: 'quiz'
        }
      ]
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      course
    });
  } catch (error) {
    console.error('Update course error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating course'
    });
  }
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Delete associated enrollments first
    await CourseEnrollment.destroy({
      where: { courseId: req.params.id }
    });

    // Delete associated quiz results if any
    if (course.quizId) {
      await QuizResult.destroy({
        where: { quizId: course.quizId }
      });
      
      // Delete the quiz itself
      const quiz = await Quiz.findByPk(course.quizId);
      if (quiz) {
        await quiz.destroy();
      }
    }

    await course.destroy();

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error deleting course: ' + error.message
    });
  }
});

// @desc    Upload video to course
// @route   POST /api/courses/:id/videos
// @access  Private (Admin only)
router.post('/:id/videos', protect, authorize('admin'), upload.single('video'), async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a video file'
      });
    }

    const { title, description, duration, order } = req.body;

    const video = {
      title,
      description: description || '',
      videoUrl: `/uploads/videos/${req.file.filename}`,
      duration: parseInt(duration),
      order: parseInt(order) || course.videos.length + 1
    };

    const updatedVideos = [...(course.videos || []), video];
    await course.update({ videos: updatedVideos });

    res.status(200).json({
      success: true,
      message: 'Video uploaded successfully',
      course
    });
  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading video'
    });
  }
});

// @desc    Delete video from course
// @route   DELETE /api/courses/:id/videos/:videoIndex
// @access  Private (Admin only)
router.delete('/:id/videos/:videoIndex', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const videoIndex = parseInt(req.params.videoIndex);
    const videos = course.videos || [];

    if (videoIndex < 0 || videoIndex >= videos.length) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Remove video from array
    const updatedVideos = videos.filter((_, index) => index !== videoIndex);
    await course.update({ videos: updatedVideos });

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully',
      course
    });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting video'
    });
  }
});

// @desc    Enroll in course
// @route   POST /api/courses/:id/enroll
// @access  Private (Student only)
router.post('/:id/enroll', protect, authorize('student'), async (req, res) => {
  try {
    console.log('Enrollment attempt for course ID:', req.params.id, 'by user ID:', req.user.id);
    console.log('Course ID type:', typeof req.params.id);
    console.log('Course ID parsed as int:', parseInt(req.params.id));
    console.log('CourseEnrollment model:', typeof CourseEnrollment);
    
    // Parse the ID to ensure it's a valid integer
    const courseId = parseInt(req.params.id);
    if (isNaN(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID format'
      });
    }
    
    const course = await Course.findByPk(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Course is not available for enrollment'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await CourseEnrollment.findOne({
      where: {
        studentId: req.user.id,
        courseId: course.id
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Create enrollment record
    await CourseEnrollment.create({
      studentId: req.user.id,
      courseId: courseId
    });

    res.status(200).json({
      success: true,
      message: 'Successfully enrolled in course'
    });
  } catch (error) {
    console.error('Enroll error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error enrolling in course'
    });
  }
});

// @desc    Get enrolled courses for student
// @route   GET /api/courses/my-courses
// @access  Private (Student only)
router.get('/student/enrolled', protect, authorize('student'), async (req, res) => {
  try {
    // Query from User side using the many-to-many relationship
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Course,
          as: 'enrolledCourses',
          where: { isPublished: true },
          include: [
            {
              model: User,
              as: 'instructor',
              attributes: ['firstName', 'lastName']
            }
          ]
        }
      ]
    });
    
    const courses = user ? user.enrolledCourses : [];

    res.status(200).json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting enrolled courses'
    });
  }
});

// @desc    Get enrolled users with quiz status for a course
// @route   GET /api/courses/:id/enrolled-users-quiz-status
// @access  Private (Admin only)
router.get('/:id/enrolled-users-quiz-status', protect, authorize('admin'), async (req, res) => {
  try {
    const courseId = req.params.id;
    
    // Get the course and its quiz
    const course = await Course.findByPk(courseId, {
      include: [
        {
          model: Quiz,
          as: 'quiz'
        }
      ]
    });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Get all enrolled users for this course
    const enrollments = await CourseEnrollment.findAll({
      where: { courseId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'email', 'username']
        }
      ],
      order: [['enrolledAt', 'ASC']]
    });
    
    // If there's no quiz for this course, all users are considered as not having taken it
    if (!course.quiz) {
      const users = enrollments.map(enrollment => ({
        id: enrollment.student.id,
        firstName: enrollment.student.firstName,
        lastName: enrollment.student.lastName,
        email: enrollment.student.email,
        username: enrollment.student.username,
        enrolledAt: enrollment.enrolledAt,
        hasTakenQuiz: false,
        quizResult: null
      }));
      
      return res.status(200).json({
        success: true,
        course: {
          id: course.id,
          title: course.title,
          hasQuiz: false
        },
        users
      });
    }
    
    // Get quiz results for this quiz
    const { QuizResult } = require('../models/index');
    const quizResults = await QuizResult.findAll({
      where: { 
        quizId: course.quiz.id,
        courseId: courseId 
      },
      attributes: ['studentId', 'score', 'percentage', 'isPassed', 'completedAt']
    });
    
    // Create a map of student quiz results
    const resultsMap = new Map();
    quizResults.forEach(result => {
      resultsMap.set(result.studentId, result);
    });
    
    // Combine enrollment data with quiz results
    const users = enrollments.map(enrollment => {
      const quizResult = resultsMap.get(enrollment.student.id);
      
      return {
        id: enrollment.student.id,
        firstName: enrollment.student.firstName,
        lastName: enrollment.student.lastName,
        email: enrollment.student.email,
        username: enrollment.student.username,
        enrolledAt: enrollment.enrolledAt,
        hasTakenQuiz: !!quizResult,
        quizResult: quizResult ? {
          score: quizResult.score,
          percentage: quizResult.percentage,
          isPassed: quizResult.isPassed,
          completedAt: quizResult.completedAt
        } : null
      };
    });
    
    res.status(200).json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        hasQuiz: true,
        quiz: {
          id: course.quiz.id,
          title: course.quiz.title
        }
      },
      users,
      stats: {
        totalEnrolled: users.length,
        completedQuiz: users.filter(u => u.hasTakenQuiz).length,
        pendingQuiz: users.filter(u => !u.hasTakenQuiz).length
      }
    });
    
  } catch (error) {
    console.error('Get enrolled users quiz status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting enrolled users quiz status'
    });
  }
});

module.exports = router;