// keel_web/src/modules/coak/components/tabs/constellation/node-visuals/CoakNodePinIcon.tsx

type CoakNodePinIconProps = {
  className?: string;
};

export function CoakNodePinIcon({ className = "h-3 w-3 shrink-0" }: CoakNodePinIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 17v5M9 3h6l1 7h3l-4 5v2H9v-2L5 10h3l1-7Z"
      />
    </svg>
  );
}
