"""
routers/match.py
────────────────
Phase 4: Social Matching — Tourist → Local (one-directional).

A tourist's embedding is compared only against CITOYEN (local) user
embeddings. 

"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas import MatchRequest, MatchResponse, ScoredItem
from app.database import acquire
from app.security import verify_api_key

router = APIRouter(
    prefix="/match",
    tags=["Social Matching"],
    dependencies=[Depends(verify_api_key)],
)


@router.post("", response_model=MatchResponse)
async def match_locals(body: MatchRequest):
    """
    Find the most interest-compatible locals for a tourist.

    """
    async with acquire() as conn:
        # Verify the requesting user has a valid embedding
        tourist = await conn.fetchrow(
            'SELECT id, role, embedding FROM "User" WHERE id = $1',
            body.tourist_id,
        )

    if tourist is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {body.tourist_id} not found",
        )
    # if tourist["role"] != "TOURISTE":
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="Social matching is only available for TOURISTE users",
    #     )
    if tourist["embedding"] is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Tourist {body.tourist_id} has no embedding. Call POST /embed/user first.",
        )

    t_vec = tourist["embedding"]

    async with acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT   id,
                     "fullName",
                     bio,
                     interests,
                     image,
                     1 - (embedding <=> $1::vector) AS similarity
            FROM     "User"
            WHERE    role      = 'CITOYEN'
              AND    embedding IS NOT NULL
              AND    id        != $2          -- exclude the tourist themselves
            ORDER BY embedding <=> $1::vector
            LIMIT    $3
            """,
            t_vec,
            body.tourist_id,
            body.top_k,
        )

    matches = [
        ScoredItem(
            id=row["id"],
            score=round(float(row["similarity"]), 4),
            data={k: v for k, v in dict(row).items() if k not in ("embedding", "similarity")},
        )
        for row in rows
    ]

    return MatchResponse(tourist_id=body.tourist_id, matches=matches)