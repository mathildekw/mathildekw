import assert from "node:assert/strict";
import {
  estimateBorrowingCapacity,
  estimateMonthlyPayment,
  estimateRentalYield,
  estimateSimpleBudget,
  monthlyPaymentForPrincipal,
  principalForMonthlyPayment
} from "../finance-calculators.js";

function near(actual, expected, tolerance = 1500) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} not near ${expected}`);
}

near(monthlyPaymentForPrincipal(20000000, 0.045, 20), 126530);
near(principalForMonthlyPayment(126530, 0.045, 20), 20000000, 2500);

assert.equal(monthlyPaymentForPrincipal(12000000, 0, 10), 100000);
assert.equal(principalForMonthlyPayment(100000, 0, 10), 12000000);

const capacity = estimateBorrowingCapacity({
  monthlyIncome: 500000,
  otherIncome: 50000,
  monthlyDebts: 60000,
  downPayment: 3000000,
  years: 20,
  annualRate: 0.045,
  effortRate: 0.35
});
assert.equal(capacity.availableMonthlyPayment, 133000);
assert.ok(capacity.borrowingCapacity > 20000000);
assert.equal(capacity.downPayment, 3000000);

const noCapacity = estimateBorrowingCapacity({
  monthlyIncome: 200000,
  monthlyDebts: 120000,
  years: 20,
  annualRate: 0.045
});
assert.equal(noCapacity.availableMonthlyPayment, 0);
assert.equal(noCapacity.borrowingCapacity, 0);

const monthly = estimateMonthlyPayment({
  price: 37000000,
  downPayment: 7000000,
  annualRate: 0.045,
  years: 20
});
assert.equal(monthly.principal, 30000000);
assert.ok(monthly.monthlyPayment > 180000);
assert.ok(monthly.indicativeInterestCost > 10000000);

const rental = estimateRentalYield({
  purchasePrice: 37000000,
  monthlyRent: 180000,
  annualOwnerCharges: 240000,
  annualTaxes: 60000,
  works: 1000000
});
assert.equal(rental.annualRent, 2160000);
assert.equal(rental.annualCharges, 300000);
assert.ok(rental.grossYield > 0.05);
assert.ok(rental.netYield > 0.04);

const budget = estimateSimpleBudget({ downPayment: 5000000, borrowingCapacity: 25000000 });
assert.equal(budget.theoreticalBudgetBeforeFees, 30000000);

console.log("finance-calculators: ok");
