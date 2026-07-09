// keel_web/src/modules/coak/components/panels/CoakWorkspaceTabContent.tsx

import type { CoakWorkspaceTabId } from "../../api";
import { CoakConstellationTab } from "../tabs/constellation";
import { CoakDirectoryTab } from "../tabs/directory";
import { CoakGeneralTab } from "../tabs/general";
import { CoakSettingsTab } from "../tabs/settings";
import { CoakTagsTab } from "../tabs/tags";

type CoakWorkspaceTabContentProps = {
  tabId: CoakWorkspaceTabId;
};

const TAB_SHELL = "flex min-h-0 flex-1 flex-col overflow-hidden";

export function CoakWorkspaceTabContent({ tabId }: CoakWorkspaceTabContentProps) {
  if (tabId === "general") {
    return (
      <div className={TAB_SHELL}>
        <CoakGeneralTab />
      </div>
    );
  }

  if (tabId === "settings") {
    return (
      <div className={TAB_SHELL}>
        <CoakSettingsTab />
      </div>
    );
  }

  if (tabId === "directory") {
    return (
      <div className={TAB_SHELL}>
        <CoakDirectoryTab />
      </div>
    );
  }

  if (tabId === "tags") {
    return (
      <div className={TAB_SHELL}>
        <CoakTagsTab />
      </div>
    );
  }

  return <CoakConstellationTab />;
}
