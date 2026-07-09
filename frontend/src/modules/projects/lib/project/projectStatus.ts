// stack_sandbox/frontend_web/src/modules/projects/lib/project/projectStatus.ts

// Project status labels and pill styling for Kanban cards.

export const PROJECT_STATUSES = [
  "planning",
  "active",
  "paused",
  "completed",
  "archived",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export function isProjectStatus(value: string): value is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(value);
}

export function projectStatusLabel(status: string): string {
  switch (status) {
    case "planning":
      return "Planning";
    case "active":
      return "Active";
    case "paused":
      return "Paused";
    case "completed":
      return "Completed";
    case "archived":
      return "Archived";
    default:
      return status;
  }
}

export function projectStatusPillClass(status: string): string {
  switch (status) {
    case "planning":
      return "bg-violet-500/20 text-violet-200 ring-violet-400/30";
    case "active":
      return "bg-lime-500/20 text-lime-200 ring-lime-400/30";
    case "paused":
      return "bg-amber-500/20 text-amber-200 ring-amber-400/30";
    case "completed":
      return "bg-sky-500/20 text-sky-200 ring-sky-400/30";
    case "archived":
      return "bg-stone-500/20 text-stone-300 ring-stone-500/30";
    default:
      return "bg-stone-500/20 text-stone-300 ring-stone-500/30";
  }
}

/** Accent color for status dividers (matches pill ring tones). */
export function projectStatusAccentColor(status: string): string {
  switch (status) {
    case "planning":
      return "rgb(167 139 250)";
    case "active":
      return "rgb(163 230 53)";
    case "paused":
      return "rgb(251 191 36)";
    case "completed":
      return "rgb(56 189 248)";
    case "archived":
      return "rgb(120 113 108)";
    default:
      return "rgb(120 113 108)";
  }
}
