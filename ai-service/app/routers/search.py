"""
routers/search.py
─────────────────
Phase 2: Semantic Search.

The query is embedded with the "query:" prefix, then compared against
all activity/place embeddings stored in pgvector using the <=> (cosine
distance) operator.

pgvector cosine distance = 1 - cosine_similarity, so:
    similarity = 1 - distance
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas import SearchRequest, SearchResponse, ScoredItem
from app.embedder import encode_query, vector_to_list
from app.database import acquire
from app.security import verify_api_key

router = APIRouter(
    prefix="/search",
    tags=["Semantic Search"],
    dependencies=[Depends(verify_api_key)],
)


@router.post("", response_model=SearchResponse)
async def semantic_search(body: SearchRequest):
    """
    Natural-language search over Activities or Places.

    Examples:
        "cheap outdoor adventure"     → NATURE_ADVENTURE, COASTAL_ESCAPE …
        "relaxing traditional spa"    → WELLNESS activities + Hammam places
        "local food with sea view"    → gastronomy activities + café places

    The pgvector index (IVFFlat) makes this O(log N) at scale.
    """
    # 1. Embed the query (uses "query:" prefix for e5 models)
    q_vec = encode_query(body.query)
    q_vec_list = vector_to_list(q_vec)

    # 2. Map entity type → table name (safe mapping — not raw user input)
    table_map = {
        "activity": ("Activity", "title"),
        "place":    ("Place",    "name"),
    }
    if body.entity not in table_map:
        raise HTTPException(status_code=400, detail="Invalid entity type")

    table, name_col = table_map[body.entity]

    async with acquire() as conn:
        # <=> is the cosine distance operator in pgvector.
        # ORDER BY distance ASC = most similar first.
        # We exclude rows with NULL embedding (not yet processed).
        rows = await conn.fetch(
            f"""
            SELECT   *,
                     1 - (embedding <=> $1::vector) AS similarity
            FROM     "{table}"
            WHERE    embedding IS NOT NULL
            ORDER BY embedding <=> $1::vector
            LIMIT    $2
            """,
            q_vec_list,
            body.top_k,
        )

    results = [
        ScoredItem(
            id=row["id"],
            score=round(float(row["similarity"]), 4),
            data={
                k: v for k, v in dict(row).items()
                # Strip raw vector bytes from the API response
                if k not in ("embedding", "similarity")
            },
        )
        for row in rows
    ]

    return SearchResponse(query=body.query, results=results)