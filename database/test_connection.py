# ByteCraft Capstone 

import getpass
import psycopg2

# Database information
database_name = "markit_roofing"
database_user = "postgres"
database_host = "localhost"
database_port = "5432"

# PostgreSQL password
database_password = getpass.getpass("Enter your PostgreSQL password: ")

try:
    # Connect to PostgreSQL
    connection = psycopg2.connect(
        dbname=database_name,
        user=database_user,
        password=database_password,
        host=database_host,
        port=database_port
    )

    print("Database connection successful.")

    # Create a cursor
    cursor = connection.cursor()

    # Test query
    cursor.execute("SELECT * FROM inspector;")

    inspectors = cursor.fetchall()

    print("\nInspectors found:")

    for inspector in inspectors:
        print(inspector)

    # Close cursor and connection
    cursor.close()
    connection.close()

    print("\nDatabase connection closed.")

except psycopg2.Error as error:
    print("Database connection failed.")
    print(error)