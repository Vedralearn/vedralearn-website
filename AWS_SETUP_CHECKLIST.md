# VedraLearn AWS Deployment Checklist ✅

**Quick reference for AWS setup - Copy and track your progress**

---

## 📋 Pre-Setup (Day 1)

- [ ] Create AWS account at https://aws.amazon.com/
- [ ] Add payment method (won't charge on free tier)
- [ ] Generate Access Keys in IAM
- [ ] Save Access Keys to secure location
- [ ] Install AWS CLI on Windows
- [ ] Run `aws configure` and enter your credentials
- [ ] Test: `aws sts get-caller-identity`

---

## 🗄️ Database Setup (30 mins)

**AWS Console → RDS**

- [ ] Click "Create database"
- [ ] Select MySQL
- [ ] Select Free tier eligible
- [ ] DB instance name: `vedralearn-admin-db`
- [ ] Master username: `admin`
- [ ] Master password: `YourStrongPassword123!`
- [ ] Storage: 20 GB
- [ ] Publicly accessible: **YES**
- [ ] Multi-AZ: **NO**
- [ ] Backup retention: 7 days
- [ ] Click "Create database"
- [ ] ⏳ Wait 5-10 minutes for status "Available"

**Copy Database Endpoint:**
- [ ] Get endpoint from RDS console
- [ ] Update `.env` file with endpoint
- [ ] Update `.env` with username/password

**Setup Schema:**
- [ ] Install MySQL client on Windows
- [ ] Connect: `mysql -h endpoint -u admin -p`
- [ ] Create database: `CREATE DATABASE vedralearn_admin;`
- [ ] Import schema: `mysql -h endpoint -u admin -p vedralearn_admin < DATABASE_SCHEMA.sql`

---

## 🖥️ EC2 Server Setup (45 mins)

**AWS Console → EC2**

### Security Group
- [ ] Create security group: `vedralearn-api-sg`
- [ ] Add SSH rule: Port 22 (from your IP)
- [ ] Add HTTP rule: Port 80 (0.0.0.0/0)
- [ ] Add Custom TCP rule: Port 5000 (0.0.0.0/0)

### Key Pair
- [ ] Create key pair: `vedralearn-key`
- [ ] Download and save `vedralearn-key.pem`
- [ ] Store safely (don't lose it!)

### Launch Instance
- [ ] Launch new instance
- [ ] Choose Amazon Linux 2 AMI
- [ ] Instance type: t2.micro (free tier)
- [ ] Security group: vedralearn-api-sg
- [ ] Select key pair: vedralearn-key
- [ ] Click "Launch instances"
- [ ] ⏳ Wait 2-3 minutes for "Running" status

### Get Public IP
- [ ] Copy Public IPv4 address from EC2 console
- [ ] Save it (you'll use it many times!)

---

## 🚀 Deploy Code to EC2 (30 mins)

**From Windows PowerShell:**

```powershell
# SSH into EC2
ssh -i vedralearn-key.pem ec2-user@YOUR-EC2-IP
```

**On EC2 Terminal:**

- [ ] Update system: `sudo yum update -y`
- [ ] Install Node.js:
  ```bash
  curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
  sudo yum install -y nodejs
  ```
- [ ] Install Git: `sudo yum install -y git`
- [ ] Clone repo: `git clone https://github.com/yourusername/vedralearn-website.git`
- [ ] Enter backend: `cd vedralearn-website/backend`
- [ ] Install packages: `npm install`
- [ ] Edit .env:
  ```bash
  sudo nano .env
  ```
- [ ] Update these values in .env:
  - `NODE_ENV=production`
  - `DB_HOST=your-rds-endpoint`
  - `DB_USER=admin`
  - `DB_PASSWORD=YourStrongPassword123!`
  - `DB_NAME=vedralearn_admin`
  - `CORS_ORIGIN=http://YOUR-EC2-IP`
- [ ] Save: Ctrl+X, Y, Enter
- [ ] Install PM2: `sudo npm install -g pm2`
- [ ] Start server: `pm2 start server.js --name "vedralearn-api"`
- [ ] Make persistent: `pm2 startup` then `pm2 save`

---

## 🧪 Test Backend (15 mins)

**From Windows PowerShell:**

- [ ] Test health: `curl http://YOUR-EC2-IP:5000/api/health`
- [ ] Should return: `{"status":"OK",...}`
- [ ] Test login:
  ```powershell
  $url = "http://YOUR-EC2-IP:5000/api/admin/login"
  $body = '{"email":"admin@vedralearn.com","password":"admin123"}'
  Invoke-WebRequest -Uri $url -Method POST -Body $body -ContentType "application/json"
  ```
- [ ] Should return token starting with `eyJ...`

---

## 🎨 Update Frontend (15 mins)

**On Your Windows Machine:**

### admin-login.html
- [ ] Open file
- [ ] Find: `fetch('/api/admin/login'`
- [ ] Change to: `fetch('http://YOUR-EC2-IP:5000/api/admin/login'`

### admin-dashboard.html
- [ ] Open file
- [ ] Find: `fetch('/api/users'`
- [ ] Change to: `fetch('http://YOUR-EC2-IP:5000/api/users'`
- [ ] Find all other API calls and update endpoint
- [ ] Or create constant: `const API_BASE = 'http://YOUR-EC2-IP:5000'`

---

## ✨ Final Testing (10 mins)

- [ ] Open `http://YOUR-EC2-IP/admin-login.html`
- [ ] Login: admin@vedralearn.com / admin123
- [ ] Dashboard should load ✅
- [ ] Try adding a user
- [ ] Check it appears in table ✅
- [ ] Check RDS database for new user:
  ```bash
  mysql -h endpoint -u admin -p vedralearn_admin
  SELECT * FROM users;
  ```

---

## 🔐 Security Hardening (Optional but Recommended)

- [ ] Change default admin password immediately
- [ ] Setup SSL/HTTPS certificate (Let's Encrypt - FREE)
- [ ] Restrict SSH to your IP only (not 0.0.0.0/0)
- [ ] Enable RDS backups and snapshots
- [ ] Enable CloudTrail logging
- [ ] Setup CloudWatch monitoring

---

## 📞 Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| Can't SSH to EC2 | Check security group allows SSH (port 22) |
| API not responding | SSH to EC2, run `pm2 logs vedralearn-api` |
| Database connection error | Check RDS endpoint in .env matches exactly |
| CORS error in browser | Update CORS_ORIGIN in .env to match your IP |
| Can't find EC2 public IP | AWS Console → EC2 → Select instance → Copy from details |

---

## 💾 Important Credentials to Save

```
AWS Account ID: ________________
Access Key ID: ________________
Secret Access Key: ________________

RDS Endpoint: ________________
RDS Username: admin
RDS Password: ________________

EC2 Public IP: ________________
EC2 Key Pair: vedralearn-key.pem (location: ________________)

JWT Secret: vedralearn_aws_production_secret_key_change_this_12345
```

---

## 📊 Cost Tracking

- [ ] Monthly EC2 cost: $8-10
- [ ] Monthly RDS cost: $15-20
- [ ] Total: ~$25-30/month (or $0 for first 12 months with free tier!)

---

## 🎯 Next Phase Features

After basic setup works:
- [ ] Setup domain name
- [ ] Get SSL certificate (Let's Encrypt)
- [ ] Setup CloudFront CDN
- [ ] Setup auto-scaling
- [ ] Setup load balancer
- [ ] Enable enhanced monitoring

---

## 📞 Emergency Contacts

- AWS Support: https://console.aws.amazon.com/support/
- EC2 Documentation: https://docs.aws.amazon.com/ec2/
- RDS Documentation: https://docs.aws.amazon.com/rds/
- Node.js Documentation: https://nodejs.org/docs/

---

## ✅ All Done?

Once all checkboxes are complete:
1. Your system is running on AWS ✅
2. Database is secure in RDS ✅
3. API is live at `http://YOUR-EC2-IP:5000` ✅
4. Frontend connects to AWS backend ✅
5. Ready for production users! 🚀

---

**Estimated Total Time: 2-3 hours**

Start with "Pre-Setup" and work down!

Good luck! 🎉
