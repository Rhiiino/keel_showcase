// keel_web/src/modules/jobs/components/runs/JobRunDetailModal.tsx

import { useEffect } from "react";
import { createPortal } from "react-dom";

import type { JobRun } from "../../api";
import {
  formatJobRunDuration,
  formatJobRunStatus,
  formatJobRunTimestamp,
  formatJobRunTriggeredBy,
  jobRunStatusClass,
} from "../../lib/jobRunDisplay";

type JobRunDetailModalProps = {
  run: JobRun;
  onClose: () => void;
};

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</dt>
      <dd className="text-sm text-stone-200">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}

function JsonBlock({ label, value }: { label: string; value: Record<string, unknown> | null }) {
  const formatted =
    value && Object.keys(value).length > 0 ? JSON.stringify(value, null, 2) : null;

  return (
    <div className="grid gap-1.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</dt>
      <dd>
        {formatted ? (
          <pre className="max-h-48 overflow-auto rounded-lg border border-stone-800 bg-stone-950 p-3 text-xs text-stone-300">
            {formatted}
          </pre>
        ) : (
          <span className="text-sm text-stone-500">—</span>
        )}
      </dd>
    </div>
  );
}

export function JobRunDetailModal({ run, onClose }: JobRunDetailModalProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="presentation"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-run-detail-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-stone-800 bg-stone-950 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-800 px-5 py-4">
          <div className="min-w-0">
            <h2 id="job-run-detail-title" className="truncate text-lg font-medium text-stone-100">
              {run.task_label}
            </h2>
            <p className="mt-0.5 truncate text-sm text-stone-500" title={run.task_name}>
              {run.task_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-stone-700 px-2.5 py-1.5 text-xs text-stone-300 hover:bg-stone-900"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-6">
            <section className="grid gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                Overview
              </h3>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1">
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Status
                  </dt>
                  <dd>
                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                        jobRunStatusClass(run.status),
                      ].join(" ")}
                    >
                      {formatJobRunStatus(run.status)}
                    </span>
                  </dd>
                </div>
                <DetailField label="Trigger" value={formatJobRunTriggeredBy(run.triggered_by)} />
                <DetailField label="Queue" value={run.queue} />
                <DetailField label="Schedule" value={run.schedule_name} />
              </dl>
            </section>

            <section className="grid gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                Timing
              </h3>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DetailField label="Created" value={formatJobRunTimestamp(run.created_at)} />
                <DetailField label="Started" value={formatJobRunTimestamp(run.started_at)} />
                <DetailField label="Finished" value={formatJobRunTimestamp(run.finished_at)} />
                <DetailField
                  label="Duration"
                  value={formatJobRunDuration(run.started_at, run.finished_at)}
                />
              </dl>
            </section>

            <section className="grid gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                Execution
              </h3>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailField label="Run ID" value={run.id} />
                <DetailField label="Celery task ID" value={run.celery_task_id} />
                <DetailField label="Schedule ID" value={run.schedule_id} />
                <DetailField
                  label="User ID"
                  value={run.user_id !== null ? String(run.user_id) : null}
                />
              </dl>
            </section>

            <section className="grid gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                Data
              </h3>
              <dl className="grid gap-4">
                <JsonBlock label="Payload" value={run.payload} />
                <JsonBlock label="Result" value={run.result} />
                {run.error ? (
                  <div className="grid gap-1.5">
                    <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                      Error
                    </dt>
                    <dd>
                      <pre className="max-h-48 overflow-auto rounded-lg border border-red-950/60 bg-red-950/20 p-3 text-xs text-red-200">
                        {run.error}
                      </pre>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
