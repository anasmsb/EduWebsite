# Education Website - Installation Guide

A full-stack teaching platform with multilingual quiz support, course management, and student progress tracking.

## 📋 Features

- ✅ **User Management**: Admin and Student roles with authentication
- ✅ **Course System**: Create, manage, and publish courses
- ✅ **Quiz Engine**: Timed quizzes with multiple question types
- ✅ **Multilingual Support**: Create quizzes in multiple languages
- ✅ **Session Management**: Save and resume quiz progress
- ✅ **Results Tracking**: Detailed performance analytics
- ✅ **Retake System**: Configurable quiz retake policies with cooldown periods

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v14 or higher)
- **MySQL** (v5.7 or higher)
- **npm** or **yarn**

### Installation Steps

#### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/anasmsb/EduWebsite.git
cd EduWebsite
\`\`\`

#### 2. Backend Setup

\`\`\`bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
# DB_NAME=education_website
# DB_USER=root
# DB_PASS=your_password
# DB_HOST=localhost
# DB_PORT=3306
# JWT_SECRET=your_secret_key_here
\`\`\`

#### 3. Database Setup

\`\`\`bash
# Run the consolidated database setup script
node setup-database.js
\`\`\`

This script will:
- ✅ Create the database if it doesn't exist
- ✅ Create all required tables with proper schema
- ✅ Set up foreign keys and constraints
- ✅ Seed initial data (admin, students, languages)
- ✅ Create required directories for file uploads

**Default Login Credentials:**
- Admin: `admin@demo.com` / `password123`
- Student: `student@demo.com` / `password123`

#### 4. Start Backend Server

\`\`\`bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
\`\`\`

Backend will run on `http://localhost:5000`

#### 5. Frontend Setup

\`\`\`bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Start development server
npm start
\`\`\`

Frontend will run on `http://localhost:3000`

## 📁 Project Structure

\`\`\`
EduWebsite/
├── backend/
│   ├── config/
│   │   └── database.js          # Database connection config
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Course.js            # Course model
│   │   ├── Quiz.js              # Quiz model (with retake fields)
│   │   ├── QuizResult.js        # Quiz results model
│   │   ├── QuizSession.js       # Quiz session management
│   │   ├── Language.js          # Language model
│   │   └── QuizTranslation.js   # Quiz translations model
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── courses.js           # Course management routes
│   │   ├── quizzes.js           # Quiz and session routes
│   │   ├── results.js           # Results routes
│   │   ├── languages.js         # Language management
│   │   ├── translations.js      # Translation management
│   │   └── users.js             # User management routes
│   ├── uploads/                 # File upload directories
│   ├── setup-database.js        # **NEW: Consolidated database setup**
│   ├── server.js                # Express server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   │   └── AuthContext.js   # Authentication context
│   │   ├── pages/
│   │   │   ├── admin/           # Admin pages
│   │   │   └── student/         # Student pages
│   │   ├── services/            # API service layers
│   │   └── App.js
│   └── package.json
└── README.md
\`\`\`

## 🗄️ Database Schema

### Core Tables

1. **users** - User accounts (admin/student)
2. **courses** - Course information
3. **quizzes** - Quiz configurations with retake settings
4. **quiz_results** - Quiz attempt results
5. **quiz_sessions** - Active quiz sessions
6. **course_enrollments** - Student course enrollments
7. **languages** - Supported languages
8. **quiz_translations** - Quiz translations

### Latest Schema Features

- ✅ **Quiz Retake Fields**: `allowRetake`, `retakeCooldownHours`
- ✅ **Multilingual Support**: Complete translation system
- ✅ **Session Management**: Resume quiz functionality
- ✅ **Progress Tracking**: Course completion percentages

## 🔧 Configuration

### Environment Variables

Backend (`.env`):
\`\`\`env
# Database Configuration
DB_NAME=education_website
DB_USER=root
DB_PASS=your_password
DB_HOST=localhost
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development
\`\`\`

### Database Connection

The `setup-database.js` script handles everything automatically. Manual configuration is only needed if you want to customize:

\`\`\`javascript
// backend/config/database.js
const sequelize = new Sequelize(
  process.env.DB_NAME || 'education_website',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql'
  }
);
\`\`\`

## 🧪 Testing

### Test Database Connection

\`\`\`bash
cd backend
node setup-database.js
\`\`\`

### Test API Endpoints

\`\`\`bash
# Test authentication
curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@demo.com","password":"password123"}'
\`\`\`

## 📚 API Documentation

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Courses

- `GET /api/courses` - Get all published courses
- `POST /api/courses` - Create course (admin only)
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Quizzes

- `POST /api/quizzes/start/:quizId` - Start/resume quiz
- `POST /api/quizzes/session/:sessionToken/answer` - Submit answer
- `POST /api/quizzes/session/:sessionToken/submit` - Submit quiz
- `GET /api/quizzes/:quizId/retake-info` - Check retake availability

### Languages & Translations

- `GET /api/languages` - Get all languages
- `POST /api/languages` - Create language (admin)
- `GET /api/translations/quiz/:quizId` - Get quiz translations
- `POST /api/translations/quiz/:quizId` - Create translation (admin)

## 🔄 Updates in v1.0.0

### Database Improvements
- ✅ Consolidated all database scripts into single `setup-database.js`
- ✅ Added quiz retake functionality with cooldown periods
- ✅ Improved schema verification and error handling
- ✅ Automatic directory structure creation

### Features
- ✅ Multilingual quiz system
- ✅ Session-based quiz progress saving
- ✅ Modern gradient UI with glassmorphism
- ✅ Retake policy configuration per quiz

### Code Quality
- ✅ Removed deprecated database scripts
- ✅ Consolidated duplicate code
- ✅ Improved error messages and logging

## 🐛 Troubleshooting

### Database Connection Errors

\`\`\`bash
# Verify MySQL is running
mysql -u root -p

# Check credentials in .env file
cat backend/.env

# Re-run database setup
cd backend && node setup-database.js
\`\`\`

### Missing Dependencies

\`\`\`bash
# Reinstall all dependencies
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
\`\`\`

### Port Already in Use

\`\`\`bash
# Change port in backend/.env
PORT=5001

# Or kill process using the port (Linux/Mac)
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
\`\`\`

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- **anasmsb** - [GitHub](https://github.com/anasmsb)

## 🙏 Acknowledgments

- React.js for the frontend framework
- Express.js for the backend framework
- Sequelize for ORM
- MySQL for database
- JWT for authentication

## 📞 Support

For issues and questions, please open an issue on [GitHub](https://github.com/anasmsb/EduWebsite/issues).

---

**Version:** 1.0.0  
**Last Updated:** October 7, 2025
