/**
 * types/ai.types.ts
 * ─────────────────
 * Shared TypeScript interfaces for every AI service request and response.
 *
 * Keeping types in one file means:
 *   - The service, middleware, and routes all import from the same source
 *     of truth — no type drift between layers.
 *   - When the FastAPI schemas change, there is exactly one place to update.
 */

// ── Entity types (mirror Prisma enums) ───────────────────────────────────────

export type EntityType  = 'activity' | 'place';
export type UserRole    = 'TOURISTE' | 'CITOYEN';

// ── Generic scored result (returned by every similarity endpoint) ─────────────

export interface ScoredItem<T = Record<string, unknown>> {
  /** Primary key — number for Activity/User, string for Place */
  id: number | string;
  /** Cosine similarity in [0, 1]. Higher = more similar. */
  score: number;
  /** Full row data minus the raw vector bytes */
  data: T;
}

// ── /embed ────────────────────────────────────────────────────────────────────

export interface EmbedActivityPayload {
  id: number;
  title: string;
  description: string;
  category: string;
  tags: string[];
}

export interface EmbedPlacePayload {
  id: string;
  name: string;
  category: string;
  city: string;
  description?: string;
  tags: string[];
}

export interface EmbedUserPayload {
  id: number;
  bio?: string;
  interests: string[];
}

export interface EmbedResponse {
  id: number | string;
  embeddingText: string;
  dim: number;
}

// ── /search ───────────────────────────────────────────────────────────────────

export interface SearchRequest {
  query: string;
  entity?: EntityType;
  top_k?: number;
}

export interface SearchResponse {
  query: string;
  results: ScoredItem[];
}

// ── /recommend ────────────────────────────────────────────────────────────────

export interface RecommendRequest {
  user_id: number;
  entity?: EntityType;
  top_k?: number;
}

export interface RecommendResponse {
  user_id: number;
  results: ScoredItem[];
}

// ── /match ────────────────────────────────────────────────────────────────────

export interface MatchRequest {
  tourist_id: number;
  top_k?: number;
}

export interface MatchResponse {
  tourist_id: number;
  matches: ScoredItem[];
}

// ── /personalised-search ─────────────────────────────────────────────────────

export interface PersonalisedSearchRequest {
  query: string;
  user_id: number;
  /**
   * Blend weight between semantic search and user-profile similarity.
   * 0.0 = pure profile recommendation
   * 1.0 = pure semantic search
   * 0.5 = balanced (default)
   */
  alpha?: number;
  top_k?: number;
}

export interface PersonalisedSearchResponse {
  query: string;
  user_id: number;
  alpha: number;
  results: ScoredItem[];
}

// ── /backfill ─────────────────────────────────────────────────────────────────

export type BackfillEntity = 'activities' | 'places' | 'users';

export interface BackfillResponse {
  backfilled: number;
}

// ── /health ───────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: 'ok' | 'error';
  model: string;
  embedding_dim: number;
}

// ── Express request augmentation ─────────────────────────────────────────────
// Extends Express's Request so req.user is typed after JWT middleware runs.

import 'express';

declare module 'express' {
  interface Request {
    /** Populated by the JWT auth middleware */
    user?: {
      userId: number;
      role: UserRole;
      email: string;
    };
  }
}