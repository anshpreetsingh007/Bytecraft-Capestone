# Markit Roofing Database

This folder contains the PostgreSQL database files for the ByteCraft Capstone Project.

## Files

- `schema.sql` – Creates all database tables, relationships, constraints, and indexes.
- `sample_data.sql` – Inserts sample records used for development and testing.
- `reset.sql` – Deletes all database tables. Use only during local development to recreate the database.
- `test_connection.py` – Tests the connection between Python and PostgreSQL.

## Database Tables

The database contains the following tables:

1. client
2. inspector
3. admin
4. super_admin
5. stock
6. items
7. inspection_request
8. orders
9. cost_estimate
10. invoice
11. report
12. notification

## Database Setup

1. Open pgAdmin 4.
2. Create or select the database named `markit_roofing`.
3. Open the Query Tool.
4. Run `schema.sql`.
5. Run `sample_data.sql`.
6. Confirm that the tables and sample data were created successfully.

> **Development Only**
>
> If you need to recreate the database from scratch, run:
>
> 1. `reset.sql`
> 2. `schema.sql`
> 3. `sample_data.sql`

## Python Connection Test

Install the PostgreSQL Python library:

```bash
pip install psycopg2-binary
```

Run the connection test:

```bash
python test_connection.py
```

The script will prompt you for your PostgreSQL password, connect to the `markit_roofing` database, and verify that the connection is successful by querying the database.
