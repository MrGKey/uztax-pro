import os
import time
from typing import Optional
from urllib.parse import urlparse
from collections import deque

import pg8000.dbapi

from config import config


_conn_pool: deque = deque(maxlen=5)
_last_used: float = 0
_POOL_TTL = 300


def _get_conn():
    global _last_used
    now = time.time()
    while _conn_pool:
        conn = _conn_popleft()
        _last_used = now
        try:
            conn.cursor().execute("SELECT 1")
            return conn
        except Exception:
            conn.close()
    _last_used = now
    url = urlparse(config.database_url)
    return pg8000.dbapi.connect(
        host=url.hostname,
        port=url.port or 5432,
        database=url.path.lstrip("/"),
        user=url.username,
        password=url.password,
    )


def _conn_popleft():
    try:
        return _conn_pool.popleft()
    except IndexError:
        return None


def _return_conn(conn):
    if conn and len(_conn_pool) < _conn_pool.maxlen:
        _conn_pool.append(conn)
    else:
        try:
            conn.close()
        except Exception:
            pass


def connect():
    pass


def disconnect():
    for conn in list(_conn_pool):
        try:
            conn.close()
        except Exception:
            pass
    _conn_pool.clear()


def execute(sql: str, *args):
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute(sql, args)
        conn.commit()
        cur.close()
    finally:
        _return_conn(conn)


def fetch(sql: str, *args) -> list[dict]:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute(sql, args)
        columns = [desc[0] for desc in cur.description] if cur.description else []
        rows = cur.fetchall()
        cur.close()
        return [dict(zip(columns, row)) for row in rows]
    finally:
        _return_conn(conn)


def fetchrow(sql: str, *args) -> Optional[dict]:
    conn = _get_conn()
    try:
        cur = conn.cursor()
        cur.execute(sql, args)
        columns = [desc[0] for desc in cur.description] if cur.description else []
        row = cur.fetchone()
        cur.close()
        if row and sql.strip().upper().startswith("INSERT"):
            conn.commit()
        return dict(zip(columns, row)) if row else None
    finally:
        _return_conn(conn)
