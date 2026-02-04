// CardFlipWithModalFLIPFixed.jsx
import React, { useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";

function ModalPortal({ children }) {
  const elRef = useRef(null);
  if (!elRef.current) {
    elRef.current = document.createElement("div");
    elRef.current.className = "card-modal-root";
  }
  useEffect(() => {
    document.body.appendChild(elRef.current);
    return () => document.body.removeChild(elRef.current);
  }, []);
  return ReactDOM.createPortal(children, elRef.current);
}

export default function CardFlipWithModalFLIPFixed({
  title,
  rating = 4,
  description,
  featured_image,
  items = ["item1", "item2", "item3"],
}) {
  const cardRef = useRef(null);
  const cloneRef = useRef(null);

  const [flipped, setFlipped] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [showModalContent, setShowModalContent] = useState(false);
  const [cloneStyle, setCloneStyle] = useState(null);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // compute centered modal rectangle
  function computeTargetRect() {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const targetW = Math.min(vw * 0.9, 900);
    const targetH = Math.min(vh * 0.85, 800);
    const left = (vw - targetW) / 2;
    const top = (vh - targetH) / 2;
    return { left, top, width: targetW, height: targetH };
  }

  // compute transform from src -> target
  function computeTransformFor(src, target) {
    const srcCx = src.left + src.width / 2;
    const srcCy = src.top + src.height / 2;
    const tgtCx = target.left + target.width / 2;
    const tgtCy = target.top + target.height / 2;
    const dx = tgtCx - srcCx;
    const dy = tgtCy - srcCy;
    const sx = target.width / src.width;
    const sy = target.height / src.height;
    return { translate: `translate(${dx}px, ${dy}px)`, scale: `scale(${sx}, ${sy})`, sx, sy, dx, dy };
  }

  // OPEN: clone placed at card rect (left/top=src), transform NONE -> animate to transform (src->target)
  function openPopup() {
    if (!cardRef.current) return;
    const srcRect = cardRef.current.getBoundingClientRect();
    const target = computeTargetRect();

    const initial = {
      position: "fixed",
      left: `${srcRect.left}px`,
      top: `${srcRect.top}px`,
      width: `${srcRect.width}px`,
      height: `${srcRect.height}px`,
      borderRadius: window.getComputedStyle(cardRef.current).borderRadius || "12px",
      overflow: "hidden",
      zIndex: 9999,
      background: "#fff",
      transition: prefersReducedMotion
        ? "none"
        : "transform 460ms cubic-bezier(.2,.9,.2,1), border-radius 360ms cubic-bezier(.2,.9,.2,1), box-shadow 360ms cubic-bezier(.2,.9,.2,1)",
      transformOrigin: "center center",
      boxShadow: "0 18px 40px rgba(2,6,23,0.25)",
      willChange: "transform",
      transform: "none", // start at identity
    };

    setCloneStyle(initial);
    setOverlayVisible(true);

    // compute transform (src -> target)
    const tm = computeTransformFor(srcRect, target);
    const transformValue = `${tm.translate} ${tm.scale}`;

    // animate (transform only)
    requestAnimationFrame(() => {
      setCloneStyle((prev) => ({
        ...prev,
        transform: transformValue,
        borderRadius: "12px",
        boxShadow: "0 40px 110px rgba(2,6,23,0.30)",
      }));
    });

    // show modal content after animation
    if (prefersReducedMotion) {
      setShowModalContent(true);
      setCloneStyle(null);
    } else {
      // wait for transition end: use timeout slightly above duration
      setTimeout(() => {
        setShowModalContent(true);
        setCloneStyle(null);
      }, 500);
    }
  }

  // CLOSE: create clone positioned at srcRect (left/top=src) with transform = src->target (so visually it's at modal),
  // then animate transform to NONE -> clone animates back to card. This avoids jumps.
  function closePopup() {
    if (!cardRef.current) {
      // fallback: just hide
      setShowModalContent(false);
      setOverlayVisible(false);
      setFlipped(false);
      return;
    }

    const srcRect = cardRef.current.getBoundingClientRect();
    const target = computeTargetRect();
    const tm = computeTransformFor(srcRect, target);
    const startTransform = `${tm.translate} ${tm.scale}`;

    // remove modal content first (so only clone is visible)
    setShowModalContent(false);

    // set clone positioned at srcRect but transformed so it visually is at modal (start of reverse anim)
    const start = {
      position: "fixed",
      left: `${srcRect.left}px`,   // crucial: keep left/top as srcRect
      top: `${srcRect.top}px`,
      width: `${srcRect.width}px`,
      height: `${srcRect.height}px`,
      borderRadius: "12px",
      overflow: "hidden",
      zIndex: 9999,
      background: "#fff",
      transition: prefersReducedMotion
        ? "none"
        : "transform 460ms cubic-bezier(.2,.9,.2,1), border-radius 360ms cubic-bezier(.2,.9,.2,1), box-shadow 360ms cubic-bezier(.2,.9,.2,1)",
      transformOrigin: "center center",
      boxShadow: "0 40px 110px rgba(2,6,23,0.30)",
      willChange: "transform",
      transform: startTransform, // visually placed at modal
    };

    // show clone and overlay (overlay remains)
    setCloneStyle(start);
    setOverlayVisible(true);

    // next frame: animate transform to none -> moves clone back to srcRect visual
    requestAnimationFrame(() => {
      setCloneStyle((prev) => ({
        ...prev,
        transform: "none", // animate back to identity
        borderRadius: window.getComputedStyle(cardRef.current).borderRadius || "12px",
        boxShadow: "0 18px 40px rgba(2,6,23,0.25)",
      }));
    });

    // after animation completes: remove clone, overlay, reset flip
    if (prefersReducedMotion) {
      setCloneStyle(null);
      setOverlayVisible(false);
      setFlipped(false);
    } else {
      setTimeout(() => {
        setCloneStyle(null);
        setOverlayVisible(false);
        setFlipped(false);
      }, 500);
    }
  }

  // click handler
  function handleClick(e) {
    e.preventDefault();
    if (!flipped) {
      setFlipped(true);
      return;
    }
    openPopup();
  }

  // card inner markup unchanged
  const cardInner = (
    <div
      ref={cardRef}
      className={`card-3d inline-block rounded-3xl ${flipped ? "flip" : ""}`}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onFocus={() => setFlipped(true)}
      onBlur={() => setFlipped(false)}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      style={{ width: 320, height: 400, cursor: "pointer", outline: "none" }}
    >
      <div
        className="card relative w-full h-full rounded-3xl"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.6s cubic-bezier(.2,.9,.2,1)",
          willChange: "transform",
        }}
      >
        {/* FRONT */}
        <div className="card-face card-front absolute inset-0 rounded-3xl overflow-hidden z-10">
          <img
            src={featured_image || "https://static.spotapps.co/website_images/ab_websites/174603_website_v1/menu.jpg"}
            alt={title}
            className="w-full h-full object-cover opacity-95"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-[#C2410C] p-3 rounded-b-3xl">
            <div className="text-amber-300 text-xl">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i + 1 <= rating ? "text-amber-300" : "text-gray-300"}>
                  &#9733;
                </span>
              ))}
            </div>
            <h2 className="text-2xl font-extrabold mt-1 line-clamp-2">{title?.toUpperCase()}</h2>
            <ul className="flex gap-1 mt-2 text-sm text-orange-100">
              {items.slice(0, 3).map((it, idx) => (
                <li key={idx} className="capitalize">
                  {it}
                  {idx < 2 ? " | " : ""}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* BACK */}
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
            {items.map((it, idx) => (
              <li key={idx} className="capitalize">
                • {it}
              </li>
            ))}
          </ul>
          <div className="text-white font-bold mt-2">Recipe:</div>
          <div className="mt-1 text-sm max-h-[60%] overflow-y-auto pr-2">
            <p>{description}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {cardInner}

      {overlayVisible && (
        <ModalPortal>
          {/* overlay */}
          <div
            onMouseDown={() => {
              if (showModalContent) closePopup();
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9988,
              background: "rgba(6,6,6,0.28)",
              backdropFilter: "blur(6px) saturate(110%)",
              transition: "opacity 260ms ease",
              opacity: showModalContent ? 1 : 0.98,
            }}
          />

          {/* clone (positioned at srcRect always; transform applied to move it to modal) */}
          {cloneStyle && (
            <div
              ref={cloneRef}
              style={{
                ...cloneStyle,
              }}
            >
              {/* back content inside clone (user clicked when flipped) */}
              <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "#C2410C", padding: 20, color: "white" }}>
                  <div style={{ fontWeight: 700 }}>Ingredients:</div>
                  <ul>
                    {items.map((it, idx) => (
                      <li key={idx} style={{ textTransform: "capitalize" }}>
                        • {it}
                      </li>
                    ))}
                  </ul>
                  <div style={{ fontWeight: 700, marginTop: 12 }}>Recipe:</div>
                  <div style={{ marginTop: 6 }}>{description}</div>
                </div>
              </div>
            </div>
          )}

          {/* modal content shown after open animation */}
          {showModalContent && (
            <div
              role="dialog"
              aria-modal="true"
              style={{
                position: "fixed",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "min(90vw, 900px)",
                height: "min(85vh, 800px)",
                zIndex: 9999,
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 40px 120px rgba(2,6,23,0.35)",
                background: "#fff",
                display: "flex",
                flexDirection: "row",
              }}
            >
              <div style={{ width: "45%", minWidth: 260, height: "100%", overflow: "hidden" }}>
                <img
                  src={featured_image || "https://static.spotapps.co/website_images/ab_websites/174603_website_v1/menu.jpg"}
                  alt={title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              <div style={{ padding: 24, flex: 1, overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h2 style={{ margin: 0 }}>{title}</h2>
                  <button
                    onClick={closePopup}
                    style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer" }}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div style={{ marginTop: 12 }}>
                  <strong>Ingredients</strong>
                  <ul>
                    {items.map((it, idx) => (
                      <li key={idx} style={{ textTransform: "capitalize" }}>
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginTop: 12 }}>
                  <strong>Recipe</strong>
                  <div style={{ marginTop: 6 }}>{description}</div>
                </div>
              </div>
            </div>
          )}
        </ModalPortal>
      )}
    </>
  );
}
