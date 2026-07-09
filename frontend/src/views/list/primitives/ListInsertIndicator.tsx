// keel_web/src/views/list/primitives/ListInsertIndicator.tsx

// Insertion line overlay for list reorder (does not affect layout).

type ListInsertIndicatorProps = {
  position: "top" | "bottom";
  tone?: "lime" | "blue";
};

const TONE_CLASS: Record<NonNullable<ListInsertIndicatorProps["tone"]>, string> = {
  lime: "bg-lime-400/90 shadow-[0_0_8px_rgba(163,230,53,0.4)]",
  blue: "bg-blue-400/90 shadow-[0_0_8px_rgba(96,165,250,0.45)]",
};

export function ListInsertIndicator({
  position,
  tone = "lime",
}: ListInsertIndicatorProps) {
  const positionClass =
    position === "top"
      ? "top-0 -translate-y-1/2"
      : "bottom-0 translate-y-1/2";

  return (
    <div
      aria-hidden
      className={[
        "pointer-events-none absolute inset-x-3 z-10 h-0.5 rounded-full",
        TONE_CLASS[tone],
        positionClass,
      ].join(" ")}
    />
  );
}
