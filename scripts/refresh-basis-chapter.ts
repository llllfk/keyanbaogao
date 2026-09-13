/**
 * 按当前勾选依据重渲染项目 1.3 章（每条一行）。
 * pnpm exec tsx --tsconfig tsconfig.json scripts/refresh-basis-chapter.ts --id=...
 */
import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(process.cwd(), '.env.local') });

import { getPool } from '../src/lib/db';
import { renderBasisChapter } from '../src/lib/project/generate';
import type { BasisItem, ReportChapter } from '../src/lib/project/schema';

function argValue(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  const hit = process.argv.find(arg => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : fallback;
}

async function main() {
  const id = argValue('id', '0dfd966b-3cda-48c5-a6bb-0fed656ceebc');
  const pool = getPool();
  const { rows } = await pool.query<{
    basis_items: BasisItem[];
    report_chapters: ReportChapter[];
  }>(`SELECT basis_items, report_chapters FROM projects WHERE id = $1`, [id]);

  const row = rows[0];
  if (!row) {
    throw new Error('项目不存在');
  }

  const content = renderBasisChapter(row.basis_items ?? []);
  const chapters = (row.report_chapters ?? []).map(chapter =>
    chapter.chapterId === '1.3'
      ? {
          ...chapter,
          content,
          status: 'done' as const,
          error: undefined,
          updatedAt: new Date().toISOString(),
        }
      : chapter,
  );

  if (!chapters.some(chapter => chapter.chapterId === '1.3')) {
    chapters.push({
      chapterId: '1.3',
      title: '编制依据',
      content,
      status: 'done',
      updatedAt: new Date().toISOString(),
    });
  }

  await pool.query(
    `UPDATE projects SET report_chapters = $1::jsonb, updated_at = NOW() WHERE id = $2`,
    [JSON.stringify(chapters), id],
  );

  console.log('OK refreshed 1.3:\n');
  console.log(content);
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
