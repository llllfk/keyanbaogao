require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await pool.query(
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS deepseek_api_key_enc text',
  );
  console.log('OK deepseek_api_key_enc');
  await pool.end();
}

main().catch(error => {
  console.error('FAIL', error.message);
  process.exit(1);
});
