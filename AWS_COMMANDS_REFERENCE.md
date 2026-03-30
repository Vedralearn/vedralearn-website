# AWS Deployment - Quick Command Reference

Copy and paste these commands in order. Replace placeholders with your values.

---

## 🔑 Prerequisites Setup (Run Once)

```powershell
# 1. Download AWS CLI installer
# Visit: https://awscli.amazonaws.com/AWSCLIV2.msi
# Run the installer and follow prompts

# 2. Verify installation
aws --version

# 3. Configure AWS credentials (get from IAM console)
aws configure
# When prompted:
# AWS Access Key ID: [paste your Access Key]
# AWS Secret Access Key: [paste your Secret Key]
# Default region name: us-east-1
# Default output format: json

# 4. Test configuration
aws sts get-caller-identity
```

---

## 🗄️ RDS Database Setup (AWS Console)

### Step 1: Create RDS Instance
```
AWS Console → RDS → Create Database
- Engine: MySQL
- Version: 8.0.latest
- Free tier eligible: YES
- DB instance class: db.t3.micro
- Storage: 20 GB
- DB instance name: vedralearn-admin-db
- Master username: admin
- Master password: YourStrongPassword123!
- Publicly accessible: YES
- Backup retention period: 7 days
CREATE DATABASE
```

### Step 2: Get Endpoint (from Connectivity & security tab)
```
Copy this and save for later:
your-db-instance-id.c12345.us-east-1.rds.amazonaws.com
```

### Step 3: Create Database via MySQL Client
```powershell
# Download MySQL Workbench or MySQL Command Line Client
# From: https://dev.mysql.com/downloads/mysql/

# Connect to RDS
mysql -h your-db-instance-id.c12345.us-east-1.rds.amazonaws.com -u admin -p
# Enter password when prompted

# Once connected, run in MySQL console:
CREATE DATABASE vedralearn_admin;
USE vedralearn_admin;

# Then import schema (run full DATABASE_SCHEMA.sql content)
# Or via command line:
```

```powershell
# Option: Import via command line (run in PowerShell, NOT in MySQL console)
mysql -h your-db-instance-id.c12345.us-east-1.rds.amazonaws.com `
      -u admin -p vedralearn_admin < .\backend\DATABASE_SCHEMA.sql
# Enter password when prompted
```

---

## 🖥️ EC2 Server Setup (AWS Console)

### Step 1: Create Security Group
```
AWS Console → EC2 → Security Groups → Create security group
- Name: vedralearn-api-sg
- Description: Security group for VedraLearn API
- VPC: default

Add inbound rules:
1. SSH - Port 22 - Source: YOUR-IP/32
2. HTTP - Port 80 - Source: 0.0.0.0/0
3. Custom TCP - Port 5000 - Source: 0.0.0.0/0
4. Custom TCP - Port 3000 - Source: 0.0.0.0/0 (optional, for PM2 Plus)

CREATE
```

### Step 2: Create Key Pair
```
AWS Console → EC2 → Key Pairs → Create key pair
- Name: vedralearn-key
- Key pair type: RSA
- Private key format: .pem
- CREATE

# Save vedralearn-key.pem to secure location, e.g.:
# C:\Users\YourName\.ssh\vedralearn-key.pem
```

### Step 3: Launch EC2 Instance
```
AWS Console → EC2 → Instances → Launch instances
- AMI: Amazon Linux 2 AMI (free tier eligible)
- Instance type: t2.micro (free tier)
- Network settings: default VPC
- Security group: vedralearn-api-sg (select from dropdown)
- Key pair: vedralearn-key
- Storage: 30 GB (gp2, default)

LAUNCH INSTANCE

# Copy Public IPv4 address from console for later
# Example: 54.123.45.67
```

---

## 🌍 Connect to EC2 (From Windows PowerShell)

```powershell
# Give key proper permissions (one time)
icacls "C:\Users\YourName\.ssh\vedralearn-key.pem" /inheritance:r /grant:r "$env:USERNAME`:(F)"

# Connect to your EC2 instance
# Replace 54.123.45.67 with your EC2 public IP
ssh -i C:\Users\YourName\.ssh\vedralearn-key.pem ec2-user@54.123.45.67

# Accept host key when prompted
# You're now inside your EC2 instance!
```

---

## 🚀 Setup Node.js on EC2

```bash
# Run these commands ON THE EC2 INSTANCE (after SSH connection)

# Update system
sudo yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Git
sudo yum install -y git

# Install Nginx (optional, for reverse proxy)
sudo amazon-linux-extras install -y nginx

# Verify installations
node --version
npm --version
git --version

# Create app directory
mkdir -p ~/projects/vedralearn
cd ~/projects/vedralearn
```

---

## 📥 Deploy Code to EC2

```bash
# Run these commands ON YOUR EC2 INSTANCE

# Clone your repository
git clone https://github.com/YOUR-USERNAME/vedralearn-website.git
cd vedralearn-website/backend

# Install dependencies
npm install

# Create .env file
sudo nano .env
```

**In nano editor, paste this (update values):**
```
# VedraLearn Admin System - Production Configuration
PORT=5000
NODE_ENV=production
JWT_SECRET=vedralearn_aws_production_secret_key_12345

# AWS RDS Configuration
DB_HOST=your-db-instance-id.c12345.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=YourStrongPassword123!
DB_NAME=vedralearn_admin
DB_SSL=true

# Server Configuration
AWS_REGION=us-east-1
CORS_ORIGIN=http://54.123.45.67:5000
LOG_LEVEL=info

# Security
BCRYPT_ROUNDS=10
SESSION_TIMEOUT=86400
```

**Save file:** Press `Ctrl+X`, then `Y`, then `Enter`

---

## ⚙️ Setup Process Manager (PM2)

```bash
# Still on EC2 instance

# Install PM2 globally
sudo npm install -g pm2

# Start the application
pm2 start server.js --name "vedralearn-api"

# Make it auto-restart on reboot
pm2 startup
# Copy and paste the command shown in output
pm2 save

# Check logs
pm2 logs vedralearn-api
# Press Ctrl+C to exit

# View process status
pm2 status
pm2 monit  # Real-time monitoring
```

---

## 🧪 Test Backend from Windows

```powershell
# Replace 54.123.45.67 with your EC2 IP

# Test 1: Health check
curl http://54.123.45.67:5000/api/health

# Test 2: Login attempt
$credentials = @{
    email = "admin@vedralearn.com"
    password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://54.123.45.67:5000/api/admin/login" `
                  -Method POST `
                  -Body $credentials `
                  -ContentType "application/json"

# Test 3: Get users (replace TOKEN with actual token from Test 2)
$token = "eyJhbGci..."  # Copy from Test 2 response

Invoke-RestMethod -Uri "http://54.123.45.67:5000/api/users" `
                  -Method GET `
                  -Headers @{ Authorization = "Bearer $token" }
```

---

## 🎨 Update Frontend for AWS

```powershell
# Run these commands ON YOUR WINDOWS MACHINE

# Open admin-login.html and find this line (around line 215):
# OLD: const response = await fetch('/api/health', { timeout: 2000 });
# NEW: const response = await fetch('http://54.123.45.67:5000/api/health', { timeout: 2000 });

# Open admin-login.html and find this line (around line 239):
# OLD: const response = await fetch('/api/admin/login', {
# NEW: const response = await fetch('http://54.123.45.67:5000/api/admin/login', {

# Open admin-dashboard.html and find all fetch calls:
# OLD: fetch('/api/users',
# NEW: fetch('http://54.123.45.67:5000/api/users',
# Do this for ALL /api/ calls

# ALTERNATIVE (Recommended): Use API config helper
# Add this line to admin-login.html <head>:
# <script src="/js/api-config.js"></script>

# Then in admin-login.html script, change:
# OLD: const response = await fetch(URL, options);
# NEW: const response = await API.fetch(API.url(URL), options);

# Update API_BASE in js/api-config.js:
# BASE: 'http://54.123.45.67:5000',
```

---

## ✅ Final System Test

```powershell
# Open browser and test the system
# URL: http://54.123.45.67/admin-login.html
# (or C:\path\to\vedralearn-website\admin-login.html if serving locally)

# Step 1: Login
Email: admin@vedralearn.com
Password: admin123

# Step 2: Should see dashboard with demo users
# Yellow "DEMO MODE" badge indicates fallback mode (backend not available)

# Step 3: Add a new user
# Click "+ Add User"
# Fill form and submit

# Step 4: Verify in database (from Windows)
$token = "eyJhbGci..."  # From login response
Invoke-RestMethod -Uri "http://54.123.45.67:5000/api/users" `
                  -Method GET `
                  -Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 10
```

---

## 🔒 Optional Security Setup

### Enable HTTPS with Let's Encrypt

```bash
# On EC2 instance
sudo yum install -y certbot python3-certbot-nginx

# Get certificate (stop app first)
pm2 stop vedralearn-api
sudo certbot certonly --standalone -d yourdomain.com
pm2 start vedralearn-api

# Auto-renew
sudo systemctl enable certbot-renew.timer
```

### Setup Nginx Reverse Proxy

```bash
# On EC2 instance
sudo nano /etc/nginx/conf.d/vedralearn.conf
```

**Paste this config:**
```nginx
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 🐛 Troubleshooting Quick Commands

```bash
# Check if Node process is running
pm2 status

# View error logs
pm2 logs vedralearn-api --lines 50

# Restart application
pm2 restart vedralearn-api

# Check database connection
mysql -h your-rds-endpoint -u admin -p

# Check open ports on EC2
sudo netstat -tlnp

# View system resources
free -h
df -h
top

# SSH into specific RDS instance
mysql -h your-rds-endpoint -u admin -pYourPassword vedralearn_admin
SHOW TABLES;
SELECT COUNT(*) FROM users;
```

---

## 📊 AWS Billing Check

```powershell
# View estimated charges (requires AWS CLI configured)
aws ce get-cost-and-usage `
  --time-period Start=2024-01-01,End=2024-01-31 `
  --granularity MONTHLY `
  --metrics BlendedCost
```

---

## 📝 Important Values to Save

```
AWS Region: us-east-1
EC2 Public IP: _______________
EC2 Public DNS: ec2-__.compute-1.amazonaws.com
RDS Endpoint: _______________
RDS Username: admin
RDS Database: vedralearn_admin
```

---

## ✨ You're Done! 🎉

Your VedraLearn system should now be:
- ✅ Running on AWS EC2
- ✅ Data stored in AWS RDS
- ✅ Accessible via http://YOUR-EC2-IP:5000
- ✅ Ready for production use

**Next steps:**
1. Setup custom domain (Route53)
2. Add SSL certificate (Let's Encrypt)
3. Setup CloudWatch monitoring
4. Configure backup strategy
5. Plan scaling strategy
