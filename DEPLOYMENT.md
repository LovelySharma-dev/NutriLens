# Deployment Guide

This guide covers deploying NutriTrust to production using Vercel (frontend) and Railway (backend).

## Prerequisites

- Vercel account (free tier works)
- Railway account (free tier works)
- GitHub repository with your code
- Railway PostgreSQL database (can be created during deployment)

## Environment Variables

### Railway (Backend) Environment Variables

Set these in your Railway project settings:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_RAILWAY_DB_HOST:5432/railway
OCR_SERVICE_URL=http://localhost:8001  # Update if deploying OCR service separately
ML_SERVICE_URL=http://localhost:8000   # Update if deploying ML service separately
PORT=4000
NODE_ENV=production
```

### Vercel (Frontend) Environment Variables

Set these in your Vercel project settings:

```env
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
```

## Deployment Steps

### 1. Deploy Backend to Railway

1. **Push your code to GitHub** (if not already done)
2. **Create a new Railway project**:
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your NutriTrust repository
   - Select the `services/api` directory as the root directory

3. **Configure the service**:
   - Railway will automatically detect it's a Node.js project
   - Set the root directory to `services/api`
   - Add the environment variables listed above

4. **Add PostgreSQL Database**:
   - In your Railway project, click "New Service"
   - Select "PostgreSQL"
   - Railway will provide a `DATABASE_URL` in your environment variables
   - Copy this URL and update your `DATABASE_URL` environment variable

5. **Run Database Migrations**:
   - Go to your Railway service
   - Click "Console" tab
   - Run: `npx prisma migrate deploy`
   - Or add a deployment script to run this automatically

6. **Deploy**:
   - Railway will automatically deploy on push
   - Wait for the build to complete
   - Your API will be available at `https://your-app-name.railway.app`

### 2. Deploy Frontend to Vercel

1. **Create a new Vercel project**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the `NutriTrust` repository

2. **Configure the project**:
   - Framework Preset: Next.js
   - Root Directory: `./` (project root)
   - Build Command: `pnpm --filter web build`
   - Output Directory: `apps/web/.next`

3. **Add Environment Variables**:
   - Add `NEXT_PUBLIC_API_URL` with your Railway URL
   - Example: `https://nutritrust-api.railway.app`

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your Next.js app
   - Your frontend will be available at `https://your-app-name.vercel.app`

### 3. Update API URLs (Important)

After deploying both services:

1. **Get your Railway API URL** from Railway dashboard
2. **Update Vercel environment variable**:
   - Go to Vercel project → Settings → Environment Variables
   - Update `NEXT_PUBLIC_API_URL` to your Railway URL
   - Redeploy Vercel

## Deploying Python Services (Optional)

The ML and OCR services are currently set up for local development. For production deployment, you have several options:

### Option 1: Deploy to Railway (Recommended)

1. Create separate Railway services for ML and OCR
2. Update `services/ml` and `services/ocr` with Railway configuration
3. Update API environment variables with the new service URLs

### Option 2: Use Render or similar platform

1. Deploy ML service to Render/Railway
2. Deploy OCR service to Render/Railway
3. Update API environment variables

### Option 3: Keep local/dedicated server

- Run ML and OCR services on a dedicated server
- Expose them via a reverse proxy (nginx)
- Update API environment variables to point to these services

## Verification

After deployment:

1. **Test Backend Health**:
   ```bash
   curl https://your-api.railway.app/health
   ```

2. **Test Frontend**:
   - Open your Vercel URL
   - Try uploading a food label image
   - Verify the complete pipeline works

3. **Check Logs**:
   - Railway: Logs tab in Railway dashboard
   - Vercel: Logs tab in Vercel dashboard

## Troubleshooting

### Railway Issues

- **Build fails**: Check the build logs in Railway
- **Database connection**: Ensure `DATABASE_URL` is correct
- **Port issues**: Railway automatically assigns ports, use `PORT` env var

### Vercel Issues

- **Build fails**: Check build logs in Vercel
- **API connection**: Ensure `NEXT_PUBLIC_API_URL` is set correctly
- **Environment variables**: Must be prefixed with `NEXT_PUBLIC_` for client-side access

### Database Migration

If database schema changes:
```bash
# In Railway console
npx prisma migrate deploy
```

## Cost Estimation

- **Vercel**: Free tier includes unlimited projects, 100GB bandwidth/month
- **Railway**: Free tier includes $5 credit/month (sufficient for small projects)
- **PostgreSQL**: Included in Railway free tier (512MB storage)

## Next Steps

1. Set up custom domains (optional)
2. Configure monitoring and error tracking (Sentry, etc.)
3. Set up CI/CD pipelines
4. Add automated testing before deployment
