-- Apply AFTER existing schema.sql; never drop or reseed existing records.
ALTER TABLE products ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN images_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE variants ADD COLUMN image TEXT;
ALTER TABLE orders ADD COLUMN user_id TEXT;
ALTER TABLE orders ADD COLUMN access_hash TEXT;
ALTER TABLE orders ADD COLUMN request_hash TEXT;
ALTER TABLE orders ADD COLUMN idempotency_key TEXT;
ALTER TABLE orders ADD COLUMN expires_at INTEGER;
ALTER TABLE orders ADD COLUMN discount_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN coupon_code TEXT;
ALTER TABLE orders ADD COLUMN fulfillment TEXT NOT NULL DEFAULT 'new';
ALTER TABLE orders ADD COLUMN tracking_code TEXT;
ALTER TABLE orders ADD COLUMN shipping_json TEXT;
ALTER TABLE orders ADD COLUMN payment_json TEXT;
ALTER TABLE orders ADD COLUMN updated_at TEXT;
CREATE UNIQUE INDEX orders_idempotency ON orders(idempotency_key);
CREATE UNIQUE INDEX orders_payment_id ON orders(payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX orders_user ON orders(user_id,created_at);
CREATE TABLE customers(id TEXT PRIMARY KEY,email TEXT NOT NULL,name TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE administrators(user_id TEXT PRIMARY KEY,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE addresses(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES customers(id),data_json TEXT NOT NULL);
CREATE TABLE favorites(user_id TEXT NOT NULL REFERENCES customers(id),product_id TEXT NOT NULL REFERENCES products(id),PRIMARY KEY(user_id,product_id));
CREATE TABLE coupons(code TEXT PRIMARY KEY,percent INTEGER NOT NULL CHECK(percent BETWEEN 1 AND 100),min_cents INTEGER NOT NULL DEFAULT 0 CHECK(min_cents>=0),active INTEGER NOT NULL DEFAULT 0,expires_at INTEGER);
CREATE TABLE order_items(order_id TEXT NOT NULL REFERENCES orders(id),product_id TEXT NOT NULL,color TEXT NOT NULL,size TEXT NOT NULL,quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 10),price_cents INTEGER NOT NULL CHECK(price_cents>0),PRIMARY KEY(order_id,product_id,color,size),FOREIGN KEY(product_id,color,size) REFERENCES variants(product_id,color,size));
CREATE TABLE audit(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id TEXT,actor TEXT NOT NULL,action TEXT NOT NULL,detail TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE outbox(id TEXT PRIMARY KEY,order_id TEXT NOT NULL REFERENCES orders(id),event TEXT NOT NULL,sent_at TEXT,attempts INTEGER NOT NULL DEFAULT 0,UNIQUE(order_id,event));
CREATE TABLE rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE shipments(order_id TEXT PRIMARY KEY REFERENCES orders(id),provider_id TEXT,status TEXT NOT NULL DEFAULT 'prepared',data_json TEXT NOT NULL DEFAULT '{}');
-- Raising a SQL error rolls back the ENTIRE D1 batch, including the order insert.
CREATE TRIGGER reserve_inventory BEFORE INSERT ON order_items BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM variants v JOIN products p ON p.id=v.product_id WHERE v.product_id=NEW.product_id AND v.color=NEW.color AND v.size=NEW.size AND v.active=1 AND p.active=1 AND v.stock-v.reserved>=NEW.quantity) THEN RAISE(ABORT,'inventory_unavailable') END;
 UPDATE variants SET reserved=reserved+NEW.quantity WHERE product_id=NEW.product_id AND color=NEW.color AND size=NEW.size;
END;
CREATE TRIGGER inventory_invariant BEFORE UPDATE ON variants WHEN NEW.reserved>NEW.stock OR NEW.reserved<0 OR NEW.stock<0 BEGIN SELECT RAISE(ABORT,'inventory_invariant'); END;
CREATE TRIGGER order_inventory AFTER UPDATE OF status ON orders WHEN NEW.status<>OLD.status BEGIN
 UPDATE variants SET stock=stock-COALESCE((SELECT quantity FROM order_items i WHERE i.order_id=NEW.id AND i.product_id=variants.product_id AND i.color=variants.color AND i.size=variants.size),0),reserved=reserved-COALESCE((SELECT quantity FROM order_items i WHERE i.order_id=NEW.id AND i.product_id=variants.product_id AND i.color=variants.color AND i.size=variants.size),0) WHERE NEW.status='paid' AND OLD.status IN ('pending','paying') AND EXISTS(SELECT 1 FROM order_items i WHERE i.order_id=NEW.id AND i.product_id=variants.product_id AND i.color=variants.color AND i.size=variants.size);
 UPDATE variants SET reserved=reserved-COALESCE((SELECT quantity FROM order_items i WHERE i.order_id=NEW.id AND i.product_id=variants.product_id AND i.color=variants.color AND i.size=variants.size),0) WHERE NEW.status IN ('expired','cancelled','rejected') AND OLD.status IN ('pending','paying') AND EXISTS(SELECT 1 FROM order_items i WHERE i.order_id=NEW.id AND i.product_id=variants.product_id AND i.color=variants.color AND i.size=variants.size);
 INSERT INTO audit(order_id,actor,action,detail) VALUES(NEW.id,'system','payment_status',OLD.status||' -> '||NEW.status);
 INSERT OR IGNORE INTO outbox(id,order_id,event) SELECT NEW.id||':'||NEW.status,NEW.id,NEW.status WHERE NEW.status IN ('paid','refunded','cancelled');
END;
-- Refunds do NOT automatically restock shipped merchandise: inspect returned goods first.
