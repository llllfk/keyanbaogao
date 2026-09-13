/**
 * 将「完整测试」项目刷新为财务 V2，并重渲染第 11 章附表。
 * pnpm exec tsx --tsconfig tsconfig.json scripts/refresh-full-test-finance-v2.ts
 */
import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(process.cwd(), '.env.local') });

import { getPool } from '../src/lib/db';
import {
  calculateFinanceV2,
  renderFinanceAttachmentTables,
  type FinanceInput,
} from '../src/lib/finance/engine';
import type { ReportChapter } from '../src/lib/project/schema';

const PROJECT_NAME = '【完整测试】郑州市金水区市政道路改扩建工程';

async function main() {
  const pool = getPool();
  const { rows } = await pool.query<{
    id: string;
    status: string;
    finance: {
      input?: Partial<FinanceInput>;
      result?: unknown;
      skipped?: boolean;
    } | null;
    report_chapters: ReportChapter[];
    basic_info: { operationPeriod?: string; constructionPeriod?: string };
  }>(
    `SELECT id, status, finance, report_chapters, basic_info
     FROM projects
     WHERE basic_info->>'name' = $1
     ORDER BY updated_at DESC
     LIMIT 1`,
    [PROJECT_NAME],
  );

  const project = rows[0];
  if (!project) {
    throw new Error(`未找到项目：${PROJECT_NAME}`);
  }

  const prev = project.finance?.input ?? {};
  const input: FinanceInput = {
    constructionInvestment:
      typeof prev.constructionInvestment === 'number' &&
      prev.constructionInvestment > 0
        ? prev.constructionInvestment
        : 28500,
    equityRatio:
      typeof prev.equityRatio === 'number' ? prev.equityRatio : 0.3,
    loanAnnualRate:
      typeof prev.loanAnnualRate === 'number' ? prev.loanAnnualRate : 0.035,
    constructionYears:
      typeof prev.constructionYears === 'number'
        ? prev.constructionYears
        : 2,
    workingCapitalRate:
      typeof prev.workingCapitalRate === 'number'
        ? prev.workingCapitalRate
        : 0.05,
    annualRevenue:
      typeof prev.annualRevenue === 'number' ? prev.annualRevenue : 3200,
    annualOperatingCost:
      typeof prev.annualOperatingCost === 'number'
        ? prev.annualOperatingCost
        : 860,
    operationYears:
      typeof prev.operationYears === 'number' ? prev.operationYears : 20,
    discountRate:
      typeof prev.discountRate === 'number' ? prev.discountRate : 0.06,
    notes:
      typeof prev.notes === 'string' && prev.notes.trim()
        ? prev.notes
        : '完整测试·V2：市政道路附带经营收入口径，用于验证分年现金流/IRR/NPV 与第 11 章程序表。',
  };

  const result = calculateFinanceV2(input);
  const finance = {
    input,
    result,
    calculatedAt: new Date().toISOString(),
    skipped: false,
  };

  const chapter11Content = renderFinanceAttachmentTables(result);
  const now = new Date().toISOString();
  let chapters = [...(project.report_chapters ?? [])];
  const idx = chapters.findIndex(
    item =>
      item.chapterId === '11' ||
      item.chapterId === '11.1' ||
      item.chapterId.startsWith('11'),
  );

  // 大纲里 noLlm 章通常是 11 或带子节点；按常见 id 更新
  const targetIds = new Set(
    chapters
      .filter(item => item.chapterId === '11' || item.chapterId.startsWith('11'))
      .map(item => item.chapterId),
  );

  if (targetIds.size === 0) {
    chapters.push({
      chapterId: '11',
      title: '研究结论及建议之外的附件清单章',
      content: chapter11Content,
      status: 'done',
      updatedAt: now,
    });
  } else {
    chapters = chapters.map(item => {
      if (!targetIds.has(item.chapterId)) {
        return item;
      }
      // 只重写带附表清单的章；若有多个 11.x，优先 11 / 11.1
      if (
        item.chapterId === '11' ||
        item.chapterId === '11.1' ||
        (targetIds.size === 1 && item.chapterId.startsWith('11'))
      ) {
        return {
          ...item,
          content: chapter11Content,
          status: 'done' as const,
          error: undefined,
          updatedAt: now,
        };
      }
      return item;
    });
  }

  // 若存在 11.1 附件清单节点则写到 11.1，否则写到任一 11* 且内容含附表的章
  const attachmentChapter =
    chapters.find(item => item.chapterId === '11.1') ??
    chapters.find(item => item.chapterId === '11') ??
    chapters.find(item => item.chapterId.startsWith('11'));

  if (attachmentChapter) {
    chapters = chapters.map(item =>
      item.chapterId === attachmentChapter.chapterId
        ? {
            ...item,
            content: chapter11Content,
            status: 'done' as const,
            updatedAt: now,
          }
        : item,
    );
  }

  await pool.query(
    `UPDATE projects
     SET finance = $1::jsonb,
         report_chapters = $2::jsonb,
         status = 'finance_done',
         updated_at = NOW()
     WHERE id = $3`,
    [JSON.stringify(finance), JSON.stringify(chapters), project.id],
  );

  console.log(
    JSON.stringify(
      {
        id: project.id,
        name: PROJECT_NAME,
        calcVersion: result.calcVersion,
        totalInvestment: result.totalInvestment,
        projectIrr: result.projectIrr,
        projectNpv: result.projectNpv,
        staticPaybackYears: result.staticPaybackYears,
        yearCount: result.yearlyRows.length,
        attachmentChapterId: attachmentChapter?.chapterId ?? null,
        urls: {
          finance: `http://localhost:5000/projects/${project.id}/finance`,
          report: `http://localhost:5000/projects/${project.id}/report`,
          outline: `http://localhost:5000/projects/${project.id}/outline`,
        },
      },
      null,
      2,
    ),
  );

  await pool.end();
}

main().catch(async error => {
  console.error(error instanceof Error ? error.message : error);
  try {
    await getPool().end();
  } catch {
    // ignore
  }
  process.exit(1);
});
