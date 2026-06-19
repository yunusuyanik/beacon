DROP TABLE old_orders;

UPDATE users SET status = 'inactive';

CREATE INDEX idx_orders_created_at ON orders (created_at);

ALTER TABLE users ADD COLUMN tier text NOT NULL;
