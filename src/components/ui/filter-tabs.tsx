'use client';
export function FilterTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`rounded-lg border px-2.5 py-1 ${
            value === t.value ? 'border-primary bg-primary text-white' : 'border-border bg-surface text-ink'
          }`}
        >
          {t.label}
          {t.count != null && <span className="ml-1 opacity-70">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
