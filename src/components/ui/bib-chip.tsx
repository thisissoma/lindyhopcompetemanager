export function BibChip({ number }: { number: number | null }) {
  if (number == null) return <span className="text-xs text-muted">—</span>;
  return (
    <span className="rounded-lg bg-primary px-2 py-0.5 text-xs font-extrabold text-white">
      {number}
    </span>
  );
}
