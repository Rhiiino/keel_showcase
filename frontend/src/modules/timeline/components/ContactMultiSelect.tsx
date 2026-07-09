// keel_web/src/modules/timeline/components/ContactMultiSelect.tsx

// Multi-select contact picker for timeline event forms.

import { useEffect, useMemo, useRef, useState } from "react";

import type { Contact } from "../../people/contacts/api";
import { formatContactName } from "../../people/contacts/api";
import { contactMatchesSearch } from "../../people/contacts/lib/contactFilters";
import { TimelinePersonCircle } from "./TimelinePersonCircle";

const CIRCLE_SIZE = {
  default: {
    circle: "h-24 w-24",
    plus: "h-8 w-8",
    remove: "h-5 w-5",
    gap: "gap-3",
  },
  compact: {
    circle: "h-8 w-8",
    plus: "h-3 w-3",
    remove: "h-3.5 w-3.5",
    gap: "gap-2",
  },
} as const;

type ContactMultiSelectProps = {
  contacts: Contact[];
  value: number[];
  onChange: (contactIds: number[]) => void;
  disabled?: boolean;
  label?: string;
  variant?: "field" | "circles";
  /** When true with `variant="circles"`, selected contacts show a remove control. */
  removable?: boolean;
  /** Compact circles for filter bars; default is large for event forms. */
  size?: keyof typeof CIRCLE_SIZE;
};

function RemovableContactCircle({
  contact,
  onRemove,
  disabled,
  sizeClass,
  removeButtonSizeClass,
}: {
  contact: Contact;
  onRemove: () => void;
  disabled: boolean;
  sizeClass: string;
  removeButtonSizeClass: string;
}) {
  const displayName = formatContactName(contact);

  return (
    <span className="relative inline-flex shrink-0">
      <TimelinePersonCircle
        displayName={displayName}
        photo={contact.photo}
        firstName={contact.first_name}
        sizeClass={sizeClass}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        aria-label={`Remove ${displayName}`}
        className={[
          "absolute -left-0.5 -top-0.5 z-10 inline-flex items-center justify-center rounded-full",
          removeButtonSizeClass,
          "bg-stone-900 text-[10px] leading-none text-stone-300 ring-1 ring-stone-600",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "hover:bg-red-950 hover:text-red-200 hover:ring-red-400/50",
        ].join(" ")}
      >
        <span aria-hidden>×</span>
      </button>
    </span>
  );
}


function ContactAddCircleButton({
  onClick,
  disabled,
  open,
  sizeClass,
  plusIconSizeClass,
}: {
  onClick: () => void;
  disabled: boolean;
  open: boolean;
  sizeClass: string;
  plusIconSizeClass: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label="Add contact"
      aria-haspopup="listbox"
      aria-expanded={open}
      className={[
        "inline-flex shrink-0 items-center justify-center rounded-full border border-dashed transition",
        sizeClass,
        disabled
          ? "cursor-not-allowed border-stone-700/80 text-stone-500 opacity-50"
          : "border-stone-700/80 text-stone-400 hover:border-sky-400/50 hover:bg-sky-500/5 hover:text-sky-200",
        open ? "border-sky-400/50 bg-sky-500/5 text-sky-200" : "",
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        className={plusIconSizeClass}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}

export function ContactMultiSelect({
  contacts,
  value,
  onChange,
  disabled = false,
  label = "Contacts",
  variant = "field",
  removable = false,
  size = "default",
}: ContactMultiSelectProps) {
  const circleSize = CIRCLE_SIZE[size];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const contactById = useMemo(() => {
    const map = new Map<number, Contact>();
    for (const contact of contacts) {
      map.set(contact.id, contact);
    }
    return map;
  }, [contacts]);

  const options = useMemo(
    () =>
      contacts.map((contact) => ({
        id: contact.id,
        label: formatContactName(contact),
        contact,
      })),
    [contacts],
  );

  const selectedSet = useMemo(() => new Set(value), [value]);

  const stickySelectedOptions = useMemo(
    () =>
      value
        .map((contactId) => options.find((option) => option.id === contactId))
        .filter((option): option is (typeof options)[number] => option != null)
        .filter((option) => contactMatchesSearch(option.contact, query)),
    [options, query, value],
  );

  const browseOptions = useMemo(
    () =>
      options.filter((option) => {
        if (selectedSet.has(option.id)) {
          return false;
        }
        return contactMatchesSearch(option.contact, query);
      }),
    [options, query, selectedSet],
  );

  const selectedContacts = value
    .map((contactId) => contactById.get(contactId))
    .filter((contact): contact is Contact => contact != null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (containerRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  const toggleContact = (contactId: number) => {
    if (value.includes(contactId)) {
      onChange(value.filter((id) => id !== contactId));
      return;
    }
    onChange([...value, contactId]);
  };

  const renderOptionRow = (option: (typeof options)[number]) => {
    const checked = value.includes(option.id);
    return (
      <button
        type="button"
        className={[
          "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition",
          checked
            ? "bg-stone-900/80 text-stone-100"
            : "text-stone-200 hover:bg-stone-900/80",
        ].join(" ")}
        onClick={() => toggleContact(option.id)}
      >
        <span
          className={[
            "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border",
            checked
              ? "border-sky-400/60 bg-sky-400/20 text-sky-200"
              : "border-stone-600 bg-stone-950",
          ].join(" ")}
          aria-hidden
        >
          {checked ? "✓" : ""}
        </span>
        <TimelinePersonCircle
          displayName={option.label}
          photo={option.contact.photo}
          firstName={option.contact.first_name}
          sizeClass="h-7 w-7"
        />
        <span className="truncate">{option.label}</span>
      </button>
    );
  };

  const hasSelectedSection = stickySelectedOptions.length > 0;
  const listEmpty = stickySelectedOptions.length === 0 && browseOptions.length === 0;

  const dropdown = open && !disabled ? (
    <div
      className="absolute left-0 top-full z-50 mt-2 min-w-[14rem] overflow-hidden rounded-lg border border-stone-800 bg-stone-950 shadow-lg ring-1 ring-stone-800/80"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="border-b border-stone-800 p-2">
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => event.stopPropagation()}
          placeholder="Search contacts…"
          aria-label="Search contacts"
          autoComplete="off"
          className="w-full rounded-md bg-stone-900/60 px-2.5 py-1.5 text-sm text-stone-100 ring-1 ring-stone-800 placeholder:text-stone-500 focus:outline-none focus:ring-stone-600"
        />
      </div>
      <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
        {listEmpty ? (
          <li className="px-3 py-2 text-sm text-stone-500">No matches</li>
        ) : null}
        {hasSelectedSection ? (
          <>
            {stickySelectedOptions.map((option) => (
              <li key={`selected-${option.id}`} role="option" aria-selected>
                {renderOptionRow(option)}
              </li>
            ))}
            {browseOptions.length > 0 ? (
              <li aria-hidden className="mx-3 my-1 border-t border-stone-800" />
            ) : null}
          </>
        ) : null}
        {browseOptions.map((option) => (
          <li key={option.id} role="option" aria-selected={false}>
            {renderOptionRow(option)}
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  if (variant === "circles") {
    return (
      <div ref={containerRef} className="overflow-visible">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
          {label}
        </p>
        <div className={`flex flex-wrap items-center ${circleSize.gap}`}>
          {selectedContacts.map((contact) =>
            removable ? (
              <RemovableContactCircle
                key={contact.id}
                contact={contact}
                disabled={disabled}
                sizeClass={circleSize.circle}
                removeButtonSizeClass={circleSize.remove}
                onRemove={() => toggleContact(contact.id)}
              />
            ) : (
              <TimelinePersonCircle
                key={contact.id}
                displayName={formatContactName(contact)}
                photo={contact.photo}
                firstName={contact.first_name}
                sizeClass={circleSize.circle}
              />
            ),
          )}
          <div className="relative">
            <ContactAddCircleButton
              disabled={disabled}
              open={open}
              sizeClass={circleSize.circle}
              plusIconSizeClass={circleSize.plus}
              onClick={() => setOpen((current) => !current)}
            />
            {dropdown}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          "flex w-full max-w-md min-h-[2.75rem] flex-wrap items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ring-1 ring-stone-800 transition",
          "bg-stone-900/50 text-stone-200 hover:ring-stone-600",
          disabled ? "cursor-not-allowed opacity-50" : "",
        ].join(" ")}
      >
        {selectedContacts.length === 0 ? (
          <span className="text-stone-500">Select contacts…</span>
        ) : (
          selectedContacts.map((contact) => (
            <TimelinePersonCircle
              key={contact.id}
              displayName={formatContactName(contact)}
              photo={contact.photo}
              firstName={contact.first_name}
              sizeClass="h-7 w-7"
            />
          ))
        )}
      </button>

      {dropdown}
    </div>
  );
}
