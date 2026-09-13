import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(process.cwd(), '.env.local') });

import { getPool } from '../src/lib/db';

async function main() {
  const pool = getPool();
  const { rows } = await pool.query<{
    report_chapters: Array<{ chapterId: string; status: string }>;
  }>(
    `SELECT report_chapters FROM projects WHERE id = $1`,
    ['0dfd966b-3cda-48c5-a6bb-0fed656ceebc'],
  );
  const chapters = rows[0]?.report_chapters ?? [];
  console.log(
    chapters.map((c, i) => `${i + 1}. ${c.chapterId} (${c.status})`).join('\n'),
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
