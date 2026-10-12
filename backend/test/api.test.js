const assert = require('assert');
const http = require('http');
const app = require('../src/server');

const PORT = 5099;
let server;
let baseUrl = `http://localhost:${PORT}/api`;
let authToken = '';
let testPatientId = '';
let testMedicationId = '';

async function runTests() {
  console.log('🚀 Starting Backend Integration Tests...');

  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });

  try {
    // 1. Healthcheck
    console.log('1️⃣ Testing /api/health...');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthData.status, 'ok');
    console.log('   ✅ Healthcheck passed.');

    // 2. Auth - Login Demo Patient
    console.log('2️⃣ Testing /api/auth/login (Demo Patient)...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'arthur@example.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginData.success, true);
    assert.ok(loginData.token);
    assert.strictEqual(loginData.user.email, 'arthur@example.com');
    authToken = loginData.token;
    testPatientId = loginData.user.id;
    console.log('   ✅ Patient login passed. User:', loginData.user.name);

    // 3. Medications - Fetch patient's medications
    console.log('3️⃣ Testing GET /api/medications...');
    const medsRes = await fetch(`${baseUrl}/medications`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const medsData = await medsRes.json();
    assert.strictEqual(medsRes.status, 200);
    assert.ok(medsData.medications.length >= 3);
    console.log(`   ✅ Fetched ${medsData.medications.length} medications with active schedules.`);

    // 4. Medications - Create a new medication
    console.log('4️⃣ Testing POST /api/medications...');
    const createMedRes = await fetch(`${baseUrl}/medications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: 'Vitamin D3 Drops',
        dosage: '1000 IU (2 drops)',
        form: 'drops',
        color: '#10B981',
        foodInstruction: 'with_meal',
        instructions: 'Take with morning breakfast',
        currentStock: 60,
        totalQuantity: 60,
        refillThreshold: 10,
        times: ['09:00']
      })
    });
    const createMedData = await createMedRes.json();
    assert.strictEqual(createMedRes.status, 201);
    assert.strictEqual(createMedData.success, true);
    assert.strictEqual(createMedData.medication.name, 'Vitamin D3 Drops');
    assert.strictEqual(createMedData.medication.schedules.length, 1);
    testMedicationId = createMedData.medication.id;
    console.log('   ✅ Created medication ID:', testMedicationId);

    // 5. Schedules - Get Today's Doses
    console.log('5️⃣ Testing GET /api/schedules/today...');
    const todayRes = await fetch(`${baseUrl}/schedules/today`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const todayData = await todayRes.json();
    assert.strictEqual(todayRes.status, 200);
    assert.ok(todayData.doses.length > 0);
    assert.ok(todayData.summary);
    console.log(`   ✅ Today doses: ${todayData.doses.length} scheduled. Adherence: ${todayData.summary.adherenceRate}%`);

    // Verify TTS voice announcement format
    const sampleDose = todayData.doses[0];
    assert.ok(sampleDose.voiceAnnouncement);
    console.log(`   🔊 Verified TTS Announcement string: "${sampleDose.voiceAnnouncement}"`);

    // 6. Schedules - Log Dose as Taken (and verify stock decrement)
    console.log('6️⃣ Testing POST /api/schedules/log (Take Dose & Stock Sync)...');
    const targetDose = todayData.doses.find(d => d.medicationId === testMedicationId);
    assert.ok(targetDose, 'Target dose found');

    const logRes = await fetch(`${baseUrl}/schedules/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        medicationId: testMedicationId,
        scheduleId: targetDose.scheduleId,
        scheduledDate: targetDose.scheduledDate,
        status: 'taken'
      })
    });
    const logData = await logRes.json();
    assert.strictEqual(logRes.status, 200);
    assert.strictEqual(logData.success, true);
    assert.strictEqual(logData.currentStock, 59); // Decremented from 60
    console.log('   ✅ Dose marked as TAKEN. Stock automatically decremented to 59.');

    // 7. Caregiver - Monitor Patients
    console.log('7️⃣ Testing Caregiver Linking & Patient Monitoring...');
    const cgLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah@example.com', password: 'password123' })
    });
    const cgLoginData = await cgLoginRes.json();
    const cgToken = cgLoginData.token;

    const cgPatientsRes = await fetch(`${baseUrl}/caregiver/patients`, {
      headers: { Authorization: `Bearer ${cgToken}` }
    });
    const cgPatientsData = await cgPatientsRes.json();
    assert.strictEqual(cgPatientsRes.status, 200);
    assert.ok(cgPatientsData.patients.length >= 1);
    console.log(`   ✅ Caregiver successfully monitoring ${cgPatientsData.patients.length} patient(s).`);

    // 8. Emergency Contacts
    console.log('8️⃣ Testing GET /api/emergency...');
    const emgRes = await fetch(`${baseUrl}/emergency`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const emgData = await emgRes.json();
    assert.strictEqual(emgRes.status, 200);
    assert.ok(emgData.contacts.length >= 2);
    console.log(`   ✅ Emergency contacts verified (${emgData.contacts.length} entries).`);

    console.log('\n🎉 ALL BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY! 💯\n');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();
