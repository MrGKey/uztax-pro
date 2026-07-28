import os
from typing import Optional

import pg8000
from pg8000.native import literal

from config import config


def _connect():
    return pg8000.connect(dsn=config.database_url)


def execute(sql: str, *args):
    conn = _connect()
    try:
        conn.run(sql, args)
        conn.commit()
    finally:
        conn.close()


def fetch(sql: str, *args) -> list[dict]:
    conn = _connect()
    try:
        result = conn.run(sql, args)
        columns = [d["name"] for d in conn.columns]
        return [dict(zip(columns, row)) for row in result]
    finally:
        conn.close()


def fetchrow(sql: str, *args) -> Optional[dict]:
    conn = _connect()
    try:
        result = conn.run(sql, args)
        if not result:
            return None
        columns = [d["name"] for d in conn.columns]
        return dict(zip(columns, result[0]))
    finally:
        conn.close()
