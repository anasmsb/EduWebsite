# Database Setup Guide

## Overview

This guide explains how to set up the Education Website database with a clean, consolidated approach.

## Database Structure

The application uses 5 main tables:

### 1. **users**
- User accounts (students and admins)
- Authentication and profile information

### 2. **courses** 
- Course information with videos (JSON)
- Instructor relationships
- Publishing status

### 3. **quizzes**
- Quiz questions and configuration (JSON)
- Connected to courses and creators

### 4. **quiz_results**
- Student quiz attempts and scores
- Performance tracking

### 5. **course_enrollments**
- Many-to-many relationship between users and courses
- Progress tracking

## Setup Methods

### Method 1: Clean Setup (Recommended)

Use the consolidated setup script:

```bash
cd backend
npm run setup-db
```

This script will:
- ✅ Create database if it doesn't exist
- ✅ Create all tables with proper constraints
- ✅ Add indexes for performance
- ✅ Insert sample data if none exists
- ✅ Handle foreign key relationships correctly

### Method 2: Legacy Setup (Deprecated)

```bash
cd backend
npm run init-db
```

⚠️ **Not recommended**: This uses Sequelize sync which can cause issues with table alterations.

## What Gets Created

### Sample Data
- **Admin User**: admin@demo.com / password123
- **Student User**: student@demo.com / password123  
- **Sample Course**: "Introduction to Web Development"
- **Sample Quiz**: Web development basics with 3 questions

### Database Features
- ✅ **Foreign Key Constraints**: Proper relationships with CASCADE options
- ✅ **Indexes**: Optimized queries for common lookups
- ✅ **JSON Fields**: Flexible storage for videos, questions, tags
- ✅ **FULLTEXT Search**: Course search capabilities
- ✅ **Validation**: Check constraints for data integrity

## Environment Configuration

Create `.env` file in backend directory:

```env
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=education_website
DB_PORT=3306
NODE_ENV=development
```

## Troubleshooting

### Database Already Exists
The setup script uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

### Foreign Key Errors
The script creates tables in the correct order to handle dependencies.

### Sample Data Already Exists
The script checks for existing admin user and skips sample data creation if found.

### Permission Issues
Ensure your MySQL user has CREATE, ALTER, INSERT, SELECT permissions.

## Migration Notes

If you have an existing database with different structure:
1. **Backup your data first**
2. Run the setup script to see what changes are needed
3. The script won't alter existing table structures
4. Manual migration may be required for schema changes

## Verification

After setup, verify the installation:

```bash
mysql -u root -p
USE education_website;
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT title FROM courses;
```

You should see:
- 5 tables created
- 2 users (admin + student)  
- 1 sample course
- 1 sample quiz

## Production Setup

For production:
1. Use strong passwords
2. Remove or change default sample accounts
3. Set `NODE_ENV=production`
4. Configure proper backup strategy
5. Set up SSL/TLS for database connections