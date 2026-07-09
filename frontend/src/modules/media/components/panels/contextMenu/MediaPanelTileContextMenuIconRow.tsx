// keel_web/src/modules/media/components/panels/contextMenu/MediaPanelTileContextMenuIconRow.tsx

import type { MediaPanelItem } from "../../../api";
import type { PanelTileRect } from "./panelTileRect";
import {
  DeleteActionIcon,
  DetailsIcon,
  IconButton,
  SwapIcon,
  ViewIcon,
} from "./MediaPanelTileContextMenuIcons";
import { useMediaPanelTileDeleteConfirm } from "./useMediaPanelTileDeleteConfirm";

type MediaPanelTileContextMenuIconRowProps = {
  item: MediaPanelItem;
  tileRect: PanelTileRect;
  showViewActions: boolean;
  canPreviewMedia: boolean;
  onDelete: (itemId: string) => void;
  onDetails: (itemId: string) => void;
  onView: (item: MediaPanelItem, tileRect: PanelTileRect) => void;
  onSwapStart: (itemId: string) => void;
  onClose: () => void;
};

export function MediaPanelTileContextMenuIconRow({
  item,
  tileRect,
  showViewActions,
  canPreviewMedia,
  onDelete,
  onDetails,
  onView,
  onSwapStart,
  onClose,
}: MediaPanelTileContextMenuIconRowProps) {
  const { deleteConfirmPending, setDeleteConfirmPending } =
    useMediaPanelTileDeleteConfirm(item.id);

  const actions = [
    {
      key: "delete",
      label: deleteConfirmPending ? "Confirm delete" : "Delete tile",
      danger: true,
      disabled: false,
      onClick: () => {
        if (deleteConfirmPending) {
          onDelete(item.id);
          onClose();
          return;
        }
        setDeleteConfirmPending(true);
      },
      icon: <DeleteActionIcon confirmPending={deleteConfirmPending} />,
    },
    showViewActions
      ? {
          key: "details",
          label: "Details",
          danger: false,
          disabled: false,
          onClick: () => {
            onDetails(item.id);
            onClose();
          },
          icon: <DetailsIcon />,
        }
      : null,
    showViewActions && canPreviewMedia
      ? {
          key: "view",
          label: "View",
          danger: false,
          disabled: false,
          onClick: () => {
            onView(item, tileRect);
            onClose();
          },
          icon: <ViewIcon />,
        }
      : null,
    showViewActions
      ? {
          key: "swap",
          label: "Swap",
          danger: false,
          disabled: false,
          onClick: () => {
            onSwapStart(item.id);
            onClose();
          },
          icon: <SwapIcon />,
        }
      : null,
  ].filter((action): action is NonNullable<typeof action> => action !== null);

  if (actions.length === 0) {
    return null;
  }

  return (
    <div
      className="grid py-1"
      style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}
    >
      {actions.map((action, index) => (
        <div
          key={action.key}
          className={[
            "flex min-w-0 items-stretch",
            index > 0 ? "border-l border-white/[0.08]" : "",
          ].join(" ")}
        >
          <IconButton
            label={action.label}
            danger={action.danger}
            disabled={action.disabled}
            onClick={action.onClick}
          >
            {action.icon}
          </IconButton>
        </div>
      ))}
    </div>
  );
}
