// keel_web/src/modules/home/cards/greeting/HomeGreetingCard.tsx

// Personalized welcome greeting with configurable title font and size.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ProjectDetailInlineTitleFontPicker } from "../../../projects/components/detail/ProjectDetailInlineTitleFontPicker";
import {
  DEFAULT_TITLE_FONT_KEY,
  projectTitleFontStyle,
  resolveProjectTitleFontKey,
  type ProjectTitleFontKey,
} from "../../../projects/lib/project/appearance";
import {
  fetchSettings,
  patchSettings,
  settingsKeys,
} from "../../../settings/api";
import {
  authKeys,
  authSessionQueryRetry,
  CURRENT_USER_STALE_TIME_MS,
  fetchAuthSessionUser,
} from "../../../auth/api";
import {
  greetingFontPickerDimensions,
  homeGreetingFontSizePatchValue,
  resolveHomeGreetingFontSizePx,
} from "../../lib/greetingFontSize";
import { HomeGreetingFontSizeControl } from "./HomeGreetingFontSizeControl";

export function HomeGreetingCard() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: authKeys.me(),
    queryFn: ({ signal }) => fetchAuthSessionUser(signal),
    staleTime: CURRENT_USER_STALE_TIME_MS,
    refetchOnWindowFocus: false,
    retry: authSessionQueryRetry,
  });

  const settingsQuery = useQuery({
    queryKey: settingsKeys.root(),
    queryFn: fetchSettings,
  });

  const greetingFontKey = resolveProjectTitleFontKey(
    settingsQuery.data?.data.home_greeting_font_key,
  );
  const greetingFontSizePx = resolveHomeGreetingFontSizePx(
    settingsQuery.data?.data.home_greeting_font_size_px,
  );
  const fontPickerDimensions = greetingFontPickerDimensions(greetingFontSizePx);

  const saveFontMutation = useMutation({
    mutationFn: (nextFont: ProjectTitleFontKey) =>
      patchSettings({
        home_greeting_font_key:
          nextFont === DEFAULT_TITLE_FONT_KEY ? null : nextFont,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(settingsKeys.root(), updated);
    },
  });

  const saveFontSizeMutation = useMutation({
    mutationFn: (nextFontSizePx: number) =>
      patchSettings({
        home_greeting_font_size_px: homeGreetingFontSizePatchValue(nextFontSizePx),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(settingsKeys.root(), updated);
    },
  });

  const settingsBusy =
    saveFontMutation.isPending
    || saveFontSizeMutation.isPending
    || settingsQuery.isLoading;

  const greetingName = user ? user.display_name.split(" ")[0] : null;
  const greetingText = greetingName ? `Welcome, ${greetingName}` : "Welcome";

  return (
    <div className="group/greeting inline-flex max-w-full items-center gap-1.5">
      <div className="relative flex shrink-0 items-center">
        <HomeGreetingFontSizeControl
          fontSizePx={greetingFontSizePx}
          disabled={settingsBusy}
          onChange={(nextFontSizePx) => saveFontSizeMutation.mutate(nextFontSizePx)}
          className="absolute top-1/2 right-full mr-1.5 -translate-y-1/2"
        />

        <div
          className="flex items-center justify-center"
          style={{ width: fontPickerDimensions.buttonSizePx }}
        >
          <ProjectDetailInlineTitleFontPicker
            titleFontDraft={greetingFontKey}
            onTitleFontDraftChange={(nextFont) => saveFontMutation.mutate(nextFont)}
            disabled={settingsBusy}
            alwaysVisible
            menuAlign="left"
            triggerDimensions={fontPickerDimensions}
          />
        </div>
      </div>

      <h1
        className="font-semibold leading-tight tracking-tight text-stone-50"
        style={{
          fontSize: greetingFontSizePx,
          ...projectTitleFontStyle(greetingFontKey),
        }}
      >
        {greetingText}
      </h1>
    </div>
  );
}
