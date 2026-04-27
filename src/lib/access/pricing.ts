export type AccessPricingPlanLike = {
  fixedPriceCents: number | null;
  fractionMinutes: number | null;
  pricePerFractionCents: number | null;
  graceMinutes: number | null;
  dailyMaxCents: number | null;
};

export function calculateChargeCents(params: {
  entryAt: Date;
  exitAt: Date;
  plan: AccessPricingPlanLike | null;
}): number {
  const { entryAt, exitAt, plan } = params;
  if (!plan) return 0;

  if (plan.fixedPriceCents != null && plan.fixedPriceCents > 0) return Math.trunc(plan.fixedPriceCents);

  const ms = Math.max(0, exitAt.getTime() - entryAt.getTime());
  const minutes = Math.ceil(ms / 60000);
  const grace = Math.max(0, plan.graceMinutes ?? 0);
  const billableMinutes = Math.max(0, minutes - grace);

  const fractionMinutes = Math.max(1, plan.fractionMinutes ?? 60);
  const pricePerFraction = Math.max(0, plan.pricePerFractionCents ?? 0);
  const fractions = Math.ceil(billableMinutes / fractionMinutes);
  let total = fractions * pricePerFraction;

  const max = plan.dailyMaxCents ?? null;
  if (max != null && max > 0) total = Math.min(total, max);

  return Math.trunc(Math.max(0, total));
}

