// keel_web/src/modules/people/figures/pages/FigureCreatePage.tsx

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { FormPageLayout } from "../../../../views";
import { AutoSizeTextarea } from "../../../projects/components/common/AutoSizeTextarea";
import type { MediaObject } from "../../../media/api";
import { PersonBirthDateField } from "../../shared/components/PersonBirthDateField";
import { PersonPhotoField } from "../../shared/components/PersonPhotoField";
import {
  EMPTY_BIRTH_DATE_PARTS,
  partsToDateOnly,
  partsToPayload,
  type BirthDateParts,
} from "../../shared/lib/birthDate";
import {
  createFigure,
  figuresQueryKeys,
  setFigurePhotoFromMedia,
  uploadFigurePhoto,
  validateFigurePhotoFile,
  type FigureCreatePayload,
  type FigureGender,
} from "../api";

const GENDER_OPTIONS: { value: FigureGender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

function GenderIcon({ gender }: { gender: FigureGender }) {
  if (gender === "female") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
        <circle cx="12" cy="8" r="4.25" />
        <path d="M12 12.5v8" />
        <path d="M8.5 17h7" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <circle cx="9.5" cy="14.5" r="4.25" />
      <path d="M12.5 11.5 19 5" />
      <path d="M15 5h4v4" />
    </svg>
  );
}

export function FigureCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [firstNameDraft, setFirstNameDraft] = useState("");
  const [lastNameDraft, setLastNameDraft] = useState("");
  const [genderDraft, setGenderDraft] = useState<FigureGender | null>(null);
  const [birthDatePartsDraft, setBirthDatePartsDraft] = useState<BirthDateParts>(
    EMPTY_BIRTH_DATE_PARTS,
  );
  const [deathDatePartsDraft, setDeathDatePartsDraft] = useState<BirthDateParts>(
    EMPTY_BIRTH_DATE_PARTS,
  );
  const [notesDraft, setNotesDraft] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoMedia, setPhotoMedia] = useState<MediaObject | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const birthDatePayload = partsToPayload(birthDatePartsDraft);
      const payload: FigureCreatePayload = {
        first_name: firstNameDraft.trim() || null,
        last_name: lastNameDraft.trim() || null,
        birth_date: birthDatePayload.birth_date,
        birth_date_year_known: birthDatePayload.birth_date_year_known,
        death_date: partsToDateOnly(deathDatePartsDraft),
        notes: notesDraft,
      };
      if (genderDraft !== null) {
        payload.gender = genderDraft;
      }

      const created = await createFigure(payload);
      if (photoMedia) {
        return setFigurePhotoFromMedia(created.id, photoMedia.id);
      }
      if (photoFile) {
        return uploadFigurePhoto(created.id, photoFile);
      }
      return created;
    },
    onSuccess: (figure) => {
      void queryClient.invalidateQueries({ queryKey: figuresQueryKeys.all });
      navigate(`/people/figures/${figure.id}`);
    },
  });

  const handlePhotoSelected = (file: File) => {
    const validation = validateFigurePhotoFile(file);
    if (!validation.ok) {
      setPhotoError(validation.error);
      return;
    }
    setPhotoError(null);
    setPhotoMedia(null);
    setPhotoFile(file);
  };

  const handlePhotoMediaSelected = (media: MediaObject) => {
    setPhotoError(null);
    setPhotoFile(null);
    setPhotoMedia(media);
  };

  return (
    <FormPageLayout
      title="New figure"
      backHref="/people/figures"
      backLabel="Figures"
      headerAction={
        <button
          type="button"
          disabled={createMutation.isPending}
          onClick={() => createMutation.mutate()}
          className="rounded-lg bg-app-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-app-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {createMutation.isPending ? "Creating…" : "Create"}
        </button>
      }
    >
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <PersonPhotoField
          person={{ first_name: firstNameDraft || null, last_name: lastNameDraft || null }}
          photoLabel="figure photo"
          disabled={createMutation.isPending}
          onPhotoSelected={handlePhotoSelected}
          onMediaSelected={handlePhotoMediaSelected}
        />
        <div className="min-w-0 flex-1 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
                First name
              </span>
              <input
                type="text"
                value={firstNameDraft}
                disabled={createMutation.isPending}
                onChange={(event) => setFirstNameDraft(event.target.value)}
                className="mt-1 w-full rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:outline-none focus:ring-stone-600"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Last name
              </span>
              <input
                type="text"
                value={lastNameDraft}
                disabled={createMutation.isPending}
                onChange={(event) => setLastNameDraft(event.target.value)}
                className="mt-1 w-full rounded-lg bg-stone-900/50 px-3 py-2 text-sm text-stone-100 ring-1 ring-stone-800 focus:outline-none focus:ring-stone-600"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-stone-400">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Gender
              </span>
              {GENDER_OPTIONS.map((option) => {
                const selected = genderDraft === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={createMutation.isPending}
                    onClick={() => setGenderDraft(option.value)}
                    aria-pressed={selected}
                    aria-label={`Set gender to ${option.label}`}
                    title={option.label}
                    className={[
                      "inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
                      selected && option.value === "male"
                        ? "border-sky-300/70 bg-sky-400/20 text-sky-100"
                        : "",
                      selected && option.value === "female"
                        ? "border-pink-300/70 bg-pink-400/20 text-pink-100"
                        : "",
                      !selected
                        ? "border-stone-800 bg-stone-950 text-stone-500 hover:border-stone-600 hover:text-stone-200"
                        : "",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                    ].join(" ")}
                  >
                    <GenderIcon gender={option.value} />
                  </button>
                );
              })}
            </div>
            <PersonBirthDateField
              value={birthDatePartsDraft}
              disabled={createMutation.isPending}
              onChange={setBirthDatePartsDraft}
            />
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Death date
              </span>
              <PersonBirthDateField
                value={deathDatePartsDraft}
                disabled={createMutation.isPending}
                onChange={setDeathDatePartsDraft}
                monthAriaLabel="Death month"
                dayAriaLabel="Death day"
                yearAriaLabel="Death year"
                yearPlaceholder="Year"
              />
            </div>
          </div>
          {photoError ? <p className="text-xs text-red-400">{photoError}</p> : null}
        </div>
      </header>

      <section className="mt-8 rounded-2xl border border-stone-800/80 bg-stone-950/40 p-5">
        <h2 className="text-sm font-medium uppercase tracking-wide text-stone-500">Notes</h2>
        <AutoSizeTextarea
          value={notesDraft}
          disabled={createMutation.isPending}
          onChange={(event) => setNotesDraft(event.target.value)}
          placeholder="Add notes about this figure..."
          aria-label="Figure notes"
          className="mt-2 w-full border-0 bg-transparent text-sm leading-relaxed text-stone-300 placeholder:text-stone-600 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </section>
    </FormPageLayout>
  );
}
