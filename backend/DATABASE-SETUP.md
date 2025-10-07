# Database Setup - Education Website

## Overview
This document describes the consolidated database initialization system for the Education Website project.

## Consolidated Database Setup

The database setup has been consolidated into a single file: `database-setup.js`

### Key Features
- **Single Point of Setup**: All database creation, table structure, and initial data seeding in one file
- **Environment Validation**: Checks for required packages and configuration
- **Comprehensive Table Creation**: All tables with proper constraints, indexes, and foreign keys
- **Sample Data**: Creates admin and student accounts with sample courses and quizzes
- **Directory Structure**: Sets up required directories for file uploads
- **Error Handling**: Comprehensive error handling and graceful cleanup
- **Verification**: Final verification of database structure and data

### Files Consolidated
- ✅ `setupDatabase.js` (moved to `backup/deprecated/`)
- ✅ `initDatabase.js` (moved to `backup/deprecated/`)
- ✅ `server.js` database initialization (updated to use consolidated setup)

## Usage

### Method 1: Standalone Database Setup
```bash
# Run database setup independently
npm run setup-database
```

### Method 2: Integrated with Server Start
```bash
# Start server (automatically initializes database)
npm start

# or for development
npm run dev
```

### Method 3: Reset Database
```bash
# Reset/recreate database (same as setup-database)
npm run reset-database
```

## Database Structure

### Tables Created
1. **users** - User accounts (admin/student roles)
2. **courses** - Course information with instructor relationships
3. **quizzes** - Quiz definitions with questions and settings
4. **quiz_results** - Student quiz attempt results
5. **quiz_sessions** - Active quiz session management
6. **course_enrollments** - Student course enrollment tracking

### Sample Accounts Created
- **Admin**: admin@demo.com / password123
- **Student**: student@demo.com / password123
- **Student**: jane@demo.com / password123

### Sample Data
- 2 demo courses with different difficulty levels
- 2 comprehensive quizzes with multiple question types
- Sample course enrollments

## Configuration

### Environment Variables
```env
DB_NAME=education_website
DB_USER=root
DB_PASS=7710
DB_HOST=localhost
DB_PORT=3306
```

### Directory Structure Created
```
backend/
├── uploads/
│   ├── videos/
│   ├── thumbnails/
│   └── profiles/
├── logs/
└── temp/
```

## Database Schema Highlights

### Advanced Features
- **Foreign Key Constraints**: Proper relationships between all tables
- **Indexes**: Optimized for common query patterns
- **JSON Storage**: Questions, answers, and metadata stored as JSON
- **Session Management**: Persistent quiz sessions with expiration
- **Audit Trail**: Created/updated timestamps on all tables
- **Data Integrity**: Check constraints for valid ranges and values

### Security Features
- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **Role-Based Access**: Enforced at database and application levels
- **Session Tokens**: Unique session tokens for quiz state management
- **Data Validation**: Constraints to ensure data integrity

## Troubleshooting

### Common Issues
1. **MySQL Connection**: Ensure MySQL is running and credentials are correct
2. **Permission Issues**: Check database user has CREATE/ALTER privileges
3. **Port Conflicts**: Verify port 3306 is available for MySQL
4. **Package Dependencies**: Run `npm install` if packages are missing

### Reset Database
If you need to completely reset the database:
```bash
npm run reset-database
```

### Manual Database Deletion
If needed, you can manually drop the database:
```sql
DROP DATABASE IF EXISTS education_website;
```

## Migration from Old Setup

### Changes Made
1. **Consolidated Files**: Multiple setup files merged into single `database-setup.js`
2. **Enhanced Error Handling**: Better error messages and cleanup
3. **Improved Logging**: Comprehensive setup progress logging
4. **Server Integration**: Database setup integrated into server startup
5. **Package Scripts**: Updated npm scripts for easier usage

### Backup Location
Old files are preserved in: `backup/deprecated/`
- `setupDatabase.js`
- `initDatabase.js`

## Performance Optimizations

### Indexes Added
- User email and username for fast authentication
- Course categories and publication status for filtering
- Quiz and result relationships for analytics
- Session tokens for quick session lookup

### Connection Pooling
- Configured Sequelize connection pool for better performance
- Max 10 connections, idle timeout 10 seconds

## Next Steps

### Recommended Enhancements
1. **Database Migration System**: Add formal migration system for schema changes
2. **Seed Data Management**: Separate seed data from structure creation
3. **Environment-Specific Setup**: Different setups for dev/staging/production
4. **Backup/Restore Scripts**: Automated backup and restore functionality

### Development Workflow
1. Use `npm run dev` for development (auto-restarts server)
2. Database is automatically set up on first run
3. Add new tables/changes to `database-setup.js`
4. Run `npm run reset-database` to apply changes

---

**Last Updated**: December 28, 2024
**Version**: 1.0.0
**Maintainer**: Education Website Development Team