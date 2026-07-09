// frontend/src/app/modules/registry.ts

// Ordered manifest registry. Add new modules here — one import + one array entry.

import { agentsManifest } from "../../modules/agents/manifest";
import { authManifest } from "../../modules/auth/manifest";
import { chatManifest } from "../../modules/chat/manifest";
import { coakManifest } from "../../modules/coak/manifest";
import { peopleManifest } from "../../modules/people/manifest";
import { deletedManifest } from "../../modules/deleted/manifest";
import { emailManifest } from "../../modules/email/manifest";
import { financeManifest } from "../../modules/finance/manifest";
import { focusManifest } from "../../modules/focus/manifest";
import { gamesManifest } from "../../modules/games/manifest";
import { homeManifest } from "../../modules/home/manifest";
import { intelligenceManifest } from "../../modules/intelligence/manifest";
import { jobsManifest } from "../../modules/jobs/manifest";
import { journalManifest } from "../../modules/journal/manifest";
import { mediaManifest } from "../../modules/media/manifest";
import { projectsManifest } from "../../modules/projects/manifest";
import { servicesManifest } from "../../modules/services/manifest";
import { settingsManifest } from "../../modules/settings/manifest";
import { timelineManifest } from "../../modules/timeline/manifest";
import type { FeatureModuleManifest } from "./types";

/** All registered modules in route composition order (inside AppShell). */
export const moduleManifests: FeatureModuleManifest[] = [
  authManifest,
  homeManifest,
  chatManifest,
  agentsManifest,
  intelligenceManifest,
  projectsManifest,
  financeManifest,
  mediaManifest,
  peopleManifest,
  timelineManifest,
  journalManifest,
  jobsManifest,
  servicesManifest,
  emailManifest,
  focusManifest,
  gamesManifest,
  coakManifest,
  settingsManifest,
  deletedManifest,
];

export function enabledModules(
  modules: readonly FeatureModuleManifest[],
): FeatureModuleManifest[] {
  return modules.filter((module) => module.enabled !== false);
}

export function assertManifestDependencies(
  modules: readonly FeatureModuleManifest[],
): void {
  if (!import.meta.env.DEV) {
    return;
  }

  const enabledKeys = new Set(modules.map((module) => module.key));

  for (const module of modules) {
    for (const dependencyKey of module.dependsOn ?? []) {
      if (!enabledKeys.has(dependencyKey)) {
        throw new Error(
          `Module "${module.key}" depends on "${dependencyKey}", which is not enabled.`,
        );
      }
    }
  }
}

const enabled = enabledModules(moduleManifests);
assertManifestDependencies(enabled);
