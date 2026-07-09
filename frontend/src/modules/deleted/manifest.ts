// keel_web/src/modules/deleted/manifest.ts

import { deletedSettingsTabs } from "./settingsTabs";
import type { FeatureModuleManifest } from "../../app/modules/types";

/** Manifest-only module — contributes settings tabs; no routes or nav. */
export const deletedManifest: FeatureModuleManifest = {
  key: "deleted",
  settingsTabs: deletedSettingsTabs,
};
