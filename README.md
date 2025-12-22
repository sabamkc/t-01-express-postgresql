### Verify installation:
```
docker --version
docker compose version
```

---

## ⚙️ First-Time Setup (After Cloning)

**IMPORTANT**: This repo does NOT include sensitive credentials. You must create them locally:

```bash
# 1. Create .env file for development
cp .env.example .env
# Edit .env with your dev database credentials

# 2. Create database.json for migrations
cp database.json.example database.json
# Edit database.json with your dev database credentials

# 3. Create .env.production for production (only if deploying)
cp .env.production.example .env.production
# Edit .env.production with your production credentials
```

**These files are in .gitignore and will NEVER be committed.**

---

## 🔧 Environment Setup

### **IMPORTANT: Separate Dev & Prod Databases**

This project uses **different databases** for development and production:

| Environment | Database Name | User | Host |
|-------------|---------------|------|------|
| **Development** | `t_01_enterprise_db_dev` | `dev_user` | `localhost` |
| **Production** | `t_01_enterprise_db_prod` | `prod_user` | `postgres` (Docker) |

---

## 🚀 Development Setup

### 1. Run PostgreSQL for Development

```bash
docker run -d \
  --name t-01-enterprise-postgres-dev \
  -e POSTGRES_USER=dev_user \
  -e POSTGRES_PASSWORD=dev_password \
  -e POSTGRES_DB=t_01_enterprise_db_dev \
  -p 5432:5432 \
  -v pgdata_dev:/var/lib/postgresql/data \
  postgres:16
```

### 2. Verify your `.env` file exists
```bash
cat .env
# Should show dev_user and t_01_enterprise_db_dev
```

### 3. Run migrations
```bash
npm run migrate:up
```

### 4. Start development server
```bash
npm run dev
# Server runs on http://localhost:3000 with auto-reload
```

### Connect to Dev Database:
```bash
docker exec -it t-01-enterprise-postgres-dev psql -U dev_user -d t_01_enterprise_db_dev
```

---

## 🐳 Production Setup (Docker Compose)

### 1. Review `.env.production` file
```bash
cat .env.production
# Should show prod_user and t_01_enterprise_db_prod
# ⚠️ CHANGE THE PASSWORD BEFORE DEPLOYING!
```

### 2. Start entire production stack
```bash
docker compose up --build

# Or run in background
docker compose up -d --build
```

This automatically:
- Creates `t_01_enterprise_db_prod` database
- Runs migrations
- Starts the API server

### 3. Test the production API
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/menu-items
```

### Connect to Prod Database:
```bash
docker compose exec postgres psql -U prod_user -d t_01_enterprise_db_prod
```

---

### Test SQL command:

```
CREATE TABLE test_table(id SERIAL PRIMARY KEY, name VARCHAR(50));
INSERT INTO test_table(name) VALUES('John Doe');
SELECT * FROM test_table;
```


If you see the inserted row, Postgres is working.

### SQL
```
CREATE TABLE menu_items (
    item_id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL
)

SELECT * FROM menu_items;

INSERT INTO menu_items (item_name)
VALUES ('Spaghetti Bolognese'),
       ('Caesar Salad'),
       ('Margherita Pizza'),
       ('Grilled Chicken Sandwich'),
       ('Chocolate Lava Cake');
```

### Backend

```
mkdir t-01-enterprise-backend
cd t-01-enterprise-backend
npm init -y
```

```
npm install express pg dotenv
npm install --save-dev nodemon
```

Why these packages

express → HTTP framework
pg → PostgreSQL driver (lower-level, predictable, enterprise-safe)
dotenv → environment separation
nodemon → dev productivity

### Enterprise Folder Structure (Minimal but Correct)
```
t-01-enterprise-backend/
├─ src/
│  ├─ config/
│  │   └─ db.js
│  ├─ repositories/
│  │   └─ menu.repository.js
│  ├─ services/
│  │   └─ menu.service.js
│  ├─ controllers/
│  │   └─ menu.controller.js
│  ├─ routes/
│  │   └─ menu.routes.js
│  ├─ app.js
│  └─ server.js
├─ .env
├─ package.json
```

This separation is non-negotiable in enterprise codebases:

Controllers → HTTP only
Services → business logic
Repositories → DB only

### Environment Configuration (.env)

### PostgreSQL Connection (pg Pool)
Why Pool (not single client)
Connection reuse
Better performance
Production-safe

### Repository Layer (SQL Only)
Key enterprise points
Parameterized queries ($1) → SQL injection safe
No HTTP logic
No business rules here

### Service Layer (Business Logic)
Why this layer matters
Validation lives here
Business rules evolve here
Controllers stay thin

### Controller Layer (HTTP Only)

### Routes

### Express App Setup

### Server Bootstrap

### Run the Backend

### Test the API

### What You Have Now

- Dockerized PostgreSQL
- Enterprise backend layering
- Clean SQL access
- Safe queries
- Scalable structure
- This is exactly how production systems start.

| Area                 | Status | Comment                                      |
| -------------------- | ------ | -------------------------------------------- |
| Layered architecture | ✅      | Controller / Service / Repository separation |
| Database access      | ✅      | Connection pooling, parameterized SQL        |
| Environment config   | ✅      | `.env` usage                                 |
| SQL safety           | ✅      | No string concatenation, injection-safe      |
| Dockerized DB        | ✅      | Matches real-world dev/prod parity           |
| Clean API contracts  | ✅      | Predictable JSON responses                   |


### Next Enterprise Steps

- Dockerize the Node backend
- Add migrations (no manual SQL anymore)
- Add validation middleware
- Add logging (pino / winston)
- Add authentication (JWT)
- Add CI/CD + deploy live

### Upgrade Path (Exact Order – Do Not Skip)

### Phase 1 (Hard Requirement)

- Add request validation middleware
- Add structured logging
- Add error classes + handler
- Add security middleware

### Phase 2 (Production Readiness)

- Add DB migrations
- Add health checks
- Add Dockerfile for backend
- Add Docker Compose (backend + DB)

### Phase 3 (Enterprise Deployment)

- Add CI/CD
- Add prod deployment
- Add monitoring & alerting

---

### PHASE 1 — HARDEN THE CORE (MANDATORY)
### Goals of Phase 1

- Structured logging
- Typed error handling
- Request validation
- Security middleware
- Health checks

### Add Structured Logging (Enterprise Standard)
Install logging dependencies
```
npm install pino pino-http
```

- Why Pino
- Fast
- JSON logs
- Industry-standard for Node production

### Create Logger Utility
```src/utils/logger.js```

### HTTP Logging Middleware
```src/middlewares/httpLogger.js```

### Wire Logging into Express
Update ```src/app.js```

📌 You now have request-level logs with timing and status codes.

### Create Base Error Class
```src/errors/AppError.js```

### Create Error Handler Middleware
```src/middlewares/errorHandler.js```

### Update Controller to Use Errors
Update ```menu.service.js```

### Register Error Middleware
Update ```src/app.js```

### Request Validation (Enterprise Mandatory)
### Install Zod
```npm install zod```

### Validation Middleware
```src/middlewares/validate.js```

### Create Schema
```src/schemas/menu.schema.js```

### Apply Validation in Routes
Update ```menu.routes.js```

Now invalid requests never reach business logic.

### Security Middleware
Install security packages
```
npm install helmet cors express-rate-limit
```

### Wire Security Middleware
Update ```src/app.js```

This is baseline enterprise security.

### Health Check Endpoint
Add Route
```
src/routes/health.routes.js
```

Register in app.js

### PHASE 1 COMPLETE

| Area               | Status |
| ------------------ | ------ |
| Structured logging | ✅      |
| Error handling     | ✅      |
| Validation         | ✅      |
| Security           | ✅      |
| Health checks      | ✅      |
