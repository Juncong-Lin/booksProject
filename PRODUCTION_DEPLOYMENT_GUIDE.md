# 🚀 Production Deployment Guide

This guide helps you deploy your bookstore website to production so it works online, not just on localhost.

## 📋 Prerequisites

1. **Frontend Hosting**: Choose a platform for your frontend (HTML/CSS/JS)

   - GitHub Pages (free)
   - Netlify (free tier)
   - Vercel (free tier)
   - Your own web server

2. **Backend Hosting**: Choose a platform for your Node.js backend

   - Railway (recommended, free tier)
   - Render (free tier)
   - Heroku (paid)
   - DigitalOcean App Platform
   - Your own VPS

3. **Database**: MongoDB Atlas (already configured)

## 🎯 Quick Deployment Steps

### Step 1: Update Configuration

1. **Update your production backend URL** in `config/config.js`:
   ```javascript
   production: {
     API_BASE_URL: 'https://your-backend-domain.com/api/v1',
     // Replace with your actual backend URL
   }
   ```

### Step 2: Deploy Backend (Railway - Recommended)

1. **Create Railway Account**: Go to [railway.app](https://railway.app)
2. **Connect GitHub**: Link your GitHub repository
3. **Deploy Backend**:

   - Select your repository
   - Choose the `backend` folder as root directory
   - Railway will auto-detect Node.js and deploy

4. **Set Environment Variables** in Railway dashboard:

   ```
   NODE_ENV=production
   MONGODB_URI=your-mongodb-atlas-connection-string
   JWT_SECRET=your-secure-jwt-secret
   JWT_REFRESH_SECRET=your-secure-refresh-secret
   PRODUCTION_FRONTEND_URL=https://your-frontend-domain.com
   ```

5. **Get your backend URL**: Railway will provide a URL like `https://your-app.railway.app`

### Step 3: Update Frontend Configuration

1. **Update `config/config.js`** with your actual backend URL:
   ```javascript
   production: {
     API_BASE_URL: 'https://your-backend-domain.railway.app/api/v1',
   }
   ```

### Step 4: Deploy Frontend (Netlify - Recommended)

1. **Create Netlify Account**: Go to [netlify.com](https://netlify.com)
2. **Deploy from GitHub**:
   - Connect your GitHub repository
   - Set build settings:
     - Build command: (leave empty for static site)
     - Publish directory: `/` (root directory)
3. **Custom Domain** (optional):
   - Add your domain (like juncongmall.com)
   - Update DNS settings as instructed

## 🌍 Alternative Deployment Options

### Backend Deployment Options

#### Option 1: Railway (Easiest)

- ✅ Free tier available
- ✅ Auto-deployment from GitHub
- ✅ Easy environment variables
- Visit: [railway.app](https://railway.app)

#### Option 2: Render

- ✅ Free tier available
- ✅ Auto-deployment from GitHub
- Visit: [render.com](https://render.com)

#### Option 3: DigitalOcean App Platform

- 💰 $5/month minimum
- ✅ Very reliable
- Visit: [digitalocean.com](https://digitalocean.com)

### Frontend Deployment Options

#### Option 1: Netlify (Recommended)

- ✅ Free tier
- ✅ Custom domains
- ✅ HTTPS included
- Visit: [netlify.com](https://netlify.com)

#### Option 2: Vercel

- ✅ Free tier
- ✅ Great performance
- Visit: [vercel.com](https://vercel.com)

#### Option 3: GitHub Pages

- ✅ Free
- ✅ Easy setup
- ❌ No custom backend support

## 🔧 Configuration Files

### Backend Environment Variables (.env.production)

```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bookstore
JWT_SECRET=your-super-secure-jwt-secret-minimum-64-characters
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-minimum-64-characters
PRODUCTION_FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend Configuration (config/config.js)

```javascript
production: {
  API_BASE_URL: 'https://your-backend-domain.com/api/v1',
  FRONTEND_URL: window.location.origin,
  ENVIRONMENT: 'production'
}
```

## 🧪 Testing Your Deployment

1. **Test Backend**: Visit `https://your-backend-domain.com/health`
2. **Test Frontend**: Visit your frontend URL
3. **Test Authentication**: Try signing up/signing in
4. **Check Console**: Look for any errors in browser console

## ⚠️ Important Security Notes

1. **Change Default Secrets**: Never use default JWT secrets in production
2. **Environment Variables**: Store sensitive data in environment variables, not in code
3. **HTTPS Only**: Always use HTTPS in production
4. **CORS Configuration**: Ensure CORS is properly configured for your domain

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**: Update CORS settings in backend to include your frontend domain
2. **Network Errors**: Check if backend URL is correct in config.js
3. **Authentication Issues**: Verify JWT secrets and MongoDB connection
4. **404 Errors**: Check if backend routes are correctly deployed

### Quick Fixes:

1. **Check Backend Health**: `curl https://your-backend-domain.com/health`
2. **Check Frontend Config**: Open browser console and look for CONFIG logs
3. **Verify Environment Variables**: Check deployment platform's environment settings

## 📞 Need Help?

1. Check browser console for errors
2. Check backend logs in your deployment platform
3. Verify all environment variables are set correctly
4. Test each component individually (backend health, frontend loading, API calls)

---

**🎉 Once deployed, your website will work from anywhere in the world, not just localhost!**
