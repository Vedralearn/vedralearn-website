# VedraLearn Admin System - AWS Setup Guide (Windows)

**Complete step-by-step guide to deploy on AWS from Windows**

---

## 🎯 What You'll Create

1. **RDS Database** - MySQL in AWS cloud
2. **EC2 Server** - Node.js API running on AWS
3. **Static Frontend** - Files served from S3 (optional)
4. **Total Cost:** ~$35-50/month

---

## 📋 Prerequisites

- AWS Account ([Create Free](https://aws.amazon.com/))
- AWS CLI installed on Windows ([Download](https://aws.amazon.com/cli/))
- Node.js installed locally
- Git installed

---

## ⏱️ Total Setup Time

- With free tier: **30-45 minutes**
- First-time AWS users: **1-2 hours**

---

# STEP-BY-STEP SETUP

## ✅ STEP 1: Create AWS Account & Get Credentials

### 1.1 Create Account
1. Go to https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Fill in email and password
4. Enter payment info (FREE tier - won't charge)
5. Verify phone number

### 1.2 Get Access Keys
1. Login to AWS Console
2. Go to **IAM** → **Users** → Click your username
3. Click **Security credentials** tab
4. Click **Create access key**
5. **Download CSV file** (save it safely!)

You'll get:
- Access Key ID: `AKIA...`
- Secret Access Key: `wJalr...`

⚠️ **Keep these secret!**

---

## ✅ STEP 2: Configure AWS CLI on Windows

### 2.1 Open PowerShell & Configure

```powershell
# Install AWS CLI (if not already done)
# Download from: https://aws.amazon.com/cli/

# Configure AWS
aws configure

# It will ask for:
# AWS Access Key ID: [paste from CSV]
# AWS Secret Access Key: [paste from CSV]
# Default region: us-east-1
# Default output format: json
```

### 2.2 Verify Setup
```powershell
aws sts get-caller-identity
```

You should see your AWS account info ✅

---

## ✅ STEP 3: Create RDS Database (MySQL on AWS)

### 3.1 Create Database via AWS Console (Easy)

1. Go to **AWS Console** → **RDS**
2. Click **Create database**
3. Choose **MySQL**
4. Select **Free tier** (eligible for 12 months)
5. Fill in these settings:

```
DB instance identifier: vedralearn-admin-db
Master username: admin
Master password: YourStrongPassword123!
Storage: 20 GB
```

6. **Important Settings:**
   - Publicly accessible: **YES** (so EC2 can connect)
   - Multi-AZ: **NO** (for free tier)
   - Backup retention: 7 days

7. Click **Create database** and wait 5-10 minutes ⏳

### 3.2 Get Database Endpoint

1. Wait for status to show "Available" (green)
2. Click the database name
3. Copy the **Endpoint** (looks like: `vedralearn-admin-db.c12345abc.us-east-1.rds.amazonaws.com`)

**Update your `.env` file:**
```
DB_HOST=vedralearn-admin-db.c12345abc.us-east-1.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=YourStrongPassword123!
```

---

## ✅ STEP 4: Setup Database Schema

### 4.1 Connect to RDS from Windows

From PowerShell:

```powershell
# Install MySQL client
# Download from: https://dev.mysql.com/downloads/mysql/

# Test connection
mysql -h vedralearn-admin-db.c12345abc.us-east-1.rds.amazonaws.com -u admin -p

# Enter password when prompted
```

### 4.2 Create Database & Import Schema

```bash
# Login to MySQL (from step above)
mysql -h your-rds-endpoint.us-east-1.rds.amazonaws.com -u admin -p

# Then in MySQL prompt:
CREATE DATABASE vedralearn_admin;

# Exit MySQL
exit
```

### 4.3 Import Database Schema

```powershell
# From your local machine
mysql -h your-rds-endpoint.us-east-1.rds.amazonaws.com -u admin -p vedralearn_admin < C:\Users\YASH-1\OneDrive\Documents\vedralearn-website\backend\DATABASE_SCHEMA.sql

# Enter password when prompted
```

✅ **Database is ready!**

---

## ✅ STEP 5: Create EC2 Server (for Node.js API)

### 5.1 Launch EC2 Instance

1. Go to **AWS Console** → **EC2**
2. Click **Launch instances**
3. Choose **Amazon Linux 2 AMI** (free tier)
4. Instance type: **t2.micro** (free tier eligible)
5. Click **Next: Configure Instance Details**

### 5.2 Configure Security

1. Scroll to **Security group**
2. Create new security group: name it `vedralearn-api-sg`
3. Add these rules:

```
Type: SSH
Port: 22
Source: 0.0.0.0/0 (Your IP address)

Type: HTTP
Port: 80
Source: 0.0.0.0/0

Type: Custom TCP
Port: 5000
Source: 0.0.0.0/0
```

### 5.3 Create Key Pair

1. On the **Key pair** section
2. Click **Create new key pair**
3. Name it: `vedralearn-key`
4. Download and save it: `vedralearn-key.pem`

❌ **Don't lose this file!**

### 5.4 Launch

1. Click **Launch instances**
2. Wait 2-3 minutes for status to show "running" ✅

---

## ✅ STEP 6: Connect to EC2 & Setup Node.js

### 6.1 Get Public IP

1. Go to **EC2 Dashboard** → **Instances**
2. Select your instance
3. Copy **Public IPv4 address** (e.g., `18.234.56.78`)

### 6.2 Connect via SSH (PowerShell)

```powershell
# Navigate to where you saved the key
cd $HOME\Downloads

# Connect to server
ssh -i vedralearn-key.pem ec2-user@18.234.56.78

# Type 'yes' when asked about authenticity
```

You should see the EC2 terminal now! 🎉

### 6.3 Install Node.js & Dependencies

```bash
# Update system
sudo yum update -y

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Git
sudo yum install -y git

# Verify
node --version
npm --version
```

---

## ✅ STEP 7: Deploy Code to EC2

### 7.1 Clone Repository

```bash
# On EC2 terminal
cd home/ec2-user
git clone https://github.com/yourusername/vedralearn-website.git
cd vedralearn-website/backend
```

(Replace with your actual GitHub repo)

### 7.2 Install NPM Packages

```bash
npm install
```

### 7.3 Update `.env` File on EC2

```bash
# Edit .env
sudo nano .env
```

_Note: On EC2, nano is available!_

**Update these values:**
```
PORT=5000
NODE_ENV=production
JWT_SECRET=vedralearn_aws_production_secret_key_change_this_12345
DB_HOST=vedralearn-admin-db.c12345abc.us-east-1.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=YourStrongPassword123!
DB_NAME=vedralearn_admin
CORS_ORIGIN=http://18.234.56.78
```

Save: **Ctrl + X** → **Y** → **Enter**

---

## ✅ STEP 8: Start the Server

### 8.1 Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 8.2 Start Application

```bash
pm2 start server.js --name "vedralearn-api"
pm2 startup
pm2 save
```

### 8.3 View Logs

```bash
pm2 logs vedralearn-api
```

You should see:
```
🚀 VedraLearn Admin API running on http://localhost:5000
```

---

## ✅ STEP 9: Test Backend API

### 9.1 From Windows

```powershell
# Test that API is running
curl http://18.234.56.78:5000/api/health

# Should return:
# {"status":"OK","message":"VedraLearn Admin API is running"}
```

### 9.2 Test Login

```powershell
$url = "http://18.234.56.78:5000/api/admin/login"
$body = @{
    email = "admin@vedralearn.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri $url -Method POST -Body $body -ContentType "application/json"
$response.Content
```

Should return JWT token ✅

---

## ✅ STEP 10: Update Frontend to Connect to AWS

### 10.1 Update Login Page

Edit `admin-login.html` on your local machine:

```javascript
// Change from:
const response = await fetch('/api/admin/login', {

// To:
const response = await fetch('http://18.234.56.78:5000/api/admin/login', {
```

Or use environment variable:
```javascript
const API_URL = 'http://18.234.56.78:5000';
const response = await fetch(API_URL + '/api/admin/login', {
```

### 10.2 Update Dashboard

Same change in `admin-dashboard.html`:

```javascript
const API_BASE = 'http://18.234.56.78:5000';

// All API calls use: API_BASE + '/api/...'
fetch(API_BASE + '/api/users', {
```

---

## ✅ STEP 11: (Optional) Setup Nginx Reverse Proxy

### 11.1 Install Nginx

```bash
sudo yum install -y nginx
```

### 11.2 Configure

```bash
sudo nano /etc/nginx/conf.d/vedralearn.conf
```

Add:
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

### 11.3 Start Nginx

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

Now access via: `http://18.234.56.78` (without :5000)

---

## 🎯 FINAL TEST

### Test the Full System

1. Open browser
2. Go to `http://18.234.56.78/admin-login.html`
3. Login with:
   - Email: `admin@vedralearn.com`
   - Password: `admin123`
4. Dashboard should open ✅
5. Try adding a user - it should save to AWS RDS! ✅

---

## 📊 Architecture Diagram

```
Your Windows Computer
        ↓
   Browser
        ↓
AWS EC2 Instance (18.234.56.78)
  - Nginx (Port 80)
  - Node.js (Port 5000)
        ↓
AWS RDS Database
  - MySQL (Port 3306)
        ↓
vedralearn_admin database
```

---

## 🔗 Useful AWS Links

1. **RDS Console:** https://console.aws.amazon.com/rds/
2. **EC2 Console:** https://console.aws.amazon.com/ec2/
3. **IAM Console:** https://console.aws.amazon.com/iam/

---

## 💡 Useful Commands

### On Your Windows PC

```powershell
# SSH into EC2
ssh -i vedralearn-key.pem ec2-user@18.234.56.78

# Stop PM2 server
# (Still SSH'd into EC2)
pm2 stop vedralearn-api

# Restart PM2 server
pm2 restart vedralearn-api

# View logs
pm2 logs vedralearn-api

# Exit SSH
exit
```

---

## ⚠️ Common Issues

### "Cannot connect to RDS"
```bash
# Check security group allows port 3306
# Re-run: mysql -h your-endpoint...
# Verify credentials
```

### "API not responding"
```bash
# SSH into EC2
# Check if Node.js is running:
pm2 status

# Restart:
pm2 restart vedralearn-api

# View errors:
pm2 logs vedralearn-api
```

### "Port 5000 not accessible"
```bash
# Check EC2 security group allows port 5000
# AWS Console → Security Groups → vedralearn-api-sg
# Should have rule: TCP 5000 from 0.0.0.0/0
```

---

## 🔐 Security Best Practices

1. ✅ Change default admin password immediately
2. ✅ Use strong RDS password
3. ✅ Restrict SSH to your IP (not 0.0.0.0/0)
4. ✅ Enable RDS backups
5. ✅ Store credentials in AWS Secrets Manager (production)
6. ✅ Use HTTPS with SSL certificate

---

## 📈 Scaling Your System

### When you get more users:

1. **Upgrade EC2 instance type** (t2.small → t2.medium)
2. **Add Auto Scaling** (automatically add more servers)
3. **Setup Load Balancer** (distribute traffic)
4. **Enable RDS read replicas** (faster database)
5. **Use CloudFront CDN** (faster content delivery)

---

## 💰 Monthly Cost Estimate

| Service | Free Tier | After 1 Year |
|---------|-----------|-------------|
| EC2 | $0 (750 hrs/mo) | $8-10 |
| RDS | $0 | $15-20 |
| S3 | Minimal | < $1 |
| Data Transfer | Included | $10-15 |
| **Total** | **$0** | **$35-50** |

---

## 🎓 Next Steps

1. ✅ Create AWS account
2. ✅ Setup RDS database
3. ✅ Create EC2 instance
4. ✅ Deploy Node.js code
5. ✅ Test the system
6. ✅ Setup domain name (optional but recommended)
7. ✅ Enable SSL/HTTPS (Let's Encrypt - FREE)

---

## 🆘 Need Help?

### If something doesn't work:

1. Check the error message carefully
2. Review the troubleshooting section above
3. Check AWS Console logs
4. SSH into EC2 and check PM2 logs: `pm2 logs`
5. Contact AWS support

---

## 📞 Support Commands

```bash
# Into EC2, check everything:

# 1. Is Node.js running?
pm2 status

# 2. Can you reach database?
mysql -h your-endpoint.us-east-1.rds.amazonaws.com -u admin -p

# 3. View recent errors
pm2 logs vedralearn-api --lines 50

# 4. Check disk space
df -h

# 5. Check memory
free -h

# 6. Restart everything
pm2 restart vedralearn-api
```

---

**✅ You're all set!** Your VedraLearn Admin System is now running on AWS! 🎉

---

Last Updated: March 30, 2026
Version: 1.0.0
