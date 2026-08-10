const CFP = "F CFP";

export function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function roundXpf(value) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value / 1000) * 1000;
}

export function formatXpf(value) {
  return `${roundXpf(value).toLocaleString("fr-FR")} ${CFP}`;
}

export function monthlyPaymentForPrincipal(principal, annualRate, years) {
  principal = toNumber(principal);
  annualRate = toNumber(annualRate);
  years = toNumber(years);
  const months = Math.round(years * 12);
  if (!principal || !months) return 0;
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return principal / months;
  return principal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -months)));
}

export function principalForMonthlyPayment(monthlyPayment, annualRate, years) {
  monthlyPayment = toNumber(monthlyPayment);
  annualRate = toNumber(annualRate);
  years = toNumber(years);
  const months = Math.round(years * 12);
  if (!monthlyPayment || !months) return 0;
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return monthlyPayment * months;
  return monthlyPayment * ((1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate);
}

export function estimateBorrowingCapacity(input = {}) {
  const income = toNumber(input.monthlyIncome) + toNumber(input.otherIncome);
  const debts = toNumber(input.monthlyDebts);
  const downPayment = toNumber(input.downPayment);
  const years = toNumber(input.years) || 20;
  const annualRate = toNumber(input.annualRate);
  const effortRate = toNumber(input.effortRate) || 0.35;
  const insuranceMonthly = toNumber(input.insuranceMonthly);
  const theoreticalPayment = income * effortRate;
  const availableMonthlyPayment = Math.max(0, theoreticalPayment - debts - insuranceMonthly);
  const borrowingCapacity = principalForMonthlyPayment(availableMonthlyPayment, annualRate, years);
  return {
    availableMonthlyPayment: roundXpf(availableMonthlyPayment),
    borrowingCapacity: roundXpf(borrowingCapacity),
    downPayment: roundXpf(downPayment),
    theoreticalBudgetBeforeFees: roundXpf(borrowingCapacity + downPayment),
    effortRate,
    annualRate,
    years
  };
}

export function estimateMonthlyPayment(input = {}) {
  const price = toNumber(input.price);
  const downPayment = toNumber(input.downPayment);
  const principal = Math.max(0, toNumber(input.principal) || price - downPayment);
  const years = toNumber(input.years) || 20;
  const annualRate = toNumber(input.annualRate);
  const monthlyPayment = monthlyPaymentForPrincipal(principal, annualRate, years);
  const totalPaid = monthlyPayment * years * 12;
  return {
    principal: roundXpf(principal),
    monthlyPayment: roundXpf(monthlyPayment),
    indicativeInterestCost: roundXpf(Math.max(0, totalPaid - principal)),
    annualRate,
    years
  };
}

export function estimateRentalYield(input = {}) {
  const purchasePrice = toNumber(input.purchasePrice);
  const monthlyRent = toNumber(input.monthlyRent);
  const annualOwnerCharges = toNumber(input.annualOwnerCharges);
  const annualTaxes = toNumber(input.annualTaxes);
  const works = toNumber(input.works);
  const totalCost = purchasePrice + works;
  const annualRent = monthlyRent * 12;
  const annualCharges = annualOwnerCharges + annualTaxes;
  const netAnnualIncome = Math.max(0, annualRent - annualCharges);
  return {
    annualRent: roundXpf(annualRent),
    annualCharges: roundXpf(annualCharges),
    grossYield: totalCost > 0 ? annualRent / totalCost : 0,
    netYield: totalCost > 0 ? netAnnualIncome / totalCost : 0,
    totalCost: roundXpf(totalCost)
  };
}

export function estimateSimpleBudget(input = {}) {
  const downPayment = toNumber(input.downPayment);
  const borrowingCapacity = toNumber(input.borrowingCapacity);
  return {
    downPayment: roundXpf(downPayment),
    borrowingCapacity: roundXpf(borrowingCapacity),
    theoreticalBudgetBeforeFees: roundXpf(downPayment + borrowingCapacity)
  };
}
