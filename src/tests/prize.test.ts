import { describe, it, expect } from 'vitest';
import { calcDivisionPrize } from '@/lib/prize';

describe('상금 계산', () => {
  it('부문 참가비 합의 비율만큼, 원 단위 내림', () => {
    expect(calcDivisionPrize([10000, 10000, 10000], 0.35)).toBe(10500);
    expect(calcDivisionPrize([7500, 7500, 7500], 0.35)).toBe(7875);
    expect(calcDivisionPrize([9999], 0.35)).toBe(3499); // floor
  });

  it('참가자가 없으면 0원', () => {
    expect(calcDivisionPrize([], 0.35)).toBe(0);
  });
});
