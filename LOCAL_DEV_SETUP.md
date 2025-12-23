# Local Development Setup

## Quick Start Commands

### 1. Start Development Database
```bash
docker start t-01-enterprise-postgres-dev
```

**Alternative:** If container doesn't exist, create it:
```bash
docker run -d \
  --name t-01-enterprise-postgres-dev \
  -e POSTGRES_USER=dev_user \
  -e POSTGRES_PASSWORD=dev_password \
  -e POSTGRES_DB=t_01_enterprise_db_dev \
  -p 5432:5432 \
  postgres:16
```

### 2. Verify Database is Running
```bash
docker ps
```
Look for `t-01-enterprise-postgres-dev` with status "Up"

### 3. Run Backend (Development Mode)
```bash
npm run dev
```

---

## Step-by-Step Setup

### Initial Setup (First Time Only)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Create Development Database Container**
   ```bash
   docker run -d \
     --name t-01-enterprise-postgres-dev \
     -e POSTGRES_USER=dev_user \
     -e POSTGRES_PASSWORD=dev_password \
     -e POSTGRES_DB=t_01_enterprise_db_dev \
     -p 5432:5432 \
     postgres:16
   ```

3. **Wait for Database to be Ready**
   ```bash
   sleep 5
   docker exec t-01-enterprise-postgres-dev pg_isready -U dev_user
   ```

4. **Run Migrations**
   ```bash
   npm run migrate:up
   ```

5. **Start Backend**
   ```bash
   npm run dev
   ```

---

## Daily Workflow

### Starting Work
```bash
# Start database
docker start t-01-enterprise-postgres-dev

# Start backend with hot-reload
npm run dev
```

### Testing Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Get menu items
curl http://localhost:3000/api/menu

# Create menu item
curl -X POST http://localhost:3000/api/menu \
  -H "Content-Type: application/json" \
  -d '{"name":"Burger","description":"Delicious burger","category":"main","price":12.99}'
```

### Stopping Work
```bash
# Stop backend (Ctrl+C in terminal)

# Stop database
docker stop t-01-enterprise-postgres-dev
```

---

## Database Management

### Connect to Database
```bash
docker exec -it t-01-enterprise-postgres-dev psql -U dev_user -d t_01_enterprise_db_dev
```

### Run Migrations
```bash
# Apply all pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Create new migration
npm run migrate create migration-name
```

### View Database Logs
```bash
docker logs t-01-enterprise-postgres-dev
```

### Reset Database (Clean Slate)
```bash
# Stop and remove container with data
docker stop t-01-enterprise-postgres-dev
docker rm -v t-01-enterprise-postgres-dev

# Create fresh container
docker run -d \
  --name t-01-enterprise-postgres-dev \
  -e POSTGRES_USER=dev_user \
  -e POSTGRES_PASSWORD=dev_password \
  -e POSTGRES_DB=t_01_enterprise_db_dev \
  -p 5432:5432 \
  postgres:16

# Run migrations
npm run migrate:up
```

---

## Troubleshooting

### Port 5432 Already in Use
```bash
# Check what's using the port
lsof -i :5432

# Stop production containers if running
docker-compose down

# Or stop the specific container
docker stop t_01_enterprise-postgres
```

### Database Connection Failed
```bash
# Check if container is running
docker ps | grep postgres

# Check container logs
docker logs t-01-enterprise-postgres-dev

# Restart container
docker restart t-01-enterprise-postgres-dev
```

### Backend Won't Start
```bash
# Check for syntax errors
npm run dev

# Verify .env file exists (optional, uses database.json for dev)
ls -la .env

# Check database.json has correct dev settings
cat database.json
```

---

## Environment Configuration

### Development (.env - optional)
```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
DB_HOST=localhost
DB_PORT=5432
DB_USER=dev_user
DB_PASSWORD=dev_password
DB_NAME=t_01_enterprise_db_dev
```

### Database Config (database.json)
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

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend with nodemon (hot-reload) |
| `npm start` | Start backend in production mode |
| `npm run migrate:up` | Run all pending migrations |
| `npm run migrate:down` | Rollback last migration |
| `npm run migrate create <name>` | Create new migration file |

---

## Quick Reference

**Development Stack:**
- Backend: `http://localhost:3000`
- Database: `localhost:5432`
- Database Name: `t_01_enterprise_db_dev`
- User: `dev_user`
- Password: `dev_password`

**Container Name:** `t-01-enterprise-postgres-dev`

**Key Endpoints:**
- Health: `GET /health`
- List Menu: `GET /api/menu`
- Get Menu Item: `GET /api/menu/:id`
- Create Menu Item: `POST /api/menu`
- Update Menu Item: `PUT /api/menu/:id`
- Delete Menu Item: `DELETE /api/menu/:id`
