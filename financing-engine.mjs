export const FINANCING_CONFIG = Object.freeze({
  annualInterestRate: 0.045,
  maximumDebtRatio: 0.35,
  defaultDurationYears: 20,
  estimateMargin: 0.08,
  updatedAt: "2026-10-17"
});

export function calculateFinancingCapacity(input, config = FINANCING_CONFIG) {
  const income = Math.max(0, Number(input.income1 || 0) + Number(input.income2 || 0));
  const charges = Math.max(0, Number(input.charges || 0));
  const contribution = Math.max(0, Number(input.contribution || 0));
  const years = Math.max(1, Number(input.durationYears || config.defaultDurationYears));
  const monthlyPayment = Math.max(0, income * config.maximumDebtRatio - charges);
  const months = years * 12;
  const monthlyRate = config.annualInterestRate / 12;
  const borrowed = monthlyRate > 0
    ? monthlyPayment * (1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate
    : monthlyPayment * months;
  const central = Math.max(0, Math.round((borrowed + contribution) / 1000) * 1000);
  return {
    income,
    charges,
    contribution,
    years,
    monthlyPayment: Math.round(monthlyPayment),
    borrowed: Math.round(borrowed / 1000) * 1000,
    central,
    minimum: Math.max(0, Math.round(central * (1 - config.estimateMargin) / 1000) * 1000),
    maximum: Math.round(central * (1 + config.estimateMargin) / 1000) * 1000,
    annualInterestRate: config.annualInterestRate,
    maximumDebtRatio: config.maximumDebtRatio
  };
}
