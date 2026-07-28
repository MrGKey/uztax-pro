from typing import Optional

import asyncpg
from config import config

pool: Optional[asyncpg.Pool] = None


async def connect():
    global pool
    pool = await asyncpg.create_pool(config.database_url, min_size=2, max_size=10)


async def disconnect():
    global pool
    if pool:
        await pool.close()
        pool = None


async def execute(sql: str, *args):
    async with pool.acquire() as conn:
        return await conn.execute(sql, *args)


async def fetch(sql: str, *args) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(sql, *args)
        return [dict(r) for r in rows]


async def fetchrow(sql: str, *args) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(sql, *args)
        return dict(row) if row else None


async def fetchval(sql: str, *args):
    async with pool.acquire() as conn:
        return await conn.fetchval(sql, *args)
