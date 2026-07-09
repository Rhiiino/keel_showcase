// keel_web/src/modules/media/components/attachments/MediaAttachmentListRow.tsx

// One attachment row linking media to an entity.

import { Link } from "react-router-dom";

import type { MediaAttachment } from "../../api";
import {
  mediaAttachmentEntityLinkLabel,
  mediaAttachmentEntityPath,
} from "../../lib/attachments";

export const MEDIA_ATTACHMENT_LIST_GRID_CLASS = "grid-cols-[minmax(0,1fr)]";

type MediaAttachmentListRowProps = {
  attachment: MediaAttachment;
};

export function MediaAttachmentListRow({ attachment }: MediaAttachmentListRowProps) {
  const entityPath = mediaAttachmentEntityPath(
    attachment.entity_type,
    attachment.entity_id,
  );
  const linkLabel = mediaAttachmentEntityLinkLabel(attachment);

  return (
    <div
      className={[
        "grid min-w-[16rem] border-b border-stone-800/80 transition last:border-b-0 hover:bg-stone-900/40",
        MEDIA_ATTACHMENT_LIST_GRID_CLASS,
      ].join(" ")}
    >
      <div className="px-4 py-4 align-middle">
        {entityPath ? (
          <Link
            to={entityPath}
            className="block truncate text-sm font-medium text-stone-100 transition hover:text-sky-300"
            title={linkLabel}
          >
            {linkLabel}
          </Link>
        ) : (
          <p className="truncate text-sm text-stone-400" title={linkLabel}>
            {linkLabel}
          </p>
        )}
      </div>
    </div>
  );
}
