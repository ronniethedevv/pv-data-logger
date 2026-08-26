type EmptyStateProps = {
  title: string;
  detail?: string;
};

/**
 * Shown when a fetch succeeded but returned no readings. Distinct from the
 * loading skeletons so an empty data source never looks like a hung page.
 */
export function EmptyState({ title, detail }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-6 py-16 text-center">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {detail ? <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{detail}</p> : null}
    </div>
  );
}
