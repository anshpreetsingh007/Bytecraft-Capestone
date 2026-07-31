-- =====================================================
-- SAMPLE DATA (SEED DATA)
-- Creates initial records for development and testing.
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
-- END OF SAMPLE DATA
-- =====================================================