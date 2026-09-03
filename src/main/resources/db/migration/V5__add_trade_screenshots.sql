CREATE TABLE trade_screenshots (
    trade_id BIGINT NOT NULL,
    image_url VARCHAR(255),
    CONSTRAINT fk_trade_screenshots_trade FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE
);

ALTER TABLE trades DROP COLUMN IF EXISTS image_url1;
ALTER TABLE trades DROP COLUMN IF EXISTS image_url2;
ALTER TABLE trades DROP COLUMN IF EXISTS image_url3;