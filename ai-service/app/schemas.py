"""
schemas.py
──────────
Pydantic v2 request and response models.

Keeping schemas separate from routers keeps each file focused and makes
it easy to generate an OpenAPI client from these types alone.
"""

from pydantic import BaseModel, Field
from typing import Any


# ── Shared ───────────────────────────────────────────────────────────────────

class ScoredItem(BaseModel):
    """Generic wrapper returned by every similarity query."""
    id: Any                          # int for Activity/User, str for Place
    score: float = Field(..., ge=0, le=1)
    data: dict                       # full row, minus the raw embedding bytes


# ── /embed  ──────────────────────────────────────────────────────────────────

class EmbedActivityRequest(BaseModel):
    id: int
    title: str
    description: str
    category: str
    tags: list[str] = []


class EmbedPlaceRequest(BaseModel):
    id: str
    name: str
    category: str
    city: str
    description: str = ""
    tags: list[str] = []


class EmbedUserRequest(BaseModel):
    id: int
    bio: str = ""
    interests: list[str] = []


class EmbedResponse(BaseModel):
    id: Any
    embeddingText: str               # stored back in DB so frontend can audit
    dim: int                         # sanity-check: should match EMBEDDING_DIM


# ── /search  ─────────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    entity: str = Field("activity", pattern="^(activity|place)$")
    top_k: int = Field(5, ge=1, le=20)


class SearchResponse(BaseModel):
    query: str
    results: list[ScoredItem]


# ── /recommend  ──────────────────────────────────────────────────────────────

class RecommendRequest(BaseModel):
    user_id: int
    entity: str = Field("activity", pattern="^(activity|place)$")
    top_k: int = Field(5, ge=1, le=20)


class RecommendResponse(BaseModel):
    user_id: int
    results: list[ScoredItem]


# ── /match  ──────────────────────────────────────────────────────────────────

class MatchRequest(BaseModel):
    tourist_id: int
    top_k: int = Field(3, ge=1, le=10)


class MatchResponse(BaseModel):
    tourist_id: int
    matches: list[ScoredItem]


# ── /personalised-search  ────────────────────────────────────────────────────

class PersonalisedSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    user_id: int
    alpha: float = Field(0.5, ge=0.0, le=1.0,
                         description="0 = pure profile, 1 = pure query")
    top_k: int = Field(5, ge=1, le=20)


class PersonalisedSearchResponse(BaseModel):
    query: str
    user_id: int
    alpha: float
    results: list[ScoredItem]