UPDATE users SET status = 'inactive' WHERE last_seen_at < now() - interval '2 years';

CREATE INDEX CONCURRENTLY idx_orders_created_at ON orders (created_at);
