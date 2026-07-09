// keel_web/src/modules/games/games/tower-of-hanoi/hooks/useTowerOfHanoiDrag.ts

import { useCallback, useEffect, useRef, useState } from "react";

import { canMoveToPeg } from "../lib/rules";
import type { Pegs } from "../lib/types";

type DragState = {
  sourcePeg: number;
  disk: number;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
  /** Peg column width so the drag ghost matches stacked disk size. */
  pegWidth: number;
};

type UseTowerOfHanoiDragOptions = {
  pegs: Pegs;
  boardRef: React.RefObject<HTMLDivElement | null>;
  disabled?: boolean;
  onMove: (sourcePeg: number, targetPeg: number) => void;
};

function findPegIndexAtPoint(board: HTMLDivElement, clientX: number): number | null {
  const pegElements = board.querySelectorAll<HTMLElement>("[data-peg-index]");
  for (const element of pegElements) {
    const rect = element.getBoundingClientRect();
    const expandedLeft = rect.left - rect.width * 0.15;
    const expandedRight = rect.right + rect.width * 0.15;
    if (clientX >= expandedLeft && clientX <= expandedRight) {
      const index = Number(element.dataset.pegIndex);
      return Number.isInteger(index) ? index : null;
    }
  }
  return null;
}

export function useTowerOfHanoiDrag({
  pegs,
  boardRef,
  disabled = false,
  onMove,
}: UseTowerOfHanoiDragOptions) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [highlightPeg, setHighlightPeg] = useState<number | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const beginDrag = useCallback(
    (sourcePeg: number, event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) {
        return;
      }
      const disk = pegs[sourcePeg][0];
      if (disk === undefined) {
        return;
      }
      const board = boardRef.current;
      if (!board) {
        return;
      }
      const pegElement = board.querySelector<HTMLElement>(
        `[data-peg-index="${sourcePeg}"]`,
      );
      const pegWidth = pegElement?.clientWidth ?? 120;
      const rect = board.getBoundingClientRect();
      const next: DragState = {
        sourcePeg,
        disk,
        pointerId: event.pointerId,
        offsetX: event.clientX - rect.left - rect.width / 2,
        offsetY: event.clientY - rect.top - 24,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        pegWidth,
      };
      dragRef.current = next;
      setDrag(next);
      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    },
    [boardRef, disabled, pegs],
  );

  useEffect(() => {
    if (!drag) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const current = dragRef.current;
      const board = boardRef.current;
      if (!current || !board || event.pointerId !== current.pointerId) {
        return;
      }
      const rect = board.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const next = { ...current, x, y };
      dragRef.current = next;
      setDrag(next);

      const pegIndex = findPegIndexAtPoint(board, event.clientX);
      if (
        pegIndex !== null &&
        canMoveToPeg(pegs, current.sourcePeg, pegIndex)
      ) {
        setHighlightPeg(pegIndex);
      } else {
        setHighlightPeg(null);
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      const current = dragRef.current;
      const board = boardRef.current;
      if (!current || !board || event.pointerId !== current.pointerId) {
        return;
      }

      const pegIndex = findPegIndexAtPoint(board, event.clientX);
      if (
        pegIndex !== null &&
        canMoveToPeg(pegs, current.sourcePeg, pegIndex)
      ) {
        onMove(current.sourcePeg, pegIndex);
      }

      dragRef.current = null;
      setDrag(null);
      setHighlightPeg(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [boardRef, drag, onMove, pegs]);

  return {
    drag,
    highlightPeg,
    beginDrag,
  };
}
