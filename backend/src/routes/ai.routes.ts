/**
 * routes/ai.routes.ts
 * ───────────────────
 * Express router that proxies all AI queries from the React frontend
 * through the Node.js backend to the FastAPI service.
 *
 * Why proxy instead of calling FastAPI directly from the browser?
 * ───────────────────────────────────────────────────────────────
 * 1. The X-API-Key secret never leaves the server.
 * 2. Auth, rate-limiting, and validation live in one place.
 * 3. The frontend only needs one API base URL.
 *
 * Mount in app.ts / server.ts:
 *   import aiRoutes from './routes/ai.routes';
 *   app.use('/api/ai', aiRoutes);
 */

import { Router, Request, Response, NextFunction } from "express";
import { isAxiosError } from "axios";
import { authenticateJWT } from "../middleware/auth.js";
import {
  search,
  recommend,
  matchLocals,
  personalisedSearch,
  backfill,
  isHealthy,
} from "../services/ai.service";
import type {
  SearchRequest,
  RecommendRequest,
  MatchRequest,
  PersonalisedSearchRequest,
  BackfillEntity,
  EntityType,
} from "../types/ai.types";

const router = Router();

// ── Auth placeholder ──────────────────────────────────────────────────────────
// Import your real JWT middleware here.
// It must populate req.user = { id, role, email } on success.
//
// Example:   import protect from '../middleware/auth.middleware';

// ── Utility: handle errors from the AI service layer ─────────────────────────

/**
 * Centralised error handler for AI service calls.
 * Distinguishes structured Axios errors from unexpected runtime errors
 * so the client always receives a meaningful JSON response.
 *
 * No AppError class is needed — we compose the response inline.
 */
function handleAIError(err: unknown, res: Response): void {
  if (isAxiosError(err)) {
    const statusCode =
      (err as Error & { statusCode?: number }).statusCode ??
      err.response?.status ??
      502;
    const detail =
      (err.response?.data as { detail?: string })?.detail ?? err.message;
    res.status(statusCode).json({ error: detail });
    return;
  }

  if (err instanceof Error) {
    // Could be a timeout or network error annotated with statusCode in the interceptor
    const statusCode =
      (err as Error & { statusCode?: number }).statusCode ?? 500;
    res.status(statusCode).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: "An unexpected error occurred" });
}

// ── GET /api/ai/health ────────────────────────────────────────────────────────
// No auth — used by frontend loading indicators and uptime monitors.

router.get("/health", async (_req: Request, res: Response): Promise<void> => {
  try {
    const healthy = await isHealthy();
    res.status(healthy ? 200 : 503).json({ ok: healthy });
  } catch (err) {
    res.status(503).json({ ok: false });
  }
});

// ── POST /api/ai/search ───────────────────────────────────────────────────────
// Public — no login required to browse activities/places.
//
// POST is used instead of GET because:
//  - Query strings are logged by proxies/CDNs; POST bodies are not.
//  - URL length limits constrain free-text natural-language queries.
//  - GET responses are cached by default; search results must stay fresh.

router.post("/search", async (req: Request, res: Response): Promise<void> => {
  const { query, entity, top_k } = req.body as Partial<SearchRequest>;

  if (!query || typeof query !== "string" || query.trim() === "") {
    res
      .status(400)
      .json({ error: "`query` is required and must be a non-empty string" });
    return;
  }

  const validEntities: EntityType[] = ["activity", "place"];
  if (entity && !validEntities.includes(entity)) {
    res.status(400).json({ error: '`entity` must be "activity" or "place"' });
    return;
  }

  try {
    const results = await search({ query, entity, top_k });
    res.json(results);
  } catch (err) {
    handleAIError(err, res);
  }
});

// ── POST /api/ai/personalised-search ─────────────────────────────────────────
// Protected — requires authentication; uses the logged-in user's profile.
//
// POST is used because the body carries a query string + user_id + alpha float.
// Encoding all three as URL parameters is fragile and exposes user identity
// in server logs.

router.post(
  "/personalised-search",
  authenticateJWT, // ← uncommented: requires authentication
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { query, alpha, top_k } =
      req.body as Partial<PersonalisedSearchRequest>;

    if (!query || typeof query !== "string" || query.trim() === "") {
      res
        .status(400)
        .json({ error: "`query` is required and must be a non-empty string" });
      return;
    }

    if (
      alpha !== undefined &&
      (typeof alpha !== "number" || alpha < 0 || alpha > 1)
    ) {
      res
        .status(400)
        .json({ error: "`alpha` must be a number between 0 and 1" });
      return;
    }

    try {
      const results = await personalisedSearch({
        query,
        user_id: req.user.userId, // populated by JWT middleware
        alpha,
        top_k,
      });
      res.json(results);
    } catch (err) {
      handleAIError(err, res);
    }
  },
);

// ── POST /api/ai/recommend ────────────────────────────────────────────────────
// Protected — personalised to the logged-in user.
//
// POST rather than GET because:
//  - The user_id in the URL/query-string would leak identity in access logs.
//  - Recommendation results must not be cached — they change as the user's
//    profile evolves and as new activities are added.

router.post(
  "/recommend",
  authenticateJWT, // ← uncommented: requires authentication
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { entity, top_k } = req.body as Partial<RecommendRequest>;

    const validEntities: EntityType[] = ["activity", "place"];
    if (entity && !validEntities.includes(entity)) {
      res.status(400).json({ error: '`entity` must be "activity" or "place"' });
      return;
    }

    try {
      const results = await recommend({
        user_id: req.user.userId,
        entity,
        top_k,
      });
      res.json(results);
    } catch (err) {
      handleAIError(err, res);
    }
  },
);

// ── POST /api/ai/match ────────────────────────────────────────────────────────
// Protected — find local guides compatible with the logged-in tourist.
//
// POST rather than GET: future implementations log match impressions for
// analytics, making this a side-effectful operation. POST correctly signals
// to infrastructure that the request is not safe to replay or cache.

router.post(
  "/match",
  authenticateJWT, // ← uncommented: requires authentication
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { top_k } = req.body as Partial<MatchRequest>;

    try {
      const results = await matchLocals({
        tourist_id: req.user.userId,
        top_k,
      });
      res.json(results);
    } catch (err) {
      handleAIError(err, res);
    }
  },
);

// ── POST /api/ai/backfill/:entity (admin only) ────────────────────────────────
// Trigger a full re-embedding of all rows for a given entity type.
// Add an admin-role guard before deploying to production.

router.post(
  "/backfill/:entity",
  // protect,         ← auth
  // requireAdmin,    ← admin-role guard
  async (req: Request, res: Response): Promise<void> => {
    const entity = req.params.entity as BackfillEntity;
    const validEntities: BackfillEntity[] = ["activities", "places", "users"];

    if (!validEntities.includes(entity)) {
      res
        .status(400)
        .json({ error: `entity must be one of: ${validEntities.join(", ")}` });
      return;
    }

    try {
      const result = await backfill(entity);
      res.json(result);
    } catch (err) {
      handleAIError(err, res);
    }
  },
);

export default router;
