# Troubleshooting Guide

Common issues, solutions, and debugging techniques for development and production environments.

---

## Table of Contents

- [Local Development Issues](#local-development-issues)
- [Production Testing Issues](#production-testing-issues)
- [Deployment Issues](#deployment-issues)
- [Database Issues](#database-issues)
- [Migration Issues](#migration-issues)
- [Docker Issues](#docker-issues)
- [Environment Variable Issues](#environment-variable-issues)

---

## Local Development Issues

### Port 5432 Already in Use

**Symptoms**: Cannot start PostgreSQL container, error: "port is already allocated"

**Solutions**:

```bash
# 1. Check what's using the port
lsof -i :5432

# 2. Stop production containers if running
docker compose down

# 3. Stop specific development container
docker stop t-01-enterprise-postgres-dev

# 4. Or stop any other PostgreSQL process
brew services stop postgresql  # If using Homebrew PostgreSQL
```

**Root Cause**: Multiple database containers or local PostgreSQL installation using the same port.

---

### Backend Won't Start

**Symptoms**: `npm run dev` fails or crashes immediately

**Solutions**:

```bash
# 1. Check for syntax errors
npm run dev
# Read error messages carefully

# 2. Verify .env file exists (optional for dev)
ls -la .env

# 3. Check database.json configuration
cat database.json
# Ensure "dev" section has correct credentials

# 4. Verify dependencies are installed
npm install

# 5. Check Node version
node --version  # Should be v20+
```

**Common Causes**:
- Missing dependencies
- Syntax errors in code
- Wrong Node.js version
- Missing configuration files

---

### Database Connection Failed (Development)

**Symptoms**: Backend starts but crashes on first database query

**Solutions**:

```bash
# 1. Check if database container is running
docker ps | grep postgres

# 2. Verify container health
docker logs t-01-enterprise-postgres-dev

# 3. Test database connection directly
docker exec -it t-01-enterprise-postgres-dev \
  psql -U dev_user -d t_01_enterprise_db_dev

# 4. Restart container
docker restart t-01-enterprise-postgres-dev

# 5. Verify credentials in database.json match container
cat database.json  # Check "dev" section
```

**Database.json Configuration**:
```json
{
  "dev": {
    "host": "localhost",
    "port": 5432,
    "database": "t_01_enterprise_db_dev",
    "user": "dev_user",
    "password": "dev_password",
    "ssl": false
  }
}
```

---

### Module Not Found Errors

**Symptoms**: `Error: Cannot find module 'express'` or similar

**Solution**:
```bash
# Clean install all dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## Production Testing Issues

### Issue 1: Migration Conflict

**Symptoms**: 
```
Error: Not run migration 1766445693371_add-price-column is preceding 
already run migration 1766445171188_add-price-column
```

**Root Cause**: Production database has migration records that don't exist in the migrations folder.

**Solution**: Reset production database
```bash
# Stop and remove all containers and volumes
docker compose down -v

# Start fresh
docker compose --env-file .env.production up --build
```

**Prevention**: Always keep migrations folder in sync with database state.

---

### Issue 2: Port Conflict Between Dev and Prod

**Symptoms**: 
```
Error: Bind for 0.0.0.0:5432 failed: port is already allocated
```

**Root Cause**: Development PostgreSQL container already using port 5432.

**Solution**: Stop development container before starting production
```bash
# Stop dev container
docker stop t-01-enterprise-postgres-dev

# Start production stack
docker compose --env-file .env.production up -d

# When done, restart dev
docker compose down
docker start t-01-enterprise-postgres-dev
```

**Best Practice**: Only run one environment at a time locally.

---

### Issue 3: Environment Variables Not Loading

**Symptoms**: 
- API container keeps restarting
- Connection errors: "getaddrinfo ENOTFOUND postgres"
- Logs show: `[dotenv@17.2.3] injecting env (0) from .env`

**Root Cause**: 
- `docker-compose.yml` loads `.env.production` via `env_file` directive
- BUT `node-pg-migrate` uses `dotenv` package which looks for `.env` file
- `database.json` had hardcoded values instead of environment variable references

**Solution**: Update `database.json` to use environment variables

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

**Key Learning**: Docker Compose's `env_file` sets variables at container level, but tools like `dotenv` need them accessible within the application. Using `{"ENV": "VAR_NAME"}` bridges this gap.

---

### Issue 4: Container Health Check Failing

**Symptoms**: Production containers show "unhealthy" status

**Solutions**:

```bash
# 1. Check container logs
docker logs t_01_enterprise-api

# 2. Verify health check endpoint
curl http://localhost:3000/health

# 3. Check if migrations completed
docker logs t_01_enterprise-api | grep migration

# 4. Wait for database to be healthy first
docker compose ps  # Check postgres health status
```

**Expected Flow**:
1. PostgreSQL container starts and becomes "healthy"
2. API container waits for database
3. Migrations run
4. Server starts
5. Health check passes

---

## Deployment Issues

### Build Timeout on Render

**Symptoms**: Deployment fails after 15 minutes

**Solutions**:
```dockerfile
# Optimize Dockerfile
RUN npm ci --only=production  # Faster than npm install
RUN npm prune --production    # Remove dev dependencies
```

**Check**:
- Remove large files from repository
- Use `.dockerignore` to exclude unnecessary files
- Consider multi-stage builds

---

### Render: Database Connection Failed

**Symptoms**: 
- API returns 500 errors
- Logs show "connection refused" or "ENOTFOUND"

**Solutions**:

1. **Verify Internal Database URL is used**:
   ```bash
   # In Render dashboard, check DATABASE_URL
   # Should end with: -internal.region-postgres.render.com
   ```

2. **Check all DB environment variables**:
   ```bash
   DB_HOST=dpg-xxx-internal.oregon-postgres.render.com  # NOT external URL
   DB_SSL=true  # Required for Render
   DB_PORT=5432
   DB_NAME=your_database_name
   DB_USER=your_user
   DB_PASSWORD=your_password
   ```

3. **Test connection from Render Shell**:
   ```bash
   # Dashboard → Service → Shell
   psql $DATABASE_URL
   ```

---

### Render: SSL Connection Error

**Symptoms**: "SSL connection failed" in production logs

**Solution**: 

1. Set environment variable:
   ```
   DB_SSL=true
   ```

2. Update database configuration:
   ```javascript
   // src/config/db.js
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: process.env.DB_SSL === 'true' 
       ? { rejectUnauthorized: false } 
       : false
   });
   ```

---

### Render: Migrations Not Running

**Symptoms**: Tables don't exist, API errors on queries

**Solutions**:

1. **Check deployment logs** for migration errors
2. **Verify `database.json` is committed** to repository
3. **Ensure `start:prod` script** includes migrations:
   ```json
   {
     "scripts": {
       "start:prod": "npm run migrate:up && node src/server.js"
     }
   }
   ```
4. **Manually run migrations** via Render Shell:
   ```bash
   npm run migrate:up
   ```

---

### Render: Free Tier Cold Starts

**Symptoms**: First request after 15 minutes takes 30+ seconds

**Explanation**: This is expected behavior on free tier. Service spins down after inactivity.

**Solutions**:
- **Accept the trade-off** for free hosting
- **Upgrade to Starter plan** ($7/month) for always-on service
- **Document for users**: "First load may take 30 seconds"

---

## Database Issues

### Cannot Connect to PostgreSQL

**Development**:
```bash
# Check container status
docker ps -a | grep postgres

# If stopped, start it
docker start t-01-enterprise-postgres-dev

# If doesn't exist, create it
docker run -d \
  --name t-01-enterprise-postgres-dev \
  -e POSTGRES_USER=dev_user \
  -e POSTGRES_PASSWORD=dev_password \
  -e POSTGRES_DB=t_01_enterprise_db_dev \
  -p 5432:5432 \
  postgres:16
```

**Production (Docker Compose)**:
```bash
# Check service status
docker compose ps

# Restart database
docker compose restart postgres

# View logs
docker compose logs postgres
```

---

### Database Disk Space Full

**Symptoms**: "disk full" errors, write operations fail

**Solutions**:

**Development**:
```bash
# Check Docker disk usage
docker system df

# Clean up unused data
docker system prune -a --volumes

# Or reset database completely
docker stop t-01-enterprise-postgres-dev
docker rm -v t-01-enterprise-postgres-dev
# Recreate container
```

**Production (Render)**:
- Upgrade database plan for more storage
- Archive/delete old data
- Check database metrics in dashboard

---

### Slow Database Queries

**Diagnosis**:
```sql
-- In psql, enable query timing
\timing on

-- Check slow queries
EXPLAIN ANALYZE SELECT * FROM menu_items WHERE category = 'main';

-- Check table size
SELECT pg_size_pretty(pg_total_relation_size('menu_items'));
```

**Solutions**:
- Add indexes to frequently queried columns
- Optimize queries (avoid SELECT *)
- Check for missing JOINs or N+1 queries

---

## Migration Issues

### Migration State Mismatch

**Symptoms**: Migration table doesn't match migration files

**Check Migration State**:
```bash
# Connect to database
docker exec -it t-01-enterprise-postgres-dev \
  psql -U dev_user -d t_01_enterprise_db_dev

# Check applied migrations
SELECT * FROM pgmigrations ORDER BY run_on;
```

**Solutions**:

1. **Rollback problematic migration**:
   ```bash
   npm run migrate:down
   ```

2. **Reset database** (development only):
   ```bash
   docker stop t-01-enterprise-postgres-dev
   docker rm -v t-01-enterprise-postgres-dev
   # Recreate container and run migrations
   ```

3. **Manually fix migration table** (advanced):
   ```sql
   -- Remove specific migration record
   DELETE FROM pgmigrations WHERE name = '1766445693371_add-price-column';
   ```

---

### Migration Fails to Apply

**Symptoms**: Error during `npm run migrate:up`

**Common Causes**:

1. **SQL Syntax Error**:
   ```bash
   # Check migration file for syntax errors
   cat migrations/1234567890_my-migration.js
   ```

2. **Duplicate Column/Table**:
   ```sql
   -- Use IF NOT EXISTS
   CREATE TABLE IF NOT EXISTS menu_items (...);
   ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
   ```

3. **Missing Dependencies**:
   ```bash
   # Ensure all previous migrations ran
   npm run migrate:up
   ```

---

### Cannot Rollback Migration

**Symptoms**: `npm run migrate:down` fails

**Solution**: Check migration file has proper `down` function

```javascript
// migrations/1234567890_example.js
exports.up = (pgm) => {
  pgm.createTable('menu_items', {...});
};

exports.down = (pgm) => {
  pgm.dropTable('menu_items');  // Must undo 'up' changes
};
```

---

## Docker Issues

### Docker Daemon Not Running

**Symptoms**: "Cannot connect to Docker daemon"

**Solution**:
```bash
# macOS
open -a Docker

# Linux
sudo systemctl start docker

# Verify
docker ps
```

---

### Container Exits Immediately

**Symptoms**: Container starts then stops

**Diagnosis**:
```bash
# View container logs
docker logs <container-name>

# Check exit code
docker inspect <container-name> | grep ExitCode
```

**Common Causes**:
- Application crashes on startup
- Missing environment variables
- Port already in use
- Command completes immediately (use CMD not RUN)

---

### Cannot Remove Container

**Symptoms**: "container is running" when trying to remove

**Solution**:
```bash
# Stop then remove
docker stop <container-name>
docker rm <container-name>

# Force remove (use with caution)
docker rm -f <container-name>
```

---

### Image Build Fails

**Symptoms**: `docker build` or `docker compose build` fails

**Solutions**:

1. **Check Dockerfile syntax**
2. **Clear build cache**:
   ```bash
   docker builder prune -a
   ```
3. **Build with verbose output**:
   ```bash
   docker compose build --progress=plain
   ```

---

## Environment Variable Issues

### Variables Not Loading in Application

**Symptoms**: `process.env.VAR_NAME` is undefined

**Solutions**:

1. **Verify file exists**:
   ```bash
   ls -la .env .env.production
   ```

2. **Check file format** (no quotes needed):
   ```env
   # Correct
   DB_HOST=localhost
   
   # Incorrect (unless you want quotes in value)
   DB_HOST="localhost"
   ```

3. **Restart application** after changing .env

4. **Check loading order**:
   ```javascript
   require('dotenv').config();  // Must be at top of entry file
   console.log(process.env.DB_HOST);  // Debug
   ```

---

### Wrong Environment Loaded

**Symptoms**: Development config used in production or vice versa

**Solutions**:

1. **Explicitly specify env file**:
   ```bash
   docker compose --env-file .env.production up
   ```

2. **Check NODE_ENV**:
   ```javascript
   console.log(`Environment: ${process.env.NODE_ENV}`);
   ```

3. **Use different files**:
   - Development: `.env` or default
   - Production: `.env.production`

---

### Environment Variables in database.json

**Problem**: Migration can't access environment variables

**Solution**: Use ENV syntax

```json
{
  "production": {
    "host": {"ENV": "DB_HOST"},
    "port": {"ENV": "DB_PORT"},
    "database": {"ENV": "DB_NAME"},
    "user": {"ENV": "DB_USER"},
    "password": {"ENV": "DB_PASSWORD"}
  }
}
```

**NOT**:
```json
{
  "production": {
    "host": "localhost",  // ❌ Hardcoded
    "port": 5432
  }
}
```

---

## Debugging Techniques

### Enable Detailed Logging

```javascript
// src/utils/logger.js
const logger = pino({
  level: process.env.LOG_LEVEL || 'debug',  // Use 'debug' for troubleshooting
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard'
    }
  }
});
```

### Database Query Logging

```javascript
// src/config/db.js
const pool = new Pool({
  // ... connection config
});

// Log all queries (development only)
if (process.env.NODE_ENV === 'development') {
  pool.on('query', (query) => {
    console.log('QUERY:', query.text);
    console.log('VALUES:', query.values);
  });
}
```

### Docker Container Debugging

```bash
# Enter running container
docker exec -it <container-name> sh

# Check environment variables inside container
docker exec <container-name> env

# View real-time logs
docker logs -f <container-name>

# Check container resource usage
docker stats <container-name>
```

### Network Debugging

```bash
# Test API from inside container
docker exec <container-name> wget -O- http://localhost:3000/health

# Check if port is accessible
nc -zv localhost 3000

# View all container networks
docker network ls
docker network inspect <network-name>
```

---

## Quick Diagnostic Checklist

When something goes wrong, check in this order:

### 1. Is it running?
```bash
docker ps                    # Containers
curl http://localhost:3000   # API
```

### 2. Check logs
```bash
docker logs <container>      # Container logs
npm run dev                  # Application logs
```

### 3. Verify configuration
```bash
cat .env                     # Environment variables
cat database.json            # Database config
docker inspect <container>   # Container config
```

### 4. Test connections
```bash
curl http://localhost:3000/health         # API health
docker exec <db> pg_isready -U dev_user   # Database
```

### 5. Check resources
```bash
docker system df             # Docker disk usage
docker stats                 # Container resources
df -h                        # System disk space
```

---

## Getting Additional Help

### Logs to Include When Asking for Help

1. **Application Logs**:
   ```bash
   docker logs <api-container> > api-logs.txt
   ```

2. **Database Logs**:
   ```bash
   docker logs <postgres-container> > db-logs.txt
   ```

3. **Environment Info**:
   ```bash
   node --version > env-info.txt
   docker --version >> env-info.txt
   npm --version >> env-info.txt
   ```

4. **Configuration** (sanitize secrets first):
   ```bash
   cat database.json
   cat docker-compose.yml
   env | grep -v PASSWORD  # Environment variables without passwords
   ```

### Useful Resources

- **Node.js Docs**: https://nodejs.org/docs
- **Express Docs**: https://expressjs.com
- **PostgreSQL Docs**: https://www.postgresql.org/docs
- **Docker Docs**: https://docs.docker.com
- **Render Docs**: https://render.com/docs
- **pg (node-postgres)**: https://node-postgres.com

---

## Prevention Tips

### ✅ Always Use Version Control
```bash
git add .
git commit -m "Working state before changes"
```

### ✅ Document Your Changes
Keep notes of configuration changes, especially environment variables.

### ✅ Test Locally Before Deploying
```bash
# Test production configuration locally
docker compose --env-file .env.production up
```

### ✅ Regular Backups
- Development: Backup database regularly
- Production: Verify automatic backups are enabled

### ✅ Monitor Your Application
- Set up health checks
- Monitor logs regularly
- Watch resource usage

---

**Still Stuck?** 

1. Check the [GETTING_STARTED.md](./GETTING_STARTED.md) guide
2. Review [RENDER.md](./RENDER.md) for deployment-specific issues
3. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for cloud platform guidance
4. Search GitHub Issues in your repository
5. Check Stack Overflow for similar issues

Remember: Most issues are configuration-related. Double-check your environment variables, file permissions, and network settings.
