const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const base = process.env.APP_BASE || 'http://localhost:5000';
  const email = process.env.TEST_EMAIL || 'admin@keyan.local';
  const password = process.env.TEST_PASSWORD || process.argv[2];
  if (!password) {
    console.error('Usage: node scripts/probe-basic.js <password>');
    process.exit(1);
  }

  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const loginBody = await loginRes.text();
  console.log('login', loginRes.status, loginBody.slice(0, 200));
  const cookie = loginRes.headers.getSetCookie?.() || [];
  const cookieHeader = cookie.map(c => c.split(';')[0]).join('; ');
  console.log('cookie', cookieHeader.slice(0, 80));

  const id = '841a6ae8-fdae-49aa-97dc-287eb379baa0';
  const apiRes = await fetch(`${base}/api/projects/${id}`, {
    headers: { Cookie: cookieHeader },
  });
  const apiText = await apiRes.text();
  console.log('api', apiRes.status, apiText.slice(0, 300));

  const pageRes = await fetch(`${base}/projects/${id}/basic`, {
    headers: { Cookie: cookieHeader },
    redirect: 'manual',
  });
  const pageText = await pageRes.text();
  console.log('page', pageRes.status, pageRes.headers.get('location'));
  console.log('page title match', /404|信息采集|可研/.exec(pageText)?.[0]);
  fs.writeFileSync('tmp-basic-probe.html', pageText.slice(0, 5000));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
