-- VedraLearn Admin System Database Schema
-- AWS RDS MySQL/PostgreSQL Compatible
-- Created: 2026-03-30

-- ============================================
-- CREATE DATABASE
-- ============================================
CREATE DATABASE IF NOT EXISTS vedralearn_admin;
USE vedralearn_admin;

-- ============================================
-- ADMINS TABLE
-- ============================================
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    program VARCHAR(100) NOT NULL,
    status ENUM('pending', 'active', 'inactive', 'completed') DEFAULT 'pending',
    password_hash VARCHAR(255),
    profile_bio TEXT,
    portfolio_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    skills JSON,
    experience_level VARCHAR(50),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_program (program),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FULLTEXT INDEX ft_name (name),
    FULLTEXT INDEX ft_email (email)
);

-- ============================================
-- ACTIVITY LOG TABLE
-- ============================================
CREATE TABLE activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    user_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_admin_id (admin_id),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_timestamp (timestamp)
);

-- ============================================
-- PROGRAMS TABLE
-- ============================================
CREATE TABLE programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    duration_weeks INT,
    difficulty_level VARCHAR(50),
    skills JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- ============================================
-- USER PROGRESS TABLE
-- ============================================
CREATE TABLE user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    program_id INT,
    progress_percentage INT DEFAULT 0,
    current_phase VARCHAR(100),
    tasks_completed INT DEFAULT 0,
    total_tasks INT DEFAULT 0,
    last_activity TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_progress (progress_percentage)
);

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- Insert Programs
INSERT INTO programs (name, description, duration_weeks, difficulty_level, skills) VALUES
('Web Development', 'Full-stack web development with modern frameworks', 8, 'Intermediate', '["HTML", "CSS", "JavaScript", "React", "Node.js"]'),
('Python Development', 'Python for web, automation, and data science', 8, 'Intermediate', '["Python", "Django", "Flask", "Data Analysis"]'),
('Java Development', 'Enterprise Java development and Spring Boot', 8, 'Intermediate', '["Java", "Spring Boot", "Microservices"]'),
('AI/ML Development', 'Machine Learning and AI model development', 10, 'Advanced', '["Python", "TensorFlow", "PyTorch", "Data Science"]'),
('Cloud Support', 'Cloud infrastructure and DevOps', 8, 'Intermediate', '["AWS", "Docker", "Kubernetes", "CI/CD"]'),
('IoT Production', 'Internet of Things and embedded systems', 8, 'Advanced', '["C++", "IoT Protocols", "Embedded Systems"]');

-- Insert Sample Admin
-- Password: admin123 (hashed with bcrypt)
INSERT INTO admins (email, password, full_name, role, is_active) VALUES
('admin@vedralearn.com', '$2a$10$9j7G5h8k9l0mQ1W2E3R4T5U6V7W8X9Y0Z1A2B3C4D5E6F7G8H9I0J', 'Admin User', 'admin', TRUE);

-- Insert Sample Users
INSERT INTO users (name, email, phone, program, status, is_verified) VALUES
('Arjun Verma', 'arjun@example.com', '9876543210', 'Web Development', 'active', TRUE),
('Priya Singh', 'priya@example.com', '9876543211', 'Python Development', 'active', TRUE),
('Rahul Patel', 'rahul@example.com', '9876543212', 'Java Development', 'pending', FALSE),
('Neha Gupta', 'neha@example.com', '9876543213', 'AI/ML Development', 'active', TRUE),
('Vikram Singh', 'vikram@example.com', '9876543214', 'Cloud Support', 'completed', TRUE);

-- ============================================
-- CREATE VIEWS FOR REPORTING
-- ============================================

-- Active Users View
CREATE VIEW active_users AS
SELECT u.id, u.name, u.email, u.program, u.status, COUNT(al.id) as activities
FROM users u
LEFT JOIN activity_log al ON u.id = al.user_id
WHERE u.status = 'active'
GROUP BY u.id;

-- Program Statistics View
CREATE VIEW program_statistics AS
SELECT 
    p.name,
    COUNT(u.id) as total_users,
    SUM(CASE WHEN u.status = 'active' THEN 1 ELSE 0 END) as active_users,
    AVG(up.progress_percentage) as avg_progress
FROM programs p
LEFT JOIN users u ON p.id = p.id
LEFT JOIN user_progress up ON u.id = up.user_id
GROUP BY p.id;

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Performance optimization indexes
ALTER TABLE activity_log ADD INDEX idx_admin_action (admin_id, action);
ALTER TABLE activity_log ADD INDEX idx_timestamp_admin (timestamp, admin_id);
ALTER TABLE users ADD INDEX idx_status_program (status, program);
ALTER TABLE users ADD INDEX idx_verified_created (is_verified, created_at);

-- ============================================
-- CREATE TRIGGERS FOR AUDIT
-- ============================================

-- Auto-update updated_at timestamp
DELIMITER $$

CREATE TRIGGER users_update_timestamp 
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER admins_update_timestamp 
BEFORE UPDATE ON admins
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DELIMITER ;

-- ============================================
-- GRANT PERMISSIONS (For security)
-- ============================================

-- Create application user with limited permissions
CREATE USER 'vedralearn_app'@'%' IDENTIFIED BY 'app_password_here';
GRANT SELECT, INSERT, UPDATE, DELETE ON vedralearn_admin.* TO 'vedralearn_app'@'%';

-- Create read-only user for reporting
CREATE USER 'vedralearn_reporter'@'%' IDENTIFIED BY 'reporter_password_here';
GRANT SELECT ON vedralearn_admin.* TO 'vedralearn_reporter'@'%';

FLUSH PRIVILEGES;

-- ============================================
-- QUERIES FOR COMMON OPERATIONS
-- ============================================

-- Get user count by program
-- SELECT program, COUNT(*) as count FROM users GROUP BY program;

-- Get user count by status
-- SELECT status, COUNT(*) as count FROM users GROUP BY status;

-- Get recent activities
-- SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 100;

-- Get user progress summary
-- SELECT u.name, p.name as program, up.progress_percentage FROM users u 
-- JOIN user_progress up ON u.id = up.user_id 
-- JOIN programs p ON up.program_id = p.id;

-- ============================================
-- BACKUP RECOMMENDATIONS FOR AWS
-- ============================================
-- 1. Enable automated backups in AWS RDS (daily, 7-day retention)
-- 2. Enable Multi-AZ deployment for high availability
-- 3. Set up CloudWatch alarms for database performance
-- 4. Use AWS Secrets Manager to store credentials
-- 5. Enable enhanced monitoring with Performance Insights
