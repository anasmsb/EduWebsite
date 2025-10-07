# Quick Setup Guide

## Prerequisites Installation

### 1. Install Node.js
- Download from: https://nodejs.org/
- Choose LTS version (recommended)
- Verify installation: `node --version` and `npm --version`

### 2. Install MongoDB
**Option A: Local Installation**
- Download from: https://www.mongodb.com/try/download/community
- Follow installation guide for your OS
- Start MongoDB service

**Option B: MongoDB Atlas (Cloud)**
- Sign up at: https://www.mongodb.com/atlas
- Create free cluster
- Get connection string

## Project Setup

### 1. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all project dependencies
npm run install-all
```

### 2. Backend Configuration
```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env file with your settings:
# MONGODB_URI=mongodb://localhost:27017/education_website
# JWT_SECRET=your_secret_key_here_make_it_long_and_random
# PORT=5000
```

### 3. Initialize Database with Demo Data
```bash
# From backend directory
npm run init-db
```

### 4. Start Development Servers
```bash
# From project root - starts both backend and frontend
npm run dev

# OR start individually:
# Backend only (from backend directory)
npm run dev

# Frontend only (from frontend directory)
npm start
```

## Demo Accounts

After running `npm run init-db`, you can log in with:

**Administrator Account:**
- Email: `admin@demo.com`
- Password: `password123`

**Student Account:**
- Email: `student@demo.com`
- Password: `password123`

## Access URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **MongoDB:** mongodb://localhost:27017 (if local)

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Kill process on port 3000
   npx kill-port 3000
   
   # Kill process on port 5000
   npx kill-port 5000
   ```

2. **MongoDB connection error:**
   - Ensure MongoDB is running
   - Check connection string in .env file
   - For Atlas, ensure IP whitelist is configured

3. **npm command not found:**
   - Install Node.js from official website
   - Restart terminal after installation

4. **Permission errors:**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Delete node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

## Development Workflow

1. **Backend Development:**
   - API routes in `backend/routes/`
   - Database models in `backend/models/`
   - Server automatically restarts with nodemon

2. **Frontend Development:**
   - Components in `frontend/src/components/`
   - Pages in `frontend/src/pages/`
   - Hot reload enabled

3. **Testing:**
   - Use demo accounts to test functionality
   - Test both admin and student workflows

## Next Steps

1. Explore the admin dashboard to create courses
2. Add video content to courses
3. Create quizzes with different question types
4. Test the student learning experience
5. Customize styling and branding
6. Add additional features as needed

Happy coding! 🚀