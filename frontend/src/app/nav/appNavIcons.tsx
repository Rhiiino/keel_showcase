// keel_web/src/app/nav/appNavIcons.tsx

// Shared PNG nav icons — rendered as CSS masks so they inherit theme text color.

import type { CSSProperties } from "react";

import agentsIcon from "../../assets/nav_icons/agents.png";
import chatIcon from "../../assets/nav_icons/chat.png";
import coakIcon from "../../assets/nav_icons/coak.png";
import contactsIcon from "../../assets/nav_icons/contacts.png";
import emailIcon from "../../assets/nav_icons/email.png";
import focusIcon from "../../assets/nav_icons/focus.png";
import gamesIcon from "../../assets/nav_icons/games.png";
import homeIcon from "../../assets/nav_icons/home.png";
import intelligenceIcon from "../../assets/nav_icons/intelligence.png";
import journalIcon from "../../assets/nav_icons/journal.png";
import jobsIcon from "../../assets/nav_icons/jobs.png";
import mediaIcon from "../../assets/nav_icons/media.png";
import projectsIcon from "../../assets/nav_icons/projects.png";
import servicesIcon from "../../assets/nav_icons/services.png";
import financeIcon from "../../assets/nav_icons/finances.png";
import devIcon from "../../assets/nav_icons/dev.png";
import timelineIcon from "../../assets/nav_icons/timeline.png";

import { NAV_ICON_IMAGE_CLASS } from "./appNavConfig";

export type AppNavIconId =
  | "home"
  | "chat"
  | "coak"
  | "agents"
  | "intelligence"
  | "projects"
  | "finance"
  | "media"
  | "people"
  | "contacts"
  | "timeline"
  | "journal"
  | "jobs"
  | "services"
  | "email"
  | "focus"
  | "games"
  | "dev";

const NAV_ICON_SRC: Record<AppNavIconId, string> = {
  home: homeIcon,
  chat: chatIcon,
  coak: coakIcon,
  agents: agentsIcon,
  intelligence: intelligenceIcon,
  projects: projectsIcon,
  finance: financeIcon,
  media: mediaIcon,
  people: contactsIcon,
  contacts: contactsIcon,
  timeline: timelineIcon,
  journal: journalIcon,
  jobs: jobsIcon,
  services: servicesIcon,
  email: emailIcon,
  focus: focusIcon,
  games: gamesIcon,
  dev: devIcon,
};

type AppNavIconImageProps = {
  id: AppNavIconId;
  className?: string;
};

export function AppNavIconImage({
  id,
  className = NAV_ICON_IMAGE_CLASS,
}: AppNavIconImageProps) {
  const src = NAV_ICON_SRC[id];

  return (
    <span
      aria-hidden
      className={`app-nav-icon-mask ${className}`}
      style={
        {
          "--app-nav-icon-mask": `url(${src})`,
        } as CSSProperties
      }
    />
  );
}
