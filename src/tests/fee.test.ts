import { describe, it, expect } from 'vitest';
import { calcFee, FeeEntryInput } from '@/lib/fee';

const mnm = (over: Partial<FeeEntryInput> = {}): FeeEntryInput => ({
  divisionName: '린디 M&M', feePre: 10000, feeOnsite: 15000, kind: 'mnm',
  strictlyPayment: 'split', isStrictlyPayer: true, isOnsiteAddition: false, ...over,
});

describe('참가비 계산', () => {
  it('사전등록: 입장료 + 부문 사전요금', () => {
    const r = calcFee({ isOnsite: false, includeEntryFee: true, entryFeePre: 20000, entryFeeOnsite: 30000, entries: [mnm()] });
    expect(r.total).toBe(30000);
    expect(r.items).toEqual([
      { label: '입장료', amount: 20000 },
      { label: '린디 M&M', amount: 10000 },
    ]);
  });

  it('현장등록: 입장료와 부문 모두 현장요금', () => {
    const r = calcFee({ isOnsite: true, includeEntryFee: true, entryFeePre: 20000, entryFeeOnsite: 30000, entries: [mnm()] });
    expect(r.total).toBe(45000);
  });

  it('사전등록자의 현장 부문추가: 입장료 없이 해당 부문만 현장요금', () => {
    const r = calcFee({
      isOnsite: false, includeEntryFee: false, entryFeePre: 20000, entryFeeOnsite: 30000,
      entries: [mnm({ isOnsiteAddition: true })],
    });
    expect(r.total).toBe(15000);
  });

  it('strictly split: 1인당 반액(내림)', () => {
    const e = mnm({ divisionName: '스트릭틀리', kind: 'strictly', feePre: 15000 });
    const r = calcFee({ isOnsite: false, includeEntryFee: false, entryFeePre: 0, entryFeeOnsite: 0, entries: [e] });
    expect(r.total).toBe(7500);
  });

  it('strictly single: 내는 쪽은 전액, 안 내는 쪽은 0원', () => {
    const payer = mnm({ kind: 'strictly', strictlyPayment: 'single', feePre: 15000 });
    const nonPayer = { ...payer, isStrictlyPayer: false };
    const base = { isOnsite: false, includeEntryFee: false, entryFeePre: 0, entryFeeOnsite: 0 };
    expect(calcFee({ ...base, entries: [payer] }).total).toBe(15000);
    expect(calcFee({ ...base, entries: [nonPayer] }).total).toBe(0);
  });

  it('여러 부문 합산', () => {
    const r = calcFee({
      isOnsite: false, includeEntryFee: true, entryFeePre: 20000, entryFeeOnsite: 30000,
      entries: [mnm(), mnm({ divisionName: '솔로재즈', kind: 'solo', feePre: 5000 })],
    });
    expect(r.total).toBe(35000);
  });
});
