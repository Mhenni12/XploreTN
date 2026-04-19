"""
routers/recommend.py
────────────────────
Phase 3: Recommendation System.

Instead of a query string, the input is a user_id.
We fetch the user's stored embedding and compare it against all
activity (or place) embeddings — same cosine distance, different seed.

This works because both users and activities live in the same 768-dim
space: a user who mentions "hiking" and "birds" will naturally land
near activities tagged with those concepts.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas import RecommendRequest, RecommendResponse, ScoredItem
from app.database import acquire
from app.security import verify_api_key

router = APIRouter(
    prefix="/recommend",
    tags=["Recommendation System"],
    dependencies=[Depends(verify_api_key)],
)


@router.post("", response_model=RecommendResponse)
async def recommend(body: RecommendRequest):
    """
    Recommend Activities or Places for a given user.

    The user's `embedding` column is used directly — no re-encoding needed.
    If the user has no embedding yet (bio/interests not set), returns 404.
    """
    async with acquire() as conn:
        # 1. Fetch the target user's embedding
        user_row = await conn.fetchrow(
            'SELECT id, embedding FROM "User" WHERE id = $1',
            body.user_id,
        )

    if user_row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {body.user_id} not found",
        )
    if user_row["embedding"] is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"User {body.user_id} has no embedding. Call POST /embed/user first.",
        )

    user_vec = user_row["embedding"]   # already decoded to list[float] by our codec

    # 2. Find the most similar activities or places
    table_map = {
        "activity": "Activity",
        "place":    "Place",
    }
    if body.entity not in table_map:
        raise HTTPException(status_code=400, detail="Invalid entity type")

    table = table_map[body.entity]

    async with acquire() as conn:
        rows = await conn.fetch(
            f"""
            SELECT   *,
                     1 - (embedding <=> $1::vector) AS similarity
            FROM     "{table}"
            WHERE    embedding IS NOT NULL
            ORDER BY embedding <=> $1::vector
            LIMIT    $2
            """,
            user_vec,
            body.top_k,
        )

    results = [
        ScoredItem(
            id=row["id"],
            score=round(float(row["similarity"]), 4),
            data={k: v for k, v in dict(row).items() if k not in ("embedding", "similarity")},
        )
        for row in rows
    ]

    return RecommendResponse(user_id=body.user_id, results=results)