# Education Website

A comprehensive full-stack teaching platform built with React frontend and Node.js/Express backend, featuring course management, interactive quizzes, and user role management.

## ✨ Features

### For Students
- **Dashboard**: View enrolled courses, quiz results, and progress
- **Course Learning**: Watch course videos with organized playlists
- **Interactive Quizzes**: Take timed quizzes with multiple question types
- **Results Tracking**: View detailed quiz results and performance analytics
- **Profile Management**: Update personal information and view account details

### For Administrators  
- **Course Management**: Create, edit, and manage courses with video uploads
- **Quiz Builder**: Design quizzes with multiple choice, true/false, and dropdown questions
- **User Management**: Add, edit, and manage student and admin accounts
- **Analytics Dashboard**: Track student performance and course engagement
- **Results Management**: View comprehensive quiz results and generate reports

### General Features
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Authentication**: Secure login system with role-based access control
- **Real-time Timers**: Configurable time limits for quizzes and individual questions
- **File Upload**: Support for video content with organized course structure
- **Progress Tracking**: Monitor learning progress and completion status

## 🚀 Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **React Router v6** - Client-side routing
- **Axios** - HTTP client for API requests
- **CSS3** - Custom responsive styling

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Multer** - File upload handling
- **bcryptjs** - Password hashing

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/education-website.git
cd education-website
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your configuration
# Required variables:
# - MONGODB_URI=mongodb://localhost:27017/education_website
# - JWT_SECRET=your_secret_key_here
# - PORT=5000

# Create uploads directory
mkdir -p uploads/videos

# Start the backend server
npm run dev
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

### 4. Database Setup
The application will automatically connect to MongoDB. Make sure your MongoDB instance is running and accessible via the connection string in your `.env` file.

## 🔧 Configuration

### Environment Variables (Backend)
Create a `.env` file in the backend directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/education_website
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
```

### Frontend Configuration
The frontend automatically proxies API requests to `http://localhost:5000` during development. For production, update the API URL in the service files.

## 👥 User Roles & Demo Accounts

### Demo Accounts
For testing purposes, you can use these demo accounts:

**Administrator**
- Email: admin@demo.com
- Password: password123

**Student**
- Email: student@demo.com  
- Password: password123

### Role Capabilities

**Admin Role:**
- Full course management (create, edit, delete)
- Quiz creation and management
- User management (add, edit, deactivate users)
- Analytics and reporting access
- View all quiz results and performance data

**Student Role:**
- Browse and enroll in available courses
- Watch course videos
- Take quizzes and view personal results
- Manage personal profile information
- Track learning progress

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Course Endpoints
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course (Admin)
- `PUT /api/courses/:id` - Update course (Admin)
- `DELETE /api/courses/:id` - Delete course (Admin)
- `POST /api/courses/:id/enroll` - Enroll in course (Student)

### Quiz Endpoints  
- `GET /api/quizzes` - Get all quizzes (Admin)
- `POST /api/quizzes` - Create quiz (Admin)
- `GET /api/quizzes/:id/take` - Get quiz for taking (Student)
- `POST /api/quizzes/:id/submit` - Submit quiz answers (Student)

### Results Endpoints
- `GET /api/results/my-results` - Get student's results
- `GET /api/results` - Get all results (Admin)
- `GET /api/results/admin/summary` - Get results analytics (Admin)

## 🎯 Usage Guide

### For Students

1. **Getting Started**
   - Register for an account or use demo credentials
   - Browse available courses on the Courses page
   - Enroll in courses that interest you

2. **Learning Process**
   - Access enrolled courses from your dashboard
   - Watch course videos in sequence
   - Take the quiz at the end of each course
   - View your results and track progress

3. **Taking Quizzes**
   - Read quiz instructions carefully
   - Note the time limits for the entire quiz and individual questions
   - Submit answers before time expires
   - View immediate results and explanations

### For Administrators

1. **Course Management**
   - Create new courses with titles, descriptions, and metadata
   - Upload video content for each course
   - Set course visibility (published/draft)
   - Monitor student enrollments

2. **Quiz Creation**
   - Design quizzes linked to specific courses
   - Add various question types (multiple choice, true/false, dropdown)
   - Set time limits and passing scores
   - Configure question randomization

3. **User Management**
   - Add new users (students or admins)
   - Edit user information and roles
   - Activate/deactivate accounts
   - Monitor user activity

4. **Analytics & Reporting**
   - View student performance metrics
   - Analyze course completion rates
   - Export quiz results
   - Generate progress reports

## 🛠️ Development

### Project Structure
```
education-website/
├── backend/
│   ├── models/          # Database schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Authentication & validation
│   ├── uploads/         # File storage
│   └── server.js        # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service functions
│   │   ├── contexts/    # React contexts
│   │   └── App.js       # Main app component
│   └── public/          # Static files
└── README.md
```

### Running in Development
```bash
# Backend (from backend directory)
npm run dev

# Frontend (from frontend directory)
npm start
```

### Building for Production
```bash
# Frontend build (from frontend directory)
npm run build

# Backend (from backend directory)  
npm start
```

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Ensure MongoDB connection is configured
3. Build and deploy to your hosting platform (Heroku, DigitalOcean, etc.)

### Frontend Deployment  
1. Update API endpoints for production
2. Build the React application: `npm run build`
3. Deploy the build folder to static hosting (Netlify, Vercel, etc.)

### Database Setup
- Use MongoDB Atlas for cloud database
- Configure connection string in environment variables
- Ensure proper indexing for performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Check MongoDB connection
- Verify environment variables
- Ensure all dependencies are installed

**Frontend build errors:**
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check for missing dependencies

**Quiz timer issues:**
- Ensure system clock is synchronized
- Check browser JavaScript console for errors

**File upload problems:**
- Verify uploads directory exists and has write permissions
- Check file size limits in server configuration

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check existing documentation
- Review the troubleshooting section

## 🎉 Acknowledgments

- React team for the amazing frontend framework
- Express.js community for the robust backend framework
- MongoDB for flexible data storage
- All contributors and testers

---

Built with ❤️ for education and learning