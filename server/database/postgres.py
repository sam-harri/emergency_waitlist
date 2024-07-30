import os
import json
from typing import Generator, Optional
from psycopg2.extensions import connection, cursor
from psycopg2.pool import SimpleConnectionPool
from psycopg2 import DatabaseError
import dotenv
from loguru import logger
from contextlib import contextmanager

dotenv.load_dotenv()

# Global connection pool
conn_pool: Optional[SimpleConnectionPool] = None

def init_postgres() -> None:
    global conn_pool
    try:
        logger.info(f"Creating PostgreSQL connection pool with values user={os.getenv('POSTGRES_USER')}, port={os.getenv('POSTGRES_PORT')}, password={os.getenv('POSTGRES_PASSWORD')}, host={os.getenv('POSTGRES_HOST')}, database={os.getenv('POSTGRES_DATABASE')}")
        conn_pool = SimpleConnectionPool(
            1, 20,
            user=os.getenv("POSTGRES_USER"),
            port=os.getenv("POSTGRES_PORT"),
            password=os.getenv("POSTGRES_PASSWORD"),
            host=os.getenv("POSTGRES_HOST"),
            database=os.getenv("POSTGRES_DATABASE")
        )
        logger.info("PostgreSQL connection pool created successfully.")
    except (Exception, DatabaseError) as error:
        logger.error(f"Error while connecting to PostgreSQL: {error}")
        raise error
    run_migration()

@contextmanager
def get_postgres() -> Generator[cursor, None, None]:
    """Get a PostgreSQL cursor from the connection pool."""
    if conn_pool is None:
        logger.error("Database not initialized. Call init_postgres() first.")
        raise RuntimeError("Database not initialized.")
    
    conn: connection = conn_pool.getconn()
    if not conn:
        logger.error("Failed to get connection from the pool.")
        raise RuntimeError("Failed to get connection from the pool.")
    
    cur: cursor = conn.cursor()
    try:
        yield cur
    finally:
        conn.commit()
        cur.close()
        conn_pool.putconn(conn)
        
def run_migration() -> None:
    migration_file = "database/migrateup.sql"
    try:
        logger.info(f"Running migration: {migration_file}")
        with open(migration_file, 'r') as file:
            migration_sql = file.read()

        with get_postgres() as cur:
            cur.execute(migration_sql)

        logger.info(f"Successfully ran migration: {migration_file}")
    except Exception as e:
        logger.error(f"Failed to run migration {migration_file}: {e}")
        raise e

def close_postgres() -> None:
    """Close all connections in the PostgreSQL connection pool."""
    if conn_pool:
        conn_pool.closeall()
        logger.info("PostgreSQL connection pool is closed.")
