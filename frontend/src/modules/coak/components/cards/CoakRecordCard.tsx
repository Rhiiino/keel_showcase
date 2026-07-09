// keel_web/src/modules/coak/components/cards/CoakRecordCard.tsx

import { useNavigate } from "react-router-dom";

import { FocusListCardColorPicker } from "../../../focus/components/cards/card/FocusListCardColorPicker";
import { FocusListCardDepth } from "../../../focus/components/cards/card/FocusListCardDepth";
import {
  FOCUS_LIST_CARD_GLASS_CLASS,
  FOCUS_LIST_CARD_GLASS_HOVER_CLASS,
} from "../../../focus/lib/appearance";
import { CardMenu } from "../../../../components/CardMenu";
import { useConfirmDeleteAction } from "../../../../hooks/useConfirmDeleteAction";
import { coakRecordPath, type CoakRecord } from "../../api";

type CoakRecordCardProps = {
  record: CoakRecord;
  onDelete: (recordId: number) => void;
  onColorChange: (recordId: number, colorHex: string | null) => void;
  deleteDisabled?: boolean;
  colorDisabled?: boolean;
};

export function CoakRecordCard({
  record,
  onDelete,
  onColorChange,
  deleteDisabled = false,
  colorDisabled = false,
}: CoakRecordCardProps) {
  const navigate = useNavigate();
  const { confirmPending, containerRef, handleClick } = useConfirmDeleteAction(record.id);

  const openRecord = () => {
    navigate(coakRecordPath(record));
  };

  return (
    <div ref={containerRef} className="relative select-none" data-coak-record-card-shell>
      <article
        className={[
          "group relative z-20 overflow-visible transition-[box-shadow,ring-color] duration-150",
          FOCUS_LIST_CARD_GLASS_CLASS,
          FOCUS_LIST_CARD_GLASS_HOVER_CLASS,
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <FocusListCardDepth colorHex={record.color_hex} />
        </div>

        <div
          role="link"
          tabIndex={0}
          onClick={openRecord}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openRecord();
            }
          }}
          className="relative z-10 flex min-h-[7.5rem] cursor-pointer flex-col p-4 pr-16 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
        >
          <h2 className="pr-8 text-base font-semibold text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] group-hover:text-white">
            {record.name}
          </h2>

          <div className="mt-auto pt-3">
            <p className="text-xs text-white/35">
              Updated {new Date(record.updated_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div
          className="pointer-events-auto absolute right-3 top-3 z-50 flex items-center gap-1.5 overflow-visible"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <FocusListCardColorPicker
            colorHex={record.color_hex}
            disabled={colorDisabled}
            onChange={(hex) => onColorChange(record.id, hex)}
          />
          <CardMenu
            ariaLabel={`Actions for ${record.name}`}
            disabled={deleteDisabled}
            items={[
              {
                id: "delete",
                label: confirmPending ? "Confirm delete" : "Delete",
                tone: "danger",
                onSelect: () => handleClick(() => onDelete(record.id)),
              },
            ]}
          />
        </div>
      </article>
    </div>
  );
}
