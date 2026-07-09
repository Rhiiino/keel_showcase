// keel_web/src/modules/people/figures/pages/FigureDetailPage.tsx

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useRecordNotFoundRedirect } from "../../../../hooks/useRecordNotFoundRedirect";
import { FormPageLayout } from "../../../../views";
import { AutoSizeTextarea } from "../../../projects/components/common/AutoSizeTextarea";
import type { MediaObject } from "../../../media/api";
import { PersonBirthDateField } from "../../shared/components/PersonBirthDateField";
import { PersonInlineName } from "../../shared/components/PersonInlineName";
import { PersonPhotoField } from "../../shared/components/PersonPhotoField";
import {
  birthDatePayloadsEqual,
  partsFromContact,
  partsFromDateOnly,
  partsToDateOnly,
  partsToPayload,
  type BirthDateParts,
} from "../../shared/lib/birthDate";
import {
  deleteFigure,
  figureEditableName,
  figuresQueryKeys,
  fetchFigure,
  parseFigureFullName,
  setFigurePhotoFromMedia,
  updateFigure,
  uploadFigurePhoto,
  validateFigurePhotoFile,
  type FigureGender,
  type FigureUpdatePayload,
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

export function FigureDetailPage() {
  const { figureId } = useParams();
  const navigate = useNavigate();
  const parsedId = Number(figureId);
  const queryClient = useQueryClient();
  const [birthDatePartsDraft, setBirthDatePartsDraft] = useState<BirthDateParts>(
    partsFromContact({ birth_date: null, birth_date_year_known: true }),
  );
  const [genderDraft, setGenderDraft] = useState<FigureGender | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [deathDatePartsDraft, setDeathDatePartsDraft] = useState<BirthDateParts>(
    partsFromDateOnly(null),
  );
  const [photoFileDraft, setPhotoFileDraft] = useState<File | null>(null);
  const [photoMediaDraft, setPhotoMediaDraft] = useState<MediaObject | null>(null);
  const [photoFieldResetKey, setPhotoFieldResetKey] = useState(0);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const invalidFigureId = !Number.isFinite(parsedId) || parsedId <= 0;

  const figureQuery = useQuery({
    queryKey: figuresQueryKeys.detail(parsedId),
    queryFn: () => fetchFigure(parsedId),
    enabled: !invalidFigureId,
  });

  const redirecting = useRecordNotFoundRedirect({
    invalidId: invalidFigureId,
    isLoading: figureQuery.isLoading,
    error: figureQuery.error,
    isFetched: figureQuery.isFetched,
    hasData: Boolean(figureQuery.data),
    listPath: "/people/figures",
    notice: "That figure could not be found.",
  });

  useEffect(() => {
    if (!figureQuery.data) {
      return;
    }
    setBirthDatePartsDraft(partsFromContact(figureQuery.data));
    setGenderDraft(figureQuery.data.gender ?? null);
    setDeathDatePartsDraft(partsFromDateOnly(figureQuery.data.death_date));
  }, [
    figureQuery.data?.id,
    figureQuery.data?.birth_date,
    figureQuery.data?.birth_date_year_known,
    figureQuery.data?.gender,
    figureQuery.data?.death_date,
  ]);

  useEffect(() => {
    setNotesDraft(figureQuery.data?.notes ?? "");
  }, [figureQuery.data?.id, figureQuery.data?.notes]);

  useEffect(() => {
    if (!figureQuery.data) {
      return;
    }
    setNameDraft(figureEditableName(figureQuery.data));
  }, [figureQuery.data?.id, figureQuery.data?.first_name, figureQuery.data?.last_name]);

  const nameDraftParts = useMemo(() => parseFigureFullName(nameDraft), [nameDraft]);

  const nameDirty = figureQuery.data
    ? figureEditableName(figureQuery.data) !== nameDraft.trim()
    : false;

  const updateFigureMutation = useMutation({
    mutationFn: async () => {
      if (!figureQuery.data) {
        return null;
      }

      let updated = figureQuery.data;
      const draftBirthDate = partsToPayload(birthDatePartsDraft);
      const serverBirthDate = partsToPayload(partsFromContact(figureQuery.data));
      const birthDateDirty = !birthDatePayloadsEqual(draftBirthDate, serverBirthDate);
      const deathDateDirty =
        partsToDateOnly(deathDatePartsDraft) !== (figureQuery.data.death_date ?? null);
      const fieldDirty =
        birthDateDirty ||
        deathDateDirty ||
        genderDraft !== figureQuery.data.gender ||
        nameDirty ||
        notesDraft !== figureQuery.data.notes;

      if (fieldDirty) {
        const payload: FigureUpdatePayload = {
          birth_date: draftBirthDate.birth_date,
          birth_date_year_known: draftBirthDate.birth_date_year_known,
          death_date: partsToDateOnly(deathDatePartsDraft),
          notes: notesDraft,
        };
        if (genderDraft !== null) {
          payload.gender = genderDraft;
        }
        if (nameDirty) {
          payload.first_name = nameDraftParts.first_name;
          payload.last_name = nameDraftParts.last_name;
        }
        updated = await updateFigure(parsedId, payload);
      }

      if (photoMediaDraft) {
        updated = await setFigurePhotoFromMedia(parsedId, photoMediaDraft.id);
      } else if (photoFileDraft) {
        updated = await uploadFigurePhoto(parsedId, photoFileDraft);
      }

      return updated;
    },
    onSuccess: () => {
      setPhotoFileDraft(null);
      setPhotoMediaDraft(null);
      setPhotoFieldResetKey((current) => current + 1);
      void queryClient.invalidateQueries({ queryKey: figuresQueryKeys.all });
    },
  });

  const deleteFigureMutation = useMutation({
    mutationFn: () => deleteFigure(parsedId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: figuresQueryKeys.all });
      navigate("/people/figures");
    },
  });

  const isDirty = useMemo(() => {
    if (!figureQuery.data) {
      return false;
    }
    const draftBirthDate = partsToPayload(birthDatePartsDraft);
    const serverBirthDate = partsToPayload(partsFromContact(figureQuery.data));
    return (
      !birthDatePayloadsEqual(draftBirthDate, serverBirthDate) ||
      partsToDateOnly(deathDatePartsDraft) !== (figureQuery.data.death_date ?? null) ||
      genderDraft !== figureQuery.data.gender ||
      nameDirty ||
      notesDraft !== figureQuery.data.notes ||
      photoFileDraft !== null ||
      photoMediaDraft !== null
    );
  }, [
    birthDatePartsDraft,
    deathDatePartsDraft,
    figureQuery.data,
    genderDraft,
    nameDirty,
    notesDraft,
    photoFileDraft,
    photoMediaDraft,
  ]);

  const handleDiscard = () => {
    if (!figureQuery.data) {
      return;
    }
    setBirthDatePartsDraft(partsFromContact(figureQuery.data));
    setGenderDraft(figureQuery.data.gender ?? null);
    setDeathDatePartsDraft(partsFromDateOnly(figureQuery.data.death_date));
    setNameDraft(figureEditableName(figureQuery.data));
    setNotesDraft(figureQuery.data.notes);
    setPhotoFileDraft(null);
    setPhotoMediaDraft(null);
    setPhotoError(null);
    setPhotoFieldResetKey((current) => current + 1);
  };

  const handlePhotoSelected = (file: File) => {
    const validation = validateFigurePhotoFile(file);
    if (!validation.ok) {
      setPhotoError(validation.error);
      return;
    }
    setPhotoError(null);
    setPhotoMediaDraft(null);
    setPhotoFileDraft(file);
  };

  const handlePhotoMediaSelected = (media: MediaObject) => {
    setPhotoError(null);
    setPhotoFileDraft(null);
    setPhotoMediaDraft(media);
  };

  if (redirecting || figureQuery.isLoading || !figureQuery.data) {
    return null;
  }

  return (
    <FormPageLayout
      backHref="/people/figures"
      backLabel="Figures"
      isDirty={isDirty}
      isSaving={updateFigureMutation.isPending}
      onSave={() => updateFigureMutation.mutate()}
      onDiscard={handleDiscard}
    >
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <PersonPhotoField
          key={photoFieldResetKey}
          person={{
            ...figureQuery.data,
            first_name: nameDraftParts.first_name,
            last_name: nameDraftParts.last_name,
          }}
          photoLabel="figure photo"
          photo={photoMediaDraft ?? figureQuery.data.photo}
          disabled={updateFigureMutation.isPending}
          onPhotoSelected={handlePhotoSelected}
          onMediaSelected={handlePhotoMediaSelected}
        />
        <div className="min-w-0 flex-1">
          <PersonInlineName
            value={nameDraft}
            onChange={setNameDraft}
            onEscape={() => {
              if (figureQuery.data) {
                setNameDraft(figureEditableName(figureQuery.data));
              }
            }}
            disabled={updateFigureMutation.isPending}
          />
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-stone-400">
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
                    disabled={updateFigureMutation.isPending}
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
              disabled={updateFigureMutation.isPending}
              onChange={setBirthDatePartsDraft}
            />
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Death date
              </span>
              <PersonBirthDateField
                value={deathDatePartsDraft}
                disabled={updateFigureMutation.isPending}
                onChange={setDeathDatePartsDraft}
                monthAriaLabel="Death month"
                dayAriaLabel="Death day"
                yearAriaLabel="Death year"
                yearPlaceholder="Year"
              />
            </div>
          </div>
          {photoError ? <p className="mt-2 text-xs text-red-400">{photoError}</p> : null}
        </div>
      </header>

      <section className="mt-8 rounded-2xl border border-stone-800/80 bg-stone-950/40 p-5">
        <h2 className="text-sm font-medium uppercase tracking-wide text-stone-500">Notes</h2>
        <AutoSizeTextarea
          value={notesDraft}
          disabled={updateFigureMutation.isPending}
          onChange={(event) => setNotesDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setNotesDraft(figureQuery.data?.notes ?? "");
            }
          }}
          placeholder="Add notes about this figure..."
          aria-label="Figure notes"
          className="mt-2 w-full border-0 bg-transparent text-sm leading-relaxed text-stone-300 placeholder:text-stone-600 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </section>

      <section className="mt-8 border-t border-stone-800/80 pt-6">
        <button
          type="button"
          disabled={deleteFigureMutation.isPending}
          onClick={() => deleteFigureMutation.mutate()}
          className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleteFigureMutation.isPending ? "Moving to trash…" : "Move to trash"}
        </button>
      </section>
    </FormPageLayout>
  );
}
