import { describe, it, expect } from 'vitest';
import { groupDivisionsByDayVenue } from '@/lib/divisions';

const d = (over: Partial<{ id: number; eventDate: string; venue: string; sortOrder: number }>) => ({
  id: 0, eventDate: '', venue: '', sortOrder: 0, ...over,
});

describe('부문 그룹핑', () => {
  it('요일·장소로 묶고 그룹/내부를 정렬한다', () => {
    const groups = groupDivisionsByDayVenue([
      d({ id: 2, eventDate: '2026-02-01', venue: '타임바', sortOrder: 1 }),
      d({ id: 1, eventDate: '2026-01-31', venue: '해피홀', sortOrder: 0 }),
      d({ id: 3, eventDate: '2026-02-01', venue: '타임바', sortOrder: 0 }),
    ]);
    expect(groups.map((g) => g.label)).toEqual(['토요일 1/31 · 해피홀', '일요일 2/1 · 타임바']);
    expect(groups[1].items.map((x) => x.id)).toEqual([3, 2]); // sortOrder 오름차순
  });

  it('요일·장소가 모두 비면 단일 그룹 label은 "부문"', () => {
    const groups = groupDivisionsByDayVenue([d({ id: 1 }), d({ id: 2 })]);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('부문');
    expect(groups[0].items.map((x) => x.id)).toEqual([1, 2]);
  });

  it('하나만 있으면 있는 값만 label', () => {
    const groups = groupDivisionsByDayVenue([d({ id: 1, venue: '해피홀' })]);
    expect(groups[0].label).toBe('해피홀');
  });
});
