import { useSyncExternalStore } from "react";

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

// SSR (and the initial client hydration pass, per useSyncExternalStore's
// contract) both use this instead of getSnapshot — false matches the
// mobile-shaped markup the server renders, so there's no hydration
// mismatch. React re-renders with the real value right after hydration.
function getServerSnapshot() {
  return false;
}

export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
