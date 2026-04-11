import { useState, useRef, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Suggestion {
  place_id: number;
  display_name: string;
  name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

// ─── Nominatim (OpenStreetMap) — no API key required ─────────────────────────

async function searchNominatim(query: string): Promise<Suggestion[]> {
  if (!query.trim() || query.length < 2) return [];
  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    limit: "6",
  });
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { headers: { "Accept-Language": "fr,en" } },
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function formatMain(s: Suggestion): string {
  const a = s.address ?? {};
  return (
    a.city ?? a.town ?? a.village ?? s.name ?? s.display_name.split(",")[0]
  );
}

function formatSecondary(s: Suggestion): string {
  return s.display_name
    .split(",")
    .slice(1, 4)
    .map((p) => p.trim())
    .join(", ");
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "e.g. Sidi Bou Said, Tunis",
  error,
  className,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    setLoading(true);
    const results = await searchNominatim(query);
    setSuggestions(results);
    setIsOpen(results.length > 0);
    setLoading(false);
  }, []);

  const handleInput = (val: string) => {
    onChange(val);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim() || val.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 350);
  };

  const selectSuggestion = (s: Suggestion) => {
    onChange(`${formatMain(s)}, ${formatSecondary(s)}`);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || !suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const inputCls = [
    "w-full bg-surface-container-low border rounded-xl px-4 py-3 text-sm text-on-surface",
    "placeholder:text-outline-variant focus:outline-none focus:ring-2 transition-all pr-10",
    error
      ? "border-error focus:ring-error/30"
      : "border-surface-variant/50 focus:border-primary focus:ring-primary/20",
    className ?? "",
  ].join(" ");

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={inputCls}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary/50">
          {loading ? (
            <span className="material-symbols-outlined text-base animate-spin">
              refresh
            </span>
          ) : (
            <span className="material-symbols-outlined text-base">
              location_on
            </span>
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-surface-container-lowest border border-surface-variant/40 rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden">
          <ul className="py-1.5 max-h-64 overflow-y-auto">
            {suggestions.map((s, i) => {
              const isActive = i === activeIndex;
              return (
                <li key={s.place_id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectSuggestion(s)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-surface-container-low text-on-surface"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-base mt-0.5 flex-shrink-0 ${isActive ? "text-primary" : "text-tertiary"}`}
                    >
                      location_on
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug truncate">
                        {formatMain(s)}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate mt-0.5">
                        {formatSecondary(s)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          {/* Attribution required by Nominatim usage policy */}
          <div className="px-4 py-2 border-t border-surface-variant/20 flex items-center justify-end">
            <span className="text-[10px] text-outline-variant">
              © OpenStreetMap contributors
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
