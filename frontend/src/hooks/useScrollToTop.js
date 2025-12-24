import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Keeps a memory of scroll positions by pathname
const scrollPositions = new Map();

export default function useScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // disable browser auto scroll restoration
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Save the previous page’s scroll before leaving
    const prevPath = window.__prevPathname;
    if (prevPath) {
      scrollPositions.set(prevPath, window.scrollY);
    }

    // --- Scroll behavior depending on navigation type ---
    requestAnimationFrame(() => {
      if (navigationType === "POP") {
        // 🔹 Back/forward navigation → restore previous scroll
        const prevPos = scrollPositions.get(pathname) || 0;
        window.scrollTo({ top: prevPos, behavior: "auto" });

        if (window.lenis?.scrollTo) {
          window.lenis.scrollTo(prevPos, { immediate: true });
        }
      } else {
        // 🔹 New navigation → scroll to top
        window.scrollTo({ top: 0, behavior: "auto" });

        const scrollableAreas = document.querySelectorAll(
          "main.overflow-y-auto, .lenis, [data-scroll-container]"
        );

        scrollableAreas.forEach((el) => {
          try {
            el.scrollTo({ top: 0, behavior: "auto" });
          } catch {
            el.scrollTop = 0;
          }
        });

        if (window.lenis?.scrollTo) {
          window.lenis.scrollTo(0, { immediate: true });
        }
      }
    });

    // Fallback in case React Router finishes rendering late
    const timeout = setTimeout(() => {
      if (navigationType === "POP") {
        const prevPos = scrollPositions.get(pathname) || 0;
        window.scrollTo({ top: prevPos });
        if (window.lenis?.scrollTo) window.lenis.scrollTo(prevPos, { immediate: true });
      } else {
        window.scrollTo({ top: 0 });
        if (window.lenis?.scrollTo) window.lenis.scrollTo(0, { immediate: true });
      }
    }, 100);

    window.__prevPathname = pathname;
    return () => clearTimeout(timeout);
  }, [pathname, navigationType]);
}
