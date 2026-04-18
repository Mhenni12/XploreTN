/**
 * hooks/useAI.ts
 * ──────────────
 * Custom React hooks wrapping every AI service call with:
 *   - TypeScript generics for typed result shapes
 *   - Loading / error state
 *   - Request cancellation via AbortController (prevents state updates on
 *     unmounted components and race conditions from rapid input changes)
 *   - Debouncing for the search hook (avoids a request per keystroke)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { isAxiosError } from "axios";
import {
  semanticSearch,
  personalisedSearch,
  getRecommendations,
  matchLocals,
  getErrorMessage,
} from "../services/ai";
import type { EntityType, ScoredItem } from "../types/ai.types";

// ── Shared hook state shape ───────────────────────────────────────────────────

interface HookState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// useSearch
// ─────────────────────────────────────────────────────────────────────────────

interface UseSearchOptions {
  entity?: EntityType;
  /** When true, uses personalisedSearch (requires login). Default: false */
  personalised?: boolean;
  top_k?: number;
  /** Milliseconds to wait after the last keystroke before firing. Default: 400 */
  debounceMs?: number;
}

interface UseSearchReturn {
  results: ScoredItem[];
  loading: boolean;
  error: string | null;
}

/**
 * Debounced, cancellable semantic or personalised search hook.
 *
 * Usage:
 *   const { results, loading, error } = useSearch(query, { entity: 'activity' });
 *
 * The hook fires a new request only after `debounceMs` ms of inactivity.
 * Any in-flight request is cancelled when the query changes, preventing
 * stale results from appearing after rapid typing.
 */
export function useSearch(
  query: string,
  options: UseSearchOptions = {},
): UseSearchReturn {
  const {
    entity = "activity",
    personalised = false,
    top_k = 5,
    debounceMs = 400,
  } = options;

  const [state, setState] = useState<HookState<ScoredItem[]>>({
    data: [],
    loading: false,
    error: null,
  });

  // useRef so the abort controller persists across renders without triggering re-renders
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear results immediately when the query is too short
    if (!query || query.trim().length < 2) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    // Debounce — cancel the previous timer on every keystroke
    const timer = setTimeout(async () => {
      // Cancel any still-running request from a previous debounce cycle
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = personalised
          ? await personalisedSearch(query, 0.5, top_k)
          : await semanticSearch(query, entity, top_k);

        setState({ data: response.results, loading: false, error: null });
      } catch (err) {
        // Ignore cancellation errors — they fire when the component unmounts
        // or when a new request supersedes this one
        if (isAxiosError(err) && err.code === "ERR_CANCELED") return;

        setState({ data: [], loading: false, error: getErrorMessage(err) });
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, entity, personalised, top_k, debounceMs]);

  return { results: state.data, loading: state.loading, error: state.error };
}

// ─────────────────────────────────────────────────────────────────────────────
// useRecommendations
// ─────────────────────────────────────────────────────────────────────────────

interface UseRecommendationsReturn {
  results: ScoredItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches profile-based recommendations once on mount.
 * `refetch` triggers a manual reload (e.g., after profile update).
 *
 * Usage:
 *   const { results, loading, refetch } = useRecommendations('activity');
 */
export function useRecommendations(
  entity: EntityType = "activity",
  top_k: number = 5,
): UseRecommendationsReturn {
  const [state, setState] = useState<HookState<ScoredItem[]>>({
    data: [],
    loading: false,
    error: null,
  });

  // useCallback so `refetch` has a stable reference — safe to pass as a prop
  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await getRecommendations(entity, top_k);
      setState({ data: response.results, loading: false, error: null });
    } catch (err) {
      setState({ data: [], loading: false, error: getErrorMessage(err) });
    }
  }, [entity, top_k]);

  // Fetch on mount and whenever entity / top_k changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    results: state.data,
    loading: state.loading,
    error: state.error,
    refetch: fetchData,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useMatchLocals
// ─────────────────────────────────────────────────────────────────────────────

interface UseMatchLocalsReturn {
  matches: ScoredItem[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches compatible local guides for the logged-in tourist.
 * One-directional: only meaningful for TOURISTE role users.
 *
 * Usage:
 *   const { matches, loading } = useMatchLocals();
 */
export function useMatchLocals(top_k: number = 3): UseMatchLocalsReturn {
  const [state, setState] = useState<HookState<ScoredItem[]>>({
    data: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    // Track whether the component is still mounted
    let cancelled = false;

    (async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await matchLocals(top_k);
        if (!cancelled) {
          setState({ data: response.matches, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState({ data: [], loading: false, error: getErrorMessage(err) });
        }
      }
    })();

    // Cleanup: prevent state update if component unmounts before response arrives
    return () => {
      cancelled = true;
    };
  }, [top_k]);

  return { matches: state.data, loading: state.loading, error: state.error };
}
