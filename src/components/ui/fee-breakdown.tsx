export function FeeBreakdown({ items, total }: { items: { label: string; amount: number }[]; total: number }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface p-4">
      <ul className="flex flex-col gap-1 text-sm text-muted">
        {items.map((it, i) => (
          <li key={i} className="flex justify-between">
            <span>{it.label}</span>
            <span>{it.amount.toLocaleString()}원</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex justify-between border-t border-border pt-2 text-[15px] font-extrabold text-primary">
        <span>예상 합계</span>
        <span>{total.toLocaleString()}원</span>
      </div>
    </div>
  );
}
