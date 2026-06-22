#!/usr/bin/env node
/**
 * verify.js — Independent end-to-end verifier for ConnectCRM.
 *
 * Runs against a live server. Does NOT involve the LLM that built the app.
 * Exit 0 = all checks pass. Exit 1 = one or more failures.
 *
 * Usage:
 *   node server.js &          # start the server
 *   node verify.js            # run checks
 *   node verify.js --url http://localhost:3001   # custom port
 */

const BASE = (() => {
  const idx = process.argv.indexOf('--url');
  return idx !== -1 ? process.argv[idx + 1] : 'http://localhost:3000';
})();

let passed = 0;
let failed = 0;
const failures = [];

function pass(label) {
  process.stdout.write('  ✓ ' + label + '\n');
  passed++;
}

function fail(label, detail) {
  process.stdout.write('  ✗ ' + label + (detail ? ': ' + detail : '') + '\n');
  failed++;
  failures.push(label + (detail ? ' — ' + detail : ''));
}

async function get(path) {
  const r = await fetch(BASE + path);
  return { status: r.status, body: await r.json().catch(() => null) };
}

async function post(path, body) {
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { status: r.status, body: await r.json().catch(() => null) };
}

async function put(path, body) {
  const r = await fetch(BASE + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { status: r.status, body: await r.json().catch(() => null) };
}

async function run() {
  console.log('\nConnectCRM — Independent Verification Suite');
  console.log('Target: ' + BASE);
  console.log('─'.repeat(48));

  // 1. Server reachable
  console.log('\n[1] Server health');
  let contacts;
  try {
    const r = await get('/api/contacts');
    if (r.status === 200 && Array.isArray(r.body)) {
      pass('GET /api/contacts returns 200 with array');
      contacts = r.body;
    } else {
      fail('GET /api/contacts', 'status ' + r.status);
      console.log('\nServer unreachable — aborting remaining checks.');
      process.exit(1);
    }
  } catch (e) {
    fail('Server reachable at ' + BASE, e.message);
    process.exit(1);
  }

  // 2. Seed data
  console.log('\n[2] Seed data');
  contacts.length >= 5 ? pass('At least 5 seed contacts present') : fail('Seed contacts', 'found ' + contacts.length + ', expected >= 5');

  const alex = contacts.find(c => c.firstName === 'Alex' && c.lastName === 'Rivera');
  alex ? pass('Seed contact Alex Rivera exists') : fail('Seed contact Alex Rivera missing');

  const phones = contacts.map(c => c.phone);
  phones.includes('+1 (555) 123-4567') ? pass('Seed ANI +1 (555) 123-4567 present') : fail('Seed ANI +1 (555) 123-4567 missing');

  // 3. Screen pop (ANI lookup)
  console.log('\n[3] Screen pop / ANI lookup');
  const sp = await post('/api/screenpop', { phone: '+1 (555) 123-4567' });
  sp.status === 200 ? pass('POST /api/screenpop returns 200') : fail('POST /api/screenpop', 'status ' + sp.status);
  sp.body && sp.body.matched ? pass('Screen pop matched a contact') : fail('Screen pop did not match known ANI');
  sp.body && sp.body.contact && sp.body.contact.firstName === 'Alex' ? pass('Matched contact is Alex Rivera') : fail('Matched wrong contact');

  // 4. Cases for known contact
  console.log('\n[4] Cases');
  if (alex) {
    const cs = await get('/api/cases?contactId=' + alex.id);
    cs.status === 200 ? pass('GET /api/cases?contactId returns 200') : fail('GET /api/cases?contactId', 'status ' + cs.status);
    cs.body && cs.body.length >= 1 ? pass('At least 1 case for Alex Rivera') : fail('No cases for Alex Rivera');
  }

  // 5. Call logs for known contact
  console.log('\n[5] Call logs');
  if (alex) {
    const cl = await get('/api/call-logs?contactId=' + alex.id);
    cl.status === 200 ? pass('GET /api/call-logs?contactId returns 200') : fail('GET /api/call-logs?contactId', 'status ' + cl.status);
  }

  // 6. Activities timeline
  console.log('\n[6] Activities timeline');
  if (alex) {
    const ac = await get('/api/activities?contactId=' + alex.id);
    ac.status === 200 ? pass('GET /api/activities?contactId returns 200') : fail('GET /api/activities', 'status ' + ac.status);
    ac.body && ac.body.length >= 1 ? pass('Timeline has at least 1 entry') : fail('Empty timeline for Alex Rivera');
    if (ac.body && ac.body.length >= 2) {
      const ts = ac.body.map(a => new Date(a.timestamp).getTime());
      const sorted = ts.every((t, i) => i === 0 || t <= ts[i - 1]);
      sorted ? pass('Timeline is sorted newest-first') : fail('Timeline order incorrect');
    }
  }

  // 7. CRUD — create a contact
  console.log('\n[7] Contact CRUD');
  const newContact = await post('/api/contacts', {
    firstName: 'Verify',
    lastName: 'Bot',
    phone: '+1 (555) 000-0001',
    email: 'verify@test.local',
    company: 'Test Suite'
  });
  newContact.status === 201 ? pass('POST /api/contacts returns 201') : fail('POST /api/contacts', 'status ' + newContact.status);
  const nc = newContact.body;
  nc && nc.id ? pass('New contact has id') : fail('New contact missing id');
  nc && nc.firstName === 'Verify' ? pass('New contact fields persisted') : fail('New contact fields wrong');

  // 8. Update the new contact
  if (nc && nc.id) {
    const upd = await put('/api/contacts/' + nc.id, { notes: 'verify-run' });
    upd.status === 200 ? pass('PUT /api/contacts/:id returns 200') : fail('PUT /api/contacts/:id', 'status ' + upd.status);
    upd.body && upd.body.notes === 'verify-run' ? pass('Updated field reflects in response') : fail('Updated field not in response');
  }

  // 9. Create a case for the new contact
  console.log('\n[8] Case CRUD');
  let newCase;
  if (nc && nc.id) {
    const cs2 = await post('/api/cases', {
      contactId: nc.id,
      subject: 'Verification test case',
      priority: 'Low'
    });
    cs2.status === 201 ? pass('POST /api/cases returns 201') : fail('POST /api/cases', 'status ' + cs2.status);
    newCase = cs2.body;
    newCase && newCase.status === 'Open' ? pass('New case defaults to Open') : fail('New case status wrong');

    if (newCase && newCase.id) {
      const csUpd = await put('/api/cases/' + newCase.id, { status: 'Closed' });
      csUpd.status === 200 ? pass('PUT /api/cases/:id returns 200') : fail('PUT /api/cases/:id', 'status ' + csUpd.status);
      csUpd.body && csUpd.body.status === 'Closed' ? pass('Case status update reflected') : fail('Case status not updated');
    }
  }

  // 10. Create a call log
  console.log('\n[9] Call log CRUD');
  if (nc && nc.id) {
    const logR = await post('/api/call-logs', {
      contactId: nc.id,
      disposition: 'Resolved',
      durationSec: 120,
      notes: 'verify run',
      type: 'inbound'
    });
    logR.status === 201 ? pass('POST /api/call-logs returns 201') : fail('POST /api/call-logs', 'status ' + logR.status);
    logR.body && logR.body.id ? pass('Call log has id') : fail('Call log missing id');
  }

  // 11. Persistence check — re-fetch and confirm new contact still exists
  console.log('\n[10] Persistence');
  if (nc && nc.id) {
    const refetch = await get('/api/contacts/' + nc.id);
    refetch.status === 200 ? pass('Newly created contact persists across re-fetch') : fail('Contact not found on re-fetch', 'status ' + refetch.status);
  }

  // 12. Validation — bad requests return 400
  console.log('\n[11] Input validation');
  const bad1 = await post('/api/contacts', { firstName: 'NoPhone' });
  bad1.status === 400 ? pass('POST /api/contacts without phone returns 400') : fail('Missing phone validation', 'got status ' + bad1.status);

  const bad2 = await post('/api/cases', { subject: 'No contact id' });
  bad2.status === 400 ? pass('POST /api/cases without contactId returns 400') : fail('Missing contactId validation', 'got status ' + bad2.status);

  const bad3 = await post('/api/call-logs', { contactId: nc && nc.id, notes: 'no disposition' });
  bad3.status === 400 ? pass('POST /api/call-logs without disposition returns 400') : fail('Missing disposition validation', 'got status ' + bad3.status);

  // 13. /demo route
  console.log('\n[12] /demo route');
  const demo = await fetch(BASE + '/demo');
  demo.status === 200 ? pass('GET /demo returns 200') : fail('GET /demo', 'status ' + demo.status);
  const demoHtml = await demo.text().catch(() => '');
  demoHtml.includes('GOAL') ? pass('/demo page renders GOAL.md content') : fail('/demo page missing GOAL content');

  // Summary
  console.log('\n' + '─'.repeat(48));
  console.log('Result: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(f => console.log('  - ' + f));
  }
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => {
  console.error('Verifier crashed:', e.message);
  process.exit(1);
});
