# Cloud Deployment Guide

## Phase 3 Completion Checklist ✅

### 1. **Automated Migrations on Startup** ✅
- [Dockerfile](Dockerfile#L15) runs `npm run start:prod`
- [package.json](package.json#L9) defines `start:prod: npm run migrate:up && node src/server.js`
- Migrations execute before server starts in production containers

### 2. **Health Checks** ✅
- **Basic health check**: `GET /health` - Returns app status
- **Deep health check**: `GET /health/deep` - Tests DB connection
- **Docker health checks**: Both postgres and api containers monitored
- **Graceful startup**: API waits for DB to be healthy before starting

### 3. **Cloud Deployment Ready** ✅

#### Security Features
- Non-root user in Docker container
- Environment variables externalized
- Secrets protected in .gitignore
- Resource limits configured

#### Production Optimizations
- Multi-stage Docker build available ([Dockerfile.production](Dockerfile.production))
- Smaller image size
- Healthcheck built into container
- Resource limits: 512MB RAM, 1 CPU

---

## 🚀 Deploy to Cloud Platforms

### **AWS ECS/Fargate**

```bash
# 1. Build and tag image
docker build -f Dockerfile.production -t your-registry/enterprise-api:latest .

# 2. Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-registry
docker push your-registry/enterprise-api:latest

# 3. Create task definition (use .env.production variables)
# 4. Create ECS service with health check on /health/deep
```

**Environment Variables in ECS:**
- Store `.env.production` values in AWS Systems Manager Parameter Store or Secrets Manager
- Reference in task definition

---

### **Google Cloud Run**

```bash
# 1. Build image
docker build -f Dockerfile.production -t gcr.io/your-project/enterprise-api:latest .

# 2. Push to GCR
docker push gcr.io/your-project/enterprise-api:latest

# 3. Deploy
gcloud run deploy enterprise-api \
  --image gcr.io/your-project/enterprise-api:latest \
  --platform managed \
  --region us-central1 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars DB_HOST=your-cloud-sql-host
```

**Database**: Use Cloud SQL for PostgreSQL

---

### **Azure Container Apps**

```bash
# 1. Build and push
docker build -f Dockerfile.production -t your-registry.azurecr.io/enterprise-api:latest .
az acr login --name your-registry
docker push your-registry.azurecr.io/enterprise-api:latest

# 2. Deploy
az containerapp create \
  --name enterprise-api \
  --resource-group your-rg \
  --environment your-env \
  --image your-registry.azurecr.io/enterprise-api:latest \
  --target-port 3000 \
  --env-vars NODE_ENV=production
```

---

### **DigitalOcean App Platform**

```yaml
# app.yaml
name: enterprise-api
services:
- name: api
  dockerfile_path: Dockerfile.production
  github:
    repo: your-username/your-repo
    branch: main
  envs:
  - key: NODE_ENV
    value: production
  - key: DB_HOST
    value: ${db.HOSTNAME}
  health_check:
    http_path: /health/deep
databases:
- name: postgres-db
  engine: PG
  version: "16"
```

Deploy: `doctl apps create --spec app.yaml`

---

### **Heroku**

```bash
# 1. Create Heroku app
heroku create your-app-name

# 2. Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# 3. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set DB_HOST=<from-heroku>
heroku config:set DB_USER=<from-heroku>

# 4. Push
git push heroku main
```

---

## 📊 Monitoring Setup

### Health Check Endpoints

```bash
# Basic check (fast)
curl https://your-domain.com/health

# Deep check (tests DB)
curl https://your-domain.com/health/deep
```

### Recommended Tools
- **Uptime Monitoring**: UptimeRobot, Pingdom, StatusCake
- **APM**: New Relic, Datadog, AWS CloudWatch
- **Logging**: CloudWatch Logs, Google Cloud Logging, Azure Monitor

---

## 🔒 Production Checklist

Before deploying to production:

- [ ] Change passwords in `.env.production` to strong, unique values
- [ ] Use managed database service (RDS, Cloud SQL, etc.)
- [ ] Enable SSL/TLS for database connections
- [ ] Set up automated backups
- [ ] Configure log aggregation
- [ ] Set up monitoring and alerts
- [ ] Enable container scanning for vulnerabilities
- [ ] Configure CDN if serving static assets
- [ ] Set up CI/CD pipeline
- [ ] Document rollback procedures

---

## 🎯 What's Already Configured

✅ Separate dev/prod environments  
✅ Automated migrations  
✅ Health checks (basic + deep)  
✅ Docker health monitoring  
✅ Resource limits  
✅ Non-root container user  
✅ Multi-stage production build  
✅ Secret management  
✅ Environment variable injection  
✅ Graceful startup with dependency checks  

**Your app is production-ready!** 🚀
