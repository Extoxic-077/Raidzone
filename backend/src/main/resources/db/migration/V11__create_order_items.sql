-- Order items: snapshot of product data at time of purchase
CREATE TABLE order_items (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id       UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id     UUID          REFERENCES products(id) ON DELETE SET NULL,
    product_name   VARCHAR(200)  NOT NULL,
    product_emoji  VARCHAR(20),
    image_url      VARCHAR(500),
    price          NUMERIC(12,2) NOT NULL,
    quantity       INT           NOT NULL,
    line_total     NUMERIC(12,2) NOT NULL
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
