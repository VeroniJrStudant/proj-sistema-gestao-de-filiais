"use client";

import { useEffect, useState } from "react";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 320);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleClick() {
    const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
    window.scrollTo({ top: 0, left: 0, behavior });
  }

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 transition ${
        visible ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"
      }`}
    >
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-2 rounded-full border border-line bg-[#2d6b78] px-4 py-3 text-sm font-semibold text-on-accent shadow-lg shadow-black/5 ring-1 ring-black/5 transition hover:bg-[#1f4f58] focus:outline-none focus:ring-2 focus:ring-accent/40 dark:shadow-black/20"
        aria-label="Voltar ao topo"
        title="Voltar ao topo"
      >
        <svg
          className="h-4 w-4 text-on-accent/90"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5l-7 7m7-7l7 7M12 5v14" />
        </svg>
        Voltar ao topo
      </button>
    </div>
  );
}

