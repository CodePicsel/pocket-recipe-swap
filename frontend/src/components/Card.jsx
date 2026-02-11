// CardFlipWithModalFLIPFixed.jsx
import React, { useRef, useState } from "react";
import ReactDOM from "react-dom";

function ModalPortal({ children }) {
  const elRef = useRef(null);
  if (!elRef.current) {
    elRef.current = document.createElement("div");
    elRef.current.className = "card-modal-root";
  }
  React.useEffect(() => {
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

  const [flipped, setFlipped] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);

  // modalRect state drives the single modal element (null = not mounted)
  const [modalRect, setModalRect] = useState(null);
  const [modalContentVisible, setModalContentVisible] = useState(false); // controls opacity of modal inner content
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ANIM_MS = 420; // duration for geometry changes
  const CONTENT_FADE_MS = 220;

  function computeTargetRect() {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const targetW = Math.min(vw * 0.9, 900);
    const targetH = Math.min(vh * 0.85, 800);
    const left = (vw - targetW) / 2;
    const top = (vh - targetH) / 2;
    return { left, top, width: targetW, height: targetH };
  }

  // open: mount modalRect at card's geometry -> transition to target geometry (using left/top/width/height)
  function openPopup() {
    if (!cardRef.current) return;
    const src = cardRef.current.getBoundingClientRect();
    const target = computeTargetRect();

    // start with modal element mounted at card rect (no transform/scale)
    const initial = {
      left: `${src.left}px`,
      top: `${src.top}px`,
      width: `${src.width}px`,
      height: `${src.height}px`,
      borderRadius: window.getComputedStyle(cardRef.current).borderRadius || "12px",
      boxShadow: "0 18px 40px rgba(2,6,23,0.25)",
    };

    setModalRect(initial);
    setOverlayVisible(true);
    setModalContentVisible(false); // hide content while geom animates

    if (prefersReducedMotion) {
      // no animation: mount final modal instantly
      const final = {
        left: `${target.left}px`,
        top: `${target.top}px`,
        width: `${target.width}px`,
        height: `${target.height}px`,
        borderRadius: "12px",
        boxShadow: "0 40px 110px rgba(2,6,23,0.70)",
      };
      setModalRect(final);
      setTimeout(() => setModalContentVisible(true), 10);
      return;
    }

    // small frame then start geometry transition
    requestAnimationFrame(() => {
      // apply CSS transition tuning in style rendering below; update geometry
      const final = {
        left: `${target.left}px`,
        top: `${target.top}px`,
        width: `${target.width}px`,
        height: `${target.height}px`,
        borderRadius: "12px",
        boxShadow: "0 40px 110px rgba(2,6,23,0.70)",
      };
      setModalRect(final);

      // reveal content halfway through the geometry animation for smoother appearance
      const contentDelay = Math.max(80, Math.round(ANIM_MS * 0.5));
      setTimeout(() => setModalContentVisible(true), contentDelay + 8);
    });
  }

  // close: hide content -> animate geometry back to card rect -> unmount
  function closePopup() {
    if (!cardRef.current) {
      setModalContentVisible(false);
      setOverlayVisible(false);
      setFlipped(false);
      setModalRect(null);
      return;
    }

    if (prefersReducedMotion) {
      setModalContentVisible(false);
      setModalRect(null);
      setOverlayVisible(false);
      setFlipped(false);
      return;
    }

    // fade out content immediately
    setModalContentVisible(false);

    // compute srcRect (card) and then set modalRect to card geometry to animate back
    const src = cardRef.current.getBoundingClientRect();
    const target = {
      left: `${src.left}px`,
      top: `${src.top}px`,
      width: `${src.width}px`,
      height: `${src.height}px`,
      borderRadius: window.getComputedStyle(cardRef.current).borderRadius || "12px",
      boxShadow: "0 18px 40px rgba(2,6,23,0.25)",
    };

    // small delay to allow content fade to run
    const fadeDelay = 60;
    setTimeout(() => {
      setModalRect(target);
      // cleanup after animation
      setTimeout(() => {
        setModalRect(null);
        setOverlayVisible(false);
        setFlipped(false);
      }, ANIM_MS + 16);
    }, fadeDelay);
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

  // style helpers for modal rect -> convert modalRect to inline styles with transitions
  const modalInlineStyle = modalRect
    ? {
        position: "fixed",
        left: modalRect.left,
        top: modalRect.top,
        width: modalRect.width,
        height: modalRect.height,
        borderRadius: modalRect.borderRadius || "12px",
        overflow: "hidden",
        background: "#fff",
        boxShadow: modalRect.boxShadow || "0 18px 40px rgba(2,6,23,0.25)",
        zIndex: 9999,
        // animate numeric geometry properties (not scale)
        transition: prefersReducedMotion
          ? "none"
          : `left ${ANIM_MS}ms cubic-bezier(.2,.9,.2,1), top ${ANIM_MS}ms cubic-bezier(.2,.9,.2,1), width ${ANIM_MS}ms cubic-bezier(.2,.9,.2,1), height ${ANIM_MS}ms cubic-bezier(.2,.9,.2,1), border-radius ${Math.round(ANIM_MS * 0.8)}ms cubic-bezier(.2,.9,.2,1), box-shadow ${Math.round(ANIM_MS * 0.8)}ms cubic-bezier(.2,.9,.2,1)`,
        willChange: "left, top, width, height",
        pointerEvents: modalContentVisible ? "auto" : "none",
      }
    : null;

  return (
    <>
      {cardInner}

      {overlayVisible && (
        <ModalPortal>
          {/* overlay */}
          <div
            onMouseDown={() => {
              if (modalContentVisible) closePopup();
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9988,
              background: "rgba(6,6,6,0.28)",
              backdropFilter: "blur(6px) saturate(110%)",
              transition: "opacity 220ms ease",
              opacity: modalContentVisible ? 1 : 0.98,
            }}
          />

          {/* single modal element (mounted while modalRect != null) */}
          {modalRect && (
            <div style={modalInlineStyle}>
              {/* inner content: keep layout identical to previous centered modal,
                  but control opacity for a smooth reveal */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  position: "relative",
                  display: "flex",
                  flexDirection: "row",
                  opacity: modalContentVisible ? 1 : 0,
                  transition: `opacity ${CONTENT_FADE_MS}ms ease`,
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
            </div>
          )}
        </ModalPortal>
      )}
    </>
  );
}
