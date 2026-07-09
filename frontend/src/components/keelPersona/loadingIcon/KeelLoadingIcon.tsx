// keel_web/src/modules/dev/components/loadingIcon/KeelLoadingIcon.tsx

import keelPng from "../../../assets/general/keel.png";
import { DEFAULT_KEEL_LOADING_ICON_SIZE_PX } from "../../../lib/keelPersona/geometry/loadingIconGeometry";

type KeelLoadingIconProps = {
  className?: string;
  size?: number;
};

export function KeelLoadingIcon({
  className,
  size = DEFAULT_KEEL_LOADING_ICON_SIZE_PX,
}: KeelLoadingIconProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className ?? ""}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Loading"
    >
      <img
        src={keelPng}
        alt=""
        aria-hidden
        draggable={false}
        width={size}
        height={size}
        className="select-none"
      />
    </div>
  );
}
