CREATE TABLE IF NOT EXISTS trades (
    id BIGSERIAL PRIMARY KEY,
    currency_pair VARCHAR(20) NOT NULL,
    entry_price NUMERIC(19, 4) NOT NULL,
    stop_loss NUMERIC(19, 4),
    exit_price NUMERIC(19, 4),
    direction VARCHAR(20),
    entry_time TIMESTAMP,
    notes VARCHAR(1000),
    outcome NUMERIC(19, 4),
    initial_rr NUMERIC(19, 4),
    image_url1 VARCHAR(500),
    image_url2 VARCHAR(500),
    image_url3 VARCHAR(500),
    final_rr NUMERIC(19, 4)
);