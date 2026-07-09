// keel_web/src/modules/focus/lib/automation/setupInstructions.ts

import { getApiBaseUrl } from "../../../../lib/api";

export function buildFocusAutomationSetupInstructions({
  guideMarkdown,
  token,
}: {
  guideMarkdown: string;
  token: string;
}): string {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const filledGuide = guideMarkdown
    .replace(
      /API root domain:\n\n/,
      `API root domain:\n${baseUrl}\n\n`,
    )
    .replace(
      /Session key \(bearer token\):\n\n/,
      `Session key (bearer token):\n${token}\n\n`,
    )
    .replace(
      /Authorization: Bearer <session-key>/g,
      `Authorization: Bearer ${token}`,
    );

  return filledGuide;
}
