# T-01 Express PostgreSQL Backend

**Enterprise-grade Express.js + PostgreSQL backend with automated migrations, security, and cloud deployment**

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 Overview

A production-ready REST API backend featuring:

- ✅ **Layered Architecture**: Controller → Service → Repository pattern
- ✅ **Security**: Helmet, CORS, rate limiting, input validation (Zod)
- ✅ **Structured Logging**: Pino with HTTP request logging
- ✅ **Database Migrations**: Automated with node-pg-migrate
- ✅ **Health Checks**: Basic (`/health`) and deep (`/health/deep`) endpoints
- ✅ **Error Handling**: Custom error classes with proper HTTP status codes
- ✅ **Docker Support**: Development and production-ready containers
- ✅ **Cloud Ready**: Deploy to Render, AWS, GCP, Azure, and more

---

## 📋 Quick Start

### Prerequisites
- **Node.js** 20+
- **Docker Desktop**
- **Git**

### Get Running in 5 Minutes

```bash
# 1. Clone repository
git clone <your-repo-url>
cd t-01-express-postgresql

# 2. Install dependencies
npm install

# 3. Start PostgreSQL
docker run -d \
  --name t-01-enterprise-postgres-dev \
  -e POSTGRES_USER=dev_user \
  -e POSTGRES_PASSWORD=dev_password \
  -e POSTGRES_DB=t_01_enterprise_db_dev \
  -p 5432:5432 \
  postgres:16

# 4. Create config files
cp .env.example .env
cp database.json.example database.json

# 5. Run migrations
npm run migrate:up

# 6. Start development server
npm run dev
```

**Server running at**: `http://localhost:3000` 🚀

Test it:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/menu
```

---

## 📚 Documentation

### Core Documentation

📖 **[Getting Started Guide](docs/GETTING_STARTED.md)**  
Complete local development setup, environment configuration, testing, and daily workflow

🚀 **[Render Deployment](docs/RENDER.md)**  
Step-by-step guide to deploy to Render.com (recommended for quick deployment)

☁️ **[Cloud Deployment](docs/DEPLOYMENT.md)**  
Deploy to AWS, Google Cloud, Azure, DigitalOcean, or Heroku

🔧 **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)**  
Common issues, solutions, and debugging techniques

---

## 🏗️ Architecture

### Project Structure

```
t-01-express-postgresql/
├── src/
│   ├── app.js                    # Express app configuration
│   ├── server.js                 # Server entry point
│   ├── config/
│   │   └── db.js                 # Database connection pool
│   ├── controllers/              # HTTP request handlers
│   │   └── menu.controller.js
│   ├── services/                 # Business logic
│   │   └── menu.service.js
│   ├── repositories/             # Database queries
│   │   └── menu.repository.js
│   ├── routes/                   # API route definitions
│   │   ├── health.routes.js
│   │   └── menu.routes.js
│   ├── middlewares/              # Custom middleware
│   │   ├── errorHandler.js
│   │   ├── httplogger.js
│   │   └── validate.js
│   ├── schemas/                  # Request validation schemas
│   │   └── menu.schema.js
│   ├── errors/                   # Error classes
│   │   └── AppError.js
│   └── utils/                    # Utilities
│       └── logger.js
├── migrations/                   # Database migrations
├── docs/                         # Documentation
├── .env.example                  # Environment template
├── database.json.example         # Migration config template
├── docker-compose.yml            # Production Docker setup
├── Dockerfile                    # Docker image definition
├── Dockerfile.production         # Optimized production build
└── package.json                  # Dependencies and scripts
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 20 | JavaScript runtime |
| **Framework** | Express.js | Web framework |
| **Database** | PostgreSQL 16 | Relational database |
| **Migrations** | node-pg-migrate | Schema version control |
| **Validation** | Zod | Request validation |
| **Logging** | Pino | Structured JSON logging |
| **Security** | Helmet, CORS | HTTP security headers |
| **Containerization** | Docker | Deployment packaging |

### Request Flow

```
HTTP Request
     ↓
HTTP Logger Middleware
     ↓
CORS & Security (Helmet)
     ↓
Rate Limiting
     ↓
Route Handler
     ↓
Validation Middleware (Zod)
     ↓
Controller (HTTP Layer)
     ↓
Service (Business Logic)
     ↓
Repository (Database Layer)
     ↓
PostgreSQL Database
     ↓
Response Chain (reverse)
     ↓
HTTP Response
```

---

## 🚀 Available Commands

### Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm start` | Start production server |
| `npm run start:prod` | Run migrations + start production server |

### Database Migrations

| Command | Description |
|---------|-------------|
| `npm run migrate:up` | Apply all pending migrations |
| `npm run migrate:down` | Rollback last migration |
| `npm run migrate create <name>` | Create new migration file |

### Docker

| Command | Description |
|---------|-------------|
| `docker compose up` | Start production stack (DB + API) |
| `docker compose down` | Stop and remove containers |
| `docker compose logs -f` | View real-time logs |

---

## 🌐 API Endpoints

### Health Checks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check (app status) |
| GET | `/health/deep` | Deep health check (includes DB test) |

### Menu API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu` | Get all menu items |
| GET | `/api/menu/:id` | Get specific menu item |
| POST | `/api/menu` | Create new menu item |
| PUT | `/api/menu/:id` | Update menu item |
| DELETE | `/api/menu/:id` | Delete menu item |

### Example Request

```bash
# Create menu item
curl -X POST http://localhost:3000/api/menu \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Burger",
    "description": "Delicious burger",
    "category": "main",
    "price": 12.99
  }'
```

---

## 🔐 Security Features

✅ **Input Validation**: All requests validated with Zod schemas  
✅ **SQL Injection Protection**: Parameterized queries with pg  
✅ **HTTP Security Headers**: Helmet middleware  
✅ **CORS Protection**: Configurable origin whitelist  
✅ **Rate Limiting**: Prevent brute-force attacks  
✅ **Error Handling**: No sensitive data leaked in errors  
✅ **Non-root Docker User**: Container security best practice  

---

## 🐳 Docker Support

### Development (Single Container)

```bash
docker run -d \
  --name t-01-enterprise-postgres-dev \
  -e POSTGRES_USER=dev_user \
  -e POSTGRES_PASSWORD=dev_password \
  -e POSTGRES_DB=t_01_enterprise_db_dev \
  -p 5432:5432 \
  postgres:16
```

### Production (Docker Compose)

```bash
# Start complete stack
docker compose --env-file .env.production up -d

# View logs
docker compose logs -f

# Stop stack
docker compose down
```

**What's included**:
- PostgreSQL database with persistent volume
- Express API with health checks
- Automatic migrations on startup
- Network isolation between services

---

## ☁️ Cloud Deployment

### Recommended: Render.com

**Why Render?**
- ✅ Free tier available
- ✅ Automatic deployments from GitHub
- ✅ Managed PostgreSQL with backups
- ✅ SSL certificates included
- ✅ Simple environment variable management

**Deploy in 10 minutes**: See [docs/RENDER.md](docs/RENDER.md)

### Other Platforms

- **AWS ECS/Fargate**: See [docs/DEPLOYMENT.md#aws-ecsfargate](docs/DEPLOYMENT.md#aws-ecsfargate)
- **Google Cloud Run**: See [docs/DEPLOYMENT.md#google-cloud-run](docs/DEPLOYMENT.md#google-cloud-run)
- **Azure Container Apps**: See [docs/DEPLOYMENT.md#azure-container-apps](docs/DEPLOYMENT.md#azure-container-apps)
- **DigitalOcean**: See [docs/DEPLOYMENT.md#digitalocean-app-platform](docs/DEPLOYMENT.md#digitalocean-app-platform)
- **Heroku**: See [docs/DEPLOYMENT.md#heroku](docs/DEPLOYMENT.md#heroku)

---

## 🔧 Configuration

### Environment Variables

Create `.env` for development:

```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Database (or use database.json)
DB_HOST=localhost
DB_PORT=5432
DB_USER=dev_user
DB_PASSWORD=dev_password
DB_NAME=t_01_enterprise_db_dev
```

### Database Configuration

Create `database.json` for migrations:

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
    "ssl": {"ENV": "DB_SSL"}
  }
}
```

**Important**: Never commit these files! They're in `.gitignore`.

---

## 📊 Production Readiness

### ✅ Completed Features

- [x] Layered architecture (Controller/Service/Repository)
- [x] Automated database migrations
- [x] Health check endpoints
- [x] Structured logging (Pino)
- [x] Error handling with custom classes
- [x] Request validation (Zod)
- [x] Security middleware (Helmet, CORS, rate limiting)
- [x] Docker containerization
- [x] Docker Compose for production
- [x] Database connection pooling
- [x] Environment-based configuration
- [x] Production-optimized Dockerfile

### 🚧 Optional Enhancements

- [ ] Authentication (JWT/OAuth)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Integration tests
- [ ] CI/CD pipeline
- [ ] Monitoring and alerting (APM)
- [ ] Caching layer (Redis)
- [ ] WebSocket support
- [ ] File upload handling

---

## 🧪 Testing

### Manual Testing

```bash
# Health checks
curl http://localhost:3000/health
curl http://localhost:3000/health/deep

# CRUD operations
curl http://localhost:3000/api/menu
curl -X POST http://localhost:3000/api/menu -H "Content-Type: application/json" -d '{"name":"Test","category":"main","price":10}'
```

### Database Testing

```bash
# Connect to database
docker exec -it t-01-enterprise-postgres-dev psql -U dev_user -d t_01_enterprise_db_dev

# Run queries
\dt                          # List tables
SELECT * FROM menu_items;    # View data
\q                           # Exit
```

---

## 🐛 Troubleshooting

### Common Issues

**Port 5432 already in use?**
```bash
docker stop t-01-enterprise-postgres-dev
# or
docker compose down
```

**Database connection failed?**
```bash
# Check if database is running
docker ps | grep postgres

# View logs
docker logs t-01-enterprise-postgres-dev
```

**Backend won't start?**
```bash
# Check for errors
npm run dev

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**More help**: See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📞 Support

- **Documentation**: Check [docs/](docs/) folder
- **Issues**: Open a GitHub issue
- **Email**: [Your email]

---

## 🎓 Learning Resources

This project demonstrates:
- **Clean Architecture**: Separation of concerns
- **SOLID Principles**: Single responsibility, dependency injection
- **Enterprise Patterns**: Repository pattern, service layer
- **Security Best Practices**: Input validation, SQL injection prevention
- **DevOps**: Docker, migrations, health checks
- **Production Readiness**: Logging, error handling, monitoring

Perfect for learning modern backend development! 🚀

---

**Built with ❤️ for enterprise-grade applications**
