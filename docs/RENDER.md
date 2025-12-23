# Deploy to Render - Complete Guide

**Complete guide for deploying your Express + PostgreSQL backend to Render.com**

This document combines step-by-step deployment instructions, quick reference checklist, and architecture overview.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Checklist](#quick-checklist)
- [Step-by-Step Deployment](#step-by-step-deployment)
- [Architecture Overview](#architecture-overview)
- [Testing & Verification](#testing--verification)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- ✅ **GitHub Account** - Your code should be in a GitHub repository
- ✅ **Render Account** - Sign up at [render.com](https://render.com) (free tier available)
- ✅ **Code Pushed to GitHub** - Ensure all changes are committed and pushed
- ✅ **Environment Files in .gitignore** - Verify `.env`, `.env.production`, and `database.json` are NOT committed

---

## Quick Checklist

Use this as a quick reference while deploying.

### Pre-Deployment ✓
- [ ] Code pushed to GitHub repository
- [ ] `.env`, `.env.production`, and `database.json` in `.gitignore`
- [ ] Render account created

### 1️⃣ Create PostgreSQL Database
- [ ] Click "New +" → "PostgreSQL"
- [ ] Name: `t-01-enterprise-db`
- [ ] Select region (same as web service)
- [ ] Choose plan (Free or Starter $7/month)
- [ ] **Save Internal Database URL**

### 2️⃣ Create Web Service
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository
- [ ] Select repository: `t-01-express-postgresql`
- [ ] Configure:
  - Name: `t-01-express-api`
  - Runtime: **Docker**
  - Branch: `main`
  - Region: Same as database

### 3️⃣ Add Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `DATABASE_URL=<paste-internal-url>`
- [ ] Extract and set: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- [ ] `DB_SSL=true`
- [ ] `CORS_ORIGIN=*` (update with your frontend URL later)
- [ ] `LOG_LEVEL=info`

### 4️⃣ Deploy & Test
- [ ] Click "Create Web Service"
- [ ] Wait for build (~2-5 minutes)
- [ ] Test: `/health`, `/health/deep`, `/api/menu`

### 5️⃣ Verify Features
- [ ] API responds correctly
- [ ] Database connected
- [ ] Migrations ran successfully
- [ ] Auto-deploy enabled

---

## Step-by-Step Deployment

### Step 1: Create PostgreSQL Database on Render

#### 1.1 Create the Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure your database:

| Setting | Value |
|---------|-------|
| **Name** | `t-01-enterprise-db` (or your preferred name) |
| **Database** | `t_01_enterprise_db_prod` (auto-generated) |
| **User** | `t_01_prod_user` (auto-generated) |
| **Region** | Choose closest to you (Oregon, Frankfurt, etc.) |
| **PostgreSQL Version** | 16 (latest) |
| **Plan** | Free (or paid for production) |

4. Click **"Create Database"**

#### 1.2 Get Database Credentials

After creation, Render displays:
- **Internal Database URL** ← Use this for your app
- **External Database URL** (for local testing)
- **PSQL Command** (for manual access)

**Example Internal URL:**
```
postgresql://user:password@dpg-xxxxx-internal.oregon-postgres.render.com/database_name
```

⚠️ **Important**: Save the **Internal Database URL** - you'll need it for your web service.

---

### Step 2: Create Web Service on Render

#### 2.1 Create the Service

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. **Connect GitHub Repository:**
   - Click "Connect account" if first time
   - Select repository: `t-01-express-postgresql`
3. **Configure the Service:**

| Setting | Value |
|---------|-------|
| **Name** | `t-01-express-api` |
| **Region** | **Same as your database** |
| **Branch** | `main` |
| **Runtime** | **Docker** ⚠️ Important! |
| **Instance Type** | Free (or paid for production) |

4. ⚠️ **Critical**: Select **"Docker"** as runtime (Render will use your Dockerfile)

---

### Step 3: Configure Environment Variables

In the **Environment Variables** section, add these variables:

#### Required Variables:

```bash
# Node Environment
NODE_ENV=production

# Server Configuration
PORT=3000

# Database Configuration
DATABASE_URL=<paste-your-internal-database-url-here>

# Database Migration Settings (for node-pg-migrate)
DB_HOST=<extract-from-database-url>
DB_PORT=5432
DB_NAME=<extract-from-database-url>
DB_USER=<extract-from-database-url>
DB_PASSWORD=<extract-from-database-url>
DB_SSL=true

# CORS Configuration
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
```

#### How to Extract Database Values from DATABASE_URL

If your Internal Database URL is:
```
postgresql://user123:pass456@dpg-abc123-internal.oregon-postgres.render.com/db_name
              ↓        ↓       ↓                                                   ↓
           DB_USER  DB_PASS  DB_HOST                                          DB_NAME
```

Extract:
- **DB_HOST**: `dpg-abc123-internal.oregon-postgres.render.com`
- **DB_PORT**: `5432`
- **DB_USER**: `user123`
- **DB_PASSWORD**: `pass456`
- **DB_NAME**: `db_name`
- **DB_SSL**: `true`

---

### Step 4: Verify Configuration Files

#### 4.1 Dockerfile

Your [Dockerfile](../Dockerfile) should include:

```dockerfile
FROM node:20-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Switch to non-root user
USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start command (runs migrations then server)
CMD ["npm", "run", "start:prod"]
```

#### 4.2 database.json

Ensure your `database.json` uses environment variables:

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

#### 4.3 package.json Scripts

Verify your scripts:
```json
{
  "scripts": {
    "start:prod": "npm run migrate:up && node src/server.js",
    "migrate:up": "node-pg-migrate up"
  }
}
```

This ensures migrations run automatically! ✅

---

### Step 5: Deploy!

1. **Click "Create Web Service"** at the bottom of the page
2. **Watch the Deployment**:
   - Render clones your repository
   - Builds the Docker image
   - Runs migrations
   - Starts your server

#### Expected Deployment Log:

```
Building Docker image...
Installing dependencies...
Running migrations...
> node-pg-migrate up
Migrations completed successfully
Starting server...
Server listening on port 3000
```

⏱️ **Build Time**: Typically 2-5 minutes

---

### Step 6: Test Your Deployment

#### 6.1 Get Your Service URL

After deployment, Render gives you a URL:
```
https://t-01-express-api.onrender.com
```

#### 6.2 Test Endpoints

```bash
# Health check
curl https://your-app.onrender.com/health

# Response: {"status":"OK","timestamp":"2025-12-23T...","uptime":123.45}

# Deep health check (tests database)
curl https://your-app.onrender.com/health/deep

# Response: {"status":"healthy","database":"connected","timestamp":"..."}

# API endpoint
curl https://your-app.onrender.com/api/menu

# Response: [{"id":1,"name":"Burger","price":12.99,...}]
```

✅ **All passing?** Your app is live!

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         RENDER.COM                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  WEB SERVICE: t-01-express-api                          │  │
│  │  https://t-01-express-api.onrender.com                  │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │  Docker Container (Node.js 20 Alpine)                   │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  1. npm run start:prod                           │  │  │
│  │  │     ├─ npm run migrate:up (auto migrations)      │  │  │
│  │  │     └─ node src/server.js                        │  │  │
│  │  │                                                   │  │  │
│  │  │  2. Express.js Server (Port 3000)                │  │  │
│  │  │     ├─ Health Routes (/health, /health/deep)     │  │  │
│  │  │     ├─ API Routes (/api/menu)                    │  │  │
│  │  │     ├─ Middleware (CORS, Helmet, Rate Limit)     │  │  │
│  │  │     └─ Error Handlers                            │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                          │                              │  │
│  │                          │ pg client (SSL)              │  │
│  └──────────────────────────┼──────────────────────────────┘  │
│                             │                                 │
│                             ▼                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  POSTGRESQL DATABASE                                    │  │
│  │  dpg-xxxxx-internal.oregon-postgres.render.com         │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │  Database: t_01_enterprise_db_prod                      │  │
│  │  SSL: Required                                          │  │
│  │  Tables: menu_items, pgmigrations                       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ▲
                            │ HTTPS
                     ┌──────┴──────┐
                     │   Internet  │
                     │   Clients   │
                     └─────────────┘
```

### Deployment Flow

```
Developer (git push) → GitHub → Render (webhook)
                                   ↓
                              Build Docker Image
                                   ↓
                              Deploy Container
                                   ↓
                            Run Migrations
                                   ↓
                            Start Server
                                   ↓
                            Health Checks
                                   ↓
                            Route Traffic
```

### Request Flow

```
Client Request (HTTPS)
     │
     ▼
Render Load Balancer (SSL Termination)
     │
     ▼
Docker Container
     │
     ├─ HTTP Logger
     ├─ CORS Middleware
     ├─ Helmet Security
     ├─ Rate Limiting
     │
     ▼
Route Handler
     │
     ├─ Validation (Zod)
     │
     ▼
Controller → Service → Repository
                          │
                          ▼
                    PostgreSQL (SSL)
                          │
                          ▼
Response Chain (reverse)
     │
     ▼
Client Receives JSON
```

### Environment Variables Flow

```
Render Dashboard (Environment Variables)
     │
     ├─ NODE_ENV=production
     ├─ DATABASE_URL=postgresql://...
     ├─ DB_HOST, DB_PORT, DB_USER, DB_PASSWORD
     │
     ▼
Injected into Container at Runtime
     │
     ▼
Application Code
     │
     ├─ process.env.NODE_ENV
     ├─ process.env.DATABASE_URL
     ├─ {"ENV": "DB_HOST"} in database.json
     │
     ▼
Database Connection & Config
```

### Migration Process

```
Container Starts
     │
     ▼
npm run start:prod
     │
     ├─ npm run migrate:up
     │   │
     │   ├─ Read database.json (production config)
     │   ├─ Connect to PostgreSQL
     │   ├─ Check pgmigrations table
     │   ├─ Compare with migrations/ folder
     │   ├─ Apply new migrations
     │   └─ Update pgmigrations table
     │
     └─ node src/server.js (start server)
```

---

## Testing & Verification

### Health Check System

#### Basic Health Check
```bash
curl https://your-app.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-12-23T10:30:00.000Z",
  "uptime": 123.45,
  "environment": "production"
}
```

#### Deep Health Check (Database Test)
```bash
curl https://your-app.onrender.com/health/deep
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-12-23T10:30:00.000Z",
  "checks": {
    "database": "OK",
    "migrations": "applied"
  }
}
```

### API Endpoints Testing

```bash
# List all menu items
curl https://your-app.onrender.com/api/menu

# Get specific item
curl https://your-app.onrender.com/api/menu/1

# Create item
curl -X POST https://your-app.onrender.com/api/menu \
  -H "Content-Type: application/json" \
  -d '{"name":"Burger","description":"Delicious","category":"main","price":12.99}'

# Update item
curl -X PUT https://your-app.onrender.com/api/menu/1 \
  -H "Content-Type: application/json" \
  -d '{"price":14.99}'

# Delete item
curl -X DELETE https://your-app.onrender.com/api/menu/1
```

---

## Monitoring & Maintenance

### Render Dashboard Features

#### View Logs
1. Go to your web service in Render
2. Click **"Logs"** tab
3. See real-time application logs with timestamps

#### Database Metrics
1. Go to your PostgreSQL database
2. Click **"Metrics"** tab
3. Monitor:
   - Storage usage
   - Connection count
   - Query performance
   - CPU/Memory usage

#### Auto-Scaling (Paid Plans)
- Render automatically scales based on traffic
- Configure in Settings → Scaling

### Automatic Deployments

Render automatically redeploys on git push:

```bash
git add .
git commit -m "Update feature"
git push origin main
# Render detects push and redeploys! 🚀
```

**Disable auto-deploy**: Dashboard → Settings → Build & Deploy → Disable

### Manual Deployments

**Trigger manual deploy**: Dashboard → Your Service → "Manual Deploy" → "Deploy latest commit"

### Health Monitoring

Render automatically monitors your `/health` endpoint:
- **Frequency**: Every 30 seconds
- **Timeout**: 3 seconds
- **Action on Failure**: Automatic restart after 3 consecutive failures

### Database Backups

**Free Tier**: 
- Point-in-time recovery (7 days)
- Daily snapshots

**Paid Plans**:
- Extended retention
- Manual backup triggers
- Download backups

---

## Troubleshooting

### Issue: Database Connection Failed

**Symptoms**: API returns 500 errors, logs show "connection refused"

**Solutions**:
1. Verify environment variables are correct:
   ```bash
   # In Render dashboard, check:
   DATABASE_URL=postgresql://...
   DB_HOST=dpg-xxx-internal...  # Should end with -internal
   DB_SSL=true
   ```
2. Test database connection manually:
   ```bash
   # In Render Shell (Dashboard → Shell):
   psql $DATABASE_URL
   ```
3. Check database is running in Render dashboard

### Issue: Migrations Didn't Run

**Symptoms**: Tables don't exist, API errors on database queries

**Solutions**:
1. Check deployment logs for migration errors
2. Verify `database.json` is committed to repository
3. Ensure `start:prod` script includes `migrate:up`
4. Manually run migrations via Render Shell:
   ```bash
   npm run migrate:up
   ```

### Issue: App Not Responding / 502 Error

**Symptoms**: Render shows "Service Unavailable"

**Solutions**:
1. Check logs for startup errors
2. Verify `PORT` environment variable is set to `3000`
3. Ensure server binds to `0.0.0.0`:
   ```javascript
   app.listen(PORT, '0.0.0.0', () => {...});
   ```
4. Check Docker build completed successfully

### Issue: SSL/TLS Error

**Symptoms**: "SSL connection failed" in logs

**Solutions**:
1. Set `DB_SSL=true` in environment variables
2. Update db config to handle SSL:
   ```javascript
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
   });
   ```

### Issue: Free Tier Spin Down (Slow First Request)

**Symptoms**: First request takes 30+ seconds after inactivity

**Explanation**: Free tier spins down after 15 minutes of inactivity

**Solutions**:
- Upgrade to Starter plan ($7/month) for always-on service
- Accept the trade-off for free hosting
- Use a ping service (not recommended, may violate terms)

### Issue: Build Timeout

**Symptoms**: Build fails after 15 minutes

**Solutions**:
1. Optimize `Dockerfile`:
   - Use `npm ci` instead of `npm install`
   - Use `--only=production` flag
2. Check for large dependencies
3. Consider using Docker layer caching

### Issue: Environment Variables Not Loading

**Symptoms**: App uses wrong config, database connection fails

**Solutions**:
1. Verify variables in Render dashboard
2. Restart service after adding variables
3. Check variable names match exactly (case-sensitive)
4. Use `process.env.VAR_NAME` in code, not hardcoded values

---

## Pricing & Plans

### Free Tier Limitations:
- **Web Service**: 
  - Spins down after 15 min inactivity
  - 750 hours/month
  - 512 MB RAM
  - Shared CPU
- **Database**: 
  - 1GB storage
  - 90-day retention
  - 97 hours/month uptime

### Recommended for Production:
- **Web Service**: Starter ($7/month)
  - No spin down
  - Always running
  - Faster response times
- **Database**: Starter ($7/month)
  - 10GB storage
  - Full uptime
  - Better performance

---

## Security Best Practices

### ✅ Environment Variables
- Never commit `.env`, `.env.production`, `database.json` with real credentials
- Use Render's environment variable system
- Rotate passwords regularly

### ✅ Database Security
- Use **Internal Database URL** (not external) for your app
- Enable SSL in production (`DB_SSL=true`)
- Use strong, generated passwords

### ✅ API Security
- Update `CORS_ORIGIN` to specific frontend domain (not `*`)
- Enable rate limiting (already configured)
- Consider adding authentication (JWT, OAuth)
- Use HTTPS only (Render provides this automatically)

### ✅ Code Security
- Keep dependencies updated (`npm audit`)
- Use parameterized queries (already implemented)
- Validate all inputs (using Zod schemas)
- Handle errors gracefully (custom error classes)

---

## Quick Reference

### Useful URLs
- **Dashboard**: https://dashboard.render.com
- **Your App**: `https://<your-service-name>.onrender.com`
- **Render Docs**: https://render.com/docs

### Common Tasks

| Task | Where |
|------|-------|
| View Logs | Dashboard → Service → Logs |
| Add Env Var | Dashboard → Service → Environment |
| Manual Deploy | Dashboard → Service → Manual Deploy |
| Database Console | Dashboard → Database → Connect → PSQL |
| View Metrics | Dashboard → Service/Database → Metrics |

### Environment Variable Template

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host/db
DB_HOST=dpg-xxx-internal.region-postgres.render.com
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password
DB_SSL=true
CORS_ORIGIN=*
LOG_LEVEL=info
```

---

## Success Checklist

- [ ] PostgreSQL database created
- [ ] Web service created and connected to GitHub
- [ ] All environment variables configured
- [ ] Database credentials correctly extracted
- [ ] Initial deployment successful (no errors in logs)
- [ ] Health checks passing (`/health`, `/health/deep`)
- [ ] API endpoints working (GET/POST/PUT/DELETE)
- [ ] Migrations running automatically on deploy
- [ ] Automatic deployments working on git push
- [ ] Logs visible and readable in dashboard
- [ ] CORS updated with frontend URL (if applicable)

---

## Next Steps

1. **Deploy Frontend** (if applicable):
   - Netlify, Vercel, or Render Static Site
   - Update `CORS_ORIGIN` with frontend URL

2. **Custom Domain** (optional):
   - Dashboard → Service → Settings → Custom Domain
   - Add CNAME record in DNS provider

3. **Monitoring & Alerts**:
   - Set up UptimeRobot for uptime monitoring
   - Configure Render email notifications

4. **Production Optimization**:
   - Upgrade to paid plans for better performance
   - Set up CI/CD for automated testing
   - Add APM tools (New Relic, Datadog)

---

**Congratulations!** 🎉 Your enterprise-grade Express + PostgreSQL backend is now live on Render!

For general cloud deployment options, see [DEPLOYMENT.md](./DEPLOYMENT.md).  
For local development, see [GETTING_STARTED.md](./GETTING_STARTED.md).  
For troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).
