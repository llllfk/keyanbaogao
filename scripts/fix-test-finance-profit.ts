import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(process.cwd(), '.env.local') });

import { getPool } from '../src/lib/db';
import { calculateFinanceV2 } from '../src/lib/finance/engine';

const PROJECT_ID = '0dfd966b-3cda-48c5-a6bb-0fed656ceebc';

async function main() {
  const input = {
    constructionInvestment: 28500,
    equityRatio: 0.3,
    loanAnnualRate: 0.035,
    constructionYears: 2,
    workingCapitalRate: 0.05,
    annualRevenue: 3200,
    annualOperatingCost: 860,
    operationYears: 20,
    discountRate: 0.06,
    notes:
      '测试数据：假设含道路附属经营/停车等收入口径，便于验证正利润与回收期（V2）。',
  };
  const result = calculateFinanceV2(input);
  const finance = {
    input,
    result,
    calculatedAt: new Date().toISOString(),
    skipped: false,
  };
  const pool = getPool();
  const res = await pool.query(
    `UPDATE projects SET finance = $1::jsonb, status = 'finance_done', updated_at = NOW() WHERE id = $2 RETURNING id`,
    [JSON.stringify(finance), PROJECT_ID],
  );
  if (res.rowCount !== 1) {
    throw new Error('项目未找到');
  }
  console.log(
    JSON.stringify(
      {
        calcVersion: result.calcVersion,
        annualRevenue: result.annualRevenue,
        annualOperatingCost: result.annualOperatingCost,
        annualProfitApprox: result.annualProfitApprox,
        simpleRoi: result.simpleRoi,
        staticPaybackYears: result.staticPaybackYears,
        projectIrr: result.projectIrr,
        projectNpv: result.projectNpv,
        totalInvestment: result.totalInvestment,
        yearCount: result.yearlyRows.length,
      },
      null,
      2,
    ),
  );
  await pool.end();
}

main().catch(async e => {
  console.error(e);
  try {
    await getPool().end();
  } catch {
    // ignore
  }
  process.exit(1);
});
