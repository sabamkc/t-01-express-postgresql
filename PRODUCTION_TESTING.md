# Production Configuration Testing - Issue Resolution

## Initial Problem
Testing production configuration locally failed when running `docker-compose up --build` followed by `npm run start:prod`.

## Issues Encountered & Solutions

### 1. Migration Conflict (First Run)
**Issue:** Duplicate migration error
```
Error: Not run migration 1766445693371_add-price-column is preceding already run migration 1766445171188_add-price-column
```

**Root Cause:** Production database had a migration record (`1766445171188`) that didn't exist in the migrations folder. Only `1766445693371_add-price-column.js` existed.

**Solution:** Reset production database
```bash
docker-compose down -v
```

---

### 2. Port Conflict (Second Run)
**Issue:** Container startup failed
```
Error: Bind for 0.0.0.0:5432 failed: port is already allocated
```

**Root Cause:** Dev PostgreSQL container (`t-01-enterprise-postgres-dev`) was already using port 5432.

**Solution:** Stop dev container before starting production
```bash
docker stop t-01-enterprise-postgres-dev
docker-compose --env-file .env.production up -d
```

---

### 3. Environment Variables Not Loading (Third Run)
**Issue:** API container kept restarting with connection errors
```
Error: getaddrinfo ENOTFOUND postgres
[dotenv@17.2.3] injecting env (0) from .env
```

**Root Cause:** 
- `docker-compose.yml` referenced `.env.production` file via `env_file` directive
- However, `node-pg-migrate` uses `dotenv` package which looks for `.env` file inside the container
- Environment variables were set at container level but not accessible to `dotenv`
- `database.json` had hardcoded values instead of referencing environment variables

**Solution:** Update `database.json` to use environment variables
```json
{
  "production": {
    "host": {"ENV": "DB_HOST"},
    "port": {"ENV": "DB_PORT"},
    "database": {"ENV": "DB_NAME"},
    "user": {"ENV": "DB_USER"},
    "password": {"ENV": "DB_PASSWORD"},
    "ssl": false
  }
}
```

---

## Final Working Setup

### Required Files

**1. `.env.production`**
```env
NODE_ENV=production
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_USER=prod_user
DB_PASSWORD=prod_password
DB_NAME=t_01_enterprise_db_prod
POSTGRES_USER=prod_user
POSTGRES_PASSWORD=prod_password
POSTGRES_DB=t_01_enterprise_db_prod
```

**2. `database.json`** (production section)
```json
"production": {
  "host": {"ENV": "DB_HOST"},
  "port": {"ENV": "DB_PORT"},
  "database": {"ENV": "DB_NAME"},
  "user": {"ENV": "DB_USER"},
  "password": {"ENV": "DB_PASSWORD"},
  "ssl": false
}
```

### Commands to Run Production Locally

```bash
# Stop dev container to free port 5432
docker stop t-01-enterprise-postgres-dev

# Start production with environment file
docker-compose --env-file .env.production up --build -d

# Verify containers are healthy
docker-compose ps

# Test the API
curl http://localhost:3000/health
```

### Clean Up

```bash
# Stop production containers
docker-compose down

# Restart dev container
docker start t-01-enterprise-postgres-dev
```

---

## Key Learnings

1. **Environment Variable Resolution**: Docker Compose's `env_file` sets variables at container level, but tools like `dotenv` need them accessible within the application. Using `{"ENV": "VAR_NAME"}` in `database.json` bridges this gap.

2. **Migration State Management**: Always ensure migration files match the database state. Use `docker-compose down -v` to reset databases during testing.

3. **Port Management**: When running multiple environments locally, manage port conflicts by stopping one environment before starting another.

4. **Container Health**: Both postgres and API containers have health checks. Wait for "healthy" status before testing endpoints.

---

## Production Status
✅ API Running: `http://localhost:3000`  
✅ Database: `localhost:5432`  
✅ Environment: `production`  
✅ Migrations: Successfully applied  
✅ Health Check: Passing
