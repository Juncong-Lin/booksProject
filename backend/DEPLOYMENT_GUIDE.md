# Deployment Guide - Bookstore Backend

## Overview

This guide provides comprehensive instructions for deploying the bookstore backend API to various hosting platforms. The backend is containerized with Docker for easy deployment and includes all necessary configuration files.

## Deployment Options

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Heroku Deployment](#heroku-deployment)
4. [Railway Deployment](#railway-deployment)
5. [DigitalOcean App Platform](#digitalocean-app-platform)
6. [AWS EC2 with Docker](#aws-ec2-with-docker)

## Prerequisites

- Node.js 16+ (for local development)
- Docker and Docker Compose (for containerized deployment)
- MongoDB Atlas account (recommended for production database)
- Git repository with your code

## Local Development

### Setup Steps

1. **Clone and Setup:**

```bash
cd booksProject/backend
npm install
```

2. **Environment Configuration:**

```bash
cp .env.example .env
```

3. **Update `.env` file:**

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bookstore
JWT_SECRET=your-local-jwt-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-local-refresh-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:8080
BCRYPT_SALT_ROUNDS=12
```

4. **Start MongoDB (if running locally):**

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install MongoDB locally
# https://docs.mongodb.com/manual/installation/
```

5. **Start the server:**

```bash
npm run dev
```

6. **Run tests:**

```bash
npm test
```

## Docker Deployment

### Local Docker Setup

1. **Build and run with Docker Compose:**

```bash
cd booksProject/backend
docker-compose up --build
```

2. **For production with external MongoDB:**

```yaml
# docker-compose.prod.yml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - FRONTEND_URL=${FRONTEND_URL}
    restart: unless-stopped
```

3. **Run production setup:**

```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

## MongoDB Atlas Setup

### Database Configuration

1. **Create MongoDB Atlas Account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free account and cluster

2. **Setup Database:**
   - Create a new database named `bookstore`
   - Create a database user with read/write permissions
   - Add your deployment IP to the IP whitelist (or 0.0.0.0/0 for all IPs)

3. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

Example connection string:

```
mongodb+srv://username:password@cluster0.abc123.mongodb.net/bookstore?retryWrites=true&w=majority
```

## Heroku Deployment

### Setup Steps

1. **Install Heroku CLI:**

```bash
# Download from https://devcenter.heroku.com/articles/heroku-cli
```

2. **Login and create app:**

```bash
heroku login
heroku create your-bookstore-backend
```

3. **Set environment variables:**

```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="your-mongodb-atlas-connection-string"
heroku config:set JWT_SECRET="your-production-jwt-secret-min-32-chars"
heroku config:set JWT_REFRESH_SECRET="your-production-refresh-secret-min-32-chars"
heroku config:set JWT_EXPIRES_IN="15m"
heroku config:set JWT_REFRESH_EXPIRES_IN="7d"
heroku config:set FRONTEND_URL="https://yourusername.github.io"
heroku config:set BCRYPT_SALT_ROUNDS="12"
```

4. **Create Procfile:**

```bash
echo "web: node server.js" > Procfile
```

5. **Deploy:**

```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

6. **Open your app:**

```bash
heroku open
```

## Railway Deployment

### Setup Steps

1. **Connect to Railway:**
   - Go to [Railway](https://railway.app)
   - Sign up with GitHub
   - Create a new project from GitHub repository

2. **Configure Environment Variables:**
   In Railway dashboard, add these variables:

   ```
   NODE_ENV=production
   MONGODB_URI=your-mongodb-atlas-connection-string
   JWT_SECRET=your-production-jwt-secret-min-32-chars
   JWT_REFRESH_SECRET=your-production-refresh-secret-min-32-chars
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   FRONTEND_URL=https://yourusername.github.io
   BCRYPT_SALT_ROUNDS=12
   PORT=3000
   ```

3. **Deploy:**
   - Railway will automatically deploy from your GitHub repository
   - Monitor the deployment in the Railway dashboard

## DigitalOcean App Platform

### Setup Steps

1. **Create App:**
   - Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
   - Create a new app from GitHub repository
   - Select the backend folder as the source

2. **Configure Build Settings:**

   ```yaml
   # .do/app.yaml
   name: bookstore-backend
   services:
     - name: api
       source_dir: /backend
       github:
         repo: your-username/your-repo
         branch: main
       run_command: npm start
       environment_slug: node-js
       instance_count: 1
       instance_size_slug: basic-xxs
       envs:
         - key: NODE_ENV
           value: production
         - key: MONGODB_URI
           value: your-mongodb-connection-string
           type: SECRET
         - key: JWT_SECRET
           value: your-jwt-secret
           type: SECRET
         - key: JWT_REFRESH_SECRET
           value: your-refresh-secret
           type: SECRET
         - key: FRONTEND_URL
           value: https://yourusername.github.io
   ```

3. **Deploy:**
   - DigitalOcean will automatically build and deploy your app
   - Monitor deployment in the DigitalOcean dashboard

## AWS EC2 with Docker

### Setup Steps

1. **Launch EC2 Instance:**
   - Launch an Amazon Linux 2 EC2 instance
   - Configure security group to allow HTTP (80), HTTPS (443), and your app port (3000)
   - Connect to your instance via SSH

2. **Install Docker:**

```bash
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

3. **Clone and Deploy:**

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo/backend
```

4. **Create production environment file:**

```bash
cat > .env << EOF
NODE_ENV=production
PORT=3000
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=https://yourusername.github.io
BCRYPT_SALT_ROUNDS=12
EOF
```

5. **Deploy with Docker:**

```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

6. **Setup Nginx (Optional - for reverse proxy):**

```bash
sudo yum install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

Nginx configuration (`/etc/nginx/conf.d/bookstore.conf`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Environment Variables Reference

### Required Variables

```env
NODE_ENV=production                    # Environment mode
PORT=3000                             # Server port
MONGODB_URI=mongodb+srv://...         # MongoDB connection string
JWT_SECRET=your-secret-min-32-chars   # JWT signing secret
JWT_REFRESH_SECRET=your-refresh-secret # Refresh token secret
FRONTEND_URL=https://yourdomain.com   # Frontend URL for CORS
```

### Optional Variables

```env
JWT_EXPIRES_IN=15m                    # Access token expiry
JWT_REFRESH_EXPIRES_IN=7d             # Refresh token expiry
BCRYPT_SALT_ROUNDS=12                 # Password hashing rounds
RATE_LIMIT_WINDOW_MS=900000           # Rate limit window
RATE_LIMIT_MAX_REQUESTS=100           # Max requests per window
```

## Security Considerations

### Production Security Checklist

1. **Environment Variables:**
   - Use strong, unique JWT secrets (minimum 32 characters)
   - Never commit `.env` files to version control
   - Use environment-specific secrets

2. **Database Security:**
   - Use MongoDB Atlas with IP whitelisting
   - Create dedicated database users with minimal permissions
   - Enable database authentication

3. **Network Security:**
   - Configure CORS properly for your frontend domain
   - Use HTTPS in production
   - Implement rate limiting

4. **Application Security:**
   - Keep dependencies updated
   - Use security headers (Helmet.js is configured)
   - Validate all inputs

## Monitoring and Logging

### Health Check Endpoint

The API includes a health check endpoint:

```
GET /health
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2025-09-13T10:00:00.000Z",
  "uptime": "0d 2h 30m 15s",
  "database": "connected"
}
```

### Logging

The application uses Morgan for HTTP request logging. In production, logs are written to:

- `stdout` for application logs
- Error logs include stack traces

### Monitoring Setup

For production monitoring, consider:

- **Uptime monitoring**: Use services like UptimeRobot or Pingdom
- **Error tracking**: Integrate Sentry for error tracking
- **Performance monitoring**: Use New Relic or DataDog
- **Log aggregation**: Use LogDNA or Papertrail

## Troubleshooting

### Common Issues

1. **Database Connection Failed:**
   - Check MongoDB URI format
   - Verify database user credentials
   - Check IP whitelist in MongoDB Atlas

2. **CORS Errors:**
   - Verify `FRONTEND_URL` environment variable
   - Check browser console for exact error
   - Ensure protocol (http/https) matches

3. **JWT Token Issues:**
   - Verify JWT secrets are set
   - Check token expiration times
   - Ensure secrets are consistent across deployments

4. **Port Already in Use:**
   - Change PORT environment variable
   - Check for other running processes
   - Use process manager like PM2

### Deployment Verification

After deployment, test these endpoints:

```bash
# Health check
curl https://your-api-domain.com/health

# Register user
curl -X POST https://your-api-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Password123",
    "confirmPassword": "Password123"
  }'

# Login
curl -X POST https://your-api-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

## Frontend Integration

### Update Frontend Configuration

After deploying the backend, update your frontend code to use the production API URL:

```javascript
// In your frontend auth service
const API_BASE_URL = "https://your-backend-domain.com/api";

// Update all fetch calls to use the production URL
const AuthService = {
  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return response.json();
  },
  // ... other methods
};
```

### GitHub Pages Configuration

If your frontend is hosted on GitHub Pages, ensure:

1. Your backend URL is added to CORS configuration
2. API calls use the production backend URL
3. HTTPS is used for all API calls

## Maintenance

### Regular Maintenance Tasks

1. **Update Dependencies:**

```bash
npm audit
npm update
```

2. **Monitor Database:**
   - Check MongoDB Atlas metrics
   - Monitor storage usage
   - Review slow queries

3. **Security Updates:**
   - Rotate JWT secrets periodically
   - Update Node.js version
   - Review security advisories

4. **Backup Strategy:**
   - MongoDB Atlas provides automatic backups
   - Export environment variables securely
   - Document deployment configuration

This deployment guide provides comprehensive instructions for deploying your bookstore backend to various platforms. Choose the option that best fits your needs and budget.
