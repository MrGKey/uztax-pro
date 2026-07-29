import os
from typing import Optional
from urllib.parse import urlparse

import pg8000.dbapi

from config import config


def connect():
    pass


def disconnect():
    pass


def _connect():
    url = urlparse(config.database_url)
    return pg8000.dbapi.connect(
        host=url.hostname,
        port=url.port or 5432,
        database=url.path.lstrip("/"),
        user=url.username,
        password=url.password,
    )


def execute(sql: str, *args):
    conn = _connect()
    try:
        cur = conn.cursor()
        cur.execute(sql, args)
        conn.commit()
        cur.close()
    finally:
        conn.close()


def fetch(sql: str, *args) -> list[dict]:
    conn = _connect()
    try:
        cur = conn.cursor()
        cur.execute(sql, args)
        columns = [desc[0] for desc in cur.description] if cur.description else []
        rows = cur.fetchall()
        cur.close()
        return [dict(zip(columns, row)) for row in rows]
    finally:
        conn.close()


def fetchrow(sql: str, *args) -> Optional[dict]:
    conn = _connect()
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
        conn.close()
