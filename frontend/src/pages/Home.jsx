// Home.jsx (fetch + small client cache)
import React, { useEffect, useState, useRef } from "react";
import Card from "../components/Card";
import Typewriter from "../components/Text";

// ===== Simple module-level cache =====
// Persists across route navigation (module stays loaded).
let recipesCache = null; // { data: [...], limit: number, ts: number }

const STORAGE_KEY = "pocket_recipes_cache_v1";
const TTL_MS = 2 * 60 * 1000; // cache TTL: 2 minutes (adjustable)

function loadCacheFromSession() {
  if (recipesCache) return recipesCache;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // validate shape
    if (parsed && Array.isArray(parsed.data) && typeof parsed.limit === "number" && typeof parsed.ts === "number") {
      recipesCache = parsed;
      return recipesCache;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function saveCacheToSession(cacheObj) {
  try {
    recipesCache = cacheObj;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cacheObj));
  } catch (e) {
    // ignore storage errors
  }
}

function isCacheFresh(cacheObj) {
  if (!cacheObj) return false;
  return Date.now() - cacheObj.ts < TTL_MS;
}
// ===== end cache helpers =====

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [limit, setLimit] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const abortRef = useRef(null);

  // NOTE: ensure .env contains VITE_API_BASE_URL=http://localhost:8000 (restart dev server after editing)
  const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

  function deterministicRating(title) {
    if (!title) return 4;
    const n = [...title].reduce((s, ch) => s + ch.charCodeAt(0), 0);
    return (n % 5) + 1;
  }

  function firstIngredientItems(ingredients = [], n = 3) {
    if (!Array.isArray(ingredients)) return [];
    return ingredients.slice(0, n).map((ing) => {
      if (typeof ing === "string") return ing;
      if (ing && ing.item) return ing.item;
      return JSON.stringify(ing).slice(0, 18);
    });
  }
  
// helper: fetch meta from backend
async function fetchRecipesMeta() {
  const url = `${API_BASE || "http://localhost:8000"}/recipes/meta`;
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Meta API ${res.status}: ${txt}`);
  }
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("application/json")) {
    const txt = await res.text();
    throw new Error(`Meta: expected JSON got ${ct}: ${txt.slice(0,200)}`);
  }
  return res.json(); // {count, latest}
}

// updated fetchRecipes with validation
async function fetchRecipes(limitParam = 12, { force = false } = {}) {
  setError(null);

  // try using in-memory/session cache if present
  const cached = loadCacheFromSession(); // existing helper from earlier
  if (!force && cached && isCacheFresh(cached) && Array.isArray(cached.data)) {
    try {
      // fetch meta to validate cache
      const meta = await fetchRecipesMeta();
      // If meta matches cached fingerprint, reuse cache
      // Use both count and latest to be safer
      if (meta && meta.count === cached.data.length && meta.latest === cached.ts_latest) {
        setRecipes(cached.data.slice(0, limitParam));
        setHasMore(cached.data.length >= limitParam);
        return;
      }
      // if count differs or latest differs → fallthrough to network fetch
    } catch (metaErr) {
      // meta check failed: network problems or server error.
      // If meta couldn't be fetched, we choose a conservative path:
      // - if cached data is fresh (within TTL), use it to avoid blocking UX.
      // - otherwise continue to full fetch.
      console.warn("recipes meta check failed:", metaErr);
      if (isCacheFresh(cached)) {
        setRecipes(cached.data.slice(0, limitParam));
        setHasMore(cached.data.length >= limitParam);
        return;
      }
      // else fallthrough, fetch fresh below
    }
  }

  // no valid cache -> fetch the full dataset
  setLoading(true);
  if (abortRef.current) abortRef.current.abort();
  abortRef.current = new AbortController();
  const signal = abortRef.current.signal;

  try {
    const url = `${API_BASE || "http://localhost:8000"}/recipes?limit=${encodeURIComponent(limitParam)}`;
    const res = await fetch(url, { signal });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`API ${res.status}: ${txt}`);
    }
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("application/json")) {
      const txt = await res.text();
      throw new Error(`Expected JSON but got ${ct || "text/html"}: ${txt.slice(0,500)}`);
    }
    const json = await res.json();
    if (!Array.isArray(json)) throw new Error("Unexpected API response: expected array");

    // update UI
    setRecipes(json.slice(0, limitParam));
    setHasMore(json.length >= limitParam);

    // also compute a small fingerprint for cache:
    //  - ts_latest: use server-provided 'created_at' of most-recent row if present
    // We'll request the meta we added earlier to store a trustworthy latest timestamp
    let meta = null;
    try {
      meta = await fetchRecipesMeta();
    } catch (e) {
      /* ignore - we'll still cache without meta timestamp */
    }

    const cachePayload = {
      data: json,
      limit: limitParam,
      ts: Date.now(),
      ts_latest: meta && meta.latest ? meta.latest : null,
    };
    saveCacheToSession(cachePayload);
  } catch (err) {
    if (err.name === "AbortError") return;
    console.error("fetchRecipes error:", err);
    setError(err.message || String(err));
  } finally {
    setLoading(false);
    abortRef.current = null;
  }
}

  async function fetchRecipes(limitParam = 12, { force = false } = {}) {
    setError(null);

    // Try using cache first (unless force)
    try {
      const cached = loadCacheFromSession();
      if (!force && cached && isCacheFresh(cached) && Array.isArray(cached.data) && cached.limit >= limitParam) {
        // cached data already covers requested limit
        setRecipes(cached.data.slice(0, limitParam));
        setHasMore(cached.data.length >= limitParam);
        return;
      }
    } catch (e) {
      // ignore cache errors and fall back to network
    }

    setLoading(true);
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    try {
      const url = `${API_BASE || "http://localhost:8000"}/recipes?limit=${encodeURIComponent(limitParam)}`;
      console.debug("Fetching recipes from:", url);

      const res = await fetch(url, { signal });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API ${res.status}: ${txt}`);
      }

      const ct = (res.headers.get("content-type") || "").toLowerCase();
      if (!ct.includes("application/json")) {
        const txt = await res.text();
        const preview = txt.slice(0, 500);
        throw new Error(`Expected JSON but got ${ct || "text/html"}: ${preview}`);
      }

      const json = await res.json();
      if (!Array.isArray(json)) throw new Error("Unexpected API response: expected array");

      // update state & cache
      setRecipes(json.slice(0, limitParam));
      setHasMore(json.length >= limitParam);

      // Save cache: store what server returned and what limit this corresponds to
      const cacheObj = { data: json, limit: limitParam, ts: Date.now() };
      saveCacheToSession(cacheObj);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("fetchRecipes error:", err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  // initial load / on limit change
  useEffect(() => {
    // Attempt to use cached content (and fetch if needed)
    fetchRecipes(limit);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  function handleLoadMore() {
    // increase limit -> fetch will either use cache (if it covers new limit) or request server
    setLimit((prev) => prev + 12);
  }

  return (
    <div className="px-6 py-6">
      <div className="flex justify-center mb-6">
        <Typewriter />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">{loading ? "Loading…" : `${recipes.length} shown`}</div>
      </div>

      {error && (
        <div className="mb-4 text-red-600 bg-red-50 p-3 rounded">
          <strong>Error:</strong> {error}
          <button className="ml-4 px-3 py-1 bg-red-100 rounded text-sm" onClick={() => fetchRecipes(limit, { force: true })}>
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading && recipes.length === 0
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="h-[25rem] w-full rounded-3xl bg-gray-100 animate-pulse" />
            ))
          : recipes.map((r) => {
              const title = r.title || "Untitled";
              const rating = deterministicRating(title);
              const description = r.overview?.description || r.raw_text?.slice(0, 120) || "No description";
              const items = firstIngredientItems(r.ingredients, 3);
              return (
                <div key={r.id || title} className="">
                  <Card title={title} rating={rating} description={description} featured_image={r.featured_image || null} items={items} />
                </div>
              );
            })}
      </div>

      <div className="flex justify-center mt-8">
        {loading && recipes.length > 0 ? (
          <div className="px-4 py-2 text-gray-700">Loading more…</div>
        ) : hasMore ? (
          <button className="px-4 py-2 rounded bg-[#C2410C] text-white hover:bg-[#a23208] transition" onClick={handleLoadMore}>
            Load more
          </button>
        ) : (
          <div className="text-sm text-gray-500">No more recipes</div>
        )}
      </div>
    </div>
  );
}
