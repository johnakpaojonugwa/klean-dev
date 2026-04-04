# Production Deployment Guide

This guide covers everything needed to deploy the Klean Backend to production.

---

## 📋 Pre-Deployment Checklist

### Code Quality
- ✅ All tests pass: `npm test`
- ✅ No console errors or warnings
- ✅ Environment variables properly configured
- ✅ .env file excluded from git (.gitignore)
- ✅ No hardcoded secrets in code

### Security
- ✅ HTTPS/SSL certificate obtained
- ✅ Rate limiting thresholds reviewed
- ✅ CORS origins properly configured
- ✅ Authentication middleware active
- ✅ Required external service credentials validated on startup
- ✅ Database credentials secure

### Database
- ✅ MongoDB backups configured
- ✅ Database indexes created
- ✅ Connection pooling configured
- ✅ Database user has minimal required permissions

### Monitoring
- ✅ Error tracking (Sentry) configured
- ✅ Logging strategy in place
- ✅ Health check endpoint tested
- ✅ CPU/Memory monitoring ready

---

## 🚀 Deployment Strategies

### Option 1: Node.js Direct (Recommended for Small-Medium Projects)

#### 1. Install Production Dependencies
```bash
npm install --production
# or
npm ci --production
```

#### 2. Use Process Manager (PM2)
```bash
# Install PM2 globally
npm install -g pm2

# Start app with PM2
pm2 start server.js --name "klean-backend" --env production

# Auto-restart on reboot
pm2 startup
pm2 save

# Monitor
pm2 monit
pm2 logs
```

#### 3. Environment Configuration
```bash
# Copy .env to server and update credentials
cp .env.example .env
# Edit .env with production values:
# - MONGO_URI (production database)
# - JWT_SECRET (strong random key)
# - SENTRY_DSN (error tracking)
# - TWILIO credentials
# - SendGrid API key
# - EMAIL_FROM (optional, defaults to noreply@klean.com)
```

#### 4. Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name api.klean.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.klean.com;
    
    ssl_certificate /etc/ssl/certs/klean.crt;
    ssl_certificate_key /etc/ssl/private/klean.key;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Option 2: Docker (Recommended for Enterprise)

#### 1. Create Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/v1/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "server.js"]
```

#### 2. Build and Run
```bash
# Build image
docker build -t klean-backend:1.0.0 .

# Run container
docker run -d \
  --name klean-backend \
  -p 5000:5000 \
  --env-file .env \
  -v /data/logs:/app/logs \
  klean-backend:1.0.0

# Push to registry (Docker Hub, AWS ECR, etc.)
docker tag klean-backend:1.0.0 your-registry/klean-backend:1.0.0
docker push your-registry/klean-backend:1.0.0
```

#### 3. Docker Compose (Multiple Services)
```yaml
version: '3.8'

services:
  app:
    image: klean-backend:1.0.0
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=${MONGO_URI}
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./logs:/app/logs
    depends_on:
      - mongo
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  mongo:
    image: mongo:7.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USER}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  mongo_data:
```

### Option 3: Cloud Platforms

#### AWS Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p "Node.js 20" klean-backend --region us-east-1

# Create environment
eb create production

# Deploy
eb deploy

# Monitor
eb logs
eb health
```

#### Google Cloud Run
```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT_ID/klean-backend

# Deploy
gcloud run deploy klean-backend \
  --image gcr.io/PROJECT_ID/klean-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,MONGO_URI=..."
```

#### Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create klean-backend

# Set environment variables
heroku config:set NODE_ENV=production MONGO_URI=... JWT_SECRET=...

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

---

## 🔧 Production Configuration

### Environment Variables (.env)
```env
# Environment
NODE_ENV=production

# Database
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/klean?retryWrites=true&w=majority

# Server
PORT=5000

# JWT
JWT_SECRET=<generate-strong-random-32-char-string>
JWT_REFRESH_SECRET=<generate-strong-random-32-char-string>
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# Email (SendGrid)
SENDGRID_API_KEY=<sendgrid-api-key>
EMAIL_FROM=noreply@klean.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=<twilio-account-sid>
TWILIO_AUTH_TOKEN=<twilio-auth-token>
TWILIO_PHONE_NUMBER=+1234567890

# File Upload (Cloudinary)
CLOUD_NAME=<cloudinary-name>
CLOUD_API_KEY=<cloudinary-key>
CLOUD_API_SECRET=<cloudinary-secret>

# CORS & Frontend
CORS_ORIGIN=https://app.klean.com
FRONTEND_URL=https://app.klean.com

# Error Tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 📊 Monitoring & Logging

### Real-Time Monitoring
```bash
# PM2 Dashboard
pm2 web
# Access: http://localhost:9615

# PM2 Plus (Premium)
pm2 plus
```

### Log Rotation
Logs are automatically rotated in `logs/` directory:
- `logs/combined-YYYY-MM-DD.log` - All logs
- `logs/error-YYYY-MM-DD.log` - Errors only

### Sentry Setup
1. Create account at [Sentry.io](https://sentry.io)
2. Create project for Node.js
3. Copy DSN to `SENTRY_DSN` in .env
4. Errors will be automatically tracked and alerted

### Health Checks
```bash
# Local health check
curl http://localhost:5000/api/v1/health

# Production health check
curl https://api.klean.com/api/v1/health
```

---

## 🔐 Security Hardening

### SSL/TLS Certificate
```bash
# Using Let's Encrypt (Free)
sudo apt-get install certbot
sudo certbot certonly --standalone -d api.klean.com

# Auto-renewal with cron
0 3 * * * /usr/bin/certbot renew --quiet
```

### Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

### Database Security
```javascript
// Use connection string with user credentials
MONGO_URI=mongodb+srv://appuser:password@cluster.mongodb.net/klean?authSource=admin&ssl=true

// Enable MongoDB authentication
// Set minimum required permissions for appuser
```

---

## 📈 Performance Optimization

### Enable Compression
```bash
# Add compression middleware (already in code via helmet)
npm install compression
```

### Connection Pooling
```javascript
// MongoDB connection pooling (automatic with mongoose)
mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: 10,
    minPoolSize: 2
});
```

### Caching Strategy
```bash
# Install Redis
npm install redis

# Use for:
# - Session storage
# - Analytics caching
# - Rate limiting
# - Notification deduplication
```

### Load Balancing
```nginx
upstream app_servers {
    least_conn;
    server app1.klean.com:5000;
    server app2.klean.com:5000;
    server app3.klean.com:5000;
}

server {
    location / {
        proxy_pass http://app_servers;
    }
}
```

---

## 🚨 Backup & Disaster Recovery

### Database Backup
```bash
# Daily automated backup with MongoDB Atlas
# Configure in MongoDB Atlas Dashboard:
# 1. Go to Backup section
# 2. Enable automatic daily snapshots
# 3. Set 30-day retention

# Manual backup
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/klean" --out ./backup

# Restore from backup
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/klean" ./backup
```

### Code Backup & Version Control
```bash
# Use GitHub/GitLab with protected main branch
# Require code reviews before merge
# Tag releases: git tag -a v1.0.0 -m "Production release"
```

### Disaster Recovery Plan
1. **Database Failover**: Use MongoDB Atlas automatic failover
2. **Application Failover**: Use load balancer with multiple servers
3. **Data Recovery**: Restore from latest backup
4. **Communication**: Notify users of any service issues

---

## 🧪 Pre-Production Testing

### Run Complete Test Suite
```bash
# Unit tests
npm test

# Test coverage
npm run test:coverage

# Integration tests (requires test database)
npm test -- --testPathPattern=integration
```

### Load Testing
```bash
# Install artillery
npm install -g artillery

# Create load test
cat > load-test.yml << EOF
config:
  target: "https://api.klean.com"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up"
    - duration: 60
      arrivalRate: 100
      name: "Sustained load"

scenarios:
  - name: "API workflow"
    flow:
      - get:
          url: "/api/v1/health"
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "test@klean.com"
            password: "TestPassword123!"
EOF

# Run load test
artillery run load-test.yml
```

---

## 📞 Rollback Procedure

### If Deployment Fails
```bash
# With PM2
pm2 restart klean-backend

# With Docker
docker stop klean-backend
docker run -d --name klean-backend -p 5000:5000 klean-backend:1.0.0

# With Heroku
heroku releases
heroku rollback v123
```

### Version Control Rollback
```bash
# Revert to previous commit
git revert <commit-hash>
git push origin main

# Redeploy
pm2 restart klean-backend
# or
eb deploy
```

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: App crashes on startup
```bash
# Check logs
pm2 logs klean-backend
# or
docker logs klean-backend

# Common causes:
# - Invalid environment variables
# - Database connection failure
# - Port already in use
```

**Issue**: High memory usage
```bash
# Monitor with PM2
pm2 monit

# Check for memory leaks
node --inspect server.js
# Use Chrome DevTools to inspect heap

# Limit memory
pm2 start server.js --max-memory-restart 500M
```

**Issue**: Slow API responses
```bash
# Check database performance
# Enable mongoDB profiling
# Review slow query logs
# Add appropriate indexes

# Check application logs for bottlenecks
grep "Response" logs/combined-*.log | grep -v "200"
```

---

## ✅ Post-Deployment Validation

```bash
# Health check
curl https://api.klean.com/api/v1/health

# Check Swagger docs
# Open: https://api.klean.com/api/v1/docs

# Test key endpoints
curl -X POST https://api.klean.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@klean.com","password":"TestPassword123!"}'

# Monitor error tracking
# Login to Sentry dashboard

# Verify notifications
# Send test SMS/Email via APIs
```

---

## 🎯 Maintenance Schedule

**Daily**:
- Monitor application logs
- Check error tracking (Sentry)
- Verify health check endpoint

**Weekly**:
- Review performance metrics
- Check disk space & backups
- Test disaster recovery procedures

**Monthly**:
- Dependency security updates
- Performance optimization review
- Capacity planning

**Quarterly**:
- Major version upgrades
- Security audit
- Architecture review

---

## 📞 Contact & Escalation

- **On-Call**: [Escalation phone number]
- **Email**: devops@klean.com
- **Slack**: #klean-backend-incidents
- **Status Page**: https://status.klean.com

For critical issues, declare a SEV1 incident and notify all team members.
