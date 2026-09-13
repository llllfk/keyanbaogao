/**
 * 财务引擎冒烟：V1 摘要口径 + V2 分年/IRR
 * pnpm exec tsx scripts/test-finance-engine.ts
 */
import {
  calculateFinanceV2,
  irrOfCashFlows,
  npvOfCashFlows,
  parseConstructionYears,
} from '../src/lib/finance/engine';

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    throw new Error(msg);
  }
}

const result = calculateFinanceV2({
  constructionInvestment: 10000,
  equityRatio: 0.4,
  loanAnnualRate: 0.04,
  constructionYears: 2,
  workingCapitalRate: 0.05,
  annualRevenue: 3500,
  annualOperatingCost: 800,
  operationYears: 15,
  discountRate: 0.06,
  notes: '',
});

// 建设期利息 = 10000 * 0.6 * 0.04 * 2 * 0.5 = 240
assert(result.interestDuringConstruction === 240, 'interest');
assert(result.workingCapital === 500, 'working capital');
assert(result.totalInvestment === 10740, 'total');
assert(result.equityAmount === 4296, 'equity');
assert(result.debtAmount === 6444, 'debt');
assert(result.annualProfitApprox === 2700, 'profit');
assert(result.calcVersion === 'V2', 'version');
assert(result.yearlyRows.length === 17, `years got ${result.yearlyRows.length}`);

const principalSum = result.yearlyRows.reduce(
  (sum, row) => sum + row.principalRepay,
  0,
);
assert(
  Math.abs(principalSum - result.debtAmount) < 0.05,
  `principal sum ${principalSum} vs debt ${result.debtAmount}`,
);

assert(result.projectIrr !== null && (result.projectIrr ?? 0) > 0, 'irr positive');
assert(result.projectNpv !== null && (result.projectNpv ?? 0) > 0, 'npv positive');
assert(result.staticPaybackYears !== null, 'payback');

const cfs = result.yearlyRows.map(row => row.netCashFlow);
assert(
  Math.abs(npvOfCashFlows(cfs, 0.06) - (result.projectNpv ?? 0)) < 0.02,
  'npv match',
);
const irr = irrOfCashFlows(cfs);
assert(irr !== null && Math.abs((irr ?? 0) - (result.projectIrr ?? 0)) < 0.001, 'irr match');

assert(parseConstructionYears('24个月') === 2, 'months');
assert(parseConstructionYears('1.5年') === 1.5, 'years');

console.log('finance engine ok', {
  version: result.calcVersion,
  irr: result.projectIrr,
  npv: result.projectNpv,
  payback: result.staticPaybackYears,
});
