const express = require('express');
const { Op } = require('sequelize');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting users'
    });
  }
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin only)
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user'
    });
  }
});

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: role || 'student'
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user
    });
  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating user'
    });
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { firstName, lastName, email, username, role, isActive, phone, dateOfBirth } = req.body;

    // Check if email or username is being changed and already exists
    if (email || username) {
      const existingUser = await User.findOne({
        where: {
          id: { [Op.ne]: req.params.id },
          [Op.or]: [
            ...(email ? [{ email }] : []),
            ...(username ? [{ username }] : [])
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email or username already exists'
        });
      }
    }

    const [updatedRows] = await User.update(
      { firstName, lastName, email, username, role, isActive, phone, dateOfBirth },
      { 
        where: { id: req.params.id },
        returning: true
      }
    );

    if (updatedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating user'
    });
  }
});

// @desc    Partially update user (for status changes, etc.)
// @route   PATCH /api/users/:id
// @access  Private (Admin only)
router.patch('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const updates = req.body;

    // If updating email or username, check for conflicts
    if (updates.email || updates.username) {
      const existingUser = await User.findOne({
        where: {
          id: { [Op.ne]: req.params.id },
          [Op.or]: [
            ...(updates.email ? [{ email: updates.email }] : []),
            ...(updates.username ? [{ username: updates.username }] : [])
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email or username already exists'
        });
      }
    }

    const [updatedRows] = await User.update(
      updates,
      { 
        where: { id: req.params.id },
        returning: true
      }
    );

    if (updatedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Patch user error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating user'
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user'
    });
  }
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Admin only)
router.get('/admin/stats', protect, authorize('admin'), async (req, res) => {
  try {
    // Test each count separately to isolate the issue
    const totalUsers = await User.count();
    console.log('Total users:', totalUsers);
    
    const activeUsers = await User.count({ where: { isActive: true } });
    console.log('Active users:', activeUsers);
    
    const adminUsers = await User.count({ where: { role: 'admin' } });
    console.log('Admin users:', adminUsers);
    
    const studentUsers = await User.count({ where: { role: 'student' } });
    console.log('Student users:', studentUsers);

    // Skip the date query for now to isolate the issue
    const recentRegistrations = 0;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        adminUsers,
        studentUsers,
        recentRegistrations
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error getting user statistics',
      error: error.message
    });
  }
});

module.exports = router;