/**
 * 将完整测试项目的 report_chapters 重排为大纲正文顺序。
 */
import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(process.cwd(), '.env.local') });

import { getPool } from '../src/lib/db';
import { sortChaptersForDocument } from '../src/lib/project/outline';
import type { ReportChapter } from '../src/lib/project/schema';

const PROJECT_ID = '0dfd966b-3cda-48c5-a6bb-0fed656ceebc';

async function main() {
  const pool = getPool();
  const { rows } = await pool.query<{
    report_chapters: ReportChapter[];
    outline_config: { outlineId?: string } | null;
  }>(`SELECT report_chapters, outline_config FROM projects WHERE id = $1`, [
    PROJECT_ID,
  ]);
  const row = rows[0];
  if (!row) {
    throw new Error('项目不存在');
  }
  const before = (row.report_chapters ?? []).map(c => c.chapterId);
  const sorted = sortChaptersForDocument(
    row.report_chapters ?? [],
    row.outline_config?.outlineId,
  );
  const after = sorted.map(c => c.chapterId);
  await pool.query(
    `UPDATE projects SET report_chapters = $1::jsonb, updated_at = NOW() WHERE id = $2`,
    [JSON.stringify(sorted), PROJECT_ID],
  );
  console.log('before:', before.join(' → '));
  console.log('after: ', after.join(' → '));
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
