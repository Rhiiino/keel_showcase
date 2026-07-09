// src/modules/focus/components/constellation/contextMenu/FocusConstellationNodeContextMenuIconRow.tsx

import type { ReactNode } from "react";

import type { FocusConstellationFlowNode } from "../node";
import {
  AlignChildrenIcon,
  DeleteActionIcon,
  EyeIcon,
  IconButton,
  LineageIcon,
  PlusIcon,
  ScopedConstellationIcon,
  UnlinkIcon,
} from "./FocusConstellationContextMenuIcons";
import { useFocusConstellationDeleteConfirm } from "./useFocusConstellationDeleteConfirm";

const MAX_ICONS_PER_ROW = 4;

type IconRowAction = {
  key: string;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

type FocusConstellationNodeContextMenuIconRowProps = {
  node: FocusConstellationFlowNode;
  showDelete: boolean;
  showLineage: boolean;
  showAlignChildren: boolean;
  showView: boolean;
  showScopedConstellation: boolean;
  showUnlink: boolean;
  showAdd: boolean;
  canShow: boolean;
  onDelete: (node: FocusConstellationFlowNode) => void;
  onShow: (node: FocusConstellationFlowNode) => void;
  onAlignChildren: (node: FocusConstellationFlowNode) => void;
  onView: (node: FocusConstellationFlowNode) => void;
  onOpenScopedConstellation: (node: FocusConstellationFlowNode) => void;
  onUnlink: (node: FocusConstellationFlowNode) => void;
  onAddMouseEnter: () => void;
  onAddMouseLeave: () => void;
  onClose: () => void;
};

function chunkActions(actions: IconRowAction[]): IconRowAction[][] {
  const rows: IconRowAction[][] = [];
  for (let index = 0; index < actions.length; index += MAX_ICONS_PER_ROW) {
    rows.push(actions.slice(index, index + MAX_ICONS_PER_ROW));
  }
  return rows;
}

function IconActionGrid({
  actions,
  columnCount,
  rowClassName = "",
}: {
  actions: (IconRowAction | null)[];
  columnCount: number;
  rowClassName?: string;
}) {
  const slots = Array.from({ length: columnCount }, (_, index) => actions[index] ?? null);

  return (
    <div
      className={["grid py-1", rowClassName].filter(Boolean).join(" ")}
      style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
    >
      {slots.map((action, index) => (
        <div
          key={action?.key ?? `empty-${index}`}
          className={[
            "flex min-w-0 items-stretch",
            index > 0 ? "border-l border-white/[0.08]" : "",
          ].join(" ")}
        >
          {action ? (
            <IconButton
              label={action.label}
              danger={action.danger}
              disabled={action.disabled}
              onClick={action.onClick}
              onMouseEnter={action.onMouseEnter}
              onMouseLeave={action.onMouseLeave}
            >
              {action.icon}
            </IconButton>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function FocusConstellationNodeContextMenuIconRow({
  node,
  showDelete,
  showLineage,
  showAlignChildren,
  showView,
  showScopedConstellation,
  showUnlink,
  showAdd,
  canShow,
  onDelete,
  onShow,
  onAlignChildren,
  onView,
  onOpenScopedConstellation,
  onUnlink,
  onAddMouseEnter,
  onAddMouseLeave,
  onClose,
}: FocusConstellationNodeContextMenuIconRowProps) {
  const { deleteConfirmPending, setDeleteConfirmPending } =
    useFocusConstellationDeleteConfirm(node.id);

  const actions = [
    showDelete
      ? {
          key: "delete",
          label: deleteConfirmPending ? "Confirm delete" : "Delete node",
          danger: true,
          disabled: false,
          onClick: () => {
            if (deleteConfirmPending) {
              onDelete(node);
              onClose();
              return;
            }
            setDeleteConfirmPending(true);
          },
          icon: <DeleteActionIcon confirmPending={deleteConfirmPending} />,
        }
      : null,
    showLineage
      ? {
          key: "lineage",
          label: "Reveal lineage",
          danger: false,
          disabled: !canShow,
          onClick: () => {
            onShow(node);
            onClose();
          },
          icon: <LineageIcon />,
        }
      : null,
    showAlignChildren
      ? {
          key: "align-children",
          label: "Align children",
          danger: false,
          disabled: false,
          onClick: () => {
            onAlignChildren(node);
            onClose();
          },
          icon: <AlignChildrenIcon />,
        }
      : null,
    showView
      ? {
          key: "view",
          label: "View node",
          danger: false,
          disabled: false,
          onClick: () => {
            onView(node);
            onClose();
          },
          icon: <EyeIcon />,
        }
      : null,
    showScopedConstellation
      ? {
          key: "scoped-constellation",
          label: "Open scoped constellation",
          danger: false,
          disabled: false,
          onClick: () => {
            onOpenScopedConstellation(node);
            onClose();
          },
          icon: <ScopedConstellationIcon />,
        }
      : null,
    showAdd
      ? {
          key: "add",
          label: "Add node",
          onClick: () => undefined,
          onMouseEnter: onAddMouseEnter,
          onMouseLeave: onAddMouseLeave,
          icon: <PlusIcon />,
        }
      : null,
    showUnlink
      ? {
          key: "unlink",
          label: "Unlink node",
          danger: false,
          disabled: false,
          onClick: () => {
            onUnlink(node);
            onClose();
          },
          icon: <UnlinkIcon />,
        }
      : null,
  ].filter((action): action is NonNullable<typeof action> => action !== null);

  if (actions.length === 0) {
    return null;
  }

  const rows = chunkActions(actions);
  const columnCount = Math.min(
    MAX_ICONS_PER_ROW,
    Math.max(...rows.map((row) => row.length)),
  );

  return (
    <>
      {rows.map((row, rowIndex) => (
        <IconActionGrid
          key={`icon-row-${rowIndex}`}
          actions={row}
          columnCount={columnCount}
          rowClassName={rowIndex > 0 ? "border-t border-white/[0.08]" : ""}
        />
      ))}
    </>
  );
}
