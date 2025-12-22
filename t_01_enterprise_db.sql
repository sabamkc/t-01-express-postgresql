CREATE TABLE menu_items (
    item_id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL
)

DROP TABLE IF EXISTS menu_items;

SELECT * FROM menu_items;

INSERT INTO menu_items (item_name)
VALUES ('Spaghetti Bolognese'),
       ('Caesar Salad'),
       ('Margherita Pizza'),
       ('Grilled Chicken Sandwich'),
       ('Chocolate Lava Cake');

docker run -d \
  --name t-01-enterprise-postgres \
  -e POSTGRES_USER=sabamkcpostgres \
  -e POSTGRES_PASSWORD=sabamkc \
  -e POSTGRES_DB=t_01_enterprise_db \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16       

  SELECT * FROM pgmigrations;

  SELECT * FROM menu_items;