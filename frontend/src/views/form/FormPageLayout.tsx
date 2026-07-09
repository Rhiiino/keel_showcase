// keel_web/src/views/form/FormPageLayout.tsx

import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { InlineSaveDiscardActions } from "../../components/InlineSaveDiscardActions";

type FormPageMaxWidth = "3xl" | "5xl" | "7xl";

const MAX_WIDTH_CLASS: Record<FormPageMaxWidth, string> = {
  "3xl": "max-w-3xl",
  "5xl": "max-w-5xl",
  "7xl": "max-w-7xl",
};

type FormPageLayoutProps = {
  backHref: string;
  backLabel: string;
  isDirty?: boolean;
  onDiscard?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  canSave?: boolean;
  saveError?: string | null;
  headerAction?: ReactNode;
  /** When true, headerAction stays visible even while save/discard is shown. */
  persistHeaderAction?: boolean;
  title?: string;
  subtitle?: string | null;
  footer?: ReactNode;
  maxWidth?: FormPageMaxWidth;
  padded?: boolean;
  /** When true, children expand to fill remaining viewport height (requires flex parent). */
  fillHeight?: boolean;
  errorMessage?: string | null;
  children: ReactNode;
};

export function FormPageLayout({
  backHref,
  backLabel,
  isDirty = false,
  onDiscard,
  onSave,
  isSaving = false,
  canSave = true,
  saveError = null,
  headerAction,
  persistHeaderAction = false,
  title,
  subtitle,
  footer,
  maxWidth = "3xl",
  padded = false,
  fillHeight = false,
  errorMessage,
  children,
}: FormPageLayoutProps) {
  const showSaveDiscard = isDirty && onDiscard && onSave;
  const widthClass = MAX_WIDTH_CLASS[maxWidth];
  const hasTitle = Boolean(title);

  const containerClass = [
    padded
      ? `mx-auto flex w-full ${widthClass} flex-col gap-4 px-4 py-6 md:px-6`
      : `w-full ${widthClass}`,
    fillHeight ? "flex min-h-0 flex-1 flex-col" : null,
  ]
    .filter(Boolean)
    .join(" ");

  const showHeaderAction =
    headerAction && (persistHeaderAction || hasTitle || !showSaveDiscard);

  const headerRight = (
    <div className="flex shrink-0 items-center gap-2">
      {showHeaderAction ? headerAction : null}
      {showSaveDiscard ? (
        <InlineSaveDiscardActions
          visible
          onDiscard={onDiscard}
          onSave={onSave}
          isSaving={isSaving}
          canSave={canSave}
          saveError={saveError}
        />
      ) : null}
    </div>
  );

  return (
    <div className={containerClass}>
      <header
        className={[
          hasTitle
            ? "flex items-start justify-between gap-4"
            : "flex items-center justify-between gap-4",
          fillHeight ? "shrink-0" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className={hasTitle ? "min-w-0" : undefined}>
          <Link
            to={backHref}
            className="text-sm text-stone-500 transition hover:text-stone-300"
          >
            ← {backLabel}
          </Link>
          {hasTitle ? (
            <>
              <h1 className="mt-4 text-xl font-medium text-stone-100">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-stone-500">{subtitle}</p> : null}
            </>
          ) : null}
        </div>
        {headerRight}
      </header>

      {errorMessage ? (
        <p className={padded || hasTitle ? "text-sm text-red-300" : "mt-6 text-sm text-red-400"}>
          {errorMessage}
        </p>
      ) : null}

      <div
        className={[
          hasTitle || padded ? undefined : "mt-10",
          fillHeight ? "flex min-h-0 flex-1 flex-col" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>

      {footer}
    </div>
  );
}
