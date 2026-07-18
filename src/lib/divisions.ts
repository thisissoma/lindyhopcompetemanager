const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// "2026-01-31" → "토요일 1/31". 유효한 YYYY-MM-DD가 아니면 원본 문자열 그대로.
export function formatEventDate(s: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return s;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  if (Number.isNaN(date.getTime())) return s;
  return `${WEEKDAYS[date.getDay()]}요일 ${Number(mo)}/${Number(d)}`;
}

export function groupDivisionsByDayVenue<
  T extends { eventDate: string; venue: string; sortOrder: number; id: number },
>(divisions: T[]): { key: string; label: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const d of divisions) {
    const key = `${d.eventDate}|${d.venue}`;
    (map.get(key) ?? map.set(key, []).get(key)!).push(d);
  }
  const groups = [...map.entries()].map(([key, items]) => {
    const [eventDate, venue] = key.split('|');
    const label = [formatEventDate(eventDate), venue].filter(Boolean).join(' · ') || '부문';
    items.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    return { key, label, items, eventDate, venue };
  });
  groups.sort((a, b) => a.eventDate.localeCompare(b.eventDate) || a.venue.localeCompare(b.venue));
  return groups.map(({ key, label, items }) => ({ key, label, items }));
}
