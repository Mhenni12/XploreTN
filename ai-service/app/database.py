"""
database.py
───────────
Manages a single asyncpg connection pool shared across the app lifetime.

Why asyncpg directly instead of an ORM?
  • The AI service only needs to READ & WRITE the `embedding` column.
  • Prisma owns the schema; a second ORM would duplicate that ownership.
  • asyncpg's binary protocol is significantly faster for bulk vector reads.

pgvector operators used:
  <->  L2 distance
  <=>  cosine distance  ← we use this (normalised vectors = cosine ≡ dot product)
  <#>  negative inner product
"""

import asyncpg
from contextlib import asynccontextmanager
from app.config import get_settings

# Module-level pool — populated in lifespan(), used everywhere else.
_pool: asyncpg.Pool | None = None


async def connect() -> None:
    """
    Open the connection pool.
    Called once at application startup (see main.py lifespan).
    """
    global _pool
    settings = get_settings()

    _pool = await asyncpg.create_pool(
        dsn=settings.DATABASE_URL,
        min_size=2,        # keep at least 2 connections warm
        max_size=10,       # cap to avoid overwhelming Postgres
        command_timeout=30,
    )

    # Register the pgvector codec so asyncpg can encode/decode vector columns
    # without manual casting everywhere.
    async with _pool.acquire() as conn:
        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        await register_vector(conn)


async def register_vector(conn: asyncpg.Connection) -> None:
    """
    Teach asyncpg how to serialise Python lists ↔ pgvector `vector` type.
    asyncpg doesn't know about custom Postgres types out of the box.
    """
    # Fetch the OID of the `vector` type installed by pgvector
    oid = await conn.fetchval("SELECT oid FROM pg_type WHERE typname = 'vector'")
    if oid is None:
        raise RuntimeError(
            "pgvector extension is not installed. "
            "Run `CREATE EXTENSION vector;` on your database."
        )

    # Encoder: Python list[float]  →  Postgres text representation '[0.1,0.2,...]'
    def encode_vector(value):
        return "[" + ",".join(str(v) for v in value) + "]"

    # Decoder: Postgres text '[0.1,0.2,...]'  →  Python list[float]
    def decode_vector(value):
        return [float(x) for x in value.strip("[]").split(",")]

    await conn.set_type_codec(
        "vector",
        encoder=encode_vector,
        decoder=decode_vector,
        schema="public",
        format="text",
    )


async def disconnect() -> None:
    """
    Close the connection pool gracefully.
    Called once at application shutdown (see main.py lifespan).
    """
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    """
    Dependency-injection helper — raises immediately if the pool
    was never initialised (guards against calls before startup).
    """
    if _pool is None:
        raise RuntimeError("Database pool is not initialised. Did startup run?")
    return _pool


@asynccontextmanager
async def acquire():
    """
    Convenience context manager for one-off queries:

        async with acquire() as conn:
            row = await conn.fetchrow("SELECT ...")
    """
    async with get_pool().acquire() as conn:
        # Re-register the vector codec on every new connection in the pool
        await register_vector(conn)
        yield conn