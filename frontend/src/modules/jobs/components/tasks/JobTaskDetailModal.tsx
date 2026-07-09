// keel_web/src/modules/jobs/components/tasks/JobTaskDetailModal.tsx

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";

import type { JobTask, JobTaskKwargSpec } from "../../api";
import {
  buildJobRunsFilterHref,
  formatJobTaskSchedulable,
  jobTaskSchedulableClass,
} from "../../lib/jobTaskDisplay";

type JobTaskDetailModalProps = {
  task: JobTask;
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

function KwargRow({ spec }: { spec: JobTaskKwargSpec }) {
  const defaultValue = spec.default?.trim() ? spec.default : "—";
  const description = spec.description?.trim() ? spec.description : "—";

  return (
    <tr className="border-b border-stone-800/80 last:border-b-0">
      <td className="px-3 py-2.5 text-sm text-stone-200">{spec.name}</td>
      <td className="px-3 py-2.5 text-sm text-stone-400">{spec.type}</td>
      <td className="px-3 py-2.5 text-sm text-stone-400">{defaultValue}</td>
      <td className="px-3 py-2.5 text-sm text-stone-400">{description}</td>
    </tr>
  );
}

export function JobTaskDetailModal({ task, onClose }: JobTaskDetailModalProps) {
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
        aria-labelledby="job-task-detail-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-stone-800 bg-stone-950 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-800 px-5 py-4">
          <div className="min-w-0">
            <h2 id="job-task-detail-title" className="truncate text-lg font-medium text-stone-100">
              {task.label}
            </h2>
            <p className="mt-0.5 truncate text-sm text-stone-500" title={task.task_name}>
              {task.task_name}
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
              <dl className="grid gap-4">
                <DetailField label="Description" value={task.description} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailField label="Queue" value={task.queue} />
                  <div className="grid gap-1">
                    <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                      Schedulable
                    </dt>
                    <dd>
                      <span
                        className={[
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                          jobTaskSchedulableClass(task.schedulable),
                        ].join(" ")}
                      >
                        {formatJobTaskSchedulable(task.schedulable)}
                      </span>
                    </dd>
                  </div>
                </div>
              </dl>
            </section>

            <section className="grid gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                Arguments
              </h3>
              {task.kwargs.length === 0 ? (
                <p className="text-sm text-stone-500">None</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-stone-800">
                  <table className="min-w-full text-left">
                    <thead className="border-b border-stone-800 bg-stone-950/60">
                      <tr>
                        <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-stone-500">
                          Name
                        </th>
                        <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-stone-500">
                          Type
                        </th>
                        <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-stone-500">
                          Default
                        </th>
                        <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-stone-500">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {task.kwargs.map((spec) => (
                        <KwargRow key={spec.name} spec={spec} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div className="border-t border-stone-800 pt-4">
              <Link
                to={buildJobRunsFilterHref(task.task_name)}
                className="text-sm text-sky-400 hover:text-sky-300"
                onClick={onClose}
              >
                View runs for this task
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
