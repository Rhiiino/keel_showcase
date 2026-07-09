// keel_web/src/modules/media/components/forms/MediaMetadataPanel.tsx

// Read-only MIME type, byte size, media kind, and delete action.

import {
  formatByteSizeWithBytes,
  mediaKindLabel,
  type MediaKind,
} from "../../lib/media";
import { ConfirmDeleteButton, MediaDownloadButton } from "../shared/actions";

type MediaMetadataPanelProps = {
  mimeType: string;
  byteSize: number | null;
  mediaKind: MediaKind | string;
  mediaId?: string;
  filename?: string;
  downloadDisabled?: boolean;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  deleteResetKey?: string | number;
};

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
      <p className="mt-1.5 text-sm text-stone-200">{value}</p>
    </div>
  );
}

export function MediaMetadataPanel({
  mimeType,
  byteSize,
  mediaKind,
  mediaId,
  filename = "",
  downloadDisabled = false,
  onDelete,
  deleteDisabled = false,
  deleteResetKey,
}: MediaMetadataPanelProps) {
  const sizeLabel =
    byteSize === null ? "—" : formatByteSizeWithBytes(byteSize);
  const kindLabel = mediaKind ? mediaKindLabel(mediaKind) : "—";

  return (
    <div className="space-y-5">
      <MetadataItem label="MIME type" value={mimeType || "—"} />
      <MetadataItem label="Byte size" value={sizeLabel} />
      <MetadataItem label="Media kind" value={kindLabel} />
      {mediaId || onDelete ? (
        <div className="inline-flex flex-col items-start gap-3">
          {mediaId ? (
            <MediaDownloadButton
              mediaId={mediaId}
              filename={filename}
              disabled={downloadDisabled}
              variant="circle"
            />
          ) : null}
          {onDelete ? (
            <ConfirmDeleteButton
              compact
              resetKey={deleteResetKey}
              disabled={deleteDisabled}
              onConfirm={onDelete}
              label="Delete file"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
