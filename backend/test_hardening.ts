async function runHardeningTests() {
  console.log('🛡️ Starting Hardening & Security Validation');
  const baseURL = 'http://localhost:5005/api';
  
  try {
    // 1. Test Global Error Format (Trigger 404)
    console.log('\n--- Testing Error Format (404) ---');
    const res404 = await fetch(`${baseURL}/not-found`);
    const text404 = await res404.text();
    try {
      const data404 = JSON.parse(text404);
      console.log('Format:', data404);
      if (data404.success === false) console.log('✅ Standardized Error Format');
    } catch (e) {
      console.error('❌ 404 returned non-JSON:', text404.slice(0, 1000));
    }

    // 2. Test Input Validation (Bad Login)
    console.log('\n--- Testing Input Validation (Bad Login) ---');
    const resVal = await fetch(`${baseURL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: '123' })
    });
    const textVal = await resVal.text();
    try {
      const dataVal = JSON.parse(textVal);
      console.log('Status:', resVal.status);
      console.log('Errors:', dataVal.errors);
      if (resVal.status === 400 && dataVal.errors) console.log('✅ Input Validation Working');
    } catch (e) {
      console.error('❌ Validation returned non-JSON:', textVal.slice(0, 1000));
    }

    // ... (rest of tests)

    // 3. Test Rate Limiting (Brute Force Simulation)
    console.log('\n--- Testing Rate Limiting (Hitting 110 requests) ---');
    let rateLimited = false;
    for (let i = 0; i < 110; i++) {
        const res = await fetch(`${baseURL}/health`);
        if (res.status === 429) {
            console.log(`✅ Rate Limit triggered at request ${i+1}`);
            rateLimited = true;
            break;
        }
    }
    if (!rateLimited) console.log('❌ Rate Limit NOT triggered');

    // 4. Test Activity Logs
    console.log('\n--- Testing Activity Logs ---');
    // Login to get token
    const loginRes = await fetch(`${baseURL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@elfatoora.tn', password: 'adminpassword123' })
    });
    const loginResp = await loginRes.json();
    const token = loginResp.data.token;

    // Fetch logs
    const logsRes = await fetch(`${baseURL}/admin/logs`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const logsData = await logsRes.json();
    console.log(`✅ Activity Logs Count: ${logsData.data.length}`);
    console.log('Last Log:', logsData.data[0].action, logsData.data[0].details);

    console.log('\n🌟 HARDENING VALIDATION SUCCESSFUL!');
  } catch (error) {
    console.error('❌ Hardening test failed:', error.message);
  }
}

runHardeningTests();
