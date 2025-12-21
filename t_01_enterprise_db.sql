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

       