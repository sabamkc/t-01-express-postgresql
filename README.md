### Verify installation:
```
docker --version
docker compose version
```

### Run PostgreSQL via Docker

```
docker run -d \
  --name t-01-enterprise-postgres \
  -e POSTGRES_USER=<user> \
  -e POSTGRES_PASSWORD=<password> \
  -e POSTGRES_DB=t_01_enterprise_db \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16
```

### Explanation of flags:

```
-d → run in detached mode (background)
--name → container name
-e POSTGRES_USER → database username
-e POSTGRES_PASSWORD → password
-e POSTGRES_DB → database name
-p 5432:5432 → map container port to host port
-v pgdata:/var/lib/postgresql/data → persist data
```

### Verify PostgreSQL Container
```
docker ps
```

You should see t-01-enterprise-postgres running.

### Connect to Postgres inside the container:

```
docker exec -it t-01-enterprise-postgres psql -U sabamkcpostgres -d t_01_enterprise_db
```


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

Enterprise Folder Structure (Minimal but Correct)
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