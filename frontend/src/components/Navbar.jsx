// src/components/Navbar.jsx
import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  // responsive flags
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onResize() {
      setWidth(window.innerWidth);
      // close mobile drawer when enlarging
      if (window.innerWidth >= 966) setMobileOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isCompact = width < 966; // use compact/hamburger below 966px
  const isMobile = width < 768;  // full mobile breakpoint

  const linkClass = ({ isActive }) =>
    `px-3 py-1 rounded-full text-sm font-medium transition-colors duration-150 ${
      isActive ? "bg-white/10 text-white" : "text-gray-300 hover:text-white hover:bg-white/5"
    }`;

  return (
    <header className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 shadow-md fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-[72px] flex items-center justify-between gap-4">
          {/* LEFT: Logo + (desktop) search */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* logo icon */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center">
                {/* simple fork icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-amber-300">
                  <path d="M7 3v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11 3v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 8c0 2 1 4 4 4s4-2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 20h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* Pocket / Recipes stacked title */}
              <div className="leading-none flex flex-col">
                <span className="text-white font-extrabold tracking-wide text-lg select-none">POCKET</span>
                <span className="text-amber-100 text-xs font-semibold -mt-0.5 select-none">Recipes</span>
              </div>
            </div>

            {/* Search input - keep from shrinking */}
            <div className="ml-4 flex-shrink-0">
              {/* hide full search on very small screens */}
              <div className={`${isMobile ? "hidden" : "block"} relative`}>
                <input
                  type="search"
                  placeholder="Search recipes..."
                  aria-label="Search recipes"
                  className="w-[320px] md:w-[420px] lg:w-[380px] bg-slate-800/60 placeholder:text-slate-400 text-sm text-white rounded-full px-4 py-2 shadow-inner border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                />
              </div>
            </div>
          </div>

          {/* RIGHT: nav links or hamburger */}
          <div className="flex items-center gap-4">
            {/* show links only when not compact */}
            {!isCompact ? (
              <nav className="flex items-center gap-4">
                <NavLink to="/" className={linkClass}>Home</NavLink>
                <NavLink to="/surprise-me" className={linkClass}>Surprise</NavLink>
                <NavLink to="/Ai-Chat" className={linkClass}>AI</NavLink>

                {/* small recipe count pill placeholder */}
                {/* <div className="ml-2 px-3 py-1 rounded-full bg-white/5 text-sm text-amber-200 border border-white/5">
                  0 recipes
                </div> */}

                {/* saved/bookmark icon */}
                <button
                  title="Saved"
                  className="ml-2 p-2 rounded-full bg-white/5 hover:bg-white/10 transition text-white"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M6 3h12v18l-6-3-6 3V3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-white" />
                  </svg>
                </button>
              </nav>
            ) : (
              // compact/hamburger: show small search icon and hamburger
              <div className="flex items-center gap-2">
                {/* compact search icon (visible on compact but not mobile) */}
                <button className={`p-2 rounded-full bg-white/5 hover:bg-white/10 transition ${isMobile ? "hidden" : "inline-flex"}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5"></circle>
                  </svg>
                </button>

                <button
                  aria-label="Open menu"
                  onClick={() => setMobileOpen((s) => !s)}
                  className="p-2 rounded-md bg-white/5 hover:bg-white/10 transition"
                >
                  {/* hamburger */}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M3 7h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"></path>
                    <path d="M3 12h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"></path>
                    <path d="M3 17h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"></path>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer (small overlay panel) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40"
          aria-hidden={false}
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />

          <aside className="absolute right-0 top-0 h-full w-72 bg-slate-900/95 backdrop-blur-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-amber-400/10 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M7 3v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M11 3v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div className="text-white font-bold">POCKET</div>
                  <div className="text-amber-100 text-xs">Recipes</div>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded bg-white/5">
                ✕
              </button>
            </div>

            <nav className="flex flex-col gap-3">
              <NavLink to="/" className={linkClass} onClick={() => setMobileOpen(false)}>Home</NavLink>
              <NavLink to="/surprise-me" className={linkClass} onClick={() => setMobileOpen(false)}>Surprise</NavLink>
              <NavLink to="/Ai-Chat" className={linkClass} onClick={() => setMobileOpen(false)}>AI</NavLink>
              <div className="mt-4 text-sm text-slate-300">
                <strong>Saved</strong>
                <div className="text-xs text-slate-400 mt-1">No saved recipes</div>
              </div>
              <div className="mt-6">
                <input
                  type="search"
                  placeholder="Search recipes..."
                  className="w-full rounded-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-white"
                />
              </div>
            </nav>
          </aside>
        </div>
      )}
    </header>
  );
}
