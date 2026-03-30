# VedraLearn Admin Backend API

**Professional Admin & User Management System with AWS Integration**

---

## 📋 Overview

This is the backend API for the VedraLearn Admin Dashboard. It provides:
- ✅ Admin authentication (JWT-based)
- ✅ Complete User CRUD operations
- ✅ Activity logging & auditing
- ✅ Role-based access control
- ✅ AWS RDS database integration
- ✅ Production-ready with security best practices

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 14+ ([Download](https://nodejs.org/))
- MySQL 8.0+ or connect to AWS RDS
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/vedralearn-website.git
cd vedralearn-website/backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
nano .env
```

Update `.env` with your database credentials:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_development_secret_key
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=vedralearn_admin
```

4. **Setup database**
```bash
# Connect to MySQL
mysql -u root -p

# Execute schema
source DATABASE_SCHEMA.sql

# Exit
exit
```

5. **Start development server**
```bash
npm run dev
```

Server runs at: `http://localhost:5000`

---

## 📚 API Documentation

### Authentication

#### Admin Login
**Endpoint:** `POST /api/admin/login`

**Request:**
```json
{
    "email": "admin@vedralearn.com",
    "password": "admin123"
}
```

**Response:**
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR...",
    "admin": {
        "id": 1,
        "email": "admin@vedralearn.com"
    }
}
```

**All subsequent requests require this token in headers:**
```headers
Authorization: eyJhbGciOiJIUzI1NiIsInR...
```

---

### User Management

#### Get All Users
**Endpoint:** `GET /api/users`

**Headers:**
```
Authorization: <token>
```

**Response:**
```json
{
    "users": [
        {
            "id": 1,
            "name": "Arjun Verma",
            "email": "arjun@example.com",
            "phone": "9876543210",
            "program": "web-development",
            "status": "active",
            "created_at": "2026-03-30T10:00:00Z"
        }
    ],
    "total": 1,
    "active": 1,
    "pending": 0
}
```

---

#### Get Single User
**Endpoint:** `GET /api/users/:id`

**Response:**
```json
{
    "id": 1,
    "name": "Arjun Verma",
    "email": "arjun@example.com",
    "phone": "9876543210",
    "program": "web-development",
    "status": "active",
    "created_at": "2026-03-30T10:00:00Z"
}
```

---

#### Create User
**Endpoint:** `POST /api/users`

**Request:**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "program": "web-development",
    "status": "pending"
}
```

**Response:** (201 Created)
```json
{
    "message": "User created successfully",
    "user": {
        "id": 4,
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "program": "web-development",
        "status": "pending",
        "created_at": "2026-03-30T15:30:00Z"
    }
}
```

---

#### Update User
**Endpoint:** `PUT /api/users/:id`

**Request:**
```json
{
    "status": "active",
    "phone": "9876543215"
}
```

**Response:**
```json
{
    "message": "User updated successfully",
    "user": {
        "id": 1,
        "name": "Arjun Verma",
        "email": "arjun@example.com",
        "phone": "9876543215",
        "program": "web-development",
        "status": "active",
        "updated_at": "2026-03-30T15:35:00Z"
    }
}
```

---

#### Delete User
**Endpoint:** `DELETE /api/users/:id`

**Response:**
```json
{
    "message": "User deleted successfully",
    "user": {
        "id": 1,
        "name": "Arjun Verma",
        "email": "arjun@example.com"
    }
}
```

---

### Activity Logs

#### Get Activity Log
**Endpoint:** `GET /api/activities?limit=50&offset=0`

**Query Parameters:**
- `limit` (optional): Number of records (default: 50)
- `offset` (optional): Starting record number (default: 0)

**Response:**
```json
{
    "activities": [
        {
            "id": 1,
            "admin_id": 1,
            "action": "Admin Login",
            "user_id": null,
            "timestamp": "2026-03-30T10:00:00Z"
        },
        {
            "id": 2,
            "admin_id": 1,
            "action": "User Created",
            "user_id": 4,
            "timestamp": "2026-03-30T15:30:00Z"
        }
    ],
    "total": 2
}
```

---

### Statistics

#### Get Dashboard Stats
**Endpoint:** `GET /api/stats`

**Response:**
```json
{
    "total_users": 5,
    "active_users": 3,
    "pending_users": 1,
    "completed_users": 1,
    "total_activities": 25,
    "programs": {
        "web-development": 2,
        "python-development": 1,
        "java-development": 1,
        "ai-ml": 1,
        "cloud-support": 0,
        "iot-production": 0
    }
}
```

---

### Health Check

**Endpoint:** `GET /api/health`

**Response:**
```json
{
    "status": "OK",
    "message": "VedraLearn Admin API is running"
}
```

---

## 🔐 Security Features

1. **JWT Authentication**
   - Tokens expire after 24 hours
   - Validated on every protected endpoint

2. **Password Hashing**
   - bcryptjs with salt rounds 10
   - Never stored in plain text

3. **CORS Protection**
   - Whitelist specific domains in production

4. **Input Validation**
   - Email format validation
   - Required field checks
   - Type validation

5. **Rate Limiting** (Recommended to add)
   ```bash
   npm install express-rate-limit
   ```

---

## 📦 Project Structure

```
backend/
├── server.js                 # Main application entry point
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables
├── .env.example             # Environment template
├── DATABASE_SCHEMA.sql      # MySQL schema and setup
├── AWS_DEPLOYMENT_GUIDE.md  # AWS deployment instructions
├── README.md                # This file
├── user-data.sh             # EC2 auto-setup script
├── routes/                  # API routes (recommended structure)
│   ├── admin.js
│   ├── users.js
│   └── activities.js
├── middleware/              # Custom middleware
│   └── auth.js
├── models/                  # Database models (optional Sequelize)
│   ├── Admin.js
│   │ ├── User.js
│   └── Activity.js
└── config/                  # Configuration files
    └── database.js
```

---

## 🧪 Testing

### Test Admin Login
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@vedralearn.com",
    "password": "admin123"
  }'
```

### Test Get Users
```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: <your_token>"
```

### Test Create User
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "1234567890",
    "program": "web-development",
    "status": "pending"
  }'
```

---

## 🚀 Deployment

### Option 1: AWS EC2 (Recommended)
See [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md) for detailed instructions

Quick command:
```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro \
  --user-data file://user-data.sh
```

### Option 2: Heroku
```bash
heroku login
heroku create vedralearn-api
git push heroku main
```

### Option 3: DigitalOcean App Platform
```bash
doctl apps create --spec app.yaml
```

---

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Server port |
| `NODE_ENV` | development | Environment (development/production) |
| `JWT_SECRET` | - | Secret key for JWT tokens |
| `DB_HOST` | localhost | Database host |
| `DB_PORT` | 3306 | Database port |
| `DB_USER` | root | Database user |
| `DB_PASSWORD` | - | Database password |
| `DB_NAME` | vedralearn_admin | Database name |
| `CORS_ORIGIN` | - | Allowed CORS origin |

---

## 📊 Database Schema Overview

### Users Table
| Column | Type | Notes |
|--------|------|-------|
| id | INT | Primary Key |
| name | VARCHAR(255) | Required |
| email | VARCHAR(255) | Required, Unique |
| phone | VARCHAR(20) | Optional |
| program | VARCHAR(100) | Required |
| status | ENUM | pending, active, inactive, completed |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

### Admins Table
| Column | Type | Notes |
|--------|------|-------|
| id | INT | Primary Key |
| email | VARCHAR(255) | Required, Unique |
| password | VARCHAR(255) | Hashed |
| created_at | TIMESTAMP | Auto |

### Activity Log Table
| Column | Type | Notes |
|--------|------|-------|
| id | INT | Primary Key |
| admin_id | INT | Foreign Key → admins |
| action | VARCHAR(255) | Action performed |
| user_id | INT | Foreign Key → users |
| timestamp | TIMESTAMP | Auto |

---

## 🐛 Troubleshooting

### "Cannot connect to database"
1. Verify credentials in `.env`
2. Check database is running: `mysql -u root -p`
3. Ensure database was created with schema

### "JWT validation failed"
1. Check token is sent in Authorization header
2. Verify JWT_SECRET matches between login and other endpoints
3. Check token hasn't expired (24 hour limit)

### "Port 5000 already in use"
```bash
# Kill process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :5000
kill -9 <PID>
```

---

## 📈 Performance Optimization

1. **Add Database Indexes** ✅ (Already in schema)
2. **Implement Caching**
   ```bash
   npm install redis
   ```
3. **Add Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```
4. **Compress Responses**
   ```bash
   npm install compression
   ```

---

## 📝 Future Enhancements

- [ ] Email notifications for user actions
- [ ] Two-factor authentication
- [ ] Role-based permissions
- [ ] Batch import/export users
- [ ] Advanced analytics dashboard
- [ ] Webhook support
- [ ] GraphQL endpoint
- [ ] File upload support

---

## 📜 License

MIT License - See LICENSE file for details

---

## 👥 Support

For issues or questions:
1. Check AWS_DEPLOYMENT_GUIDE.md
2. Review API documentation above
3. Check troubleshooting section
4. Contact: support@vedralearn.com

---

## 📅 Changelog

### v1.0.0 (2026-03-30)
- ✅ Initial release
- ✅ Admin authentication
- ✅ User CRUD operations
- ✅ Activity logging
- ✅ AWS deployment guide

---

**Built with ❤️ for VedraLearn Technologies**
