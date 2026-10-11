// keel_web/src/modules/media/components/attachments/MediaAttachmentListView.tsx

// Table-style list of entity attachments for one media object.

import type { MediaAttachment } from "../../api";
import {
  MEDIA_ATTACHMENT_LIST_GRID_CLASS,
  MediaAttachmentListRow,
} from "./MediaAttachmentListRow";

type MediaAttachmentListViewProps = {
  attachments: MediaAttachment[];
};

export function MediaAttachmentListView({
  attachments,
}: MediaAttachmentListViewProps) {
  if (attachments.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/[0.08] px-4 py-6 text-sm text-stone-500">
        Not attached to any records yet.
      </p>
    );
  }

  return (
    <div className="w-fit max-w-full overflow-x-auto rounded-xl border border-stone-800 bg-stone-950/40">
      <div
        className={[
          "grid min-w-[16rem] border-b border-stone-800 text-xs font-medium uppercase tracking-wide text-stone-500",
          MEDIA_ATTACHMENT_LIST_GRID_CLASS,
        ].join(" ")}
      >
        <div className="px-4 py-3 font-medium">Entity</div>
      </div>
      {attachments.map((attachment) => (
        <MediaAttachmentListRow key={attachment.id} attachment={attachment} />
      ))}
    </div>
  );
}
