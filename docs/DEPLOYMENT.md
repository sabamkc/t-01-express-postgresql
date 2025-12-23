# Cloud Deployment Guide

**Deploy your Express + PostgreSQL application to various cloud platforms**

This guide covers deployment to multiple cloud providers beyond Render. For Render-specific deployment, see [RENDER.md](./RENDER.md).

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Production Readiness Checklist](#production-readiness-checklist)
- [AWS (ECS/Fargate)](#aws-ecsfargate)
- [Google Cloud Run](#google-cloud-run)
- [Azure Container Apps](#azure-container-apps)
- [DigitalOcean App Platform](#digitalocean-app-platform)
- [Heroku](#heroku)
- [General Best Practices](#general-best-practices)

---

## Prerequisites

### What's Already Built

✅ **Automated Migrations on Startup**
- [Dockerfile](../Dockerfile#L15) runs `npm run start:prod`
- [package.json](../package.json#L9) defines `start:prod: npm run migrate:up && node src/server.js`
- Migrations execute automatically before server starts

✅ **Health Checks**
- Basic: `GET /health` - Returns app status
- Deep: `GET /health/deep` - Tests database connection
- Docker health checks for postgres and API containers
- Graceful startup with dependency checks

✅ **Security Features**
- Non-root user in Docker container
- Environment variables externalized
- Secrets protected in .gitignore
- Resource limits configured

✅ **Production Optimizations**
- Multi-stage Docker build available ([Dockerfile.production](../Dockerfile.production))
- Smaller image size
- Health check built into container
- Resource limits: 512MB RAM, 1 CPU

---

## Production Readiness Checklist

Before deploying to any cloud platform:

### Configuration
- [ ] Change passwords in `.env.production` to strong, unique values
- [ ] Update `CORS_ORIGIN` to your frontend domain (not `*`)
- [ ] Set `LOG_LEVEL` appropriately (info, warn, error)
- [ ] Verify `database.json` uses `{"ENV": "VAR_NAME"}` syntax

### Infrastructure
- [ ] Use managed database service (not containerized DB in production)
- [ ] Enable SSL/TLS for database connections
- [ ] Set up automated database backups
- [ ] Configure log aggregation and monitoring
- [ ] Set up health check monitoring
- [ ] Enable container vulnerability scanning

### Security
- [ ] Review and update security middleware settings
- [ ] Configure rate limiting appropriately
- [ ] Set up secrets management (not plain environment variables)
- [ ] Enable HTTPS only
- [ ] Review CORS settings
- [ ] Audit npm packages for vulnerabilities

### Operations
- [ ] Document deployment procedures
- [ ] Create rollback procedures
- [ ] Set up CI/CD pipeline
- [ ] Configure alerts and monitoring
- [ ] Plan for database migration strategy
- [ ] Set up staging environment

---

## AWS (ECS/Fargate)

### Overview
Deploy containerized app to AWS Elastic Container Service using Fargate (serverless containers).

### Prerequisites
- AWS Account
- AWS CLI installed and configured
- Docker image registry (Amazon ECR)
- RDS PostgreSQL database

### Step 1: Create RDS PostgreSQL Database

```bash
# Using AWS CLI
aws rds create-db-instance \
  --db-instance-identifier t-01-enterprise-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16 \
  --master-username dbadmin \
  --master-user-password "YourStrongPassword" \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name your-subnet-group \
  --backup-retention-period 7 \
  --publicly-accessible false
```

Or use AWS Console:
1. Navigate to RDS → Create database
2. Choose PostgreSQL 16
3. Select Free tier (if applicable)
4. Configure security groups to allow ECS access
5. Note connection endpoint

### Step 2: Build and Push Docker Image to ECR

```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name t-01-express-api

# 2. Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com

# 3. Build production image
docker build -f Dockerfile.production -t t-01-express-api:latest .

# 4. Tag image
docker tag t-01-express-api:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/t-01-express-api:latest

# 5. Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/t-01-express-api:latest
```

### Step 3: Create ECS Task Definition

Create `task-definition.json`:

```json
{
  "family": "t-01-express-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/t-01-express-api:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"}
      ],
      "secrets": [
        {"name": "DB_HOST", "valueFrom": "arn:aws:ssm:region:account:parameter/db-host"},
        {"name": "DB_USER", "valueFrom": "arn:aws:ssm:region:account:parameter/db-user"},
        {"name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-password"},
        {"name": "DB_NAME", "valueFrom": "arn:aws:ssm:region:account:parameter/db-name"}
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "wget -q -O- http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/t-01-express-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Register task definition:
```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### Step 4: Store Secrets in AWS Systems Manager

```bash
# Store non-sensitive config in Parameter Store
aws ssm put-parameter --name "/t-01/db-host" --value "your-rds-endpoint.rds.amazonaws.com" --type String
aws ssm put-parameter --name "/t-01/db-name" --value "t_01_enterprise_db_prod" --type String
aws ssm put-parameter --name "/t-01/db-user" --value "dbadmin" --type String

# Store sensitive data in Secrets Manager
aws secretsmanager create-secret --name "/t-01/db-password" --secret-string "YourStrongPassword"
```

### Step 5: Create ECS Service

```bash
aws ecs create-service \
  --cluster your-cluster \
  --service-name t-01-express-api \
  --task-definition t-01-express-api \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=api,containerPort=3000"
```

### Step 6: Configure Application Load Balancer

1. Create ALB targeting ECS service
2. Configure health check: `/health/deep`
3. Set up HTTPS with ACM certificate
4. Configure security groups

---

## Google Cloud Run

### Overview
Serverless container platform with automatic scaling.

### Prerequisites
- Google Cloud account
- `gcloud` CLI installed
- Cloud SQL PostgreSQL database

### Step 1: Create Cloud SQL Database

```bash
# Create PostgreSQL instance
gcloud sql instances create t-01-enterprise-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create t_01_enterprise_db_prod \
  --instance=t-01-enterprise-db

# Create user
gcloud sql users create prod_user \
  --instance=t-01-enterprise-db \
  --password="YourStrongPassword"
```

### Step 2: Build and Push to Google Container Registry

```bash
# Enable APIs
gcloud services enable run.googleapis.com containerregistry.googleapis.com

# Build image
docker build -f Dockerfile.production -t gcr.io/your-project-id/t-01-express-api:latest .

# Configure Docker for GCR
gcloud auth configure-docker

# Push image
docker push gcr.io/your-project-id/t-01-express-api:latest
```

### Step 3: Deploy to Cloud Run

```bash
gcloud run deploy t-01-express-api \
  --image gcr.io/your-project-id/t-01-express-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,PORT=3000 \
  --set-secrets DB_HOST=db-host:latest,DB_USER=db-user:latest,DB_PASSWORD=db-password:latest,DB_NAME=db-name:latest \
  --add-cloudsql-instances your-project-id:us-central1:t-01-enterprise-db \
  --cpu 1 \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 10
```

### Step 4: Store Secrets in Secret Manager

```bash
# Create secrets
echo "your-db-host" | gcloud secrets create db-host --data-file=-
echo "prod_user" | gcloud secrets create db-user --data-file=-
echo "YourStrongPassword" | gcloud secrets create db-password --data-file=-
echo "t_01_enterprise_db_prod" | gcloud secrets create db-name --data-file=-
```

---

## Azure Container Apps

### Overview
Serverless container platform on Azure with auto-scaling.

### Prerequisites
- Azure account
- Azure CLI installed
- Azure Database for PostgreSQL

### Step 1: Create Resource Group

```bash
az group create \
  --name t-01-enterprise-rg \
  --location eastus
```

### Step 2: Create Azure Database for PostgreSQL

```bash
az postgres flexible-server create \
  --resource-group t-01-enterprise-rg \
  --name t-01-enterprise-db \
  --location eastus \
  --admin-user dbadmin \
  --admin-password "YourStrongPassword" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 16 \
  --storage-size 32

# Create database
az postgres flexible-server db create \
  --resource-group t-01-enterprise-rg \
  --server-name t-01-enterprise-db \
  --database-name t_01_enterprise_db_prod
```

### Step 3: Build and Push to Azure Container Registry

```bash
# Create ACR
az acr create \
  --resource-group t-01-enterprise-rg \
  --name t01enterpriseacr \
  --sku Basic

# Login to ACR
az acr login --name t01enterpriseacr

# Build and push
docker build -f Dockerfile.production -t t01enterpriseacr.azurecr.io/t-01-express-api:latest .
docker push t01enterpriseacr.azurecr.io/t-01-express-api:latest
```

### Step 4: Create Container App Environment

```bash
az containerapp env create \
  --name t-01-enterprise-env \
  --resource-group t-01-enterprise-rg \
  --location eastus
```

### Step 5: Deploy Container App

```bash
az containerapp create \
  --name t-01-express-api \
  --resource-group t-01-enterprise-rg \
  --environment t-01-enterprise-env \
  --image t01enterpriseacr.azurecr.io/t-01-express-api:latest \
  --target-port 3000 \
  --ingress external \
  --registry-server t01enterpriseacr.azurecr.io \
  --env-vars \
    NODE_ENV=production \
    PORT=3000 \
    DB_HOST=t-01-enterprise-db.postgres.database.azure.com \
    DB_PORT=5432 \
    DB_NAME=t_01_enterprise_db_prod \
    DB_USER=dbadmin \
    DB_PASSWORD="YourStrongPassword" \
    DB_SSL=true \
  --cpu 0.5 \
  --memory 1.0Gi \
  --min-replicas 0 \
  --max-replicas 5
```

---

## DigitalOcean App Platform

### Overview
Simple PaaS with managed databases and automatic deployments.

### Prerequisites
- DigitalOcean account
- `doctl` CLI (optional)

### Option 1: Using App Spec (app.yaml)

Create `app.yaml`:

```yaml
name: t-01-express-api
region: nyc

services:
  - name: api
    github:
      repo: your-username/t-01-express-postgresql
      branch: main
      deploy_on_push: true
    dockerfile_path: Dockerfile.production
    health_check:
      http_path: /health/deep
      initial_delay_seconds: 60
    envs:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "3000"
      - key: DB_HOST
        value: ${db.HOSTNAME}
      - key: DB_PORT
        value: ${db.PORT}
      - key: DB_NAME
        value: ${db.DATABASE}
      - key: DB_USER
        value: ${db.USERNAME}
      - key: DB_PASSWORD
        value: ${db.PASSWORD}
      - key: DB_SSL
        value: "true"
    instance_count: 1
    instance_size_slug: basic-xxs

databases:
  - name: db
    engine: PG
    version: "16"
    production: false
```

Deploy:
```bash
doctl apps create --spec app.yaml
```

### Option 2: Using DigitalOcean Console

1. **Create Database**:
   - Go to Databases → Create Database
   - Choose PostgreSQL 16
   - Select plan and region
   - Note connection details

2. **Create App**:
   - Go to Apps → Create App
   - Connect GitHub repository
   - Select branch
   - Choose Dockerfile.production
   - Add environment variables
   - Link to database
   - Deploy

---

## Heroku

### Overview
Classic PaaS with simple deployment via Git push.

### Prerequisites
- Heroku account
- Heroku CLI installed

### Step 1: Create Heroku App

```bash
# Login
heroku login

# Create app
heroku create t-01-express-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini
```

### Step 2: Configure Environment Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set PORT=3000
heroku config:set DB_SSL=true
heroku config:set CORS_ORIGIN=https://your-frontend.com
heroku config:set LOG_LEVEL=info
```

Database variables are set automatically by the PostgreSQL addon.

### Step 3: Create heroku.yml

```yaml
build:
  docker:
    web: Dockerfile.production
run:
  web: npm run start:prod
```

### Step 4: Deploy

```bash
# Set stack to container
heroku stack:set container

# Deploy
git push heroku main

# View logs
heroku logs --tail

# Open app
heroku open
```

---

## General Best Practices

### Database Management

✅ **Use Managed Databases**
- AWS RDS, Google Cloud SQL, Azure Database
- Automatic backups, scaling, maintenance
- High availability configurations

✅ **Enable SSL/TLS**
```javascript
// src/config/db.js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false  // For managed databases
  } : false
});
```

✅ **Connection Pooling**
- Already configured in your app
- Adjust pool size for production:
```javascript
const pool = new Pool({
  max: 20,  // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Secrets Management

✅ **Never Commit Secrets**
- Use platform-specific secret management
- AWS: Secrets Manager, Parameter Store
- GCP: Secret Manager
- Azure: Key Vault
- Heroku: Config Vars

✅ **Rotate Credentials Regularly**
- Change passwords every 90 days
- Use strong, generated passwords
- Update across all environments

### Monitoring & Logging

✅ **Centralized Logging**
- CloudWatch (AWS)
- Cloud Logging (GCP)
- Azure Monitor
- Third-party: Datadog, New Relic, Loggly

✅ **Health Check Monitoring**
- Set up external monitoring (UptimeRobot, Pingdom)
- Alert on failures
- Monitor response times

✅ **Application Performance Monitoring (APM)**
- Track request latency
- Monitor database queries
- Identify bottlenecks

### Scaling Considerations

✅ **Horizontal Scaling**
- Run multiple container instances
- Use load balancer
- Database read replicas

✅ **Vertical Scaling**
- Increase container resources
- Upgrade database tier
- Monitor resource usage

✅ **Auto-scaling**
```yaml
# Example: Google Cloud Run
--min-instances 1
--max-instances 10
--cpu-throttling  # Scale based on CPU
```

### Deployment Strategy

✅ **Blue-Green Deployment**
- Deploy to new environment
- Test thoroughly
- Switch traffic
- Keep old version for rollback

✅ **Rolling Updates**
- Update instances gradually
- Monitor health during rollout
- Automatic rollback on failure

✅ **CI/CD Pipeline**
```yaml
# Example: GitHub Actions
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and push Docker image
        # ... build steps
      - name: Deploy to Cloud
        # ... deployment steps
```

### Cost Optimization

✅ **Right-size Resources**
- Start small, scale up as needed
- Monitor actual usage
- Use auto-scaling to reduce costs

✅ **Use Free Tiers**
- Development/staging on free tiers
- Production on paid plans

✅ **Database Optimization**
- Use connection pooling
- Optimize queries
- Archive old data

---

## Platform Comparison

| Feature | AWS ECS | GCP Cloud Run | Azure Container Apps | Render | Heroku |
|---------|---------|---------------|---------------------|---------|---------|
| **Ease of Setup** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Auto-scaling** | ✅ | ✅ | ✅ | ✅ (Paid) | ✅ |
| **Free Tier** | ✅ (Limited) | ✅ (Generous) | ✅ (Limited) | ✅ (Good) | ❌ (Deprecated) |
| **Managed DB** | RDS | Cloud SQL | Azure DB | ✅ | ✅ |
| **Docker Support** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Price** | $$$ | $$ | $$ | $ | $$ |
| **Global** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Quick Start Matrix

Choose your deployment based on:

- **Simplest**: Render (see [RENDER.md](./RENDER.md))
- **Most Control**: AWS ECS
- **Best for Google Ecosystem**: GCP Cloud Run
- **Best for Microsoft Ecosystem**: Azure Container Apps
- **Cheapest at Scale**: DigitalOcean
- **Fastest Setup**: Heroku (but no free tier)

---

## Next Steps

1. **Choose Your Platform** based on requirements
2. **Set Up Database** (managed service recommended)
3. **Configure Secrets** using platform secret management
4. **Deploy Application** following platform-specific guide
5. **Configure Monitoring** and alerts
6. **Set Up CI/CD** for automated deployments
7. **Test Thoroughly** before switching production traffic

---

**Your app is production-ready!** 🚀

All features are already configured:
- ✅ Automated migrations
- ✅ Health checks
- ✅ Security middleware
- ✅ Error handling
- ✅ Logging
- ✅ Docker optimization

Choose your platform and deploy with confidence!

For Render-specific deployment, see [RENDER.md](./RENDER.md).  
For troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).  
For local development, see [GETTING_STARTED.md](./GETTING_STARTED.md).
