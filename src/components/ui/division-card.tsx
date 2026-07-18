import { Card } from './card';
import { Tag } from './tag';

const KIND_LABEL: Record<string, string> = { mnm: 'M&M', strictly: 'Strictly', solo: '솔로', team: '팀' };

export function DivisionCard({
  name,
  kind,
  meta,
  fee,
  selected = false,
  onClick,
  children,
}: {
  name: string;
  kind: string;
  meta?: string;
  fee?: number;
  selected?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Card selected={selected} accent className="mb-2.5 last:mb-0">
      <div className={`flex items-center gap-3 p-3.5 ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
        {onClick && (
          <span
            className={`h-[18px] w-[18px] flex-none rounded-[5px] border-2 ${
              selected ? 'border-accent bg-accent' : 'border-primary'
            } flex items-center justify-center text-xs text-white`}
          >
            {selected ? '✓' : ''}
          </span>
        )}
        <span className="min-w-0">
          <span className="font-bold">{name}</span>
          {meta && <span className="ml-1 text-[11px] text-muted">{meta}</span>}
        </span>
        <span className="ml-auto flex items-center gap-2">
          <Tag>{KIND_LABEL[kind] ?? kind}</Tag>
          {fee != null && <span className="whitespace-nowrap font-bold text-ink">{fee.toLocaleString()}원</span>}
        </span>
      </div>
      {selected && children && (
        <div className="flex flex-wrap items-center gap-2.5 border-t border-accent/25 p-3.5">{children}</div>
      )}
    </Card>
  );
}
