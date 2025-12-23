# 🚀 Deploy to Render - Complete Guide

This guide will walk you through deploying your Express + PostgreSQL backend to Render.com.

---

## 📋 Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com) (free tier available)
3. **Your project pushed to GitHub**

---

## 🗄️ Step 1: Create PostgreSQL Database on Render

### 1.1 Create the Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure your database:
   - **Name**: `t-01-enterprise-db` (or your preferred name)
   - **Database**: `t_01_enterprise_db_prod` (auto-generated, you can change)
   - **User**: `t_01_prod_user` (auto-generated, you can change)
   - **Region**: Choose closest to you (e.g., Oregon, Frankfurt)
   - **PostgreSQL Version**: 16 (latest)
   - **Plan**: Free (or paid for better performance)

4. Click **"Create Database"**

### 1.2 Get Database Credentials

After creation, Render will show you:
- **Internal Database URL** (use this for your app)
- **External Database URL** (for local testing)
- **PSQL Command** (for manual access)

**Example Internal URL:**
```
postgresql://user:password@dpg-xxxxx-internal/database_name
```

**Important**: Save the **Internal Database URL** - you'll need it for your web service.

---

## 🌐 Step 2: Create Web Service on Render

### 2.1 Create the Service

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository:
   - Click **"Connect account"** if first time
   - Select your repository: `t-01-express-postgresql`
3. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `t-01-express-api` (or your preferred name) |
| **Region** | Same as your database |
| **Branch** | `main` (or your default branch) |
| **Runtime** | `Docker` |
| **Instance Type** | Free (or paid for production) |

4. **Important**: Select **"Docker"** as the runtime (Render will use your Dockerfile)

---

## ⚙️ Step 3: Configure Environment Variables

In the **Environment Variables** section, add these variables:

### Required Variables:

```bash
# Node Environment
NODE_ENV=production

# Server Configuration
PORT=3000

# Database Configuration (from Step 1.2)
DATABASE_URL=<paste-your-internal-database-url-here>

# Database Migration Settings (for node-pg-migrate)
DB_HOST=<from-database-url>
DB_PORT=5432
DB_NAME=<from-database-url>
DB_USER=<from-database-url>
DB_PASSWORD=<from-database-url>
DB_SSL=true

# CORS Configuration (update with your frontend URL)
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
```

### 📝 How to Extract Database Values from DATABASE_URL

If your Internal Database URL is:
```
postgresql://user123:pass456@dpg-abc123-internal.oregon-postgres.render.com/db_name
```

Extract:
- **DB_HOST**: `dpg-abc123-internal.oregon-postgres.render.com`
- **DB_PORT**: `5432`
- **DB_USER**: `user123`
- **DB_PASSWORD**: `pass456`
- **DB_NAME**: `db_name`
- **DB_SSL**: `true`

---

## 🔧 Step 4: Update Configuration Files

### 4.1 Ensure Your Dockerfile is Production-Ready

Your [Dockerfile](Dockerfile) should look like this:

```dockerfile
FROM node:20-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start command (runs migrations then starts server)
CMD ["npm", "run", "start:prod"]
```

### 4.2 Update database.json for Production

Create a `database.json` that works with Render's environment variables:

```json
{
  "production": {
    "host": { "ENV": "DB_HOST" },
    "port": { "ENV": "DB_PORT" },
    "database": { "ENV": "DB_NAME" },
    "user": { "ENV": "DB_USER" },
    "password": { "ENV": "DB_PASSWORD" },
    "ssl": { "ENV": "DB_SSL" }
  }
}
```

### 4.3 Verify package.json Scripts

Your [package.json](package.json) already has the correct scripts:
```json
{
  "scripts": {
    "start:prod": "npm run migrate:up && node src/server.js",
    "migrate:up": "node-pg-migrate up"
  }
}
```

This ensures migrations run automatically before the server starts! ✅

---

## 🚀 Step 5: Deploy!

1. **Click "Create Web Service"** at the bottom
2. Render will:
   - Clone your repository
   - Build the Docker image
   - Run migrations (`npm run migrate:up`)
   - Start your server
3. Watch the deployment logs in real-time

### Expected Deployment Log:
```
Building Docker image...
Installing dependencies...
Running migrations...
> node-pg-migrate up
Migrations completed successfully
Starting server...
Server listening on port 3000
```

---

## ✅ Step 6: Test Your Deployment

### 6.1 Get Your Service URL

After deployment, Render gives you a URL like:
```
https://t-01-express-api.onrender.com
```

### 6.2 Test Endpoints

```bash
# Health check
curl https://your-app.onrender.com/health

# Deep health check (tests database)
curl https://your-app.onrender.com/health/deep

# API endpoint (menu items)
curl https://your-app.onrender.com/api/menu
```

---

## 🔄 Automatic Deployments

Render automatically redeploys when you push to your GitHub branch!

```bash
git add .
git commit -m "Update feature"
git push origin main
# Render automatically deploys! 🚀
```

---

## 🐛 Troubleshooting

### Issue: "Migration failed"

**Solution**: Check your database connection string in environment variables.

```bash
# Test database connection manually
# In Render Shell (Dashboard → Shell tab):
psql $DATABASE_URL
# Should connect successfully
```

### Issue: "Port binding failed"

**Solution**: Ensure your app listens on `process.env.PORT`:

```javascript
// src/server.js
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
```

### Issue: "Database SSL error"

**Solution**: Add SSL configuration to your db config:

```javascript
// src/config/db.js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

### Issue: "Application not responding"

**Check**:
1. View logs in Render Dashboard → Logs tab
2. Verify environment variables are set correctly
3. Check database is running and accessible

---

## 💰 Pricing & Limitations

### Free Tier Limitations:
- **Web Service**: Spins down after 15 min of inactivity (first request takes ~30s to wake)
- **Database**: 1GB storage, 97 hours/month uptime
- **Bandwidth**: Limited

### Recommended for Production:
- **Web Service**: Starter ($7/month) - no spin down
- **Database**: Starter ($7/month) - 10GB storage, full uptime

---

## 🔐 Security Best Practices

### 1. Environment Variables
✅ **Never commit** `.env`, `.env.production`, or `database.json` with real credentials
✅ Use Render's environment variable system

### 2. Database Security
✅ Use Internal Database URL (not external) for your app
✅ Enable SSL in production
✅ Use strong passwords (Render generates these)

### 3. API Security
✅ Update CORS_ORIGIN to your frontend domain
✅ Consider adding authentication middleware
✅ Enable rate limiting (your app already has this!)

---

## 📊 Monitoring

### View Logs
1. Go to your web service in Render
2. Click **"Logs"** tab
3. See real-time application logs

### Database Metrics
1. Go to your PostgreSQL database in Render
2. Click **"Metrics"** tab
3. View connections, queries, storage usage

### Health Checks
Render automatically monitors your `/health` endpoint!

---

## 🎯 Quick Reference Card

| Task | Command/URL |
|------|-------------|
| View App | `https://your-app.onrender.com` |
| View Logs | Dashboard → Web Service → Logs |
| Database Console | Dashboard → PostgreSQL → Connect → PSQL |
| Trigger Redeploy | Dashboard → Web Service → Manual Deploy |
| View Environment | Dashboard → Web Service → Environment |

---

## 📚 Additional Resources

- [Render PostgreSQL Docs](https://render.com/docs/databases)
- [Render Docker Docs](https://render.com/docs/docker)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Your DEPLOYMENT.md](DEPLOYMENT.md) - General cloud deployment guide

---

## ✨ Success Checklist

- [ ] PostgreSQL database created on Render
- [ ] Web service created and connected to GitHub
- [ ] Environment variables configured
- [ ] Database credentials added
- [ ] Initial deployment successful
- [ ] Health checks passing (`/health`, `/health/deep`)
- [ ] API endpoints working
- [ ] Migrations running automatically
- [ ] Automatic deployments working on git push

---

**Congratulations!** 🎉 Your enterprise-grade backend is now deployed on Render!

**Next Steps:**
1. Deploy your frontend (if any) to Netlify/Vercel
2. Update CORS_ORIGIN with your frontend URL
3. Set up custom domain (optional)
4. Consider upgrading to paid tiers for production use
