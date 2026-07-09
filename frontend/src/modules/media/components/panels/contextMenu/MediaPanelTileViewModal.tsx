// keel_web/src/modules/media/components/panels/contextMenu/MediaPanelTileViewModal.tsx

// Full-size media preview modal that expands from the invoking panel tile.

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { buildMediaContentUrl, type MediaPanelItem } from "../../../api";
import { isImageMimeType, isVideoMimeType } from "../../../lib/media";
import type { PanelTileRect } from "./panelTileRect";

export type MediaPanelTileViewModalState = {
  item: MediaPanelItem;
  tileRect: PanelTileRect;
} | null;

type MediaPanelTileViewModalProps = {
  state: MediaPanelTileViewModalState;
  onClose: () => void;
};

type FrameSize = {
  width: number;
  height: number;
};

type Presentation = {
  item: MediaPanelItem;
  tileRect: PanelTileRect;
  srcUrl: string;
  layout: {
    frameSize: FrameSize;
    position: { left: number; top: number };
    origin: { x: number; y: number };
    initialScale: number;
  };
};

const VIEWPORT_MARGIN_PX = 32;
const ANIMATION_MS = 0.34;

function fitFrameSize(naturalWidth: number, naturalHeight: number): FrameSize {
  const maxWidth = Math.max(120, window.innerWidth - VIEWPORT_MARGIN_PX * 2);
  const maxHeight = Math.max(120, window.innerHeight - VIEWPORT_MARGIN_PX * 2);
  const scale = Math.min(1, maxWidth / naturalWidth, maxHeight / naturalHeight);
  return {
    width: Math.max(1, Math.round(naturalWidth * scale)),
    height: Math.max(1, Math.round(naturalHeight * scale)),
  };
}

function resolveFramePosition(size: FrameSize) {
  return {
    left: Math.round((window.innerWidth - size.width) / 2),
    top: Math.round((window.innerHeight - size.height) / 2),
  };
}

function resolveTransformOrigin(tileRect: PanelTileRect, frameLeft: number, frameTop: number) {
  const tileCenterX = tileRect.left + tileRect.width / 2;
  const tileCenterY = tileRect.top + tileRect.height / 2;
  return {
    x: tileCenterX - frameLeft,
    y: tileCenterY - frameTop,
  };
}

function resolveInitialScale(tileRect: PanelTileRect, frame: FrameSize) {
  return Math.max(
    0.08,
    Math.min(tileRect.width / frame.width, tileRect.height / frame.height),
  );
}

async function loadMediaFrameSize(
  srcUrl: string,
  mimeType: string,
): Promise<FrameSize | null> {
  if (isImageMimeType(mimeType)) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve(fitFrameSize(img.naturalWidth, img.naturalHeight));
      };
      img.onerror = () => resolve(null);
      img.src = srcUrl;
    });
  }

  if (isVideoMimeType(mimeType)) {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        const width = video.videoWidth;
        const height = video.videoHeight;
        video.remove();
        if (width > 0 && height > 0) {
          resolve(fitFrameSize(width, height));
          return;
        }
        resolve(null);
      };
      video.onerror = () => {
        video.remove();
        resolve(null);
      };
      video.src = srcUrl;
    });
  }

  return null;
}

function buildPresentation(state: NonNullable<MediaPanelTileViewModalState>) {
  const srcUrl =
    state.item.media.status === "ready"
      ? buildMediaContentUrl(state.item.media.id, state.item.media.updated_at)
      : null;
  if (!srcUrl) {
    return null;
  }

  return {
    item: state.item,
    tileRect: state.tileRect,
    srcUrl,
  };
}

export function MediaPanelTileViewModal({ state, onClose }: MediaPanelTileViewModalProps) {
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const pendingPresentation = useMemo(() => {
    if (!state) {
      return null;
    }
    return buildPresentation(state);
  }, [state]);

  useEffect(() => {
    if (!pendingPresentation) {
      setIsVisible(false);
      return;
    }

    let cancelled = false;
    void loadMediaFrameSize(
      pendingPresentation.srcUrl,
      pendingPresentation.item.media.mime_type,
    ).then((frameSize) => {
      if (cancelled || !frameSize) {
        return;
      }

      const position = resolveFramePosition(frameSize);
      const origin = resolveTransformOrigin(
        pendingPresentation.tileRect,
        position.left,
        position.top,
      );
      const initialScale = resolveInitialScale(pendingPresentation.tileRect, frameSize);

      setPresentation({
        ...pendingPresentation,
        layout: {
          frameSize,
          position,
          origin,
          initialScale,
        },
      });
      setIsVisible(true);
    });

    return () => {
      cancelled = true;
    };
  }, [pendingPresentation]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, onClose]);

  useEffect(() => {
    if (!state) {
      setIsVisible(false);
    }
  }, [state]);

  if (typeof document === "undefined" || !presentation) {
    return null;
  }

  const { item, srcUrl, layout } = presentation;

  return createPortal(
    <AnimatePresence onExitComplete={() => setPresentation(null)}>
      {isVisible ? (
        <>
          <motion.button
            key="tile-view-backdrop"
            type="button"
            aria-label="Close preview"
            className="fixed inset-0 z-[300] cursor-default bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: ANIMATION_MS * 0.85, ease: "easeOut" }}
            onClick={onClose}
          />
          <motion.div
            key="tile-view-frame"
            role="dialog"
            aria-modal="true"
            aria-label={item.media.original_filename}
            className="fixed z-[301] overflow-hidden rounded-2xl bg-stone-950 shadow-2xl shadow-black/60 ring-1 ring-white/10"
            style={{
              width: layout.frameSize.width,
              height: layout.frameSize.height,
              left: layout.position.left,
              top: layout.position.top,
              transformOrigin: `${layout.origin.x}px ${layout.origin.y}px`,
            }}
            initial={{ scale: layout.initialScale, opacity: 0.35 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: layout.initialScale, opacity: 0 }}
            transition={{ duration: ANIMATION_MS, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            {isVideoMimeType(item.media.mime_type) ? (
              <video
                src={srcUrl}
                className="block h-full w-full object-contain"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={srcUrl}
                alt={item.media.original_filename}
                className="block h-full w-full object-contain"
                draggable={false}
              />
            )}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
