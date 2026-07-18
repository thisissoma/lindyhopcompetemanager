// 참가자·공개 대회 페이지의 상단 메뉴를 한 곳에서 정의 — 페이지마다 순서가 달라지지 않게.
export type MenuKey = 'info' | 'register' | 'participants' | 'my';

export function competitionMenu(slug: string, active: MenuKey) {
  return [
    { href: `/c/${slug}`, label: '대회 안내', active: active === 'info' },
    { href: `/c/${slug}/register`, label: '참가 신청', active: active === 'register' },
    { href: `/c/${slug}/participants`, label: '신청 현황', active: active === 'participants' },
    { href: '/my', label: '내 신청', active: active === 'my' },
  ];
}
