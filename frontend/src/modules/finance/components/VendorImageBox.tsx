// keel_web/src/modules/shop/components/VendorImageBox.tsx

// Beveled cube frame for vendor logo display.

import { buildMediaContentUrl, type MediaObject } from "../../media/api";

type VendorImageBoxProps = {
  vendorName: string;
  logo?: MediaObject | null;
  previewUrl?: string | null;
  size?: "sm" | "md" | "lg";
  /** Fallback initials when no logo is set (default: 2). */
  initialLength?: 1 | 2;
};

export function VendorImageBox({
  vendorName,
  logo = null,
  previewUrl = null,
  size = "md",
  initialLength = 2,
}: VendorImageBoxProps) {
  const imageUrl = previewUrl ?? (logo ? buildMediaContentUrl(logo.id, logo.updated_at) : null);

  const dimension =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-20 w-20" : "h-10 w-10";

  return (
    <div
      className={[
        "relative shrink-0",
        dimension,
        "rounded-md bg-gradient-to-br from-stone-700 via-stone-800 to-stone-950",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_2px_4px_rgba(0,0,0,0.45)]",
        "ring-1 ring-stone-600/80",
      ].join(" ")}
      title={vendorName}
      aria-hidden={!imageUrl}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full rounded-[5px] object-cover"
        />
      ) : (
        <span
          className={[
            "flex h-full w-full items-center justify-center font-semibold uppercase text-stone-400",
            size === "sm" ? "text-[10px]" : size === "lg" ? "text-sm" : "text-xs",
          ].join(" ")}
        >
          {vendorName.slice(0, initialLength)}
        </span>
      )}
    </div>
  );
}
