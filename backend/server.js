const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Import consolidated database manager
const DatabaseManager = require('./database-setup');

// Import database models (after database initialization)
const { sequelize } = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const quizRoutes = require('./routes/quizzes');
const userRoutes = require('./routes/users');
const resultRoutes = require('./routes/results');
const languageRoutes = require('./routes/languages');
const translationRoutes = require('./routes/translations');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded videos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database initialization and connection
async function initializeDatabase() {
  try {
    console.log('🚀 Initializing Education Website Database...');
    
    // Initialize database with consolidated setup
    const dbManager = new DatabaseManager();
    await dbManager.initialize();
    
    // Connect Sequelize models to existing database
    await sequelize.authenticate();
    console.log('✅ Sequelize models connected to database');
    
    // Skip sync - tables already created with proper structure by database-setup.js
    console.log('✅ Sequelize models ready (using existing table structure)');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/users', userRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/translations', translationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database first
    await initializeDatabase();
    
    // Start server after successful database initialization
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🎉 Education Website Server is running on port ${PORT}`);
      console.log(`📊 Admin Panel: http://localhost:${PORT}/admin`);
      console.log(`👨‍🎓 Student Portal: http://localhost:${PORT}/student`);
      console.log(`📧 Demo Login - Admin: admin@demo.com / password123`);
      console.log(`📧 Demo Login - Student: student@demo.com / password123`);
    });
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️  Shutting down gracefully...');
  if (sequelize) {
    await sequelize.close();
    console.log('✅ Database connections closed');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Server terminated...');
  if (sequelize) {
    await sequelize.close();
    console.log('✅ Database connections closed');
  }
  process.exit(0);
});

// Start the server
startServer();