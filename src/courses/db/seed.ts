// The playground dataset: a small online shop plus a few tables used by the hard problems.
// Everything is SQLite (sql.js) so it runs in the browser and in the tests.

export const SEED_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE customers (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  city       TEXT,
  country    TEXT NOT NULL,
  signed_up  DATE NOT NULL
);

CREATE TABLE products (
  id        INTEGER PRIMARY KEY,
  name      TEXT NOT NULL,
  category  TEXT NOT NULL,
  price     REAL NOT NULL CHECK (price >= 0),
  stock     INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0)
);

CREATE TABLE orders (
  id           INTEGER PRIMARY KEY,
  customer_id  INTEGER NOT NULL REFERENCES customers(id),
  ordered_at   DATETIME NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('pending','paid','shipped','cancelled'))
);

CREATE TABLE order_items (
  id          INTEGER PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id),
  qty         INTEGER NOT NULL CHECK (qty > 0),
  unit_price  REAL NOT NULL
);

CREATE TABLE payments (
  id        INTEGER PRIMARY KEY,
  order_id  INTEGER NOT NULL REFERENCES orders(id),
  amount    REAL NOT NULL,
  method    TEXT NOT NULL,
  paid_at   DATETIME NOT NULL
);

CREATE TABLE employees (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  dept        TEXT NOT NULL,
  salary      INTEGER NOT NULL,
  manager_id  INTEGER REFERENCES employees(id),
  hired_on    DATE NOT NULL
);

CREATE TABLE product_tags (
  product_id  INTEGER NOT NULL REFERENCES products(id),
  tag         TEXT NOT NULL,
  PRIMARY KEY (product_id, tag)
);

CREATE TABLE logins (
  user_id  INTEGER NOT NULL,
  day      DATE NOT NULL,
  PRIMARY KEY (user_id, day)
);

CREATE TABLE bookings (
  id         INTEGER PRIMARY KEY,
  room_id    INTEGER NOT NULL,
  guest      TEXT NOT NULL,
  starts_at  DATE NOT NULL,
  ends_at    DATE NOT NULL,
  CHECK (ends_at > starts_at)
);

CREATE TABLE accounts (
  id       INTEGER PRIMARY KEY,
  owner    TEXT NOT NULL,
  balance  REAL NOT NULL CHECK (balance >= 0),
  version  INTEGER NOT NULL DEFAULT 1
);

INSERT INTO customers (id, name, email, city, country, signed_up) VALUES
 (1,'Aarav Mehta','aarav@example.com','Mumbai','India','2024-01-05'),
 (2,'Priya Nair','priya@example.com','Kochi','India','2024-01-19'),
 (3,'Liam Walker','liam@example.com','London','UK','2024-02-02'),
 (4,'Sofia Rossi','sofia@example.com','Milan','Italy','2024-02-14'),
 (5,'Noah Kim','noah@example.com','Seoul','South Korea','2024-03-01'),
 (6,'Emma Clarke','emma@example.com','Manchester','UK','2024-03-20'),
 (7,'Rahul Verma','rahul@example.com','Delhi','India','2024-04-11'),
 (8,'Olivia Brown','olivia@example.com','New York','USA','2024-05-02'),
 (9,'Mateo Garcia','mateo@example.com','Madrid','Spain','2024-05-30'),
 (10,'Hana Sato','hana@example.com','Tokyo','Japan','2024-06-18'),
 (11,'Zara Khan','zara@example.com','Kolkata','India','2024-07-07'),
 (12,'Ethan Miller','ethan@example.com','Austin','USA','2024-08-21'),
 (13,'Ishaan Roy','ishaan@example.com','Pune','India','2024-09-10');

INSERT INTO products (id, name, category, price, stock) VALUES
 (1,'Mechanical Keyboard','Electronics',89.00,40),
 (2,'USB-C Hub','Electronics',35.00,120),
 (3,'Noise-Cancelling Headphones','Electronics',199.00,15),
 (4,'Standing Desk','Furniture',449.00,8),
 (5,'Ergonomic Chair','Furniture',329.00,12),
 (6,'Desk Lamp','Furniture',45.00,60),
 (7,'Clean Code (book)','Books',32.00,200),
 (8,'Designing Data-Intensive Apps (book)','Books',48.00,150),
 (9,'Yoga Mat','Fitness',25.00,90),
 (10,'Water Bottle','Fitness',15.00,300),
 (11,'Gift Card','Misc',50.00,999);

INSERT INTO product_tags (product_id, tag) VALUES
 (1,'office'),(1,'gaming'),(2,'office'),(3,'travel'),(3,'office'),
 (4,'office'),(5,'office'),(6,'office'),(7,'engineering'),(8,'engineering'),
 (8,'bestseller'),(9,'health'),(10,'health'),(10,'travel');

INSERT INTO orders (id, customer_id, ordered_at, status) VALUES
 (1,1,'2025-01-03 10:12:00','paid'),
 (2,2,'2025-01-04 15:40:00','shipped'),
 (3,3,'2025-01-10 09:05:00','paid'),
 (4,1,'2025-01-15 18:22:00','cancelled'),
 (5,4,'2025-01-20 11:00:00','shipped'),
 (6,5,'2025-02-01 08:45:00','paid'),
 (7,6,'2025-02-03 13:10:00','pending'),
 (8,7,'2025-02-10 16:30:00','paid'),
 (9,1,'2025-02-14 12:00:00','shipped'),
 (10,8,'2025-02-20 20:15:00','paid'),
 (11,9,'2025-03-01 10:00:00','shipped'),
 (12,2,'2025-03-05 09:30:00','paid'),
 (13,10,'2025-03-12 14:00:00','cancelled'),
 (14,3,'2025-03-18 17:45:00','paid'),
 (15,11,'2025-03-25 11:11:00','shipped'),
 (16,1,'2025-04-02 08:00:00','paid'),
 (17,7,'2025-04-09 19:20:00','pending'),
 (18,5,'2025-04-15 10:10:00','shipped'),
 (19,8,'2025-04-22 13:00:00','paid'),
 (20,2,'2025-05-01 15:00:00','paid'),
 (21,12,'2025-05-06 09:00:00','shipped'),
 (22,4,'2025-05-14 12:30:00','paid'),
 (23,9,'2025-05-20 18:00:00','pending'),
 (24,1,'2025-06-01 10:00:00','paid');

INSERT INTO order_items (id, order_id, product_id, qty, unit_price) VALUES
 (1,1,1,1,89.00),(2,1,2,2,35.00),
 (3,2,7,1,32.00),(4,2,8,1,48.00),
 (5,3,3,1,199.00),
 (6,4,4,1,449.00),
 (7,5,5,1,329.00),(8,5,6,2,45.00),
 (9,6,9,2,25.00),(10,6,10,3,15.00),
 (11,7,1,1,89.00),
 (12,8,8,2,48.00),(13,8,7,1,32.00),
 (14,9,2,1,35.00),(15,9,6,1,45.00),
 (16,10,3,1,199.00),(17,10,2,1,35.00),
 (18,11,4,1,449.00),(19,11,5,1,329.00),
 (20,12,10,5,15.00),
 (21,13,3,1,199.00),
 (22,14,1,2,89.00),
 (23,15,9,1,25.00),(24,15,8,1,48.00),
 (25,16,8,1,48.00),(26,16,7,1,32.00),(27,16,2,1,32.00),
 (28,17,5,1,329.00),
 (29,18,1,1,89.00),(30,18,3,1,199.00),
 (31,19,6,3,45.00),
 (32,20,2,2,35.00),(33,20,10,2,15.00),
 (34,21,4,1,449.00),
 (35,22,7,3,32.00),
 (36,23,9,2,25.00),
 (37,24,3,1,199.00),(38,24,1,1,89.00),(39,24,10,1,15.00);

INSERT INTO payments (id, order_id, amount, method, paid_at) VALUES
 (1,1,159.00,'card','2025-01-03 10:13:00'),
 (2,2,80.00,'upi','2025-01-04 15:41:00'),
 (3,3,199.00,'card','2025-01-10 09:06:00'),
 (4,5,419.00,'card','2025-01-20 11:02:00'),
 (5,6,95.00,'paypal','2025-02-01 08:46:00'),
 (6,8,128.00,'upi','2025-02-10 16:31:00'),
 (7,9,80.00,'card','2025-02-14 12:01:00'),
 (8,10,234.00,'card','2025-02-20 20:16:00'),
 (9,11,778.00,'card','2025-03-01 10:02:00'),
 (10,12,75.00,'upi','2025-03-05 09:31:00'),
 (11,14,178.00,'paypal','2025-03-18 17:46:00'),
 (12,15,73.00,'upi','2025-03-25 11:12:00'),
 (13,16,112.00,'card','2025-04-02 08:01:00'),
 (14,18,288.00,'card','2025-04-15 10:11:00'),
 (15,19,135.00,'paypal','2025-04-22 13:01:00'),
 (16,20,100.00,'upi','2025-05-01 15:01:00'),
 (17,21,449.00,'card','2025-05-06 09:01:00'),
 (18,22,96.00,'card','2025-05-14 12:31:00'),
 (19,24,303.00,'card','2025-06-01 10:01:00');

INSERT INTO employees (id, name, dept, salary, manager_id, hired_on) VALUES
 (1,'Meera Iyer','Leadership',250000,NULL,'2018-01-15'),
 (2,'Dev Patel','Engineering',180000,1,'2019-03-01'),
 (3,'Sara Ahmed','Sales',150000,1,'2019-06-10'),
 (4,'Arjun Rao','Engineering',140000,2,'2020-02-20'),
 (5,'Nina Das','Engineering',135000,2,'2020-09-01'),
 (6,'Tom Hughes','Engineering',120000,4,'2021-05-17'),
 (7,'Lina Park','Engineering',118000,4,'2022-01-10'),
 (8,'Omar Ali','Sales',95000,3,'2021-11-02'),
 (9,'Kavya Singh','Sales',92000,3,'2022-07-25'),
 (10,'Ben Carter','Support',70000,3,'2023-03-14');

INSERT INTO logins (user_id, day) VALUES
 (1,'2025-06-01'),(1,'2025-06-02'),(1,'2025-06-03'),(1,'2025-06-05'),(1,'2025-06-06'),
 (1,'2025-06-10'),(1,'2025-06-11'),(1,'2025-06-12'),(1,'2025-06-13'),
 (2,'2025-06-01'),(2,'2025-06-03'),(2,'2025-06-04'),(2,'2025-06-05'),(2,'2025-06-06'),(2,'2025-06-07'),
 (3,'2025-06-02'),(3,'2025-06-09'),(3,'2025-06-10');

INSERT INTO bookings (id, room_id, guest, starts_at, ends_at) VALUES
 (1,101,'Aarav','2025-07-01','2025-07-04'),
 (2,101,'Liam','2025-07-04','2025-07-06'),
 (3,102,'Sofia','2025-07-02','2025-07-05'),
 (4,103,'Noah','2025-07-10','2025-07-12'),
 (5,102,'Emma','2025-07-05','2025-07-08'),
 (6,101,'Hana','2025-07-10','2025-07-11');

INSERT INTO accounts (id, owner, balance) VALUES
 (1,'Aarav',500.00),(2,'Priya',120.00),(3,'Liam',900.00);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_items_order ON order_items(order_id);
`;
