-- ByteCraft Capstone Project
-- Database: PostgreSQL
-- PostgreSQL stores the Firebase UID and user profile information.
-- Passwords are handled only by Firebase Authentication.
-- =====================================================
-- 1. DELETE EXISTING TABLES
-- =====================================================
-- WARNING:
-- This section deletes all existing tables and data.
-- Use only during local development and testing.
-- Do not run this section after real users are registered.
DROP TABLE IF EXISTS notification CASCADE;
DROP TABLE IF EXISTS report CASCADE;
DROP TABLE IF EXISTS invoice CASCADE;
DROP TABLE IF EXISTS cost_estimate CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS inspection_request CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS stock CASCADE;
DROP TABLE IF EXISTS super_admin CASCADE;
DROP TABLE IF EXISTS admin CASCADE;
DROP TABLE IF EXISTS inspector CASCADE;
DROP TABLE IF EXISTS client CASCADE;
-- =====================================================
-- 2. CLIENT TABLE
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
-- 3. INSPECTOR TABLE
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
-- 4. ADMIN TABLE
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
-- 5. SUPER ADMIN TABLE
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
-- 6. STOCK TABLE
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
-- 7. ITEMS TABLE
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
-- 8. INSPECTION REQUEST TABLE
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
-- 9. ORDERS TABLE
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
-- 10. COST ESTIMATE TABLE
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
-- 11. INVOICE TABLE
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
-- 12. REPORT TABLE
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
-- 13. NOTIFICATION TABLE
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
-- =====================================================
-- 14. SAMPLE DATA
-- =====================================================
-- Create one client
INSERT INTO client (
        firebase_uid,
        first_name,
        last_name,
        email,
        role_client,
        phone,
        address
    )
VALUES (
        'test-client-uid-001',
        'Diego',
        'Galvis',
        'diego.client@example.com',
        'client',
        '403-555-0101',
        '123 Calgary Street'
    );
-- Create one inspector
INSERT INTO inspector (
        firebase_uid,
        first_name,
        last_name,
        email,
        role_inspector,
        phone
    )
VALUES (
        'test-inspector-uid-001',
        'Michael',
        'Smith',
        'michael.inspector@example.com',
        'inspector',
        '403-555-0201'
    );
-- Create one administrator
INSERT INTO admin (
        firebase_uid,
        first_name,
        last_name,
        email,
        role_admin,
        department
    )
VALUES (
        'test-admin-uid-001',
        'Sarah',
        'Johnson',
        'sarah.admin@example.com',
        'admin',
        'Operations'
    );
-- Create one super administrator
INSERT INTO super_admin (
        firebase_uid,
        first_name,
        last_name,
        email,
        role_superadmin,
        phone,
        department
    )
VALUES (
        'test-superadmin-uid-001',
        'System',
        'Administrator',
        'superadmin@markitroofing.com',
        'superadmin',
        '403-555-0100',
        'Management'
    );
-- Create one stock location
INSERT INTO stock (
        location,
        name,
        status,
        last_updated,
        low_stock_alert
    )
VALUES (
        'Calgary Warehouse',
        'Main Stock',
        'active',
        CURRENT_DATE,
        10
    );
-- Create two inventory items
INSERT INTO items (
        stock_id,
        name,
        description,
        qty_on_hand,
        unit_cost,
        category,
        unit,
        reorder_threshold
    )
VALUES (
        1,
        'Roofing Shingles',
        'Standard asphalt roofing shingles',
        100,
        35.00,
        'Materials',
        'bundles',
        20
    ),
    (
        1,
        'Roofing Nails',
        'Box of roofing nails',
        50,
        15.00,
        'Hardware',
        'boxes',
        10
    );
-- Create one inspection request
INSERT INTO inspection_request (
        client_id,
        inspector_id,
        status,
        details,
        scheduled_date
    )
VALUES (
        1,
        1,
        'assigned',
        'The client reported a roof leak.',
        CURRENT_DATE
    );
-- Create one order
INSERT INTO orders (
        client_id,
        request_id,
        order_date,
        status
    )
VALUES (
        1,
        1,
        CURRENT_DATE,
        'in_progress'
    );
-- Create one cost estimate
INSERT INTO cost_estimate (
        order_id,
        inspector_id,
        admin_id,
        details,
        estimate_date,
        status
    )
VALUES (
        1,
        1,
        1,
        'Materials: shingles and nails. Estimated service total: 2000 dollars.',
        CURRENT_DATE,
        'approved'
    );
-- Create one invoice
INSERT INTO invoice (
        order_id,
        client_id,
        estimate_id,
        subtotal,
        tax_amount,
        total_amount,
        invoice_date,
        due_date,
        status,
        date_paid
    )
VALUES (
        1,
        1,
        1,
        2000.00,
        100.00,
        2100.00,
        CURRENT_DATE,
        CURRENT_DATE + 14,
        'issued',
        NULL
    );
-- Create one final report
INSERT INTO report (
        order_id,
        inspector_id,
        admin_id,
        material_used_cost,
        material_waste_cost,
        profit,
        details,
        report_date
    )
VALUES (
        1,
        1,
        1,
        500.00,
        50.00,
        1450.00,
        'The roof repair was completed successfully.',
        CURRENT_DATE
    );
-- Create one low-stock notification for the admin
INSERT INTO notification (
        recipient_type,
        recipient_id,
        type,
        title,
        message,
        related_entity_type,
        related_entity_id
    )
VALUES (
        'admin',
        1,
        'low_stock',
        'Low Stock Alert',
        'Roofing Nails inventory is below the reorder threshold.',
        'items',
        2
    );
-- =====================================================
-- END OF SCHEMA + SEED DATA
-- =====================================================