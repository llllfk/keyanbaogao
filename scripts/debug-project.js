require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const id = process.argv[2] || '841a6ae8-fdae-49aa-97dc-287eb379baa0';

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const r = await pool.query(
    `SELECT id, tenant_id, user_id, status,
            basic_info->>'name' AS name,
            basic_info->>'doFinancialAnalysis' AS fin,
            jsonb_typeof(basic_info) AS bi_type,
            basic_info ? 'doFinancialAnalysis' AS has_flag
     FROM projects WHERE id = $1`,
    [id],
  );
  console.log('project row:', JSON.stringify(r.rows, null, 2));

  if (r.rows[0]) {
    const full = await pool.query(`SELECT basic_info FROM projects WHERE id = $1`, [
      id,
    ]);
    const bi = full.rows[0].basic_info;
    console.log('keys:', Object.keys(bi || {}));
    console.log('doFinancialAnalysis raw:', bi?.doFinancialAnalysis, typeof bi?.doFinancialAnalysis);
  }

  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
