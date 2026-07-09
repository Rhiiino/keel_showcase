// keel_web/src/modules/media/components/shared/icons/MediaFolderIcon.tsx

// Folder glyph for list and carousel views.

type MediaFolderIconProps = {
  className?: string;
};

export function MediaFolderIcon({ className = "h-5 w-5" }: MediaFolderIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H9l2 2h6.5A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
    </svg>
  );
}
