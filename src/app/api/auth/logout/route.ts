import { NextResponse } from 'next/server';

export async function POST() {
  // 상대경로 Location으로 리다이렉트. req.url 기반 절대경로는 프록시(Railway) 뒤에서
  // 내부 호스트(localhost)로 잡혀 엉뚱한 곳으로 넘어가는 문제가 있음. 브라우저가 현재 도메인 기준으로 해석.
  const res = new NextResponse(null, { status: 303, headers: { Location: '/' } });
  res.cookies.set('session', '', { maxAge: 0, path: '/' });
  return res;
}
