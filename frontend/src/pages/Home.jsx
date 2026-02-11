import React, { useEffect, useState, useRef } from "react";
import Card from "../components/Card";         // adjust path if your component filename differs
import Typewriter from "../components/Text";  // your existing typewriter

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [limit, setLimit] = useState(12);             // initial page size (change as needed)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const abortRef = useRef(null);

  // helper: deterministic rating from title so it doesn't jitter on re-renders
  function deterministicRating(title) {
    if (!title) return 4;
    const n = [...title].reduce((s, ch) => s + ch.charCodeAt(0), 0);
    return (n % 5) + 1; // 1..5
  }

  // helper: extract first N ingredient item names (strings)
  function firstIngredientItems(ingredients = [], n = 3) {
    if (!Array.isArray(ingredients)) return [];
    return ingredients.slice(0, n).map((ing) => {
      // model stores ingredient objects: { item, unit, quantity, notes }
      if (typeof ing === "string") return ing;
      if (ing && ing.item) return ing.item;
      // fallback stringify
      return JSON.stringify(ing).slice(0, 18);
    });
  }

  async function fetchRecipes(limitParam = 12) {
    setLoading(true);
    setError(null);
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    try {
      const res = await fetch(`http://localhost:8000/recipes?limit=${encodeURIComponent(limitParam)}`, { signal });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API ${res.status}: ${txt}`);
      }
      const json = await res.json();
      // expect an array; guard it
      if (!Array.isArray(json)) {
        throw new Error("Unexpected API response: expected array");
      }
      setRecipes(json);
      setHasMore(json.length >= limitParam); // if server returns fewer, probably no more
    } catch (err) {
      if (err.name === "AbortError") {
        // ignore abort
        return;
      }
      console.error("fetchRecipes error:", err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  // initial load / on limit change
  useEffect(() => {
    fetchRecipes(limit);
    // cleanup: abort on unmount
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [limit]);

  // load more handler (simple client-side pagination model)
  function handleLoadMore() {
    // increase limit to fetch more
    setLimit((prev) => prev + 12);
  }

  return (
    <div className="px-6 py-6">
      <div className="flex justify-center mb-6">
        <Typewriter />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Recipes</h1>
        <div className="text-sm text-gray-600">
          {loading ? "Loading…" : `${recipes.length} shown`}
        </div>
      </div>

      {error && (
        <div className="mb-4 text-red-600 bg-red-50 p-3 rounded">
          <strong>Error:</strong> {error}
          <button
            className="ml-4 px-3 py-1 bg-red-100 rounded text-sm"
            onClick={() => fetchRecipes(limit)}
          >
            Retry
          </button>
        </div>
      )}

      {/* responsive grid: 1 on mobile, 2 on sm, 3 on md, 4 on lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* skeleton placeholders while loading on first load */}
        {loading && recipes.length === 0
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="h-[25rem] w-full rounded-3xl bg-gray-100 animate-pulse" />
            ))
          : recipes.map((r) => {
              const title = r.title || "Untitled";
              const rating = deterministicRating(title);
              const description = r.overview?.description || r.raw_text?.slice(0, 120) || "No description";
              const items = firstIngredientItems(r.ingredients, 3);
              // if you want equipment or instructions, pass them too
              return (
                <div key={r.id} className="">
                  <Card
                    title={title}
                    rating={rating}
                    description={description}
                    featured_image={r.featured_image || null} // if server gives one in future
                    items={items}
                  />
                </div>
              );
            })}
      </div>

      {/* load more / no-more indicator */}
      <div className="flex justify-center mt-8">
        {loading && recipes.length > 0 ? (
          <div className="px-4 py-2 text-gray-700">Loading more…</div>
        ) : hasMore ? (
          <button
            className="px-4 py-2 rounded bg-[#C2410C] text-white hover:bg-[#a23208] transition"
            onClick={handleLoadMore}
          >
            Load more
          </button>
        ) : (
          <div className="text-sm text-gray-500">No more recipes</div>
        )}
      </div>
    </div>
  );
}
