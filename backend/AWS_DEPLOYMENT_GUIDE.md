# AWS Deployment Guide for VedraLearn Admin Backend

## Overview
This guide provides step-by-step instructions to deploy the VedraLearn Admin Backend on AWS.

## Prerequisites
- AWS Account (with billing enabled)
- AWS CLI installed locally: https://aws.amazon.com/cli/
- Node.js 14+ installed locally
- Git installed
- Domain name (optional, for custom domain)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       AWS Cloud                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐          ┌──────────────────────────┐   │
│  │   CloudFront     │          │   Elastic Load Balancer  │   │
│  │   (Static)       │          │   (API Traffic)          │   │
│  └────────┬─────────┘          └──────────┬───────────────┘   │
│           │                               │                    │
│           ▼                               ▼                    │
│  ┌──────────────────┐          ┌──────────────────────────┐   │
│  │  S3 Bucket       │          │  EC2 Instance(s)         │   │
│  │  (Frontend)      │          │  - Node.js/Express       │   │
│  │  - index.html    │          │  - Admin API             │   │
│  │  - css/          │          └──────────┬───────────────┘   │
│  │  - js/           │                     │                    │
│  └──────────────────┘          ┌──────────▼───────────────┐   │
│                                │  RDS Database            │   │
│                                │  - MySQL 8.0             │   │
│                                │  - Multi-AZ Ready        │   │
│                                └──────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1: AWS Account Setup

### 1.1 Create IAM User
1. Go to AWS Console → IAM → Users → Create User
2. Username: `vedralearn-deployment`
3. Attach policies:
   - `AmazonEC2FullAccess`
   - `AmazonRDSFullAccess`
   - `AmazonS3FullAccess`
   - `IAMFullAccess`
4. Create access keys and save them securely

### 1.2 Configure AWS CLI
```bash
aws configure
# Enter Access Key ID
# Enter Secret Access Key
# Default region: us-east-1
# Default output format: json
```

---

## Step 2: Create RDS Database

### 2.1 Create Database Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier vedralearn-admin-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --engine-version 8.0.33 \
  --master-username admin \
  --master-user-password YourStrongPassword123! \
  --allocated-storage 20 \
  --publicly-accessible true \
  --backup-retention-period 7 \
  --multi-az \
  --storage-encrypted
```

### 2.2 Get Database Endpoint
```bash
aws rds describe-db-instances \
  --db-instance-identifier vedralearn-admin-db \
  --query 'DBInstances[0].Endpoint'
```

### 2.3 Create Database and Setup
```bash
# Connect to database (after it's ready)
mysql -h your-endpoint.rds.amazonaws.com -u admin -p

# Execute the DATABASE_SCHEMA.sql file
source /path/to/DATABASE_SCHEMA.sql
```

---

## Step 3: Launch EC2 Instance

### 3.1 Create Security Group
```bash
aws ec2 create-security-group \
  --group-name vedralearn-api-sg \
  --description "Security group for VedraLearn API"

# Add inbound rules
aws ec2 authorize-security-group-ingress \
  --group-name vedralearn-api-sg \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name vedralearn-api-sg \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name vedralearn-api-sg \
  --protocol tcp \
  --port 5000 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name vedralearn-api-sg \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0
```

### 3.2 Launch Instance
```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --count 1 \
  --instance-type t2.micro \
  --key-name my-key-pair \
  --security-groups vedralearn-api-sg \
  --user-data file://user-data.sh
```

Note: Create key pair first:
```bash
aws ec2 create-key-pair \
  --key-name my-key-pair \
  --query 'KeyMaterial' \
  --output text > my-key-pair.pem
chmod 400 my-key-pair.pem
```

### 3.3 Get Instance Details
```bash
aws ec2 describe-instances \
  --filters "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].PublicIpAddress'
```

---

## Step 4: Deploy Backend on EC2

### 4.1 SSH into Instance
```bash
ssh -i my-key-pair.pem ec2-user@your-public-ip
```

### 4.2 Install Dependencies
```bash
# Update system
sudo yum update -y

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Git
sudo yum install -y git

# Verify installations
node --version
npm --version
```

### 4.3 Clone Repository
```bash
git clone https://github.com/yourusername/vedralearn-website.git
cd vedralearn-website/backend
```

### 4.4 Install Dependencies
```bash
npm install
```

### 4.5 Configure Environment
```bash
sudo nano .env
```

Add/Update:
```
PORT=5000
NODE_ENV=production
JWT_SECRET=your_super_secret_key_here
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=3306
DB_USER=vedralearn_app
DB_PASSWORD=app_password_here
DB_NAME=vedralearn_admin
AWS_REGION=us-east-1
```

### 4.6 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2

# Start application
pm2 start server.js --name "vedralearn-api"

# Make it persistent
pm2 startup
pm2 save
```

---

## Step 5: Setup Nginx Reverse Proxy

### 5.1 Install Nginx
```bash
sudo yum install -y nginx
```

### 5.2 Configure Nginx
```bash
sudo nano /etc/nginx/nginx.conf
```

Add server block:
```nginx
server {
    listen 80;
    server_name your-domain.com;

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

### 5.3 Enable Nginx
```bash
sudo systemctl enable nginx
sudo systemctl restart nginx
```

---

## Step 6: Setup SSL Certificate (CloudFront + ACM)

### 6.1 Request Certificate
```bash
aws acm request-certificate \
  --domain-name your-domain.com \
  --subject-alternative-names www.your-domain.com
```

### 6.2 Validate Certificate
- Check email and approve certificate request

---

## Step 7: Deploy Frontend on S3

### 7.1 Create S3 Bucket
```bash
aws s3 mb s3://vedralearn-frontend-prod
```

### 7.2 Upload Files
```bash
cd /path/to/vedralearn-website

aws s3 sync . s3://vedralearn-frontend-prod \
  --region us-east-1 \
  --exclude "backend/*"
```

### 7.3 Configure S3 for Website
```bash
aws s3 website s3://vedralearn-frontend-prod \
  --index-document index.html \
  --error-document index.html
```

---

## Step 8: Update Frontend API Endpoints

In your HTML files, update API calls:

```javascript
const API_BASE = 'https://api.your-domain.com';

// Example
fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
});
```

---

## Step 9: Monitoring and Logs

### 9.1 CloudWatch Monitoring
```bash
# View application logs
pm2 logs vedralearn-api

# Setup CloudWatch agent
sudo yum install -y amazon-cloudwatch-agent
```

### 9.2 Set Alarms
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name vedralearn-api-cpu \
  --alarm-description "Alert if API CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

---

## Step 10: Database Backups

### 10.1 Automatic Backups (Already enabled)
```bash
aws rds modify-db-instance \
  --db-instance-identifier vedralearn-admin-db \
  --backup-retention-period 30 \
  --apply-immediately
```

### 10.2 Manual Snapshot
```bash
aws rds create-db-snapshot \
  --db-instance-identifier vedralearn-admin-db \
  --db-snapshot-identifier vedralearn-snapshot-$(date +%Y%m%d)
```

---

## Troubleshooting

### Connection Issues
```bash
# Test database connection
telnet your-endpoint.rds.amazonaws.com 3306

# Check EC2 security group
aws ec2 describe-security-groups --group-names vedralearn-api-sg
```

### API Not Responding
```bash
# SSH to instance
ssh -i my-key-pair.pem ec2-user@your-public-ip

# Check PM2 status
pm2 status

# Restart application
pm2 restart vedralearn-api

# View logs
pm2 logs vedralearn-api --lines 100
```

### Database Connection Error
1. Verify credentials in `.env`
2. Check RDS endpoint is correct
3. Confirm security group allows inbound on port 3306
4. Check VPC settings

---

## Performance Optimization

### 1. AWS CloudFront CDN
```bash
# Create CloudFront distribution for frontend
aws cloudfront create-distribution \
  --origin-domain-name vedralearn-frontend-prod.s3.amazonaws.com
```

### 2. Auto Scaling
```bash
# Create Auto Scaling Group for API
aws autoscaling create-launch-configuration \
  --launch-configuration-name vedralearn-api-lc \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro
```

### 3. RDS Performance Insights
```bash
aws rds modify-db-instance \
  --db-instance-identifier vedralearn-admin-db \
  --enable-performance-insights \
  --performance-insights-retention-period 7
```

---

## Estimated Monthly Costs

| Service | Instance | Cost/Month |
|---------|----------|-----------|
| EC2 | t2.micro | $8-10 |
| RDS | db.t3.micro | $15-20 |
| S3 | < 1GB | < $1 |
| Data Transfer | 100GB | $10-15 |
| **Total** | | **~$35-50** |

---

## Security Best Practices

1. ✅ Use IAM roles instead of access keys
2. ✅ Enable VPC with private subnets for database
3. ✅ Use AWS Secrets Manager for credentials
4. ✅ Enable encryption for RDS (TLS)
5. ✅ Use AWS WAF for DDoS protection
6. ✅ Enable CloudTrail for audit logs
7. ✅ Rotate credentials regularly
8. ✅ Use environment-specific API keys

---

## Scaling Strategy

**Phase 1: Development**
- Single t2.micro EC2 instance
- Single RDS instance

**Phase 2: Production (Low Traffic)**
- Load Balancer with 2 t2.small EC2 instances
- RDS Multi-AZ deployment

**Phase 3: Production (High Traffic)**
- Auto Scaling Group (2-10 instances)
- RDS read replicas
- ElastiCache for caching

---

## Support & Resources

- AWS Documentation: https://docs.aws.amazon.com/
- Node.js AWS SDK: https://aws.amazon.com/sdk-for-node-js/
- EC2 Best Practices: https://docs.aws.amazon.com/ec2/
- RDS Best Practices: https://docs.aws.amazon.com/rds/

---

**Last Updated:** 2026-03-30
**Maintained By:** VedraLearn Technologies
