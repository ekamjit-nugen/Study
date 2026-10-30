import { describe, expect, it } from "vitest";
import { referencedTables } from "./sqlCore";

const known = ["customers", "orders", "order_items", "products", "payments", "employees", "logins", "bookings", "accounts", "outbox"];

describe("referencedTables", () => {
  it("finds tables after FROM, JOIN, INTO, UPDATE and CREATE TABLE", () => {
    expect(referencedTables("SELECT * FROM customers c JOIN orders o ON o.customer_id = c.id", known)).toEqual(["customers", "orders"]);
    expect(referencedTables("INSERT INTO payments (x) VALUES (1); UPDATE accounts SET balance = 1; DELETE FROM orders", known)).toEqual(["payments", "accounts", "orders"]);
    expect(referencedTables("CREATE TABLE IF NOT EXISTS outbox (id INTEGER)", known)).toEqual(["outbox"]);
  });
  it("ignores CTE names, strings and comments", () => {
    expect(referencedTables("WITH months(m) AS (SELECT 1) SELECT * FROM months -- from orders", known)).toEqual([]);
    expect(referencedTables("SELECT 'from orders' FROM employees", known)).toEqual(["employees"]);
  });
});
