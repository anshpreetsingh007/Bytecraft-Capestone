# Markit Roofing Database

This folder contains the PostgreSQL database for our ByteCraft Capstone Project.

## Files

- `markit_roofing.sql`: Creates the database tables, relationships, sample data, and simple test queries.
- `test_connection.py`: Tests the connection between Python and PostgreSQL.

## Database Tables

The database contains the following tables:

1. client
2. inspector
3. admin
4. stock
5. items
6. inspection_request
7. orders
8. cost_estimate
9. invoice
10. report

## How to Run the Database

1. Open pgAdmin 4.
2. Create or select the database named `markit_roofing`.
3. Open the Query Tool.
4. Copy and run the complete `markit_roofing.sql` file.
5. Confirm that the tables and sample data were created.

## Python Connection Test

Install the PostgreSQL Python library:

```bash
pip install psycopg2-binary
```
