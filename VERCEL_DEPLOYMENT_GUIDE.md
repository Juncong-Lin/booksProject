# Vercel Deployment Guide

## 🚀 Migrating from Netlify to Vercel

This guide will help you deploy your bookstore project to Vercel, which offers a generous free tier without the limitations you encountered on Netlify.

### Why Vercel?

- **Truly Free Tier**: 100GB bandwidth, unlimited sites, and generous build minutes
- **Excellent Performance**: Global CDN and edge functions
- **Easy Custom Domain**: Free SSL certificates
- **Zero Configuration**: Automatic deployments from GitHub
- **Better Analytics**: Built-in web vitals and performance monitoring

### Prerequisites

1. GitHub account (already set up)
2. Vercel account (sign up at [vercel.com](https://vercel.com))

### Deployment Steps

#### 1. Sign Up for Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Start Deploying"
3. Sign up with GitHub (recommended for seamless integration)
4. Authorize Vercel to access your repositories

#### 2. Deploy Your Project

1. **Import Project**:

   - Click "New Project" in your Vercel dashboard
   - Select "Import Git Repository"
   - Choose your `booksProject` repository

2. **Configure Project**:

   - **Project Name**: `juncong-bookstore` (or your preferred name)
   - **Framework Preset**: Other (since this is a vanilla HTML/JS project)
   - **Root Directory**: Leave as `.` (root)
   - **Build Command**: Leave empty (static site)
   - **Output Directory**: Leave empty
   - **Install Command**: Leave empty

3. **Environment Variables** (if needed):

   - For frontend-only deployment, no environment variables are typically needed
   - The backend API calls will be proxied to your existing Render backend

4. **Deploy**:
   - Click "Deploy"
   - Wait for the deployment to complete (usually 1-2 minutes)

#### 3. Configure Custom Domain

1. **Add Domain**:

   - Go to your project settings in Vercel
   - Click "Domains" tab
   - Add your domain: `www.juncongmall.com`

2. **Update DNS Settings**:

   - Go to your domain registrar (where you bought the domain)
   - Update the DNS records:
     ```
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```
   - Or for apex domain:
     ```
     Type: A
     Name: @
     Value: 76.76.19.61
     ```

3. **SSL Certificate**:
   - Vercel automatically provides free SSL certificates
   - No additional configuration needed

### Project Configuration

The project is already configured with `vercel.json` which includes:

- **Static File Serving**: All HTML, CSS, JS, and images
- **API Proxy**: Routes `/api/*` requests to your Render backend
- **Client-Side Routing**: Handles SPA routing for your bookstore
- **Security Headers**: XSS protection, frame options, etc.
- **CORS Headers**: Proper cross-origin resource sharing

### Backend Configuration

Your backend remains on Render (which is perfect since it's working well). The Vercel frontend will:

- Serve all static files (HTML, CSS, JS, images)
- Proxy API calls to `https://bookstore-backend-yu11.onrender.com`
- Handle client-side routing for your single-page application

### Advantages of This Setup

1. **Cost**: Completely free on Vercel's generous free tier
2. **Performance**: Vercel's edge network for fast global delivery
3. **Reliability**: 99.99% uptime SLA even on free tier
4. **Scalability**: Automatic scaling without configuration
5. **Analytics**: Built-in performance monitoring
6. **Simplicity**: Zero configuration deployments

### Testing the Deployment

After deployment:

1. **Check Frontend**: Visit your Vercel URL to ensure the site loads
2. **Test API Calls**: Try signing up/signing in to test backend connectivity
3. **Verify Domain**: Confirm custom domain works correctly
4. **Check Performance**: Use Vercel's analytics to monitor performance

### Rollback Plan

If you need to rollback:

1. The original Netlify configuration is preserved in `netlify.toml`
2. Your Render backend continues to work independently
3. You can easily switch between deployments

### Monitoring and Maintenance

- **Automatic Deployments**: Every push to `main` branch triggers deployment
- **Preview Deployments**: Pull requests get preview URLs
- **Analytics**: Monitor performance in Vercel dashboard
- **Logs**: Real-time function and build logs

### Support and Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Custom Domain Setup](https://vercel.com/docs/concepts/projects/domains)

## Next Steps

1. Deploy to Vercel following the steps above
2. Test all functionality thoroughly
3. Update any hardcoded URLs if necessary
4. Monitor performance and analytics
5. Consider removing Netlify deployment once Vercel is confirmed working

Your bookstore project is well-suited for Vercel and should have excellent performance on their platform!
