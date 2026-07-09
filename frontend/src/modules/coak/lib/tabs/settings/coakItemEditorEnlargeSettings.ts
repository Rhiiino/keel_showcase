// keel_web/src/modules/coak/lib/tabs/settings/coakItemEditorEnlargeSettings.ts

export const COAK_CONFIGURATION_ITEM_EDITOR_ENLARGE_KEY = "item_editor_enlarge";

export function readCoakItemEditorEnlargeEnabled(settings: Record<string, unknown>): boolean {
  const raw = settings[COAK_CONFIGURATION_ITEM_EDITOR_ENLARGE_KEY];
  return raw !== false;
}
