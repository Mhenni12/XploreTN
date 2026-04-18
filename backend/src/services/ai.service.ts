/**
 * services/ai.service.ts
 * ──────────────────────
 * Typed Axios client for every FastAPI AI endpoint.
 *
 * Why Axios over the native Fetch API?
 * ─────────────────────────────────────
 * 1. Automatic JSON serialisation/deserialisation — no .json() call needed.
 * 2. Axios throws on non-2xx by default; Fetch resolves on 4xx/5xx and requires
 *    a manual `if (!res.ok)` check that is easy to forget.
 * 3. Request/response interceptors make it trivial to add the API key header in
 *    one place rather than every call site.
 * 4. `axios.isAxiosError()` provides typed error discrimination — we can inspect
 *    `error.response.data` reliably without casting.
 * 5. Built-in timeout support (`timeout` option) vs. the AbortController
 *    boilerplate required by Fetch.
 * 6. Node.js compatibility without extra polyfills (Fetch is only stable in
 *    Node 21+; many projects still target Node 18/20 LTS).
 */

import axios, { AxiosInstance, AxiosError, isAxiosError } from 'axios';
import type {
  EmbedActivityPayload,
  EmbedPlacePayload,
  EmbedUserPayload,
  EmbedResponse,
  SearchRequest,
  SearchResponse,
  RecommendRequest,
  RecommendResponse,
  MatchRequest,
  MatchResponse,
  PersonalisedSearchRequest,
  PersonalisedSearchResponse,
  BackfillEntity,
  BackfillResponse,
  HealthResponse,
} from '../types/ai.types';

// ── Axios instance ─────────────────────────────────────────────────────────

/**
 * One shared instance ensures the API key interceptor is attached exactly
 * once, and that baseURL / timeout are configured in a single place.
 */
const aiClient: AxiosInstance = axios.create({
  baseURL: process.env.AI_SERVICE_URL ?? 'http://localhost:8000',
  timeout: 15_000,  // 15 s — model inference on CPU can take a few seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: inject API key on every outgoing request ────────────

aiClient.interceptors.request.use((config) => {
  // Read the key at request time rather than at module load time so that
  // tests can override process.env.AI_SERVICE_API_KEY between calls.
  const key = process.env.AI_SERVICE_API_KEY;
  if (!key) {
    throw new Error(
      '[ai.service] AI_SERVICE_API_KEY is not set. ' +
      'Add it to your backend .env file.'
    );
  }
  config.headers['X-API-Key'] = key;
  return config;
});

// ── Response interceptor: normalise errors ───────────────────────────────────

aiClient.interceptors.response.use(
  (response) => response,   // pass successful responses straight through

  (error: AxiosError<{ detail?: string }>) => {
    // isAxiosError narrows the type so we can safely read .response
    if (isAxiosError(error)) {
      const status  = error.response?.status;
      const detail  = error.response?.data?.detail ?? error.message;

      if (error.code === 'ECONNABORTED') {
        // Timeout — the AI service is overloaded or the model is still loading
        const msg = `[ai.service] Request timed out after ${aiClient.defaults.timeout}ms`;
        console.error(msg);
        throw Object.assign(new Error(msg), { statusCode: 504 });
      }

      if (!error.response) {
        // Network error — service is down or Docker network issue
        const msg = `[ai.service] AI service unreachable: ${error.message}`;
        console.error(msg);
        throw Object.assign(new Error(msg), { statusCode: 503 });
      }

      // Forward the FastAPI error with its original status code so the
      // Express layer can decide whether to surface it to the client.
      const msg = `[ai.service] AI service error [${status}]: ${detail}`;
      console.error(msg);
      throw Object.assign(new Error(msg), { statusCode: status ?? 500 });
    }

    throw error;  // re-throw anything that is not an AxiosError
  },
);

// ── Embed endpoints ───────────────────────────────────────────────────────────

/** Generate and persist an embedding for a single Activity. */
export async function embedActivity(
  activity: EmbedActivityPayload
): Promise<EmbedResponse> {
  const { data } = await aiClient.post<EmbedResponse>('/embed/activity', {
    id:          activity.id,
    title:       activity.title,
    description: activity.description,
    category:    activity.category,
    tags:        activity.tags ?? [],
  });
  return data;
}

/** Generate and persist an embedding for a single Place. */
export async function embedPlace(
  place: EmbedPlacePayload
): Promise<EmbedResponse> {
  const { data } = await aiClient.post<EmbedResponse>('/embed/place', {
    id:          place.id,
    name:        place.name,
    category:    place.category,
    city:        place.city,
    description: place.description ?? '',
    tags:        place.tags ?? [],
  });
  return data;
}

/**
 * Generate and persist a User embedding.
 * Only bio + interests are sent — matching the schema specification.
 */
export async function embedUser(
  user: EmbedUserPayload
): Promise<EmbedResponse> {
  const { data } = await aiClient.post<EmbedResponse>('/embed/user', {
    id:        user.id,
    bio:       user.bio       ?? '',
    interests: user.interests ?? [],
  });
  return data;
}

// ── Search ────────────────────────────────────────────────────────────────────

/**
 * Semantic search over Activities or Places.
 *
 * POST is used rather than GET because:
 *  - The query string can exceed URL length limits on proxies/CDNs.
 *  - Query strings are written to access logs — a privacy concern for
 *    searches that implicitly reflect the user's profile.
 *  - GET responses are aggressively cached; search results must be fresh.
 */
export async function search(params: SearchRequest): Promise<SearchResponse> {
  const { data } = await aiClient.post<SearchResponse>('/search', {
    query:  params.query,
    entity: params.entity  ?? 'activity',
    top_k:  params.top_k   ?? 5,
  });
  return data;
}

// ── Recommend ─────────────────────────────────────────────────────────────────

/**
 * Profile-based recommendations for a logged-in user.
 *
 * POST is used because the payload contains a user_id that — combined with
 * the entity type — constitutes a request for personalised data that should
 * not appear in server logs or browser history as a URL parameter.
 */
export async function recommend(
  params: RecommendRequest
): Promise<RecommendResponse> {
  const { data } = await aiClient.post<RecommendResponse>('/recommend', {
    user_id: params.user_id,
    entity:  params.entity ?? 'activity',
    top_k:   params.top_k  ?? 5,
  });
  return data;
}

// ── Match ─────────────────────────────────────────────────────────────────────

/**
 * Find compatible local guides for a tourist.
 *
 * POST is used because future implementations may log match events
 * for analytics (impression tracking), making this a non-idempotent
 * operation by side-effect — a signal to use POST over GET.
 */
export async function matchLocals(
  params: MatchRequest
): Promise<MatchResponse> {
  const { data } = await aiClient.post<MatchResponse>('/match', {
    tourist_id: params.tourist_id,
    top_k:      params.top_k ?? 3,
  });
  return data;
}

// ── Personalised search ───────────────────────────────────────────────────────

/**
 * Blend query relevance and user-profile similarity.
 *
 * POST is especially justified here: the body carries both a free-text
 * query AND a user_id AND a float parameter (alpha). Encoding all three
 * as query-string parameters produces an ugly, fragile, privacy-leaking URL.
 */
export async function personalisedSearch(
  params: PersonalisedSearchRequest
): Promise<PersonalisedSearchResponse> {
  const { data } = await aiClient.post<PersonalisedSearchResponse>(
    '/personalised-search',
    {
      query:   params.query,
      user_id: params.user_id,
      alpha:   params.alpha  ?? 0.5,
      top_k:   params.top_k  ?? 5,
    }
  );
  return data;
}

// ── Backfill (admin) ──────────────────────────────────────────────────────────

/** Re-embed all rows of the given entity type. */
export async function backfill(
  entity: BackfillEntity
): Promise<BackfillResponse> {
  const { data } = await aiClient.post<BackfillResponse>(
    `/embed/backfill/${entity}`
  );
  return data;
}

// ── Health ────────────────────────────────────────────────────────────────────

/**
 * Probe whether the AI service is ready (model loaded + DB connected).
 * Returns false instead of throwing so callers can poll safely.
 */
export async function isHealthy(): Promise<boolean> {
  try {
    const { data } = await aiClient.get<HealthResponse>('/health', {
      // Use a short timeout for health checks — we want a fast yes/no
      timeout: 5_000,
    });
    return data.status === 'ok';
  } catch {
    return false;
  }
}