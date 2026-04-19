"""
routers/personalised_search.py
───────────────────────────────
Bonus pipeline: blends semantic search with user-profile similarity.

    final_score = alpha * query_score + (1 - alpha) * profile_score

alpha = 1.0  →  pure semantic search (ignores user profile)
alpha = 0.0  →  pure recommendation (ignores query text)
alpha = 0.5  →  balanced (default, works well in practice)

Implementation note:
  We fetch ALL activity embeddings in one query (efficient for <50k rows),
  compute both score vectors in Python, blend, and return top-K.
  At very large scale, consider a two-stage retrieve-then-rerank approach.
"""

import numpy as np
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas import (
    PersonalisedSearchRequest, PersonalisedSearchResponse, ScoredItem,
)
from app.embedder import encode_query, vector_to_list
from app.database import acquire
from app.security import verify_api_key

router = APIRouter(
    prefix="/personalised-search",
    tags=["Personalised Search"],
    dependencies=[Depends(verify_api_key)],
)


@router.post("", response_model=PersonalisedSearchResponse)
async def personalised_search(body: PersonalisedSearchRequest):
    """
    Personalised activity search for a logged-in tourist.

    Use this on the homepage / discovery feed where you have both a search
    query AND a known user. Falls back gracefully to pure semantic search
    if the user has no embedding yet (alpha forced to 1.0).
    """
    # 1. Embed the query
    q_vec = np.array(encode_query(body.query), dtype=np.float32)

    async with acquire() as conn:
        # 2. Fetch the user's embedding
        user_row = await conn.fetchrow(
            'SELECT id, embedding FROM "User" WHERE id = $1',
            body.user_id,
        )

        # 3. Fetch all activity embeddings + metadata in one round-trip
        activity_rows = await conn.fetch(
            """
            SELECT id, title, description, category, price, location,
                   date, images, tags, embedding
            FROM   "Activity"
            WHERE  embedding IS NOT NULL
              AND  status = 'APPROVED'
            """
        )

    if not activity_rows:
        return PersonalisedSearchResponse(
            query=body.query, user_id=body.user_id, alpha=body.alpha, results=[]
        )

    # 4. Build matrix of activity embeddings  (N, D)
    act_vecs = np.array([row["embedding"] for row in activity_rows], dtype=np.float32)

    # 5. Compute query scores via dot product (vectors are normalised → = cosine sim)
    query_scores = act_vecs @ q_vec        # shape (N,)

    # 6. Compute profile scores if user has an embedding; otherwise skip
    effective_alpha = body.alpha
    if user_row is None or user_row["embedding"] is None:
        # No user embedding → fall back to pure semantic search
        effective_alpha = 1.0
        profile_scores = np.zeros(len(activity_rows), dtype=np.float32)
    else:
        u_vec = np.array(user_row["embedding"], dtype=np.float32)
        profile_scores = act_vecs @ u_vec  # shape (N,)

    # 7. Blend
    combined = effective_alpha * query_scores + (1 - effective_alpha) * profile_scores

    # 8. Top-K by blended score
    top_idx = np.argsort(combined)[::-1][: body.top_k]

    results = [
        ScoredItem(
            id=activity_rows[i]["id"],
            score=round(float(combined[i]), 4),
            data={
                **{k: v for k, v in dict(activity_rows[i]).items()
                   if k != "embedding"},
                "_query_score":   round(float(query_scores[i]), 4),
                "_profile_score": round(float(profile_scores[i]), 4),
            },
        )
        for i in top_idx
    ]

    return PersonalisedSearchResponse(
        query=body.query,
        user_id=body.user_id,
        alpha=effective_alpha,
        results=results,
    )