import { useEffect, useState } from "react";

const DESKTOP_QUERY = "(min-width: 1024px)";

// SSR-safe: defaults to false so server and first client render both
// produce mobile-shaped markup (no hydration mismatch). Settles to the
// real value once the effect below runs, causing one harmless extra
// render on an actual desktop-width first load.
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isDesktop;
}
