// keel_web/src/modules/home/cards/layout/useHomeCardContentScale.ts

// Scales resizable card content to fit its slot dimensions.

import { useEffect, useRef, useState } from "react";

export function useHomeCardContentScale(baseWidth: number, baseHeight: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return undefined;
    }

    const updateScale = () => {
      const width = node.clientWidth;
      const height = node.clientHeight;
      if (width <= 0 || height <= 0) {
        return;
      }
      setScale(Math.min(width / baseWidth, height / baseHeight));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(node);
    return () => observer.disconnect();
  }, [baseHeight, baseWidth]);

  return { containerRef, scale };
}
