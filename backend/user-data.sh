#!/bin/bash
# VedraLearn Admin Backend - EC2 User Data Script
# This script automatically configures EC2 instances

set -e

echo "🚀 Starting VedraLearn Backend Setup on EC2..."

# Update system
sudo yum update -y
echo "✓ System updated"

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
echo "✓ Node.js installed: $(node --version)"

# Install Git
sudo yum install -y git
echo "✓ Git installed"

# Install Nginx
sudo yum install -y nginx
echo "✓ Nginx installed"

# Install PM2 globally
sudo npm install -g pm2
echo "✓ PM2 installed"

# Clone repository
cd /home/ec2-user
git clone https://github.com/yourusername/vedralearn-website.git
cd vedralearn-website/backend
echo "✓ Repository cloned"

# Install dependencies
npm install
echo "✓ Dependencies installed"

# Create .env file (Update with real values)
cat > .env << 'EOF'
PORT=5000
NODE_ENV=production
JWT_SECRET=your_super_secret_key_change_this_in_production
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=3306
DB_USER=vedralearn_app
DB_PASSWORD=app_password_here
DB_NAME=vedralearn_admin
AWS_REGION=us-east-1
CORS_ORIGIN=https://your-domain.com
EOF
echo "✓ Environment file created (UPDATE WITH REAL VALUES!)"

# Start application with PM2
pm2 start server.js --name "vedralearn-api" --instances max
pm2 startup
pm2 save
echo "✓ Application started with PM2"

# Configure Nginx as reverse proxy
sudo tee /etc/nginx/conf.d/vedralearn.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://localhost:5000/api/health;
    }
}
EOF

sudo systemctl enable nginx
sudo systemctl restart nginx
echo "✓ Nginx configured and started"

# Setup CloudWatch logs
sudo yum install -y amazon-cloudwatch-agent
echo "✓ CloudWatch agent installed"

# Create log directory
sudo mkdir -p /var/log/vedralearn-api
sudo chown ec2-user:ec2-user /var/log/vedralearn-api
echo "✓ Log directory created"

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📝 Important Next Steps:"
echo "1. Update .env file with real database credentials"
echo "2. Create and setup RDS database using DATABASE_SCHEMA.sql"
echo "3. Setup domain name and SSL certificate"
echo "4. Configure autoscaling and load balancer"
echo ""
echo "📊 Access your API at: http://$(ec2-metadata --public-ipv4 | cut -d ' ' -f 2)"
echo ""
echo "🔗 Check PM2 status: pm2 status"
echo "📋 View logs: pm2 logs vedralearn-api"
