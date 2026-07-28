from typing import Optional

import psycopg2
from psycopg2 import pool

from config import config

connection_pool: Optional[pool.ThreadedConnectionPool] = None


def connect():
    global connection_pool
    connection_pool = pool.ThreadedConnectionPool(2, 10, config.database_url)


def disconnect():
    global connection_pool
    if connection_pool:
        connection_pool.closeall()
        connection_pool = None


def _getconn(conn=None):
    if conn:
        return conn
    return connection_pool.getconn()


def _putconn(conn):
    connection_pool.putconn(conn)


def execute(sql: str, *args):
    conn = _getconn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, args)
        conn.commit()
    finally:
        _putconn(conn)


def fetch(sql: str, *args) -> list[dict]:
    conn = _getconn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, args)
            columns = [desc[0] for desc in cur.description] if cur.description else []
            return [dict(zip(columns, row)) for row in cur.fetchall()]
    finally:
        _putconn(conn)


def fetchrow(sql: str, *args) -> Optional[dict]:
    conn = _getconn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, args)
            columns = [desc[0] for desc in cur.description] if cur.description else []
            row = cur.fetchone()
            if row and sql.strip().upper().startswith("INSERT"):
                conn.commit()
            return dict(zip(columns, row)) if row else None
    finally:
        _putconn(conn)
