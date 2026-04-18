"""
routers/embed.py
────────────────
Handles Phase 1: Embedding Pipeline.

Called by the Node.js backend whenever an Activity, Place, or User is
created or updated (via the ai.middleware.js hook).

Flow per entity:
  1. Receive entity fields in request body
  2. Build embeddingText (deterministic concatenation)
  3. Encode with sentence-transformer
  4. UPDATE the row's `embedding` + `embeddingText` columns in Postgres
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas import (
    EmbedActivityRequest, EmbedPlaceRequest, EmbedUserRequest, EmbedResponse,
)
from app.embedder import (
    encode_passages, vector_to_list,
    build_activity_embedding_text,
    build_place_embedding_text,
    build_user_embedding_text,
)
from app.database import acquire
from app.security import verify_api_key
from app.config import get_settings

router = APIRouter(
    prefix="/embed",
    tags=["Embedding Pipeline"],
    dependencies=[Depends(verify_api_key)],   # all embed routes are protected
)


# ── Activity ─────────────────────────────────────────────────────────────────

@router.post("/activity", response_model=EmbedResponse, status_code=status.HTTP_200_OK)
async def embed_activity(body: EmbedActivityRequest):
    """
    Generate and persist an embedding for a single Activity row.

    Node.js calls this after INSERT or UPDATE on the Activity table.
    """
    embedding_text = build_activity_embedding_text(
        body.title, body.description, body.category, body.tags
    )

    # encode_passages returns (1, D) — take the first (and only) row
    vec = encode_passages([embedding_text])[0]
    vec_list = vector_to_list(vec)

    async with acquire() as conn:
        result = await conn.fetchrow(
            """
            UPDATE "Activity"
            SET    "embeddingText" = $1,
                   "embedding"    = $2::vector
            WHERE  id = $3
            RETURNING id
            """,
            embedding_text,
            vec_list,
            body.id,
        )
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Activity {body.id} not found",
            )

    return EmbedResponse(
        id=body.id,
        embeddingText=embedding_text,
        dim=len(vec_list),
    )


# ── Place ────────────────────────────────────────────────────────────────────

@router.post("/place", response_model=EmbedResponse, status_code=status.HTTP_200_OK)
async def embed_place(body: EmbedPlaceRequest):
    """Generate and persist an embedding for a single Place row."""
    embedding_text = build_place_embedding_text(
        body.name, body.category, body.city, body.description, body.tags
    )
    vec_list = vector_to_list(encode_passages([embedding_text])[0])

    async with acquire() as conn:
        result = await conn.fetchrow(
            """
            UPDATE "Place"
            SET    "embeddingText" = $1,
                   "embedding"    = $2::vector
            WHERE  id = $3
            RETURNING id
            """,
            embedding_text,
            vec_list,
            body.id,
        )
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Place {body.id} not found",
            )

    return EmbedResponse(id=body.id, embeddingText=embedding_text, dim=len(vec_list))


# ── User ─────────────────────────────────────────────────────────────────────

@router.post("/user", response_model=EmbedResponse, status_code=status.HTTP_200_OK)
async def embed_user(body: EmbedUserRequest):
    """
    Generate and persist a User embedding.
    Only bio + interests are used (per schema specification).
    """
    embedding_text = build_user_embedding_text(body.bio, body.interests)
    vec_list = vector_to_list(encode_passages([embedding_text])[0])

    async with acquire() as conn:
        result = await conn.fetchrow(
            """
            UPDATE "User"
            SET    "embeddingText" = $1,
                   "embedding"    = $2::vector
            WHERE  id = $3
            RETURNING id
            """,
            embedding_text,
            vec_list,
            body.id,
        )
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {body.id} not found",
            )

    return EmbedResponse(id=body.id, embeddingText=embedding_text, dim=len(vec_list))


# ── Batch endpoints (optional — useful for backfilling existing data) ─────────

@router.post("/backfill/activities", tags=["Backfill"])
async def backfill_activities():
    """
    Re-embed every Activity in the database.
    Use once after deploying to an existing database or after a model swap.
    Can take minutes — call from a one-off script, not a user request.
    """
    async with acquire() as conn:
        rows = await conn.fetch(
            'SELECT id, title, description, category, tags FROM "Activity"'
        )

    if not rows:
        return {"backfilled": 0}

    texts = [
        build_activity_embedding_text(
            r["title"], r["description"], r["category"], list(r["tags"])
        )
        for r in rows
    ]
    vecs = encode_passages(texts)   # single batch call — efficient

    async with acquire() as conn:
        # Use executemany for bulk updates
        await conn.executemany(
            """
            UPDATE "Activity"
            SET "embeddingText" = $1, "embedding" = $2::vector
            WHERE id = $3
            """,
            [
                (texts[i], vector_to_list(vecs[i]), rows[i]["id"])
                for i in range(len(rows))
            ],
        )

    return {"backfilled": len(rows)}


@router.post("/backfill/places", tags=["Backfill"])
async def backfill_places():
    """Re-embed every Place in the database."""
    async with acquire() as conn:
        rows = await conn.fetch(
            'SELECT id, name, category, city, description, tags FROM "Place"'
        )

    if not rows:
        return {"backfilled": 0}

    texts = [
        build_place_embedding_text(
            r["name"], r["category"], r["city"], r["description"] or "", list(r["tags"])
        )
        for r in rows
    ]
    vecs = encode_passages(texts)

    async with acquire() as conn:
        await conn.executemany(
            'UPDATE "Place" SET "embeddingText"=$1, "embedding"=$2::vector WHERE id=$3',
            [(texts[i], vector_to_list(vecs[i]), rows[i]["id"]) for i in range(len(rows))],
        )

    return {"backfilled": len(rows)}


@router.post("/backfill/users", tags=["Backfill"])
async def backfill_users():
    """Re-embed every User in the database."""
    async with acquire() as conn:
        rows = await conn.fetch('SELECT id, bio, interests FROM "User"')

    if not rows:
        return {"backfilled": 0}

    texts = [
        build_user_embedding_text(r["bio"] or "", list(r["interests"]))
        for r in rows
    ]
    vecs = encode_passages(texts)

    async with acquire() as conn:
        await conn.executemany(
            'UPDATE "User" SET "embeddingText"=$1, "embedding"=$2::vector WHERE id=$3',
            [(texts[i], vector_to_list(vecs[i]), rows[i]["id"]) for i in range(len(rows))],
        )

    return {"backfilled": len(rows)}