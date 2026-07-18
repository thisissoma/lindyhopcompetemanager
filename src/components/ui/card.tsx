export function Card({
  selected = false,
  accent = false,
  className = '',
  children,
}: {
  selected?: boolean;
  accent?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const base = 'rounded-[10px] border overflow-hidden bg-surface border-border';
  // 왼쪽 강조바 색은 명확히 하나만: 선택 시 accent(오렌지), 아니면 primary(그린).
  const accentBar = accent ? (selected ? 'border-l-4 border-l-accent' : 'border-l-4 border-l-primary') : '';
  const sel = selected ? 'bg-soft border-accent' : '';
  return <div className={`${base} ${accentBar} ${sel} ${className}`}>{children}</div>;
}

export function CardBody({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`p-3.5 ${className}`}>{children}</div>;
}
