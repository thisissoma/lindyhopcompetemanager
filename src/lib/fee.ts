export type FeeEntryInput = {
  divisionName: string;
  feePre: number;
  feeOnsite: number;
  kind: 'mnm' | 'strictly' | 'solo' | 'team';
  strictlyPayment: 'single' | 'split';
  isStrictlyPayer: boolean;
  isOnsiteAddition: boolean;
};

export type FeeInput = {
  isOnsite: boolean;
  includeEntryFee: boolean;
  entryFeePre: number;
  entryFeeOnsite: number;
  entries: FeeEntryInput[];
};

export type FeeItem = { label: string; amount: number };

export function calcFee(input: FeeInput): { items: FeeItem[]; total: number } {
  const items: FeeItem[] = [];
  if (input.includeEntryFee) {
    items.push({ label: '입장료', amount: input.isOnsite ? input.entryFeeOnsite : input.entryFeePre });
  }
  for (const e of input.entries) {
    const onsite = input.isOnsite || e.isOnsiteAddition;
    let amount = onsite ? e.feeOnsite : e.feePre;
    if (e.kind === 'strictly') {
      if (e.strictlyPayment === 'split') amount = Math.floor(amount / 2);
      else if (!e.isStrictlyPayer) amount = 0;
    }
    items.push({ label: e.divisionName, amount });
  }
  return { items, total: items.reduce((s, i) => s + i.amount, 0) };
}
