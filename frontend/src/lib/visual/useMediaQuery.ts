// keel_web/src/lib/visual/useMediaQuery.ts

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(query);
    const handler = () => setMatches(media.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

const NARROW_VIEWPORT_QUERY = "(max-width: 768px)";

/** Touch-primary devices (phones, most tablets) — unaffected by browser window width. */
const TOUCH_PRIMARY_DEVICE_QUERY = "(hover: none) and (pointer: coarse)";

const MOBILE_USER_AGENT_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;

export function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  if (navigator.userAgentData?.mobile) {
    return true;
  }

  return MOBILE_USER_AGENT_PATTERN.test(navigator.userAgent);
}

export function useIsNarrowViewport(): boolean {
  return useMediaQuery(NARROW_VIEWPORT_QUERY);
}

/** True on phones/tablets — not when a desktop browser is merely resized narrow. */
export function useIsMobileDevice(): boolean {
  const touchPrimaryDevice = useMediaQuery(TOUCH_PRIMARY_DEVICE_QUERY);
  const [mobileUserAgent, setMobileUserAgent] = useState(() => isMobileUserAgent());

  useEffect(() => {
    setMobileUserAgent(isMobileUserAgent());
  }, []);

  return touchPrimaryDevice || mobileUserAgent;
}
