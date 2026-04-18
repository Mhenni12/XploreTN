/**
 * types/ai.types.ts  (frontend)
 * ──────────────────────────────
 * Mirrors the backend types. In a monorepo setup, both packages would
 * import from a shared `@project/types` package instead of duplicating.
 */

export type EntityType = 'activity' | 'place';

export interface ScoredItem<T = Record<string, unknown>> {
  id: number | string;
  /** Cosine similarity in [0, 1]. Higher = more relevant. */
  score: number;
  data: T;
}

export interface SearchResponse {
  query: string;
  results: ScoredItem[];
}

export interface RecommendResponse {
  user_id: number;
  results: ScoredItem[];
}

export interface MatchResponse {
  tourist_id: number;
  matches: ScoredItem[];
}

export interface PersonalisedSearchResponse {
  query: string;
  user_id: number;
  alpha: number;
  results: ScoredItem[];
}

export interface HealthResponse {
  ok: boolean;
}