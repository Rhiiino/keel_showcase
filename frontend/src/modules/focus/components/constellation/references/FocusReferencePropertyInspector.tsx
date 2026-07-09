// src/modules/focus/components/constellation/references/FocusReferencePropertyInspector.tsx

// Read-only flyout for inspecting curated properties on a linked reference record.

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

import { fetchFocusReferenceDetail, focusQueryKeys } from "../../../api";
import {
  FLYOUT_ITEM_ACTIVE_CLASS,
  FLYOUT_ITEM_CLASS,
  FLYOUT_PANEL_CLASS,
} from "../contextMenu";
import { useFocusReferenceInspectorInteraction } from "./FocusReferenceInspectorInteractionContext";

const INSPECTOR_ANIMATION_MS = 180;

type FocusReferencePropertyInspectorProps = {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  targetType: string;
  targetId: string;
  onClose: () => void;
};

export function FocusReferencePropertyInspector({
  open,
  anchorRef,
  targetType,
  targetId,
  onClose,
}: FocusReferencePropertyInspectorProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const { setReferenceInspectorOpen } = useFocusReferenceInspectorInteraction();
  const [selectedKey, setSelectedKey] = useState("");
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);

  const detailQuery = useQuery({
    queryKey: focusQueryKeys.referenceDetail(targetType, targetId),
    queryFn: () => fetchFocusReferenceDetail(targetType, targetId),
    enabled: open,
  });

  const properties = detailQuery.data?.properties ?? [];
  const selectedProperty = useMemo(
    () => properties.find((property) => property.key === selectedKey) ?? properties[0] ?? null,
    [properties, selectedKey],
  );

  useEffect(() => {
    setReferenceInspectorOpen(open);
    return () => {
      setReferenceInspectorOpen(false);
    };
  }, [open, setReferenceInspectorOpen]);

  useEffect(() => {
    if (open) {
      setRendered(true);
      const frame = window.requestAnimationFrame(() => {
        setVisible(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    setVisible(false);
    const timer = window.setTimeout(() => {
      setRendered(false);
    }, INSPECTOR_ANIMATION_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!rendered) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (shellRef.current?.contains(target)) {
        return;
      }
      if (anchorRef.current?.contains(target)) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [anchorRef, onClose, rendered]);

  useEffect(() => {
    if (!open) {
      setSelectedKey("");
      setFieldPickerOpen(false);
      return;
    }
    if (properties.length > 0 && !selectedKey) {
      setSelectedKey(properties[0]?.key ?? "");
    }
  }, [open, properties, selectedKey]);

  useEffect(() => {
    if (!rendered) {
      return;
    }

    const updatePosition = () => {
      const anchorEl = anchorRef.current;
      if (!anchorEl) {
        return;
      }
      const rect = anchorEl.getBoundingClientRect();
      setPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 12,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, rendered, visible]);

  if (!rendered) {
    return null;
  }

  return createPortal(
    <div
      ref={shellRef}
      className="fixed z-[70] flex items-start gap-2"
      style={{
        top: position.top,
        left: position.left,
        transform: visible
          ? "translateY(-50%) translateX(0) scale(1)"
          : "translateY(-50%) translateX(-10px) scale(0.78)",
        opacity: visible ? 1 : 0,
        transformOrigin: "left center",
        pointerEvents: visible ? "auto" : "none",
        transition: `opacity ${INSPECTOR_ANIMATION_MS}ms ease-out, transform ${INSPECTOR_ANIMATION_MS}ms ease-out`,
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className={`${FLYOUT_PANEL_CLASS} w-44 py-1`}>
        <div className="border-b border-white/[0.06] px-3 py-2">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Properties
          </p>
          <p className="mt-1 truncate text-xs font-medium text-white/85">
            {detailQuery.data?.title ?? "Loading…"}
          </p>
        </div>

        {detailQuery.isLoading ? (
          <p className="px-3 py-2 text-xs text-white/45">Loading…</p>
        ) : detailQuery.isError ? (
          <p className="px-3 py-2 text-xs text-rose-300">Could not load properties.</p>
        ) : detailQuery.data?.is_missing ? (
          <p className="px-3 py-2 text-xs text-white/45">Reference no longer available.</p>
        ) : properties.length === 0 ? (
          <p className="px-3 py-2 text-xs text-white/45">No properties configured.</p>
        ) : (
          <div className="relative px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
              Field
            </span>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={fieldPickerOpen}
              onClick={() => setFieldPickerOpen((current) => !current)}
              className="mt-1.5 flex w-full items-center justify-between gap-2 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-left text-xs text-white/85 transition hover:border-white/20"
            >
              <span className="truncate">{selectedProperty?.label ?? "Select field"}</span>
              <svg
                viewBox="0 0 20 20"
                className={[
                  "h-3.5 w-3.5 shrink-0 text-white/45 transition",
                  fieldPickerOpen ? "rotate-180" : "",
                ].join(" ")}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {fieldPickerOpen ? (
              <div
                role="listbox"
                aria-label="Reference field"
                className={`${FLYOUT_PANEL_CLASS} absolute left-3 right-3 top-full z-10 mt-1 max-h-40 overflow-y-auto py-1`}
              >
                {properties.map((property) => {
                  const selected = property.key === selectedProperty?.key;
                  return (
                    <button
                      key={property.key}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setSelectedKey(property.key);
                        setFieldPickerOpen(false);
                      }}
                      className={selected ? FLYOUT_ITEM_ACTIVE_CLASS : FLYOUT_ITEM_CLASS}
                    >
                      {property.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {selectedProperty ? (
        <div
          className={`${FLYOUT_PANEL_CLASS} w-56 px-3 py-3`}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateX(0)" : "translateX(-6px)",
            transition: `opacity ${INSPECTOR_ANIMATION_MS}ms ease-out ${visible ? "40ms" : "0ms"}, transform ${INSPECTOR_ANIMATION_MS}ms ease-out ${visible ? "40ms" : "0ms"}`,
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
            {selectedProperty.label}
          </p>
          <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap break-words text-sm text-white/88">
            {selectedProperty.value}
          </p>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
