# 🏗️ Render Deployment Architecture

## System Overview

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
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  Docker Container (Node.js 20 Alpine)            │  │  │
│  │  │                                                   │  │  │
│  │  │  1. npm run start:prod                           │  │  │
│  │  │     ├─ npm run migrate:up (auto migrations)      │  │  │
│  │  │     └─ node src/server.js                        │  │  │
│  │  │                                                   │  │  │
│  │  │  2. Express.js Server (Port 3000)                │  │  │
│  │  │     ├─ Health Routes (/health, /health/deep)     │  │  │
│  │  │     ├─ API Routes (/api/menu)                    │  │  │
│  │  │     ├─ Error Handlers                            │  │  │
│  │  │     └─ Security (Helmet, CORS, Rate Limit)       │  │  │
│  │  │                                                   │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                          │                              │  │
│  │                          │ pg client                    │  │
│  │                          │ (SSL connection)             │  │
│  └──────────────────────────┼──────────────────────────────┘  │
│                             │                                 │
│                             ▼                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  POSTGRESQL DATABASE                                    │  │
│  │  dpg-xxxxx-internal.oregon-postgres.render.com         │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │  Database: t_01_enterprise_db_prod                      │  │
│  │  User: t_01_prod_user                                   │  │
│  │  SSL: Required                                          │  │
│  │                                                          │  │
│  │  Tables:                                                 │  │
│  │  ├─ menu_items (id, name, description, ...)            │  │
│  │  └─ pgmigrations (migration history)                    │  │
│  │                                                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ▲
                            │ HTTPS
                            │
                   ┌────────┴────────┐
                   │   Internet      │
                   │   Clients       │
                   └─────────────────┘
```

---

## Deployment Flow

```
┌─────────────────┐
│  Developer      │
│  Local Machine  │
└────────┬────────┘
         │
         │ git push origin main
         │
         ▼
┌─────────────────┐
│  GitHub         │
│  Repository     │
└────────┬────────┘
         │
         │ webhook trigger
         │
         ▼
┌─────────────────────────────────────────┐
│  Render Build System                    │
├─────────────────────────────────────────┤
│  1. Clone repository                    │
│  2. Read Dockerfile                     │
│  3. docker build                        │
│     ├─ FROM node:20-alpine             │
│     ├─ npm ci --only=production        │
│     └─ COPY application code            │
│  4. Create Docker image                 │
└────────┬────────────────────────────────┘
         │
         │ Deploy image
         │
         ▼
┌─────────────────────────────────────────┐
│  Render Runtime                         │
├─────────────────────────────────────────┤
│  1. Start container                     │
│  2. Load environment variables          │
│  3. Execute: npm run start:prod         │
│     ├─ Run migrations (node-pg-migrate) │
│     │  ├─ Check pgmigrations table      │
│     │  └─ Apply new migrations          │
│     └─ Start server                     │
│  4. Health check: GET /health           │
│  5. Route traffic to container          │
└─────────────────────────────────────────┘
```

---

## Data Flow

### Request Flow
```
Client Request
     │
     ├─ https://t-01-express-api.onrender.com/api/menu
     │
     ▼
Render Load Balancer
     │
     ├─ SSL Termination
     ├─ Health Check
     │
     ▼
Docker Container (Express.js)
     │
     ├─ HTTP Logger Middleware
     ├─ CORS Middleware
     ├─ Helmet Security
     ├─ Rate Limiting
     │
     ▼
Route Handler (/api/menu)
     │
     ├─ Validation Middleware (Zod)
     │
     ▼
Controller (menu.controller.js)
     │
     ▼
Service (menu.service.js)
     │
     ▼
Repository (menu.repository.js)
     │
     ├─ SQL Query
     │
     ▼
PostgreSQL Database (SSL)
     │
     ├─ Execute Query
     ├─ Return Results
     │
     ▼
Response Chain (reverse order)
     │
     ├─ Format JSON
     ├─ Add Headers
     ├─ Log Response
     │
     ▼
Client Receives Response
```

---

## Environment Variables Flow

```
Render Dashboard
    │
    ├─ Environment Variables Section
    │  ├─ NODE_ENV=production
    │  ├─ PORT=3000
    │  ├─ DATABASE_URL=postgresql://...
    │  ├─ DB_HOST=dpg-xxx-internal...
    │  ├─ DB_SSL=true
    │  └─ ...
    │
    ▼
Injected into Container at Runtime
    │
    ├─ process.env.NODE_ENV
    ├─ process.env.DATABASE_URL
    ├─ process.env.DB_HOST
    │
    ▼
Used by Application Code
    │
    ├─ src/config/db.js (database connection)
    ├─ src/server.js (port binding)
    ├─ database.json (migrations)
    └─ src/app.js (CORS, logging)
```

---

## Database Migration Flow

```
Container Starts
     │
     ├─ CMD ["npm", "run", "start:prod"]
     │
     ▼
Execute: npm run migrate:up
     │
     ├─ node-pg-migrate up
     │
     ▼
Read database.json
     │
     ├─ Get production config
     ├─ Extract env vars (DB_HOST, DB_USER, ...)
     │
     ▼
Connect to PostgreSQL
     │
     ├─ Check if pgmigrations table exists
     │  ├─ No: Create it
     │  └─ Yes: Continue
     │
     ▼
Check Applied Migrations
     │
     ├─ SELECT * FROM pgmigrations
     ├─ Compare with migrations/ folder
     │
     ▼
Apply New Migrations
     │
     ├─ 1766434621826_create-menu-items-table.js
     ├─ 1766445693371_add-price-column.js
     │
     ▼
Update pgmigrations Table
     │
     ├─ INSERT migration records
     │
     ▼
Migrations Complete ✓
     │
     ▼
Start Server: node src/server.js
```

---

## Health Check System

```
Render Platform (every 30 seconds)
     │
     ▼
HTTP GET: /health
     │
     ├─ Response expected within 3 seconds
     │
     ▼
Express Route Handler
     │
     ├─ Return { status: "OK", ... }
     │
     ▼
Render Evaluation
     │
     ├─ Status 200? ✓ Healthy
     ├─ Status 5xx? ✗ Unhealthy → Restart
     └─ Timeout? ✗ Unhealthy → Restart
     
     
Client Request (manual)
     │
     ▼
HTTP GET: /health/deep
     │
     ▼
Express Route Handler
     │
     ├─ Test database connection
     ├─ SELECT 1 FROM menu_items LIMIT 1
     │
     ▼
Database Response
     │
     ├─ Success: { status: "healthy", database: "connected" }
     └─ Failure: { status: "unhealthy", error: "..." }
```

---

## Monitoring Points

```
┌─────────────────────────────────────────────┐
│  Render Dashboard                           │
├─────────────────────────────────────────────┤
│                                             │
│  Web Service Metrics:                       │
│  ├─ CPU Usage                               │
│  ├─ Memory Usage (512 MB limit)            │
│  ├─ Request Count                           │
│  ├─ Response Times                          │
│  └─ Error Rate                              │
│                                             │
│  Database Metrics:                          │
│  ├─ Storage Used (1 GB free tier)          │
│  ├─ Connection Count                        │
│  ├─ Query Performance                       │
│  └─ CPU/Memory Usage                        │
│                                             │
│  Logs (Real-time):                          │
│  ├─ Application Logs (console.log)         │
│  ├─ HTTP Request Logs                       │
│  ├─ Migration Logs                          │
│  └─ Error Logs                              │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Security Layers

```
Internet → Render Edge
              │
              ├─ DDoS Protection
              ├─ SSL/TLS Termination
              │
              ▼
         Load Balancer
              │
              ├─ Health Check Routing
              │
              ▼
       Docker Container
              │
              ├─ Helmet (HTTP Headers)
              ├─ CORS (Origin Control)
              ├─ Rate Limiting (express-rate-limit)
              ├─ Input Validation (Zod)
              │
              ▼
       Application Code
              │
              ├─ SQL Parameterization (pg)
              ├─ Error Handling
              │
              ▼
      PostgreSQL Database
              │
              ├─ SSL Required
              ├─ Password Authentication
              ├─ Network Isolation (internal)
```

---

## Scaling Options

### Free Tier
```
┌──────────────┐
│ Single       │
│ Container    │  ← Spins down after 15min
│ 512MB RAM    │  ← Cold start ~30s
└──────────────┘
```

### Starter Plan ($7/month)
```
┌──────────────┐
│ Single       │
│ Container    │  ← Always running
│ 512MB RAM    │  ← No cold starts
└──────────────┘
```

### Standard+ Plans
```
┌──────────────┐   ┌──────────────┐
│ Container 1  │   │ Container 2  │  ← Auto-scaling
│ 2GB+ RAM     │   │ 2GB+ RAM     │  ← Load balanced
└──────────────┘   └──────────────┘
```

---

This architecture provides:
✅ Automatic deployments from GitHub
✅ Managed PostgreSQL with automatic backups
✅ SSL/TLS encryption
✅ Health monitoring and auto-restart
✅ Centralized logging
✅ Zero-downtime deployments
✅ Environment variable management
✅ Database migration automation
