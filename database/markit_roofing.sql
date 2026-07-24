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
DROP TABLE IF EXISTS report CASCADE;
DROP TABLE IF EXISTS invoice CASCADE;
DROP TABLE IF EXISTS cost_estimate CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS inspection_request CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS stock CASCADE;
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
-- 12. SAMPLE DATA
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
        unit_cost
    )
VALUES (
        1,
        'Roofing Shingles',
        'Standard asphalt roofing shingles',
        100,
        35.00
    ),
    (
        1,
        'Roofing Nails',
        'Box of roofing nails',
        50,
        15.00
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
-- =====================================================
-- 13. SIMPLE TEST QUERIES
-- =====================================================
SELECT *
FROM client;
SELECT *
FROM inspector;
SELECT *
FROM admin;
SELECT *
FROM stock;
SELECT *
FROM items;
SELECT *
FROM inspection_request;
SELECT *
FROM orders;
SELECT *
FROM cost_estimate;
SELECT *
FROM invoice;
SELECT *
FROM report;