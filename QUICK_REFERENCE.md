# VedraLearn Admin System - Quick Reference Guide

## 🎯 Project Overview

This project consists of three components:
1. **Frontend**: Admin Dashboard (HTML/CSS/JavaScript)
2. **Backend**: Node.js/Express API
3. **Database**: AWS RDS MySQL

---

## 📁 Project Structure

```
vedralearn-website/
├── index.html              # Homepage
├── about.html              # About page
├── login.html              # User login
├── getstarted.html         # Get started page
├── admin-login.html        # ⭐ Admin login page
├── admin-dashboard.html    # ⭐ Admin dashboard (user management)
├── css/
│   └── style.css           # Consolidated stylesheet
├── services/               # Service pages
├── images/                 # Images and logos
├── js/
│   └── main.js             # JavaScript utilities
└── backend/                # ⭐ Node.js/Express API
    ├── server.js           # Main server file
    ├── package.json        # Dependencies
    ├── .env                # Environment variables (KEEP SECRET!)
    ├── .env.example        # Template for .env
    ├── DATABASE_SCHEMA.sql # MySQL schema
    ├── AWS_DEPLOYMENT_GUIDE.md
    ├── README.md
    └── user-data.sh        # EC2 auto-setup script
```

---

## 🚀 Quick Start Commands

### Local Development Setup
```bash
# 1. Navigate to backend
cd vedralearn-website/backend

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your local database credentials

# 4. Setup database (first time only)
mysql -u root -p < DATABASE_SCHEMA.sql

# 5. Start development server
npm run dev
# API runs at http://localhost:5000
```

### Testing the Admin System
```bash
# 1. Open browser
# Frontend: http://localhost/admin-login.html
# Backend: http://localhost:5000

# 2. Login with demo credentials
Email: admin@vedralearn.com
Password: admin123

# 3. Access dashboard
# http://localhost/admin-dashboard.html
```

---

## 🔑 Default Credentials

| Component | User | Password |
|-----------|------|----------|
| Admin Portal | admin@vedralearn.com | admin123 |
| Database | vedralearn_app | app_password_here |
| Database Root | root | your_password |

**⚠️ CHANGE THESE IN PRODUCTION!**

---

## 📊 Database Quick Reference

### Users Table Quick Query
```sql
-- All users
SELECT * FROM users;

-- Users by status
SELECT * FROM users WHERE status = 'active';

-- Users by program
SELECT * FROM users WHERE program = 'web-development';

-- User count statistics
SELECT status, COUNT(*) as count FROM users GROUP BY status;
SELECT program, COUNT(*) as count FROM users GROUP BY program;
```

### Admin Activities
```sql
-- Recent activities
SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 20;

-- Activities by admin
SELECT * FROM activity_log WHERE admin_id = 1 ORDER BY timestamp DESC;

-- Activities by user
SELECT * FROM activity_log WHERE user_id = 1;
```

---

## 🌐 API Endpoints Quick Reference

### Authentication
| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/admin/login` | Admin login | ❌ |
| GET | `/api/health` | API health check | ❌ |

### User Management
| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/users` | Get all users | ✅ |
| GET | `/api/users/:id` | Get single user | ✅ |
| POST | `/api/users` | Create user | ✅ |
| PUT | `/api/users/:id` | Update user | ✅ |
| DELETE | `/api/users/:id` | Delete user | ✅ |

### Data & Analytics
| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/stats` | Dashboard statistics | ✅ |
| GET | `/api/activities` | Activity log | ✅ |

---

## 💻 Common Development Tasks

### 1. Add New Endpoint
```javascript
// In server.js
app.post('/api/custom-endpoint', verifyToken, (req, res) => {
    try {
        // Your code here
        res.json({ message: 'Success' });
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
});
```

### 2. Add New Database Field
```sql
-- Add column
ALTER TABLE users ADD COLUMN new_field VARCHAR(255);

-- Update model in server.js
```

### 3. Generate JWT Token (for testing)
```javascript
const jwt = require('jsonwebtoken');
const token = jwt.sign(
    { id: 1, email: 'admin@vedralearn.com' },
    'your_jwt_secret',
    { expiresIn: '24h' }
);
console.log(token);
```

### 4. Test API with cURL
```bash
# Get users
curl -H "Authorization: your_token" http://localhost:5000/api/users

# Create user
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: your_token" \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","program":"web-development","status":"active"}'

# Delete user
curl -X DELETE http://localhost:5000/api/users/1 \
  -H "Authorization: your_token"
```

---

## 🔒 Security Checklist

### Before Production Deployment
- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Setup CORS properly
- [ ] Enable database encryption
- [ ] Enable CloudWatch monitoring
- [ ] Setup backup schedule
- [ ] Configure AWS security groups
- [ ] Use AWS Secrets Manager for credentials
- [ ] Enable database audit logging
- [ ] Setup rate limiting
- [ ] Remove console.log statements
- [ ] Enable CORS from specific domains only

### Pre-Deployment Checklist (.env)
```bash
# Make sure ALL these are set to production values:
NODE_ENV=production
JWT_SECRET=<long_random_string>
DB_HOST=<rds_endpoint>
DB_USER=<secure_username>
DB_PASSWORD=<secure_password>
CORS_ORIGIN=https://your-domain.com
```

---

## 🐛 Debug Mode

### Enable Detailed Logging
```javascript
// In server.js
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log('Body:', req.body);
    next();
});
```

### Check Database Connection
```bash
# From backend directory
node -e "
require('dotenv').config();
const mysql = require('mysql2');
const conn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
conn.connect(err => console.log(err ? 'FAILED' : 'SUCCESS'));
"
```

### View PM2 Logs
```bash
pm2 logs vedralearn-api
pm2 logs vedralearn-api --lines 100
pm2 logs vedralearn-api --err
```

---

## 🚀 AWS Deployment CheatSheet

### 1. Quick Deployment (from AWS Console)
```bash
# Get RDS endpoint
aws rds describe-db-instances --db-instance-identifier vedralearn-admin-db

# Get EC2 IP
aws ec2 describe-instances --filters "Name=tag:Name,Values=vedralearn-api"

# SSH to EC2
ssh -i my-key-pair.pem ec2-user@<public-ip>

# Check application status
pm2 status
pm2 restart vedralearn-api
```

### 2. Database Backup
```bash
# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier vedralearn-admin-db \
  --db-snapshot-identifier vedralearn-snapshot-$(date +%Y%m%d)

# List snapshots
aws rds describe-db-snapshots --db-instance-identifier vedralearn-admin-db
```

### 3. Update Application (on EC2)
```bash
# SSH to instance
ssh -i my-key-pair.pem ec2-user@<ip>

# Go to app directory
cd vedralearn-website/backend

# Pull latest code
git pull origin main

# Reinstall dependencies if needed
npm install

# Restart with PM2
pm2 restart vedralearn-api
```

---

## 📝 Environment Variables Explanation

| Variable | What It Does | Example |
|----------|-------------|---------|
| `PORT` | Server listening port | 5000 |
| `NODE_ENV` | Development/Production mode | production |
| `JWT_SECRET` | Token encryption key | abc123def456... |
| `DB_HOST` | Database server address | my-db.rds.amazonaws.com |
| `DB_USER` | Database login username | vedralearn_app |
| `DB_PASSWORD` | Database login password | SecurePass123! |
| `DB_NAME` | Database name | vedralearn_admin |
| `CORS_ORIGIN` | Allowed website URLs | https://example.com |
| `AWS_REGION` | AWS region | us-east-1 |

---

## 🆘 Common Issues & Solutions

### "Database connection refused"
```bash
# Check if MySQL is running
sudo systemctl status mysql

# Check credentials
mysql -h <host> -u <user> -p

# Verify database exists
mysql -u <user> -p -e "USE vedralearn_admin; SHOW TABLES;"
```

### "Port 5000 already in use"
```bash
# Find process using port
netstat -tlnp | grep 5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=5001 npm run dev
```

### "JWT token invalid"
```bash
# Regenerate token via login endpoint
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vedralearn.com","password":"admin123"}'
```

### "Cannot GET /api/users"
1. Check token is in Authorization header
2. Verify token is valid (not expired)
3. Check server is running on correct port
4. Restart server: `pm2 restart vedralearn-api`

---

## 📊 Performance Tips

### 1. Use Database Indexes ✅ (Already configured)
### 2. Cache frequently accessed data
```javascript
const cache = {};
const cachedUsers = cache.users || (cache.users = await getUsers());
```

### 3. Paginate large result sets
```javascript
app.get('/api/users?page=1&limit=10', ...);
```

### 4. Compress responses
```bash
npm install compression
```

### 5. Enable gzip compression in Nginx
```nginx
gzip on;
gzip_types text/plain application/json;
```

---

## 📚 Useful Documentation Links

- **Express.js**: https://expressjs.com/
- **MySQL Docs**: https://dev.mysql.com/doc/
- **JWT**: https://jwt.io/
- **AWS RDS**: https://docs.aws.amazon.com/rds/
- **PM2**: https://pm2.keymetrics.io/
- **bcryptjs**: https://github.com/dcodeIO/bcrypt.js

---

## 🎓 Learning Resources

### Videos
- Node.js REST API Tutorial
- Express.js Complete Course
- AWS Certified Associate Solutions Architect

### Articles
- RESTful API Best Practices
- JWT Authentication Guide
- MySQL Performance Tuning

---

## 📞 Support Contacts

| Issue | Contact | Link |
|-------|---------|------|
| Backend Issues | Tech Team | support@vedralearn.com |
| Database | DBA | dba@vedralearn.com |
| Deployment | DevOps | devops@vedralearn.com |
| Frontend | UI Team | ui@vedralearn.com |

---

**Last Updated:** 2026-03-30
**Version:** 1.0.0
**Maintainer:** VedraLearn Tech Team

---

## 🎯 Next Steps

1. ✅ Setup local development environment
2. ✅ Test API endpoints with Postman or cURL
3. ✅ Create AWS account and setup resources
4. ✅ Deploy backend to EC2
5. ✅ Configure database with RDS
6. ✅ Setup domain and SSL/TLS
7. ✅ Deploy frontend to S3 + CloudFront
8. ✅ Monitor with CloudWatch
9. ✅ Setup automatic backups
10. ✅ Go live! 🚀

---

**Happy Coding! 💻**
