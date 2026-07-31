-- =====================================================
-- ByteCraft Capstone Project
-- Database Schema (PostgreSQL)
-- PostgreSQL stores Firebase UID and user profile information.
-- Passwords are managed exclusively by Firebase Authentication.
-- =====================================================
-- 1. CLIENT TABLE
-- =====================================================
CREATE TABLE client (
    client_id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role_client VARCHAR(30) DEFAULT 'client',
    phone VARCHAR(20),
    address VARCHAR(200)
);
-- =====================================================
-- 2. INSPECTOR TABLE
-- =====================================================
CREATE TABLE inspector (
    inspector_id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role_inspector VARCHAR(30) DEFAULT 'inspector',
    phone VARCHAR(20)
);
-- =====================================================
-- 3. ADMIN TABLE
-- =====================================================
CREATE TABLE admin (
    admin_id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role_admin VARCHAR(30) DEFAULT 'admin',
    department VARCHAR(100)
);
-- =====================================================
-- 4. SUPER ADMIN TABLE
-- =====================================================
CREATE TABLE super_admin (
    super_admin_id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role_superadmin VARCHAR(30) NOT NULL DEFAULT 'superadmin',
    phone VARCHAR(20),
    department VARCHAR(100)
);
-- =====================================================
-- 5. STOCK TABLE
-- =====================================================
CREATE TABLE stock (
    stock_id SERIAL PRIMARY KEY,
    location VARCHAR(150),
    name VARCHAR(100),
    status VARCHAR(30),
    last_updated DATE,
    low_stock_alert INTEGER
);
-- =====================================================
-- 6. ITEMS TABLE
-- =====================================================
CREATE TABLE items (
    item_id SERIAL PRIMARY KEY,
    stock_id INTEGER,
    name VARCHAR(100),
    description VARCHAR(250),
    qty_on_hand INTEGER,
    unit_cost NUMERIC(10, 2),
    category VARCHAR(100),
    unit VARCHAR(30),
    reorder_threshold INTEGER,
    FOREIGN KEY (stock_id) REFERENCES stock(stock_id)
);
-- =====================================================
-- 7. INSPECTION REQUEST TABLE
-- =====================================================
CREATE TABLE inspection_request (
    request_id SERIAL PRIMARY KEY,
    client_id INTEGER,
    inspector_id INTEGER,
    status VARCHAR(30),
    details TEXT,
    scheduled_date DATE,
    FOREIGN KEY (client_id) REFERENCES client(client_id),
    FOREIGN KEY (inspector_id) REFERENCES inspector(inspector_id)
);
-- =====================================================
-- 8. ORDERS TABLE
-- =====================================================
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    client_id INTEGER,
    request_id INTEGER,
    order_date DATE,
    status VARCHAR(30),
    FOREIGN KEY (client_id) REFERENCES client(client_id),
    FOREIGN KEY (request_id) REFERENCES inspection_request(request_id)
);
-- =====================================================
-- 9. COST ESTIMATE TABLE
-- =====================================================
CREATE TABLE cost_estimate (
    estimate_id SERIAL PRIMARY KEY,
    order_id INTEGER,
    inspector_id INTEGER,
    admin_id INTEGER,
    details TEXT,
    estimate_date DATE,
    status VARCHAR(30),
    material_id INTEGER,
    material_quantity NUMERIC,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (inspector_id) REFERENCES inspector(inspector_id),
    FOREIGN KEY (admin_id) REFERENCES admin(admin_id)
);
-- =====================================================
-- 10. INVOICE TABLE
-- =====================================================
CREATE TABLE invoice (
    invoice_id SERIAL PRIMARY KEY,
    order_id INTEGER,
    client_id INTEGER,
    estimate_id INTEGER,
    subtotal NUMERIC(10, 2),
    tax_amount NUMERIC(10, 2),
    total_amount NUMERIC(10, 2),
    invoice_date DATE,
    due_date DATE,
    status VARCHAR(30),
    date_paid DATE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (client_id) REFERENCES client(client_id),
    FOREIGN KEY (estimate_id) REFERENCES cost_estimate(estimate_id)
);
-- =====================================================
-- 11. REPORT TABLE
-- =====================================================
CREATE TABLE report (
    report_id SERIAL PRIMARY KEY,
    order_id INTEGER,
    inspector_id INTEGER,
    admin_id INTEGER,
    material_used_cost NUMERIC(10, 2),
    material_waste_cost NUMERIC(10, 2),
    profit NUMERIC(10, 2),
    details TEXT,
    report_date DATE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (inspector_id) REFERENCES inspector(inspector_id),
    FOREIGN KEY (admin_id) REFERENCES admin(admin_id)
);
-- =====================================================
-- 12. NOTIFICATION TABLE
-- =====================================================
CREATE TABLE notification (
    notification_id SERIAL PRIMARY KEY,
    -- Who the notification is for. We store recipient_type +
    -- recipient_id instead of a single FK because recipients can
    -- be an admin, client, inspector, or super admin (different tables).
    recipient_type VARCHAR(20) NOT NULL CHECK (
        recipient_type IN ('admin', 'client', 'inspector', 'super_admin')
    ),
    recipient_id INTEGER NOT NULL,
    -- Machine-readable category, used by the frontend to pick an
    -- icon/route and by the backend to avoid duplicate alerts.
    type VARCHAR(50) NOT NULL CHECK (
        type IN (
            'estimate_approved',
            'low_stock',
            'inspection_request_submitted'
        )
    ),
    title VARCHAR(150) NOT NULL,
    message TEXT,
    -- Optional pointer back to the record that triggered this
    -- notification (e.g. cost_estimate.estimate_id, items.item_id,
    -- inspection_request.request_id), so the UI can deep-link to it.
    related_entity_type VARCHAR(30),
    related_entity_id INTEGER,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);
-- Speeds up the most common query: "give me this recipient's
-- unread notifications, newest first"
CREATE INDEX idx_notification_recipient_unread ON notification (
    recipient_type,
    recipient_id,
    is_read,
    created_at DESC
);
-- Prevents the low-stock alert from being re-inserted every time
-- someone polls the inventory endpoint while an item is still low,
-- since we only want ONE open (unread) low-stock alert per item at a time.
CREATE UNIQUE INDEX idx_notification_low_stock_unique ON notification (related_entity_type, related_entity_id)
WHERE type = 'low_stock'
    AND is_read = FALSE;