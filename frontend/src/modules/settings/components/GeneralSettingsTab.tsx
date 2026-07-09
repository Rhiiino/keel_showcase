// stack_sandbox/frontend_web/src/modules/settings/components/GeneralSettingsTab.tsx

// General app settings — profile name and transition animation configuration.

import { AnimatePresence, motion } from "framer-motion";
import { useState, type ReactNode } from "react";

import type { CurrentUser } from "../../auth/api";
import {
  useTransitionSettings,
  useTransitionSettingsActions,
} from "./context";
import { ProfileNameSection } from "./ProfileNameSection";
import { BackgroundSettingsSection } from "./BackgroundSettingsSection";
import { BreadcrumbSettingsSection } from "./BreadcrumbSettingsSection";
import { NavWaveGlowSettingsSection } from "./NavWaveGlowSettingsSection";
import { TimezoneSettingsSection } from "./TimezoneSettingsSection";
import {
  DEFAULT_TRANSITION_SETTINGS,
  getTransitionVariants,
  TRANSITION_PRESET_OPTIONS,
  type TransitionKind,
  type TransitionPresetId,
} from "../lib/transition";

function SettingsField({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium text-stone-200">{label}</label>
        {description ? (
          <p className="mt-0.5 text-xs text-stone-500">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function PresetSelect({
  value,
  onChange,
  id,
}: {
  value: TransitionPresetId;
  onChange: (preset: TransitionPresetId) => void;
  id: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value as TransitionPresetId)}
      className="w-full max-w-xs rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/30"
    >
      {TRANSITION_PRESET_OPTIONS.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function TransitionPreview({
  preset,
  durationMs,
  label,
}: {
  preset: TransitionPresetId;
  durationMs: number;
  label: string;
}) {
  const [previewKey, setPreviewKey] = useState(0);
  const variants = getTransitionVariants(preset);
  const durationSec = Math.max(0, durationMs) / 1000;
  const instant = preset === "none" || durationMs <= 0;

  return (
    <div className="rounded-lg border border-stone-800 bg-stone-950/80 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
          Preview — {label}
        </p>
        <button
          type="button"
          onClick={() => setPreviewKey((key) => key + 1)}
          className="rounded-md border border-stone-700 px-2.5 py-1 text-xs font-medium text-stone-300 transition hover:border-stone-600 hover:bg-stone-800 hover:text-stone-100"
        >
          Replay
        </button>
      </div>
      <div className="relative h-16 overflow-hidden rounded-md border border-stone-800/80 bg-app-canvas">
        <AnimatePresence mode="wait">
          <motion.div
            key={previewKey}
            className="absolute inset-0 flex items-center justify-center"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={
              instant
                ? { duration: 0 }
                : { duration: durationSec, ease: [0.22, 1, 0.36, 1] }
            }
          >
            <span className="rounded-md border border-stone-700 bg-stone-900 px-3 py-1.5 text-xs text-stone-300">
              Sample panel
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function KindTransitionFields({
  kind,
  title,
  description,
}: {
  kind: TransitionKind;
  title: string;
  description: string;
}) {
  const settings = useTransitionSettings();
  const { updateSettings } = useTransitionSettingsActions();
  const config = kind === "menu" ? settings.menu : settings.page;

  return (
    <section className="space-y-4 rounded-xl border border-stone-800/80 bg-stone-950/40 p-5">
      <div>
        <h3 className="text-sm font-semibold text-stone-100">{title}</h3>
        <p className="mt-1 text-xs text-stone-500">{description}</p>
      </div>

      <SettingsField label="Animation">
        <PresetSelect
          id={`transition-preset-${kind}`}
          value={config.preset}
          onChange={(preset) =>
            updateSettings(
              kind === "menu" ? { menu: { preset } } : { page: { preset } },
            )
          }
        />
      </SettingsField>

      <SettingsField
        label="Duration"
        description={`${config.durationMs} ms`}
      >
        <input
          type="range"
          min={0}
          max={800}
          step={20}
          value={config.durationMs}
          disabled={!settings.enabled || config.preset === "none"}
          onChange={(event) => {
            const durationMs = Number.parseInt(event.target.value, 10);
            updateSettings(
              kind === "menu"
                ? { menu: { durationMs } }
                : { page: { durationMs } },
            );
          }}
          className="w-full max-w-xs accent-app-accent disabled:opacity-40"
        />
      </SettingsField>

      <TransitionPreview
        preset={config.preset}
        durationMs={settings.enabled ? config.durationMs : 0}
        label={title}
      />
    </section>
  );
}

type GeneralSettingsTabProps = {
  user: CurrentUser | undefined;
  nameDraft: string;
  onNameDraftChange: (nextName: string) => void;
  nameEditDisabled?: boolean;
};

export function GeneralSettingsTab({
  user,
  nameDraft,
  onNameDraftChange,
  nameEditDisabled = false,
}: GeneralSettingsTabProps) {
  const settings = useTransitionSettings();
  const { updateSettings, replaceSettings } = useTransitionSettingsActions();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
      <header>
        <h2 className="text-lg font-semibold text-stone-50">General</h2>
        <p className="mt-1 text-sm text-stone-500">
          Profile, wallpaper, timezone, breadcrumb trail length, nav menu wave glow, and how
          the app animates when you move between areas.
        </p>
      </header>

      {user ? (
        <ProfileNameSection
          user={user}
          nameDraft={nameDraft}
          onNameDraftChange={onNameDraftChange}
          disabled={nameEditDisabled}
        />
      ) : null}

      <BackgroundSettingsSection />

      <BreadcrumbSettingsSection />

      <NavWaveGlowSettingsSection />

      <TimezoneSettingsSection />

      <section className="space-y-4 rounded-xl border border-stone-800/80 bg-stone-950/40 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-stone-100">Page transitions</h3>
            <p className="mt-1 text-xs text-stone-500">
              Animate content when navigating menus, pages, and subpages.
            </p>
          </div>
          <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-stone-300">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) => updateSettings({ enabled: event.target.checked })}
              className="h-4 w-4 rounded border-stone-600 bg-stone-900 text-app-accent focus:ring-app-accent/40"
            />
            Enabled
          </label>
        </div>

        <button
          type="button"
          onClick={() => replaceSettings(DEFAULT_TRANSITION_SETTINGS)}
          className="text-xs font-medium text-stone-500 underline-offset-2 transition hover:text-stone-300 hover:underline"
        >
          Reset transitions to defaults
        </button>
      </section>

      <KindTransitionFields
        kind="menu"
        title="Menu transitions"
        description="When switching top-level areas (Home, Chat, Agents, Projects, etc.)."
      />

      <KindTransitionFields
        kind="page"
        title="Page transitions"
        description="When moving within the same menu (e.g. project list to project detail)."
      />
    </div>
  );
}
