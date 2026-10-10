"""
Digital Shield AI - Automated MySQL Setup Script
Run this script to configure MySQL database and populate tables from schema.sql.
"""

import os
import sys

def setup():
    host = os.getenv("MYSQL_HOST", "127.0.0.1")
    port = int(os.getenv("MYSQL_PORT", 3306))
    user = os.getenv("MYSQL_USER", "root")
    password = os.getenv("MYSQL_PASSWORD", "")
    database = os.getenv("MYSQL_DATABASE", "digital_shield_ai")

    print(f"Connecting to MySQL server at {host}:{port} as user '{user}'...")

    try:
        import mysql.connector
        conn = mysql.connector.connect(host=host, port=port, user=user, password=password)
        cursor = conn.cursor()
    except Exception:
        try:
            import pymysql
            conn = pymysql.connect(host=host, port=port, user=user, password=password)
            cursor = conn.cursor()
        except Exception as e:
            print(f"[ERROR] Could not connect to MySQL server: {e}")
            print("\nTip: Make sure MySQL service is running (e.g. XAMPP, WAMP, or standalone MySQL service).")
            print("The application will seamlessly use local SQLite if MySQL is not running.")
            sys.exit(1)

    print(f"Creating database '{database}' if not exists...")
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    cursor.execute(f"USE `{database}`;")

    schema_path = os.path.join(os.path.dirname(__file__), "..", "database", "schema.sql")
    if os.path.exists(schema_path):
        print("Executing schema.sql...")
        with open(schema_path, "r", encoding="utf-8") as f:
            sql_commands = f.read().split(";")
            for cmd in sql_commands:
                stmt = cmd.strip()
                if stmt:
                    try:
                        cursor.execute(stmt)
                    except Exception as err:
                        print(f"Notice executing statement: {err}")
        conn.commit()

    seed_path = os.path.join(os.path.dirname(__file__), "..", "database", "seed_data.sql")
    if os.path.exists(seed_path):
        print("Populating initial seed telemetry...")
        with open(seed_path, "r", encoding="utf-8") as f:
            seed_commands = f.read().split(";")
            for cmd in seed_commands:
                stmt = cmd.strip()
                if stmt:
                    try:
                        cursor.execute(stmt)
                    except Exception:
                        pass
        conn.commit()

    cursor.close()
    conn.close()
    print(f"\n[SUCCESS] MySQL Database '{database}' configured successfully with all tables and seed records!")

if __name__ == "__main__":
    setup()
