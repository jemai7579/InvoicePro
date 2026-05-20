/* eslint-disable no-console */
const http = require('http');
const https = require('https');

const baseUrl = process.env.ADMIN_SMOKE_BASE_URL || 'http://localhost:5005/api';
const email = process.env.ADMIN_SMOKE_EMAIL || 'admin@invoicepro.tn';
const password = process.env.ADMIN_SMOKE_PASSWORD || 'adminpassword123';
const allowMutation = process.env.ADMIN_SMOKE_MUTATE === '1';

const request = (method, path, body, token) =>
  new Promise((resolve) => {
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${normalizedBase}${normalizedPath}`);
    const transport = url.protocol === 'https:' ? https : http;
    const payload = body ? JSON.stringify(body) : null;
    const req = transport.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );
    req.on('error', (error) => resolve({ status: 0, error: error.message }));
    if (payload) req.write(payload);
    req.end();
  });

const checks = [];
const check = async (label, fn) => {
  const result = await fn();
  checks.push({ label, ...result });
  const ok = result.ok ? 'PASS' : 'FAIL';
  console.log(`${ok} ${label}${result.detail ? ` - ${result.detail}` : ''}`);
};

async function main() {
  let token = '';
  let firstCompanyId = '';

  await check('admin login endpoint', async () => {
    const res = await request('POST', '/admin/login', { email, password });
    token = res.body?.token || res.body?.data?.token;
    return { ok: res.status === 200 && Boolean(token), detail: `status=${res.status}` };
  });

  await check('admin profile requires token', async () => {
    const res = await request('GET', '/admin/profile');
    return { ok: res.status === 401, detail: `status=${res.status}` };
  });

  await check('admin profile accepts token', async () => {
    const res = await request('GET', '/admin/profile', null, token);
    return { ok: res.status === 200, detail: `status=${res.status}` };
  });

  await check('admin overview requires token', async () => {
    const res = await request('GET', '/admin/overview');
    return { ok: res.status === 401, detail: `status=${res.status}` };
  });

  await check('admin companies requires token', async () => {
    const res = await request('GET', '/admin/companies');
    return { ok: res.status === 401, detail: `status=${res.status}` };
  });

  await check('admin subscriptions requires token', async () => {
    const res = await request('GET', '/admin/subscriptions');
    return { ok: res.status === 401, detail: `status=${res.status}` };
  });

  await check('admin payments requires token', async () => {
    const res = await request('GET', '/admin/payments');
    return { ok: res.status === 401, detail: `status=${res.status}` };
  });

  await check('system health requires token', async () => {
    const res = await request('GET', '/admin/system-health');
    return { ok: res.status === 401, detail: `status=${res.status}` };
  });

  await check('admin companies accepts token', async () => {
    const res = await request('GET', '/admin/companies', null, token);
    firstCompanyId = Array.isArray(res.body?.data) ? res.body.data[0]?.id : res.body?.[0]?.id;
    return { ok: res.status === 200, detail: `status=${res.status}, firstCompany=${firstCompanyId || 'none'}` };
  });

  await check('company status update requires admin token', async () => {
    if (!firstCompanyId) return { ok: true, detail: 'skipped: no company in database' };
    const res = await request('PUT', `/admin/companies/${firstCompanyId}/status`, { status: 'active' });
    return { ok: res.status === 401, detail: `status=${res.status}` };
  });

  await check('dossier status update requires admin token', async () => {
    if (!firstCompanyId) return { ok: true, detail: 'skipped: no company in database' };
    const res = await request('PUT', `/admin/companies/${firstCompanyId}/dossier-status`, { dossierStatus: 'pending_review' });
    return { ok: res.status === 401, detail: `status=${res.status}` };
  });

  if (allowMutation && firstCompanyId) {
    await check('company status update accepts admin token', async () => {
      const res = await request('PUT', `/admin/companies/${firstCompanyId}/status`, { status: 'active', note: 'admin smoke test' }, token);
      return { ok: res.status === 200, detail: `status=${res.status}` };
    });
    await check('dossier status update accepts admin token', async () => {
      const res = await request('PUT', `/admin/companies/${firstCompanyId}/dossier-status`, { dossierStatus: 'pending_review', note: 'admin smoke test' }, token);
      return { ok: res.status === 200, detail: `status=${res.status}` };
    });
  } else {
    console.log('SKIP authenticated mutation checks - set ADMIN_SMOKE_MUTATE=1 to enable safe local mutation checks.');
  }

  const failed = checks.filter((item) => !item.ok);
  console.log(`\nAdmin smoke result: ${checks.length - failed.length}/${checks.length} checks passed.`);
  if (failed.length > 0) process.exitCode = 1;
}

main();
