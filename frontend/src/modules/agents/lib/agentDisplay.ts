// stack_sandbox/frontend_web/src/modules/agents/lib/agentDisplay.ts

// Agent portrait and 3D model URLs from backend catalog media.

import { getApiBaseUrl } from "../../../lib/api";
import type { AgentMedia, AgentSummary } from "../api";

function catalogMediaUrl(storageKey: string, cacheBuster?: string | null): string {
  const url = `${getApiBaseUrl()}/catalog/media/${storageKey}`;
  if (!cacheBuster) {
    return url;
  }
  return `${url}?v=${encodeURIComponent(cacheBuster)}`;
}

function resolveAgentMediaUrl(
  url: string,
  cacheBuster?: string | null,
): string {
  const absoluteUrl = url.startsWith("http") ? url : `${getApiBaseUrl()}${url}`;
  if (!cacheBuster) {
    return absoluteUrl;
  }
  const separator = absoluteUrl.includes("?") ? "&" : "?";
  return `${absoluteUrl}${separator}v=${encodeURIComponent(cacheBuster)}`;
}

function mediaByKind(
  media: AgentMedia[] | undefined,
  mediaKind: string,
  role?: string,
): AgentMedia | undefined {
  if (!media?.length) {
    return undefined;
  }
  return media.find(
    (item) =>
      item.media_kind === mediaKind && (role == null || item.role === role),
  );
}

function agentImageStorageKey(agentId: string): string {
  return `agents/${agentId}/image.png`;
}

/** Built-in agents with committed 3D assets when catalog media is not loaded yet. */
const BUILTIN_AGENT_MODEL_STORAGE_KEYS: Record<string, string> = {
  keel: "agents/keel/model.glb",
};

/** Portrait URL for an agent (orchestrator or sub-agent). */
export function agentImageUrl(
  agentId: string,
  media?: AgentMedia[],
): string {
  const fromApi = mediaByKind(media, "image", "tile");
  if (fromApi) {
    return resolveAgentMediaUrl(fromApi.url, fromApi.updated_at);
  }
  return catalogMediaUrl(agentImageStorageKey(agentId));
}

/** GLB model URL for an agent detail panel turntable. */
export function agentModelUrl(
  agentId: string,
  media?: AgentMedia[],
): string | null {
  const fromApi = mediaByKind(media, "model_3d", "turntable");
  if (fromApi) {
    return resolveAgentMediaUrl(fromApi.url, fromApi.updated_at);
  }
  const builtinStorageKey = BUILTIN_AGENT_MODEL_STORAGE_KEYS[agentId];
  return builtinStorageKey ? catalogMediaUrl(builtinStorageKey) : null;
}

export function orchestratorPortraitSrc(agent?: AgentSummary | null): string {
  if (agent) {
    return agentImageUrl(agent.id, agent.media);
  }
  return catalogMediaUrl(agentImageStorageKey("keel"));
}

export function subagentPortraitSrc(
  agentId: string,
  media?: AgentMedia[],
): string {
  return agentImageUrl(agentId, media);
}

export function subagentDisplayNameClassName(agentId: string): string {
  return SUBAGENT_DISPLAY_NAME_CLASS[agentId] ?? SUBAGENT_DISPLAY_NAME_CLASS_DEFAULT;
}

export function subagentStartChatButtonClassName(agentId: string): string {
  return (
    AGENT_START_CHAT_BUTTON_CLASS[agentId] ??
    AGENT_START_CHAT_BUTTON_CLASS_DEFAULT
  );
}

export function subagentModelSrc(
  agentId: string,
  media?: AgentMedia[],
): string | null {
  return agentModelUrl(agentId, media);
}

/** Obsidian logo purple (#9333ea) — matches workspace note / edge purple. */
export const OBSIDIAN_LOGO_PURPLE = "#9333ea";

/** Light lime for Keel detail-panel glow (tailwind lime-400). */
export const KEEL_GLOW_LIME = "#a3e635";

/** Light orange for Haul detail-panel glow (tailwind orange-300). */
export const HAUL_GLOW_ORANGE = "#fdba74";

/** Light green for Forage detail-panel glow (tailwind green-300). */
export const FORAGE_GLOW_GREEN = "#86efac";

/** Theme color for the detail-panel backdrop glow, keyed by agent id. */
export function subagentModelGlowColor(agentId: string): string | null {
  switch (agentId) {
    case "keel":
      return KEEL_GLOW_LIME;
    case "baysic":
      return "#ffffff";
    case "recall":
      return OBSIDIAN_LOGO_PURPLE;
    case "haul":
      return HAUL_GLOW_ORANGE;
    case "forage":
      return FORAGE_GLOW_GREEN;
    default:
      return null;
  }
}

/** Stationary CSS radial glow behind the 3D canvas (does not rotate with the model). */
export function subagentModelGlowCssBackground(agentId: string): string | null {
  switch (agentId) {
    case "keel":
      return [
        "radial-gradient(ellipse 52% 50% at 50% 54%,",
        "rgba(163, 230, 53, 0.5) 0%,",
        "rgba(163, 230, 53, 0.2) 55%,",
        "transparent 62%)",
      ].join(" ");
    case "baysic":
      return [
        "radial-gradient(ellipse 52% 50% at 50% 54%,",
        "rgba(255, 255, 255, 0.5) 0%,",
        "rgba(255, 255, 255, 0.2) 55%,",
        "transparent 62%)",
      ].join(" ");
    case "recall":
      return [
        "radial-gradient(ellipse 52% 50% at 50% 54%,",
        "rgba(147, 51, 234, 0.55) 0%,",
        "rgba(147, 51, 234, 0.2) 55%,",
        "transparent 62%)",
      ].join(" ");
    case "haul":
      return [
        "radial-gradient(ellipse 52% 50% at 50% 54%,",
        "rgba(253, 186, 116, 0.55) 0%,",
        "rgba(253, 186, 116, 0.2) 55%,",
        "transparent 62%)",
      ].join(" ");
    case "forage":
      return [
        "radial-gradient(ellipse 52% 50% at 50% 54%,",
        "rgba(134, 239, 172, 0.55) 0%,",
        "rgba(134, 239, 172, 0.2) 55%,",
        "transparent 62%)",
      ].join(" ");
    default:
      return null;
  }
}

/** Optional avatar portrait scale when the asset reads small at chat list size. */
const AGENT_AVATAR_SCALE_CLASS: Record<string, string> = {
  baysic: "scale-[1.3]",
};

const SUBAGENT_PORTRAIT_SCALE_CLASS: Record<string, string> = {
  baysic: "scale-[1.8] group-hover:scale-[1.854]",
  recall: "scale-[1.3] group-hover:scale-[1.339]",
};

const SUBAGENT_DISPLAY_NAME_CLASS: Record<string, string> = {
  baysic: "text-white group-hover:text-white",
  forage: "text-green-600 group-hover:text-green-500",
  haul: "text-orange-400 group-hover:text-orange-300",
  recall: "text-purple-400 group-hover:text-purple-300",
};

const AGENT_START_CHAT_BUTTON_CLASS: Record<string, string> = {
  keel:
    "border-lime-700/55 text-lime-400 hover:border-lime-400/55 hover:text-lime-300",
  baysic:
    "border-stone-500/55 text-stone-100 hover:border-white/45 hover:text-white",
  forage:
    "border-green-700/55 text-green-400 hover:border-green-500/55 hover:text-green-300",
  haul:
    "border-orange-700/55 text-orange-400 hover:border-orange-400/55 hover:text-orange-300",
  recall:
    "border-purple-700/55 text-purple-400 hover:border-purple-400/55 hover:text-purple-300",
};

const AGENT_START_CHAT_BUTTON_CLASS_DEFAULT =
  "border-violet-700/55 text-violet-400 hover:border-violet-400/55 hover:text-violet-300";

const SUBAGENT_DISPLAY_NAME_CLASS_DEFAULT =
  "text-violet-300/95 group-hover:text-violet-200";

export function agentAvatarImageClassName(agentId: string): string {
  const base = "h-full w-full object-cover";
  const scaleClass = AGENT_AVATAR_SCALE_CLASS[agentId];
  return scaleClass ? `${base} ${scaleClass}` : base;
}

export function conversationListAvatarSizeClassName(agentId: string): string {
  return agentId === "keel" ? "h-9 w-9" : "h-[2.625rem] w-[2.625rem]";
}

export function agentPortraitSrc(agentId: string): string {
  return agentImageUrl(agentId);
}

export function subagentPortraitImageClassName(agentId: string): string {
  const base =
    "max-h-full max-w-full object-contain drop-shadow-md transition";
  const scaleClass = SUBAGENT_PORTRAIT_SCALE_CLASS[agentId];
  return scaleClass ? `${base} ${scaleClass}` : `${base} group-hover:scale-[1.03]`;
}
