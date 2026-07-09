// keel_web/src/modules/projects/components/workspace/overlays/WorkspaceImageLightbox.tsx

// Full-screen image zoom overlay for workspace media nodes.

type WorkspaceImageLightboxProps = {
  src: string;
  alt: string;
  onClose: () => void;
};

export function WorkspaceImageLightbox({
  src,
  alt,
  onClose,
}: WorkspaceImageLightboxProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
        }
      }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-6 rounded-md bg-stone-900/80 px-3 py-1.5 text-sm text-stone-200 ring-1 ring-stone-700 hover:bg-stone-800"
      >
        Close
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-full max-w-full object-contain shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        draggable={false}
      />
    </div>
  );
}
