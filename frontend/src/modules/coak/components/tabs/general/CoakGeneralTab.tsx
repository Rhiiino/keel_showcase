// keel_web/src/modules/coak/components/directory/CoakGeneralTab.tsx

import { useEffect, useState } from "react";

import { FocusListCardColorPicker } from "../../../../focus/components/cards/card/FocusListCardColorPicker";
import { useCoakRecordWorkspace } from "../../../context/CoakRecordWorkspaceContext";
import { CoakRecordInlineTitle } from "./CoakRecordInlineTitle";

export function CoakGeneralTab() {
  const {
    record,
    isLoading,
    recordUpdatePending,
    updateRecordName,
    updateRecordColor,
  } = useCoakRecordWorkspace();

  const [nameDraft, setNameDraft] = useState(record?.name ?? "");
  const disabled = isLoading || recordUpdatePending || !record;

  useEffect(() => {
    setNameDraft(record?.name ?? "");
  }, [record?.name]);

  const commitName = () => {
    if (!record) {
      return;
    }
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === record.name) {
      setNameDraft(record.name);
      return;
    }
    void updateRecordName(trimmed);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-stone-900/95 px-4 py-4">
      {!record && isLoading ? (
        <p className="text-xs text-stone-500">Loading record…</p>
      ) : !record ? (
        <p className="text-xs text-stone-500">Record not found.</p>
      ) : (
        <section className="space-y-5">
          <div>
            <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500">
              Record
            </span>
            <CoakRecordInlineTitle
              value={nameDraft}
              onChange={setNameDraft}
              onBlur={commitName}
              onEscape={() => setNameDraft(record.name)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500">
              Color
            </span>
            <FocusListCardColorPicker
              colorHex={record.color_hex}
              disabled={disabled}
              popoverAlign="start"
              onChange={(colorHex) => {
                void updateRecordColor(colorHex ?? "#FBBF24");
              }}
            />
          </div>
        </section>
      )}
    </div>
  );
}
