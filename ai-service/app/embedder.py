"""
embedder.py
───────────
Single responsibility: turn text into normalised float vectors.

Design decisions:
  1. Model is loaded ONCE at startup and held in a module-level singleton.
     Loading takes ~5 s; we never want that on the hot path.
  2. Used model requires task-specific prefixes ("query:" / "passage:") for
     best retrieval quality.  Other model families (MiniLM, BGE) do NOT use
     prefixes — the constant controls this cleanly.
  3. All embeddings are L2-normalised so cosine similarity reduces to a
     simple dot product, which pgvector can compute with the <=> operator.
"""

from __future__ import annotations

import numpy as np
from sentence_transformers import SentenceTransformer
from app.config import get_settings

# ── Module-level singleton ───────────────────────────────────────────────────
_model: SentenceTransformer | None = None

# Prefixes expected by the model.
# Set both to "" if you swap to MiniLM or BGE.
PASSAGE_PREFIX = "passage: "
QUERY_PREFIX   = "query: "


def load_model() -> None:
    """
    Download (first run) and initialise the sentence-transformer model.
    Must be called during application startup before any encode() call.
    """
    global _model
    settings = get_settings()
    print(f"[embedder] Loading model: {settings.EMBEDDING_MODEL} …")
    _model = SentenceTransformer(settings.EMBEDDING_MODEL)
    dim = _model.get_sentence_embedding_dimension()
    print(f"[embedder] Model ready — dimension: {dim}")


def get_model() -> SentenceTransformer:
    if _model is None:
        raise RuntimeError("Embedding model not loaded. Did startup run?")
    return _model


# ── Core encode functions ────────────────────────────────────────────────────

def encode_passages(texts: list[str]) -> np.ndarray:
    """
    Encode a list of documents/passages (activities, places, user bios).
    Returns a (N, D) float32 array of normalised vectors.
    """
    prefixed = [PASSAGE_PREFIX + t for t in texts]
    return get_model().encode(
        prefixed,
        normalize_embeddings=True,   # L2-normalise → cosine sim = dot product
        batch_size=32,
        show_progress_bar=False,
    ).astype(np.float32)


def encode_query(text: str) -> np.ndarray:
    """
    Encode a single search query.
    Returns a (D,) float32 vector.
    """
    prefixed = QUERY_PREFIX + text
    vec = get_model().encode(
        [prefixed],
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return vec[0].astype(np.float32)


def vector_to_list(vec: np.ndarray) -> list[float]:
    """Convert numpy array → plain Python list for JSON / asyncpg serialisation."""
    return vec.tolist()


# ── embeddingText builders (mirror the Node.js backend logic) ────────────────

def build_activity_embedding_text(
    title: str,
    description: str,
    category: str,
    tags: list[str],
) -> str:
    """
    Concatenate the meaningful fields for an Activity.
    Must stay in sync with the Node.js helper in ai.service.js.
    """
    return f"{title} {description} {category} {' '.join(tags)}".strip()


def build_place_embedding_text(
    name: str,
    category: str,
    city: str,
    description: str,
    tags: list[str],
) -> str:
    return f"{name} {category} {city} {description} {' '.join(tags)}".strip()


def build_user_embedding_text(bio: str, interests: list[str]) -> str:
    """
    Only bio + interests as specified in the schema notes.
    """
    return f"{bio} {' '.join(interests)}".strip()