-- GELZ Store D1 schema: all inventory defaults to disabled/zero until manually confirmed.
CREATE TABLE IF NOT EXISTS products (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 price_cents INTEGER NOT NULL CHECK(price_cents > 0),
 weight_g REAL,
 length_cm REAL,
 width_cm REAL,
 height_cm REAL,
 active INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS variants (
 product_id TEXT NOT NULL REFERENCES products(id),
 color TEXT NOT NULL,
 size TEXT NOT NULL,
 stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
 reserved INTEGER NOT NULL DEFAULT 0 CHECK(reserved >= 0),
 active INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(product_id,color,size)
);
CREATE TABLE IF NOT EXISTS orders (
 id TEXT PRIMARY KEY,
 status TEXT NOT NULL DEFAULT 'pending',
 items_json TEXT NOT NULL,
 customer_json TEXT NOT NULL,
 address_json TEXT NOT NULL,
 shipping_service_id TEXT NOT NULL,
 shipping_cents INTEGER NOT NULL,
 total_cents INTEGER NOT NULL,
 preference_id TEXT,
 payment_id TEXT,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS orders_status ON orders(status,created_at);
CREATE INDEX IF NOT EXISTS variants_stock ON variants(active,stock,reserved);
