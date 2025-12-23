# 🚀 Render Deployment Checklist

Use this checklist while deploying to Render.

## Pre-Deployment ✓

- [ ] Code pushed to GitHub repository
- [ ] `.env`, `.env.production`, and `database.json` are in `.gitignore`
- [ ] Render account created at [render.com](https://render.com)

---

## 1️⃣ Create PostgreSQL Database

- [ ] Click "New +" → "PostgreSQL"
- [ ] Set database name: `t-01-enterprise-db`
- [ ] Select region (same as web service)
- [ ] Choose plan (Free or Starter $7/month)
- [ ] Click "Create Database"
- [ ] **Save the Internal Database URL** from the dashboard

---

## 2️⃣ Create Web Service

- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository
- [ ] Select repository: `t-01-express-postgresql`
- [ ] Configure:
  - Name: `t-01-express-api`
  - Region: Same as database
  - Branch: `main`
  - Runtime: **Docker**
  - Instance Type: Free or Starter

---

## 3️⃣ Add Environment Variables

Copy these to Render's Environment Variables section:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=<paste-internal-database-url>
DB_HOST=<extract-from-database-url>
DB_PORT=5432
DB_NAME=<extract-from-database-url>
DB_USER=<extract-from-database-url>
DB_PASSWORD=<extract-from-database-url>
DB_SSL=true
CORS_ORIGIN=*
LOG_LEVEL=info
```

### How to extract from DATABASE_URL:
```
postgresql://user123:pass456@dpg-abc-internal.oregon-postgres.render.com/mydb
            ↓        ↓       ↓                                                ↓
         DB_USER  DB_PASS  DB_HOST                                      DB_NAME
```

---

## 4️⃣ Deploy

- [ ] Click "Create Web Service"
- [ ] Wait for build to complete (~2-5 minutes)
- [ ] Check logs for:
  - `Building Docker image...`
  - `Running migrations...`
  - `Server listening on port 3000`

---

## 5️⃣ Test Deployment

Your app URL: `https://t-01-express-api.onrender.com`

Test these endpoints:

```bash
# Health check
curl https://your-app.onrender.com/health

# Deep health check (database)
curl https://your-app.onrender.com/health/deep

# Menu items API
curl https://your-app.onrender.com/api/menu
```

Expected responses:
- `/health` → `{"status":"OK",...}`
- `/health/deep` → `{"status":"healthy","database":"connected",...}`
- `/api/menu` → Array of menu items

---

## 6️⃣ Verify Features

- [ ] API responds correctly
- [ ] Database connected (check `/health/deep`)
- [ ] Migrations ran successfully (check logs)
- [ ] CRUD operations work (GET/POST/PUT/DELETE)
- [ ] Logs are visible in Render dashboard
- [ ] Health checks passing

---

## 🔄 Automatic Deployments

- [ ] Verify auto-deploy is enabled (default)
- [ ] Test: Push a commit to GitHub
- [ ] Check: Render automatically redeploys

---

## 🎯 Post-Deployment

- [ ] Update `CORS_ORIGIN` with your frontend URL (if applicable)
- [ ] Set up custom domain (optional)
- [ ] Monitor database usage in Render dashboard
- [ ] Consider upgrading to paid tiers for production

---

## 📊 Monitoring

| What to Monitor | Where to Check |
|----------------|----------------|
| Application Logs | Dashboard → Web Service → Logs |
| Database Metrics | Dashboard → PostgreSQL → Metrics |
| Health Status | Dashboard → Web Service (shows status badge) |
| Request Performance | Logs tab (response times) |

---

## ⚠️ Common Issues

### Issue: Database connection failed
**Fix**: Check `DATABASE_URL` and individual DB vars are correct

### Issue: Migrations didn't run
**Fix**: Check logs for errors, verify `database.json` is committed

### Issue: App not responding
**Fix**: 
1. Check logs for errors
2. Verify PORT=3000
3. Ensure Docker builds successfully

### Issue: SSL error
**Fix**: Set `DB_SSL=true` in environment variables

---

## 💡 Tips

- **Free tier**: App spins down after 15min inactivity (first request ~30s)
- **Upgrade**: Starter plan ($7/mo) keeps app always running
- **Database**: Free tier = 1GB storage, 90 days retention
- **Logs**: Available for 7 days on free tier

---

## 📚 Resources

- Full guide: [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)
- Render Docs: https://render.com/docs
- Your deployment: https://dashboard.render.com

---

✅ **All done?** Your enterprise-grade backend is live! 🎉
