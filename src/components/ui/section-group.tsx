export function SectionGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-[18px] last:mb-0">
      <div className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
        <span className="inline-block h-2 w-2 rounded-sm bg-accent" />
        {label}
      </div>
      {children}
    </div>
  );
}
