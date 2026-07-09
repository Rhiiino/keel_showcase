// keel_web/src/app/nav/ModuleSubNav.tsx

// Secondary tab navigation rendered below the app shell header for one module.

import { Link, useLocation } from "react-router-dom";

import {
  isModuleSubNavItemActive,
  type ModuleSubNavItem,
} from "./moduleSubNavConfig";
import { resolveModuleSubNavHref } from "./moduleSubNavStorage";

type ModuleSubNavProps = {
  moduleId: string;
  moduleTitle: string;
  items: readonly ModuleSubNavItem[];
  ariaLabel?: string;
};

export function ModuleSubNav({
  moduleId,
  moduleTitle,
  items,
  ariaLabel,
}: ModuleSubNavProps) {
  const { pathname } = useLocation();

  return (
    <header className="border-b border-stone-800/80 pb-5">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-stone-500">
        {moduleTitle}
      </p>
      <nav
        aria-label={ariaLabel ?? `${moduleTitle} sections`}
        className="mt-3 inline-flex flex-wrap gap-1 rounded-xl bg-stone-950/50 p-1 ring-1 ring-stone-800/80"
      >
        {items.map((item) => {
          const active = isModuleSubNavItemActive(pathname, item);
          return (
            <Link
              key={item.id}
              to={resolveModuleSubNavHref(moduleId, item)}
              aria-current={active ? "page" : undefined}
              className={[
                "rounded-lg px-4 py-2 text-sm font-medium transition",
                active
                  ? "bg-sky-500/15 text-sky-100 shadow-sm shadow-sky-950/20 ring-1 ring-sky-400/35"
                  : "text-stone-400 hover:bg-stone-900/70 hover:text-stone-100",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
