// 상금 = 해당 부문의 입금완료된 부문 참가비 합 × prizeRate (입장료 제외 — memory.md 참고)
// 주의: 부동소수점 오차 회피. sum * 0.35 는 7874.999... 처럼 어긋날 수 있으므로
// 비율을 정수 베이스(bps, 소수 4자리)로 바꿔 정수 연산 후 내림한다.
export function calcDivisionPrize(paidFees: number[], prizeRate: number): number {
  const sum = paidFees.reduce((s, v) => s + v, 0);
  const rateBps = Math.round(prizeRate * 10000); // 0.35 -> 3500
  return Math.floor((sum * rateBps) / 10000);
}
