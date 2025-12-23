# Getting Started - Local Development

Complete guide for setting up and running the project locally.

---

## 📋 Prerequisites

### Required Tools:
- **Node.js** (v20 or higher)
- **Docker Desktop**
- **Git**

### Verify Installation:
```bash
node --version   # Should show v20.x or higher
npm --version    # Should show 10.x or higher
docker --version # Should show Docker version
```

---

## ⚙️ First-Time Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd t-01-express-postgresql
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment Configuration Files

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

## 🗄️ Database Setup

### **Environment Separation**

This project uses **different databases** for development and production:

| Environment | Database Name | User | Host |
|-------------|---------------|------|------|
| **Development** | `t_01_enterprise_db_dev` | `dev_user` | `localhost` |
| **Production** | `t_01_enterprise_db_prod` | `prod_user` | `postgres` (Docker) |

### Create Development Database Container

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

### Verify Database is Running
```bash
docker ps | grep postgres
# Should show t-01-enterprise-postgres-dev with status "Up"

# Test database connection
docker exec t-01-enterprise-postgres-dev pg_isready -U dev_user
```

### Run Database Migrations
```bash
npm run migrate:up
```

---

## 🚀 Running the Application

### Development Mode (with auto-reload)
```bash
npm run dev
```

The server will start at `http://localhost:3000` with hot-reload enabled.

### Production Mode (locally)
```bash
npm start
```

---

## 🧪 Testing the API

### Health Checks
```bash
# Basic health check
curl http://localhost:3000/health

# Deep health check (tests database connection)
curl http://localhost:3000/health/deep
```

### Menu API Endpoints
```bash
# Get all menu items
curl http://localhost:3000/api/menu

# Get specific menu item
curl http://localhost:3000/api/menu/1

# Create menu item
curl -X POST http://localhost:3000/api/menu \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Burger",
    "description": "Delicious burger",
    "category": "main",
    "price": 12.99
  }'

# Update menu item
curl -X PUT http://localhost:3000/api/menu/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Deluxe Burger",
    "price": 14.99
  }'

# Delete menu item
curl -X DELETE http://localhost:3000/api/menu/1
```

---

## 📂 Project Structure

```
t-01-express-postgresql/
├── src/
│   ├── app.js                    # Express app configuration
│   ├── server.js                 # Server entry point
│   ├── config/
│   │   └── db.js                 # Database connection pool
│   ├── controllers/              # HTTP handlers
│   ├── services/                 # Business logic
│   ├── repositories/             # Database queries
│   ├── routes/                   # API route definitions
│   ├── middlewares/              # Custom middleware
│   ├── schemas/                  # Request validation schemas
│   ├── errors/                   # Error classes
│   └── utils/                    # Utilities (logger, etc.)
├── migrations/                   # Database migrations
├── docs/                         # Documentation
├── .env                          # Dev environment variables (not committed)
├── database.json                 # Migration config (not committed)
├── docker-compose.yml            # Production Docker setup
├── Dockerfile                    # Docker image definition
└── package.json                  # Dependencies and scripts
```

---

## 💻 Daily Workflow

### Starting Your Work Day
```bash
# 1. Start the database (if not already running)
docker start t-01-enterprise-postgres-dev

# 2. Start the backend with hot-reload
npm run dev
```

### Stopping Your Work
```bash
# 1. Stop the backend (Ctrl+C in terminal)

# 2. Stop the database (optional, or leave it running)
docker stop t-01-enterprise-postgres-dev
```

---

## 🗃️ Database Management

### Connect to Database
```bash
docker exec -it t-01-enterprise-postgres-dev psql -U dev_user -d t_01_enterprise_db_dev
```

### Common SQL Commands
```sql
-- List all tables
\dt

-- Describe table structure
\d menu_items

-- View all menu items
SELECT * FROM menu_items;

-- Exit psql
\q
```

### Migration Commands
```bash
# Apply all pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Create new migration
npm run migrate create add-new-column
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

## 🐳 Testing Production Locally (Docker Compose)

### 1. Prepare Production Environment File
```bash
# Verify .env.production exists
cat .env.production
# Should show prod_user and t_01_enterprise_db_prod
# ⚠️ CHANGE THE PASSWORD BEFORE DEPLOYING!
```

### 2. Stop Development Database
```bash
# Free up port 5432
docker stop t-01-enterprise-postgres-dev
```

### 3. Start Production Stack
```bash
docker compose --env-file .env.production up --build

# Or run in background
docker compose --env-file .env.production up -d --build
```

This automatically:
- Creates production PostgreSQL database
- Runs migrations
- Starts the API server

### 4. Test Production API
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/menu
```

### 5. Connect to Production Database
```bash
docker compose exec postgres psql -U prod_user -d t_01_enterprise_db_prod
```

### 6. Stop Production Stack
```bash
# Stop containers
docker compose down

# Stop and remove volumes (complete reset)
docker compose down -v

# Restart development
docker start t-01-enterprise-postgres-dev
```

---

## 🔧 Configuration Files

### Development Environment (.env)
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

### Database Configuration (database.json)
```json
{
  "dev": {
    "host": "localhost",
    "port": 5432,
    "database": "t_01_enterprise_db_dev",
    "user": "dev_user",
    "password": "dev_password",
    "ssl": false
  },
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

## 🛠️ Available NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload (nodemon) |
| `npm start` | Start production server |
| `npm run start:prod` | Run migrations and start production server |
| `npm run migrate:up` | Apply all pending database migrations |
| `npm run migrate:down` | Rollback last migration |
| `npm run migrate create <name>` | Create new migration file |

---

## 📊 API Endpoints Reference

### Health Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/deep` | Health check with database test |

### Menu API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu` | Get all menu items |
| GET | `/api/menu/:id` | Get specific menu item |
| POST | `/api/menu` | Create new menu item |
| PUT | `/api/menu/:id` | Update menu item |
| DELETE | `/api/menu/:id` | Delete menu item |

---

## 🔍 Troubleshooting

### Port 5432 Already in Use
```bash
# Check what's using the port
lsof -i :5432

# Stop production containers if running
docker compose down

# Or stop specific container
docker stop t-01-enterprise-postgres-dev
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

# Verify .env file exists
ls -la .env

# Check database.json has correct settings
cat database.json
```

### Migration Errors
```bash
# Check migration status
docker exec -it t-01-enterprise-postgres-dev \
  psql -U dev_user -d t_01_enterprise_db_dev \
  -c "SELECT * FROM pgmigrations;"

# If migrations are out of sync, reset database (see above)
```

---

## 🎯 Quick Reference

**Development Stack:**
- Backend: `http://localhost:3000`
- Database: `localhost:5432`
- Database Name: `t_01_enterprise_db_dev`
- User: `dev_user` / Password: `dev_password`

**Container Name:** `t-01-enterprise-postgres-dev`

**Common Docker Commands:**
```bash
docker ps                           # List running containers
docker start <container>            # Start container
docker stop <container>             # Stop container
docker logs <container>             # View logs
docker exec -it <container> bash    # Access container shell
```

---

## ✅ Development Checklist

Daily startup:
- [ ] Docker is running
- [ ] PostgreSQL container is started
- [ ] Backend server is running (`npm run dev`)
- [ ] Health check passes (`/health`)
- [ ] Database connection works (`/health/deep`)

Before committing:
- [ ] Code lints without errors
- [ ] All API endpoints tested
- [ ] New migrations created if schema changed
- [ ] Environment files not committed

---

## 📚 Next Steps

- **Deploy to Production**: See [docs/RENDER.md](./RENDER.md) for Render deployment
- **General Cloud Deployment**: See [docs/DEPLOYMENT.md](./DEPLOYMENT.md)
- **Troubleshooting**: See [docs/TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Architecture Overview**: See main [README.md](../README.md)

---

**Happy Coding!** 🎉
