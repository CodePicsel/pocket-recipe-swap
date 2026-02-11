// Home.jsx (updated fetch handling)
import React, { useEffect, useState, useRef } from "react";
import Card from "../components/Card";
import Typewriter from "../components/Text";

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [limit, setLimit] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const abortRef = useRef(null);

  // NOTE: ensure .env contains VITE_API_BASE_URL=http://localhost:8000 (restart dev server after editing)
  const API_BASE = import.meta.env.VITE_API_BASE_URL || ""; 
  // const BASE = (API_BASE && API_BASE.replace(/\/$/, "")) || "http://localhost:8000";

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

  async function fetchRecipes(limitParam = 12) {
    setLoading(true);
    setError(null);
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    try {
      const url = `${API_BASE}/recipes?limit=${encodeURIComponent(limitParam)}`;
      console.debug("Fetching recipes from:", url);

      const res = await fetch(url, { signal });

      // If server returned non-OK, read text to show helpful message
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API ${res.status}: ${txt}`);
      }

      // Check content-type to avoid trying to parse HTML as JSON
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      if (!ct.includes("application/json")) {
        const txt = await res.text();
        // small preview to avoid huge logs
        const preview = txt.slice(0, 500);
        throw new Error(`Expected JSON but got ${ct || "text/html"}: ${preview}`);
      }

      const json = await res.json();
      if (!Array.isArray(json)) throw new Error("Unexpected API response: expected array");
      setRecipes(json);
      setHasMore(json.length >= limitParam);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("fetchRecipes error:", err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  useEffect(() => {
    fetchRecipes(limit);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [limit]);

  function handleLoadMore() {
    setLimit((prev) => prev + 12);
  }

  return (
    <div className="px-6 py-6">
      <div className="flex justify-center mb-6">
        <Typewriter />
      </div>

      <div className="flex items-center justify-between mb-4">
        {/* <h1 className="text-2xl font-bold">Recipes</h1> */}
        <div className="text-sm text-gray-600">{loading ? "Loading…" : `${recipes.length} shown`}</div>
      </div>

      {error && (
        <div className="mb-4 text-red-600 bg-red-50 p-3 rounded">
          <strong>Error:</strong> {error}
          <button className="ml-4 px-3 py-1 bg-red-100 rounded text-sm" onClick={() => fetchRecipes(limit)}>
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
