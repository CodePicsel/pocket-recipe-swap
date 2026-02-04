// CardFlip.jsx
import React, { useState } from "react";

/*
Requires Tailwind for layout classes.
Add the small CSS below to a global CSS file or a module for the .card-3d classes.
*/

function CardFlip({ title, rating = 4, description, featured_image, items = ["item1", "item2", "item3"] }) {
  const [flipped, setFlipped] = useState(false);

  // prefer-reduced-motion support
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const transitionDuration = prefersReducedMotion ? "0.0s" : "0.6s";

  // dynamic shadow to simulate light direction change on flip (tweak values)
  const boxShadowFront = "0 18px 40px rgba(2,6,23,0.45)";
  const boxShadowBack  = "0 -10px 30px rgba(2,6,23,0.28)"; // inverted-y offset for 'flipped' look

  return (
     <div
      className={`card-3d inline-block rounded-3xl ${flipped ? 'flip' : ''}`}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onFocus={() => setFlipped(true)}
      onBlur={() => setFlipped(false)}
      onClick={(e) => { setFlipped(prev => !prev); e.preventDefault(); }}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      style={{
        width: 320,
        height: 400,
        cursor: "pointer",
        transition: `box-shadow ${transitionDuration} cubic-bezier(.2,.9,.2,1)`
      }}
    >
      <div
        className="card relative w-full h-full rounded-3xl ${flipped ? 'flipped' : ''}"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: `transform ${transitionDuration} cubic-bezier(.2,.9,.2,1)`,
          willChange: "transform",
        }}
      >
        {/* FRONT FACE */}
        <div
          className="card-face card-front absolute inset-0 rounded-3xl overflow-hidden z-10"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <img
            src={featured_image || "https://static.spotapps.co/website_images/ab_websites/174603_website_v1/menu.jpg"}
            alt={title}
            className="w-full h-full object-cover opacity-95"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-[#C2410C] p-3 rounded-b-3xl">
            <div className="text-amber-300 text-xl">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i + 1 <= rating ? "text-amber-300" : "text-gray-300"}>&#9733;</span>
              ))}
            </div>
            <h2 className="text-2xl font-extrabold mt-1 line-clamp-2">{title?.toUpperCase()}</h2>
            <ul className="flex gap-1 mt-2 text-sm text-orange-100">
              {items.slice(0, 3).map((it, idx) => <li key={idx} className="capitalize">{it}{idx < 2 ? " | " : ""}</li>)}
            </ul>
          </div>
        </div>

        {/* BACK FACE */}
        <div
          className="card-face card-back absolute inset-0 rounded-3xl p-4"
          style={{
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: "#C2410C",
            boxSizing: "border-box",
          }}
        >
          <div className="text-white font-bold">Ingredients:</div>
          <ul className="text-sm mt-1 mb-3">
            {items.map((it, idx) => <li key={idx} className="capitalize">• {it}</li>)}
          </ul>
          <div className="text-white font-bold mt-2">Recipe:</div>
          <div className="mt-1 text-sm max-h-[60%] overflow-y-auto pr-2">
            <p>{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardFlip;
