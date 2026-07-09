// keel_web/src/modules/media/components/shared/icons/MediaFileIcon.tsx

// File glyph for upload and file actions.

type MediaFileIconProps = {
  className?: string;
};

export function MediaFileIcon({ className = "h-5 w-5" }: MediaFileIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
    </svg>
  );
}
