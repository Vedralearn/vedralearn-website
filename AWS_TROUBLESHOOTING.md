# AWS Deployment Troubleshooting Guide

**Common issues and solutions when deploying VedraLearn to AWS**

---

## 🔗 Connection Issues

### Problem: "Connection refused" when accessing API

**Symptoms:**
- Browser shows: `ERR_CONNECTION_REFUSED`
- `curl http://EC2-IP:5000/api/health` fails

**Solutions:**

1. **Check EC2 Security Group**
   ```powershell
   # Verify port 5000 is open in security group
   # AWS Console → EC2 → Security Groups → vedralearn-api-sg
   # Should have rule: Port 5000, Source: 0.0.0.0/0
   ```

2. **Check if Node process is running**
   ```bash
   # SSH into EC2
   ssh -i key.pem ec2-user@YOUR-EC2-IP
   
   # Check PM2 status
   pm2 status
   pm2 logs vedralearn-api
   ```

3. **Verify EC2 Public IP is correct**
   ```powershell
   # AWS Console → EC2 → Instances
   # Copy actual Public IPv4 address (not DNS name)
   ```

4. **Check network connectivity**
   ```powershell
   # From Windows, ping EC2 (may be blocked)
   ping YOUR-EC2-IP
   
   # Try tracert
   tracert YOUR-EC2-IP
   ```

---

## 🔐 Authentication Issues

### Problem: "Unauthorized" or "401" error

**Symptoms:**
- Login fails with "Invalid credentials"
- API returns `{"error": "Unauthorized"}`

**Solutions:**

1. **Verify credentials are correct**
   ```
   Email: admin@vedralearn.com (not admin@vedralearn.online)
   Password: admin123 (not yash@1234)
   ```

2. **Check JWT_SECRET in .env**
   ```bash
   # SSH into EC2
   ssh -i key.pem ec2-user@YOUR-EC2-IP
   
   # View .env
   cat ~/projects/vedralearn/vedralearn-website/backend/.env
   
   # JWT_SECRET should be set
   ```

3. **Test login directly with curl**
   ```powershell
   $body = @{
       email = "admin@vedralearn.com"
       password = "admin123"
   } | ConvertTo-Json
   
   Invoke-RestMethod -Uri "http://YOUR-EC2-IP:5000/api/admin/login" `
                     -Method POST `
                     -Body $body `
                     -ContentType "application/json" `
                     -Verbose
   
   # Should return: { "token": "eyJ...", "user": {...} }
   ```

4. **Check database has demo user**
   ```bash
   # SSH into EC2
   # Connect to RDS
   mysql -h your-rds-endpoint -u admin -p vedralearn_admin
   
   # Check if admin exists
   SELECT * FROM users WHERE email='admin@vedralearn.com';
   
   # If empty, insert demo user:
   INSERT INTO users (email, password, name, role, status)
   VALUES ('admin@vedralearn.com', 'admin123', 'Admin', 'admin', 'active');
   ```

---

## 🗄️ Database Connection Issues

### Problem: "Cannot connect to database" or "ECONNREFUSED"

**Symptoms:**
- Backend won't start: `Error: connect ECONNREFUSED`
- In logs: `Client does not support authentication protocol`

**Solutions:**

1. **Verify RDS endpoint in .env**
   ```bash
   # SSH to EC2
   cat ~/projects/vedralearn/vedralearn-website/backend/.env | grep DB_HOST
   
   # Should show: DB_HOST=your-db-instance-id.c12345.us-east-1.rds.amazonaws.com
   
   # Correct format - do NOT include :3306
   # ✅ CORRECT: your-db-instance-id.c12345.us-east-1.rds.amazonaws.com
   # ❌ WRONG: your-db-instance-id.c12345.us-east-1.rds.amazonaws.com:3306
   ```

2. **Test RDS connection from EC2**
   ```bash
   # SSH to EC2 and test connection
   mysql -h your-db-instance-id.c12345.us-east-1.rds.amazonaws.com \
         -u admin -p vedralearn_admin
   
   # If fails: "Access denied"
   # Check .env password matches RDS password
   ```

3. **Verify RDS security group**
   ```
   AWS Console → RDS → Databases → vedralearn-admin-db
   → Connectivity & security → Security groups
   
   Should have inbound rule:
   - MySQL/Aurora, Port 3306
   - Source: EC2 security group (vedralearn-api-sg)
   ```

4. **Check RDS is publicly accessible**
   ```
   AWS Console → RDS → vedralearn-admin-db
   → Connectivity & security
   
   "Publicly accessible" should be: YES
   ```

5. **Restart Node app**
   ```bash
   pm2 restart vedralearn-api
   pm2 logs vedralearn-api
   ```

---

## 📊 Database Schema Issues

### Problem: "Table doesn't exist" or "Unknown column"

**Symptoms:**
- Dashboard shows error: `Relation 'users' does not exist`
- In logs: `ER_NO_REFERENCED_COLUMN`

**Solutions:**

1. **Verify schema was imported**
   ```bash
   # Connect to RDS
   mysql -h your-rds-endpoint -u admin -p vedralearn_admin
   
   # List all tables
   SHOW TABLES;
   
   # Should show: users, admins, programs, activity_log, etc.
   ```

2. **Reimport schema if missing**
   ```bash
   # On EC2
   mysql -h your-rds-endpoint \
         -u admin -p vedralearn_admin < ~/projects/vedralearn/vedralearn-website/backend/DATABASE_SCHEMA.sql
   
   # Verify
   SHOW TABLES;
   ```

3. **Check for SQL errors**
   ```bash
   # Import with error output
   mysql -h your-rds-endpoint -u admin -p vedralearn_admin \
         --show-warnings < DATABASE_SCHEMA.sql 2>&1 | grep ERROR
   ```

---

## 🌐 CORS Issues

### Problem: Frontend shows "CORS error" in console

**Symptoms:**
- Browser console: `Access to XMLHttpRequest... blocked by CORS policy`
- Network tab shows errors from `/api/` endpoints

**Solutions:**

1. **Check CORS_ORIGIN in .env**
   ```bash
   # View .env
   cat ~/projects/vedralearn/vedralearn-website/backend/.env | grep CORS
   
   # Should match your frontend URL
   # For AWS: http://YOUR-EC2-IP or http://YOUR-DOMAIN
   ```

2. **Update .env if needed**
   ```bash
   # SSH to EC2
   sudo nano ~/projects/vedralearn/vedralearn-website/backend/.env
   
   # Change CORS_ORIGIN line
   # OLD: CORS_ORIGIN=http://localhost
   # NEW: CORS_ORIGIN=http://YOUR-EC2-IP
   
   # Save and restart
   pm2 restart vedralearn-api
   ```

3. **Verify server.js has CORS enabled**
   ```bash
   # Check server.js for CORS middleware
   grep -n "cors" ~/projects/vedralearn/vedralearn-website/backend/server.js
   
   # Should show: const cors = require('cors');
   ```

4. **Test with all origins (temporary for debugging)**
   ```bash
   # Edit server.js temporarily
   nano ~/projects/vedralearn/vedralearn-website/backend/server.js
   
   # Find: app.use(cors({ origin: process.env.CORS_ORIGIN }));
   # Change to: app.use(cors()); // Allow all
   
   # Restart
   pm2 restart vedralearn-api
   
   # If this fixes it, the issue is CORS_ORIGIN value
   # Revert this change and fix CORS_ORIGIN in .env
   ```

---

## 📁 File Issues

### Problem: Files not found or "Module not found"

**Symptoms:**
- Node startup fails: `Error: ENOENT: no such file or directory`
- In logs: `Cannot find module 'express'`

**Solutions:**

1. **Check Node modules installed**
   ```bash
   # SSH to EC2 and navigate to backend
   cd ~/projects/vedralearn/vedralearn-website/backend
   
   # List installed packages
   npm list --depth=0
   
   # If missing, reinstall
   npm install
   ```

2. **Verify package.json exists**
   ```bash
   # Check file exists
   ls -la ~/projects/vedralearn/vedralearn-website/backend/package.json
   
   # View contents
   cat ~/projects/vedralearn/vedralearn-website/backend/package.json
   ```

3. **Check .env file exists**
   ```bash
   # Should exist at backend/.env
   ls -la ~/projects/vedralearn/vedralearn-website/backend/.env
   
   # If missing, create it
   cp ~/projects/vedralearn/vedralearn-website/backend/.env.example \
      ~/projects/vedralearn/vedralearn-website/backend/.env
   ```

---

## 💾 Memory Issues

### Problem: Node process crashes or "out of memory"

**Symptoms:**
- App crashes after running for a while
- PM2 shows process exited with code 137 or 134
- In logs: `FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed`

**Solutions:**

1. **Check available memory**
   ```bash
   # SSH to EC2
   free -h
   
   # If low, may need larger instance:
   # t2.micro = 1 GB
   # t2.small = 2 GB
   # t2.medium = 4 GB
   ```

2. **Set Node memory limit**
   ```bash
   # Edit PM2 startup
   nano ~/projects/vedralearn/vedralearn-website/backend/ecosystem.config.js
   
   # Create file with:
   module.exports = {
     apps: [{
       name: 'vedralearn-api',
       script: './server.js',
       max_memory_restart: '200M',
       instances: 1,
     }]
   };
   
   # Then start with:
   pm2 start ecosystem.config.js
   ```

3. **Monitor memory usage**
   ```bash
   pm2 monit
   ```

---

## 📱 API Endpoint Issues

### Problem: Specific endpoint returns 404 or 500

**Symptoms:**
- `/api/users` works but `/api/users/5` returns 404
- POST request returns 500 status

**Solutions:**

1. **Test endpoint with curl**
   ```powershell
   # Get all users
   curl http://YOUR-EC2-IP:5000/api/users -H "Authorization: Bearer $token"
   
   # Get specific user (replace 1 with actual ID)
   curl http://YOUR-EC2-IP:5000/api/users/1 -H "Authorization: Bearer $token"
   
   # Check response status and body
   ```

2. **Check server logs**
   ```bash
   pm2 logs vedralearn-api --lines 50
   ```

3. **Verify endpoint exists in server.js**
   ```bash
   # Search for endpoint
   grep -n "app.get.*users" ~/projects/vedralearn/vedralearn-website/backend/server.js
   grep -n "app.post.*users" ~/projects/vedralearn/vedralearn-website/backend/server.js
   ```

4. **Check request format**
   ```powershell
   # For POST: must include body
   $body = @{ name = "Test"; email = "test@test.com" } | ConvertTo-Json
   
   # For DELETE: must include Authorization header
   curl -X DELETE http://YOUR-EC2-IP:5000/api/users/1 `
        -H "Authorization: Bearer $token"
   ```

---

## 🔄 Restart & Recovery

### Node process won't start

**Symptoms:**
- PM2 shows "stopped" or "errored"
- Restart doesn't help

**Solutions:**

1. **Check what's preventing startup**
   ```bash
   # Stop PM2
   pm2 stop vedralearn-api
   
   # Try running directly to see error
   cd ~/projects/vedralearn/vedralearn-website/backend
   node server.js
   
   # Will show exact error
   ```

2. **Check syntax errors**
   ```bash
   # Validate Node syntax
   node -c server.js
   ```

3. **Restart PM2 daemon**
   ```bash
   pm2 kill
   pm2 start server.js --name "vedralearn-api"
   pm2 startup
   pm2 save
   ```

---

## 🌐 DNS & Domain Issues

### Problem: Domain not resolving to EC2

**Symptoms:**
- `yourdomain.com` doesn't reach your API
- Browser shows "Can't reach server"

**Solutions:**

1. **Use Route53 (AWS DNS)**
   ```
   AWS Console → Route 53 → Hosted Zones → your-domain.com
   → Create record
   - Name: api
   - Type: A
   - Value: YOUR-EC2-PUBLIC-IP
   - TTL: 300
   ```

2. **Update nameservers at domain registrar**
   ```
   Point your domain registrar's nameservers to Route53's:
   (shown in Route53 NS record)
   ```

3. **Test DNS resolution**
   ```powershell
   nslookup api.yourdomain.com
   # Should return: YOUR-EC2-PUBLIC-IP
   ```

---

## 🆘 Emergency Commands

```bash
# Force stop everything
pm2 kill
pkill -f node
pkill -f nodejs

# Hard restart EC2 instance
# AWS Console → EC2 → Instances → Reboot instance

# Emergency backup to S3
aws s3 cp vedralearn-website s3://vedralearn-backup/ --recursive

# View all system processes
ps aux | grep node
ps aux | grep nodejs

# Restart Nginx if using it
sudo systemctl restart nginx
sudo systemctl status nginx

# Clear PM2 logs (if taking too much space)
pm2 delete all
pm2 start server.js --name "vedralearn-api"
```

---

## 📞 Need More Help?

- **Node.js errors**: https://nodejs.org/en/docs/
- **Express.js**: https://expressjs.com/
- **MySQL errors**: https://dev.mysql.com/doc/
- **AWS Support**: https://console.aws.amazon.com/support/
- **PM2 Docs**: https://pm2.keymetrics.io/

---

## ✅ Quick Verification Checklist

After troubleshooting, verify everything works:

```bash
# 1. EC2 server is running
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]' --output table

# 2. Node process is running
ssh -i key.pem ec2-user@YOUR-EC2-IP
pm2 status

# 3. Database is accessible
mysql -h endpoint -u admin -p vedralearn_admin -e "SELECT VERSION();"

# 4. API responds
curl http://YOUR-EC2-IP:5000/api/health

# 5. Frontend connects
# Open http://YOUR-EC2-IP/admin-login.html in browser
# Login: admin@vedralearn.com / admin123
```

If all 5 pass: ✅ **Your system is working!**
