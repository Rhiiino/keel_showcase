// keel_web/src/views/cards/CardGalleryPageLayout.tsx

import type { ReactNode } from "react";

import { AppShellContent } from "../../app/shell/AppShellContent";
import { ListPageTitle } from "../list/primitives/ListPageTitle";
import {
  CARD_GALLERY_EMPTY_CLASS,
  CARD_GALLERY_SEARCH_ICON_CLASS,
  CARD_GALLERY_SEARCH_INPUT_CLASS,
} from "./cardGridClasses";

type CardGalleryPageLayoutProps = {
  title: string;
  recordCount?: number;
  subtitle: ReactNode;
  headerActions?: ReactNode;
  headerExtras?: ReactNode;
  searchId: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  totalCount: number;
  filteredCount: number;
  loadingMessage?: string;
  errorMessage?: string;
  emptyMessage?: string;
  noMatchMessage?: string;
  actionError?: string | null;
  titleClassName?: string;
  countClassName?: string;
  subtitleClassName?: string;
  children: ReactNode;
  afterContent?: ReactNode;
};

export function CardGalleryPageLayout({
  title,
  recordCount,
  subtitle,
  headerActions,
  headerExtras,
  searchId,
  searchLabel,
  searchPlaceholder,
  searchQuery,
  onSearchChange,
  isLoading = false,
  isError = false,
  totalCount,
  filteredCount,
  loadingMessage = "Loading…",
  errorMessage = "Failed to load.",
  emptyMessage = "No items yet.",
  noMatchMessage = "No items match your search.",
  actionError = null,
  titleClassName = "text-2xl font-semibold text-white/95",
  countClassName = "font-normal tracking-normal text-white/45",
  subtitleClassName = "mt-1 max-w-2xl text-sm text-white/45",
  children,
  afterContent,
}: CardGalleryPageLayoutProps) {
  const showGrid = !isLoading && !(isError && totalCount === 0) && totalCount > 0 && filteredCount > 0;

  return (
    <AppShellContent>
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <ListPageTitle
                title={title}
                recordCount={recordCount}
                className={titleClassName}
                countClassName={countClassName}
              />
              <p className={subtitleClassName}>{subtitle}</p>
            </div>
            {headerActions ?? headerExtras ? (
              <div className="flex flex-wrap items-center gap-2">
                {headerExtras}
                {headerActions}
              </div>
            ) : null}
          </header>

          <section className="space-y-4">
            <div className="relative max-w-xl">
              <label htmlFor={searchId} className="sr-only">
                {searchLabel}
              </label>
              <div className={CARD_GALLERY_SEARCH_ICON_CLASS}>
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="6" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16 16 4 4" />
                </svg>
              </div>
              <input
                id={searchId}
                type="search"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                className={CARD_GALLERY_SEARCH_INPUT_CLASS}
              />
            </div>

            {actionError ? (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {actionError}
              </p>
            ) : null}

            {isLoading && totalCount === 0 ? (
              <p className="text-sm text-white/40">{loadingMessage}</p>
            ) : isError && totalCount === 0 ? (
              <p className="text-sm text-white/40">{errorMessage}</p>
            ) : totalCount === 0 ? (
              <p className={CARD_GALLERY_EMPTY_CLASS}>{emptyMessage}</p>
            ) : filteredCount === 0 ? (
              <p className={CARD_GALLERY_EMPTY_CLASS}>{noMatchMessage}</p>
            ) : showGrid ? (
              children
            ) : null}
          </section>
        </div>
        {afterContent}
      </div>
    </AppShellContent>
  );
}
