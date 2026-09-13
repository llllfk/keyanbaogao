require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const users = await pool.query(
    'SELECT id, email, tenant_id, name FROM users ORDER BY created_at',
  );
  console.log('users:', JSON.stringify(users.rows, null, 2));

  const projects = await pool.query(`
    SELECT p.id, p.status, p.basic_info->>'name' AS name, u.email,
           p.user_id, p.tenant_id
    FROM projects p
    JOIN users u ON u.id = p.user_id
    ORDER BY p.created_at DESC
  `);
  console.log('projects:', JSON.stringify(projects.rows, null, 2));

  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
