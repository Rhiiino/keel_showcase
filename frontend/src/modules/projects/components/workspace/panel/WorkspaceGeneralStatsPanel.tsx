// keel_web/src/modules/projects/components/workspace/panel/WorkspaceGeneralStatsPanel.tsx

// Compact project overview stats for the workspace General tab.

type WorkspaceGeneralStatsPanelProps = {
  canvasCount: number;
  noteCount: number;
  fileCount: number;
  loading?: boolean;
};

type StatItem = {
  label: string;
  value: number;
};

function StatRow({ label, value }: StatItem) {
  return (
    <div className="flex items-center justify-between gap-3 px-2.5 py-1.5">
      <dt className="text-[11px] text-stone-500">{label}</dt>
      <dd className="text-[11px] font-medium tabular-nums text-stone-300">{value.toLocaleString()}</dd>
    </div>
  );
}

function StatRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 px-2.5 py-1.5">
      <div className="h-2.5 w-14 animate-pulse rounded bg-stone-800/70" />
      <div className="h-2.5 w-5 animate-pulse rounded bg-stone-800/60" />
    </div>
  );
}

export function WorkspaceGeneralStatsPanel({
  canvasCount,
  noteCount,
  fileCount,
  loading = false,
}: WorkspaceGeneralStatsPanelProps) {
  const stats: StatItem[] = [
    { label: "Canvases", value: canvasCount },
    { label: "Notes", value: noteCount },
    { label: "Files", value: fileCount },
  ];

  return (
    <section className="space-y-2" aria-label="Project overview">
      <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500">
        Overview
      </span>
      <dl className="divide-y divide-stone-800/60 rounded-lg border border-stone-800/70 bg-stone-950/40">
        {loading
          ? stats.map((stat) => <StatRowSkeleton key={stat.label} />)
          : stats.map((stat) => <StatRow key={stat.label} {...stat} />)}
      </dl>
    </section>
  );
}
