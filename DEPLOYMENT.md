# Deployment Guide: Jaganath Enterprises

This guide explains how to deploy the Jaganath Enterprises furniture website to production.

## 1. Backend Deployment (Render)
1. **Prepare MongoDB**: Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and get your connection string.
2. **Create Render Service**: Sign up on [Render](https://render.com) and create a new **Web Service**.
3. **Connect Repository**: Connect your GitHub repo.
4. **Build Settings**:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
5. **Environment Variables**:
   - `MONGODB_URI`: Your MongoDB Atlas URL.
   - `JWT_SECRET`: A secure random string (e.g., `jagannath_secure_2026`).
   - `PORT`: `10000` (Render's default).

## 2. Frontend Deployment (Vercel)
1. **Create Vercel Project**: Sign up on [Vercel](https://vercel.com) and import your GitHub repo.
2. **Build Settings**:
   - **Root Directory**: `client`
   - **Framework Preset**: `Next.js`
3. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: The URL of your Render backend (e.g., `https://jaganath-api.onrender.com/api`).
4. **Deploy**: Click "Deploy".

## 3. Post-Deployment Verification
- Login to the Admin Panel at `/admin` (admin@jagannath.com / admin123).
- Test Product creation and Inquiry submission.
- Verify real-time stock updates.

## 🛠️ Performance & SEO Tips
- Ensure all images are optimized through Next.js `<Image>` component (already implemented).
- Setup your custom domain in Vercel settings.
- Enable SSL (handled automatically by Vercel/Render).
