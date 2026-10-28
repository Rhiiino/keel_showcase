// frontend/src/modules/auth/hooks/useMobileUnsupported.ts

// True on phones and other narrow screens where the showcase layout is not usable.

import { useEffect, useState } from "react";

/** Covers phone portrait and landscape, including large phones around 930px wide. */
const NARROW_SCREEN_QUERY = "(max-width: 960px)";

const PHONE_USER_AGENT =
  /iPhone|iPod|Android.+Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i;

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: { mobile?: boolean };
};

export function isMobileUnsupported(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgentData = (navigator as NavigatorWithUserAgentData).userAgentData;
  if (userAgentData?.mobile) {
    return true;
  }

  if (PHONE_USER_AGENT.test(navigator.userAgent)) {
    return true;
  }

  return window.matchMedia(NARROW_SCREEN_QUERY).matches;
}

export function useMobileUnsupported(): boolean {
  const [unsupported, setUnsupported] = useState(isMobileUnsupported);

  useEffect(() => {
    const media = window.matchMedia(NARROW_SCREEN_QUERY);
    const update = () => setUnsupported(isMobileUnsupported());
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return unsupported;
}
