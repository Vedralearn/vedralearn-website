const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here_change_in_production';

// In-memory database (Replace with AWS RDS/DynamoDB in production)
let admins = [
    {
        id: 1,
        email: 'admin@vedralearn.com',
        password: bcrypt.hashSync('admin123', 10),
        created_at: new Date()
    }
];

let users = [
    {
        id: 1,
        name: 'Arjun Verma',
        email: 'arjun@example.com',
        phone: '9876543210',
        program: 'web-development',
        status: 'active',
        created_at: new Date()
    },
    {
        id: 2,
        name: 'Priya Singh',
        email: 'priya@example.com',
        phone: '9876543211',
        program: 'python-development',
        status: 'active',
        created_at: new Date()
    },
    {
        id: 3,
        name: 'Rahul Patel',
        email: 'rahul@example.com',
        phone: '9876543212',
        program: 'java-development',
        status: 'pending',
        created_at: new Date()
    }
];

let activities = [];

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// ==================== ADMIN ROUTES ====================

// Admin Login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        // Find admin
        const admin = admins.find(a => a.email === email);

        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, admin.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: admin.id, email: admin.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Log activity
        activities.push({
            id: activities.length + 1,
            admin_id: admin.id,
            action: 'Admin Login',
            user_id: null,
            timestamp: new Date()
        });

        res.json({
            token,
            admin: {
                id: admin.id,
                email: admin.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== USER ROUTES ====================

// Get All Users
app.get('/api/users', verifyToken, (req, res) => {
    try {
        res.json({
            users,
            total: users.length,
            active: users.filter(u => u.status === 'active').length,
            pending: users.filter(u => u.status === 'pending').length
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Single User
app.get('/api/users/:id', verifyToken, (req, res) => {
    try {
        const user = users.find(u => u.id === parseInt(req.params.id));

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create User
app.post('/api/users', verifyToken, (req, res) => {
    try {
        const { name, email, phone, program, status } = req.body;

        // Validate required fields
        if (!name || !email || !program || !status) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if email already exists
        if (users.some(u => u.email === email)) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const newUser = {
            id: Math.max(...users.map(u => u.id), 0) + 1,
            name,
            email,
            phone: phone || null,
            program,
            status,
            created_at: new Date()
        };

        users.push(newUser);

        // Log activity
        activities.push({
            id: activities.length + 1,
            admin_id: req.admin.id,
            action: 'User Created',
            user_id: newUser.id,
            timestamp: new Date()
        });

        res.status(201).json({
            message: 'User created successfully',
            user: newUser
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update User
app.put('/api/users/:id', verifyToken, (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { name, email, phone, program, status } = req.body;

        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if new email already exists (excluding current user)
        if (email && email !== users[userIndex].email && users.some(u => u.email === email)) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const updatedUser = {
            ...users[userIndex],
            name: name || users[userIndex].name,
            email: email || users[userIndex].email,
            phone: phone !== undefined ? phone : users[userIndex].phone,
            program: program || users[userIndex].program,
            status: status || users[userIndex].status,
            updated_at: new Date()
        };

        users[userIndex] = updatedUser;

        // Log activity
        activities.push({
            id: activities.length + 1,
            admin_id: req.admin.id,
            action: 'User Updated',
            user_id: userId,
            timestamp: new Date()
        });

        res.json({
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete User
app.delete('/api/users/:id', verifyToken, (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found' });
        }

        const deletedUser = users[userIndex];
        users.splice(userIndex, 1);

        // Log activity
        activities.push({
            id: activities.length + 1,
            admin_id: req.admin.id,
            action: 'User Deleted',
            user_id: userId,
            timestamp: new Date()
        });

        res.json({
            message: 'User deleted successfully',
            user: deletedUser
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== ACTIVITY LOG ROUTES ====================

// Get Activity Log
app.get('/api/activities', verifyToken, (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const paginatedActivities = activities
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(offset, offset + limit);

        res.json({
            activities: paginatedActivities,
            total: activities.length
        });
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== STATISTICS ROUTES ====================

// Get Dashboard Stats
app.get('/api/stats', verifyToken, (req, res) => {
    try {
        const stats = {
            total_users: users.length,
            active_users: users.filter(u => u.status === 'active').length,
            pending_users: users.filter(u => u.status === 'pending').length,
            completed_users: users.filter(u => u.status === 'completed').length,
            total_activities: activities.length,
            programs: {
                'web-development': users.filter(u => u.program === 'web-development').length,
                'python-development': users.filter(u => u.program === 'python-development').length,
                'java-development': users.filter(u => u.program === 'java-development').length,
                'ai-ml': users.filter(u => u.program === 'ai-ml').length,
                'cloud-support': users.filter(u => u.program === 'cloud-support').length,
                'iot-production': users.filter(u => u.program === 'iot-production').length
            }
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'VedraLearn Admin API is running' });
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`🚀 VedraLearn Admin API running on http://localhost:${PORT}`);
    console.log(`📊 API Documentation:`);
    console.log(`   POST   http://localhost:${PORT}/api/admin/login       - Admin login`);
    console.log(`   GET    http://localhost:${PORT}/api/users             - Get all users`);
    console.log(`   POST   http://localhost:${PORT}/api/users             - Create user`);
    console.log(`   PUT    http://localhost:${PORT}/api/users/:id         - Update user`);
    console.log(`   DELETE http://localhost:${PORT}/api/users/:id         - Delete user`);
    console.log(`   GET    http://localhost:${PORT}/api/stats             - Get statistics`);
});

module.exports = app;
