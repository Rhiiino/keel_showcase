// keel_web/src/modules/coak/components/tabs/constellation/modals/CoakNoteItemEditorBody.tsx

import type { CoakItem } from "../../../../api";
import { CoakItemNodeBodyEditor } from "./CoakItemNodeBodyEditor";

type CoakNoteItemEditorBodyProps = {
  item: CoakItem;
  disabled?: boolean;
  open: boolean;
  shouldFocusBody?: boolean;
};

export function CoakNoteItemEditorBody({
  item,
  disabled,
  open,
  shouldFocusBody = false,
}: CoakNoteItemEditorBodyProps) {
  return (
    <CoakItemNodeBodyEditor
      item={item}
      disabled={disabled}
      open={open}
      shouldFocus={shouldFocusBody}
      showSectionLabel={false}
      ariaLabel="Note content"
      placeholder="Write note content…"
    />
  );
}
