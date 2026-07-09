// keel_web/src/modules/home/cards/quotes/HomeQuoteIntervalEditor.tsx

// Inline editor for home quote rotation interval on the quote card.

import { useState } from "react";

import {
  DEFAULT_HOME_QUOTE_INTERVAL_SECONDS,
  MAX_HOME_QUOTE_INTERVAL_SECONDS,
  MIN_HOME_QUOTE_INTERVAL_SECONDS,
} from "../../lib/quoteInterval";
import { HOME_CONTENT_WIDTH_CLASS } from "../layout/constants";

type HomeQuoteIntervalEditorProps = {
  intervalSeconds: number;
  accentBorderClass: string;
  disabled?: boolean;
  isSaving?: boolean;
  onSave: (intervalSeconds: number) => void;
  onCancel: () => void;
};

export function HomeQuoteIntervalEditor({
  intervalSeconds: initialIntervalSeconds,
  accentBorderClass,
  disabled = false,
  isSaving = false,
  onSave,
  onCancel,
}: HomeQuoteIntervalEditorProps) {
  const [draftIntervalSeconds, setDraftIntervalSeconds] = useState(
    initialIntervalSeconds,
  );

  const isBusy = disabled || isSaving;
  const hasChanges = draftIntervalSeconds !== initialIntervalSeconds;

  const handleSave = () => {
    onSave(draftIntervalSeconds);
  };

  const handleResetDefault = () => {
    setDraftIntervalSeconds(DEFAULT_HOME_QUOTE_INTERVAL_SECONDS);
  };

  return (
    <div className={`mt-8 ${HOME_CONTENT_WIDTH_CLASS}`} data-home-card-no-drag>
      <div
        className={[
          "rounded-xl border border-stone-800/90",
          "border-l-4 bg-gradient-to-br from-stone-900/70 via-stone-950/50 to-stone-900/30",
          "shadow-lg shadow-black/20",
          accentBorderClass,
        ].join(" ")}
      >
        <div className="space-y-4 px-5 py-5">
          <div>
            <h2 className="text-sm font-semibold text-stone-100">Quote display time</h2>
            <p className="mt-1 text-xs text-stone-500">
              How long each quote stays visible before changing.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-stone-400">
              Display time ({draftIntervalSeconds} s)
            </label>
            <input
              type="range"
              min={MIN_HOME_QUOTE_INTERVAL_SECONDS}
              max={MAX_HOME_QUOTE_INTERVAL_SECONDS}
              step={1}
              value={draftIntervalSeconds}
              disabled={isBusy}
              onChange={(event) =>
                setDraftIntervalSeconds(Number.parseInt(event.target.value, 10))
              }
              className="w-full accent-amber-400 disabled:opacity-40"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={
                isBusy
                || draftIntervalSeconds === DEFAULT_HOME_QUOTE_INTERVAL_SECONDS
              }
              onClick={handleResetDefault}
              className="text-xs font-medium text-stone-500 underline-offset-2 transition hover:text-stone-300 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reset to default ({DEFAULT_HOME_QUOTE_INTERVAL_SECONDS} s)
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isBusy}
                onClick={onCancel}
                className="rounded-lg border border-stone-800 px-3 py-1.5 text-sm text-stone-400 hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBusy || !hasChanges}
                onClick={handleSave}
                className="rounded-lg border border-sky-700/80 bg-sky-950/50 px-3 py-1.5 text-sm text-sky-100 hover:bg-sky-900/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
