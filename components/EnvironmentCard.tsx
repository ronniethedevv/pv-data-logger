type EnvironmentCardProps = {
  label: string;
  /** Two side-by-side sub-readings, e.g. temperature + humidity. */
  primary: { value: number; unit: string; caption: string };
  secondary: { value: number; unit: string; caption: string };
};

/** A card showing two related environment readings side by side. */
export function EnvironmentCard({ label, primary, secondary }: EnvironmentCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>

      <div className="mt-3 flex items-start gap-8">
        <Reading {...primary} />
        <div className="h-10 w-px self-center bg-slate-100" aria-hidden />
        <Reading {...secondary} />
      </div>
    </div>
  );
}

function Reading({ value, unit, caption }: { value: number; unit: string; caption: string }) {
  return (
    <div>
      <div className="flex items-baseline">
        <span key={value} className="value-fade text-3xl font-semibold tabular-nums text-slate-900">
          {value.toFixed(1)}
        </span>
        <span className="ml-1 text-sm text-slate-500">{unit}</span>
      </div>
      <p className="mt-1 text-xs text-slate-400">{caption}</p>
    </div>
  );
}
