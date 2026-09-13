/**
 * 修正测试项目：政策组勿全选，恢复「核心默认勾选」逻辑。
 * pnpm exec tsx --tsconfig tsconfig.json scripts/fix-test-basis-selection.ts
 */
import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(process.cwd(), '.env.local') });

import { getPool } from '../src/lib/db';

const PROJECT_ID = '0dfd966b-3cda-48c5-a6bb-0fed656ceebc';

const CORE_PATTERNS = [
  '政府投资条例',
  '可行性研究报告编写通用大纲',
  '发改投资规〔2023〕304号',
  '304号',
] as const;

function shouldAutoSelect(title: string, docCode: string): boolean {
  const hay = `${docCode} ${title}`;
  return CORE_PATTERNS.some(pattern => hay.includes(pattern));
}

async function main() {
  const pool = getPool();
  const { rows } = await pool.query<{
    basis_items: Array<{
      id: string;
      group: string;
      title: string;
      docCode?: string;
      selected: boolean;
      source?: string;
    }>;
  }>(`SELECT basis_items FROM projects WHERE id = $1`, [PROJECT_ID]);

  const items = rows[0]?.basis_items;
  if (!items) {
    throw new Error('项目不存在');
  }

  const next = items.map(item => {
    if (item.group === 'project' || item.source === 'manual') {
      return { ...item, selected: true };
    }
    return {
      ...item,
      selected: shouldAutoSelect(item.title, item.docCode ?? ''),
    };
  });

  await pool.query(
    `UPDATE projects SET basis_items = $1::jsonb, updated_at = NOW() WHERE id = $2`,
    [JSON.stringify(next), PROJECT_ID],
  );

  const summary = {
    policy: next.filter(i => i.group === 'policy').length,
    policySelected: next.filter(i => i.group === 'policy' && i.selected).length,
    standard: next.filter(i => i.group === 'standard').length,
    standardSelected: next.filter(i => i.group === 'standard' && i.selected)
      .length,
    projectSelected: next.filter(i => i.group === 'project' && i.selected)
      .length,
  };
  console.log('OK fixed basis selection', summary);
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
