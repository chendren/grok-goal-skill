const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'crm.json');

// Ensure data dir
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// --- Persistence layer ---
let db = {
  contacts: [],
  cases: [],
  callLogs: [],
  meta: { lastUpdated: new Date().toISOString() }
};

function loadDB() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      db = JSON.parse(raw);
      // Basic shape guard
      if (!db.contacts) db.contacts = [];
      if (!db.cases) db.cases = [];
      if (!db.callLogs) db.callLogs = [];
      if (!db.meta) db.meta = { lastUpdated: new Date().toISOString() };
    } else {
      seedDB();
      saveDB();
    }
  } catch (e) {
    console.error('Failed to load DB, reseeding:', e.message);
    seedDB();
    saveDB();
  }
}

// Debounced async write: batches rapid mutations into a single disk write
// without blocking the event loop. Flushes on process exit.
let _saveTimer = null;
function saveDB() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    db.meta.lastUpdated = new Date().toISOString();
    fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), 'utf8', (err) => {
      if (err) console.error('Failed to persist DB:', err.message);
    });
    _saveTimer = null;
  }, 150);
}

function flushDB() {
  if (_saveTimer) {
    clearTimeout(_saveTimer);
    _saveTimer = null;
    db.meta.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
  }
}
process.on('SIGTERM', () => { flushDB(); process.exit(0); });
process.on('SIGINT',  () => { flushDB(); process.exit(0); });

function seedDB() {
  const now = new Date();
  const iso = (d) => new Date(d).toISOString();

  db.contacts = [
    {
      id: 'c_001',
      firstName: 'Alex',
      lastName: 'Rivera',
      phone: '+1 (555) 123-4567',
      email: 'alex.rivera@acmecorp.com',
      company: 'Acme Corp',
      title: 'VP Operations',
      address: '1200 Commerce Blvd, Austin, TX 78701',
      notes: 'Premium customer. Prefers callback after 4pm CT. Last billing dispute resolved March.',
      createdAt: iso(now - 1000*60*60*24*180),
      updatedAt: iso(now - 1000*60*60*24*5)
    },
    {
      id: 'c_002',
      firstName: 'Jordan',
      lastName: 'Lee',
      phone: '+1 (555) 987-6543',
      email: 'jordan.lee@northwind.io',
      company: 'Northwind Solutions',
      title: 'Head of Support',
      address: '4500 Innovation Dr, Seattle, WA 98109',
      notes: 'High volume caller. Uses chat first then escalates. Very responsive via email.',
      createdAt: iso(now - 1000*60*60*24*120),
      updatedAt: iso(now - 1000*60*60*24*2)
    },
    {
      id: 'c_003',
      firstName: 'Priya',
      lastName: 'Patel',
      phone: '+1 (555) 222-3344',
      email: 'priya.patel@vertex.co',
      company: 'Vertex Dynamics',
      title: 'Customer Success Manager',
      address: '88 Financial Center, New York, NY 10005',
      notes: 'New logo this quarter. Watch renewal in September. Executive sponsor is CTO.',
      createdAt: iso(now - 1000*60*60*24*45),
      updatedAt: iso(now - 1000*60*60*24*1)
    },
    {
      id: 'c_004',
      firstName: 'Marcus',
      lastName: 'Thompson',
      phone: '+1 (555) 444-7788',
      email: 'marcus.thompson@bluepeak.com',
      company: 'BluePeak Logistics',
      title: 'Fleet Manager',
      address: '3000 Harbor Way, Long Beach, CA 90802',
      notes: 'Fleet of 120 trucks. Multiple sites. Primary contact for all service issues.',
      createdAt: iso(now - 1000*60*60*24*300),
      updatedAt: iso(now - 1000*60*60*24*12)
    },
    {
      id: 'c_005',
      firstName: 'Sam',
      lastName: 'Nguyen',
      phone: '+1 (555) 555-1212',
      email: 'sam.nguyen@kinetica.dev',
      company: 'Kinetica Labs',
      title: 'Founder',
      address: '15 Tech Row, San Francisco, CA 94107',
      notes: 'Founder. Fast decisions. Loves the product. Potential reference.',
      createdAt: iso(now - 1000*60*60*24*20),
      updatedAt: iso(now - 1000*60*60*24*3)
    }
  ];

  db.cases = [
    {
      id: 'case_101',
      contactId: 'c_001',
      subject: 'Billing discrepancy on April invoice',
      description: 'Customer reports $420 line item not matching PO. Need credit memo and explanation.',
      status: 'Open',
      priority: 'High',
      dueDate: iso(now + 1000*60*60*24*2),
      createdAt: iso(now - 1000*60*60*24*3),
      updatedAt: iso(now - 1000*60*60*24*1)
    },
    {
      id: 'case_102',
      contactId: 'c_001',
      subject: 'Request for dedicated account rep',
      description: 'Expanding operations. Would like single point of contact for all sites.',
      status: 'In Progress',
      priority: 'Medium',
      dueDate: iso(now + 1000*60*60*24*7),
      createdAt: iso(now - 1000*60*60*24*14),
      updatedAt: iso(now - 1000*60*60*24*2)
    },
    {
      id: 'case_201',
      contactId: 'c_002',
      subject: 'API rate limit increase for staging',
      description: 'Team hitting 429s during load tests. Requesting temporary 5x increase.',
      status: 'Closed',
      priority: 'Medium',
      dueDate: iso(now - 1000*60*60*24*5),
      createdAt: iso(now - 1000*60*60*24*10),
      updatedAt: iso(now - 1000*60*60*24*6)
    },
    {
      id: 'case_301',
      contactId: 'c_003',
      subject: 'Renewal discussion and add-on modules',
      description: 'Q3 renewal. Interested in Analytics and Workflow automation add-ons.',
      status: 'Open',
      priority: 'High',
      dueDate: iso(now + 1000*60*60*24*4),
      createdAt: iso(now - 1000*60*60*24*2),
      updatedAt: iso(now - 1000*60*60*24*2)
    },
    {
      id: 'case_401',
      contactId: 'c_004',
      subject: 'Hardware integration issue - device 47B',
      description: 'ELD device dropping GPS in certain zip codes. Firmware update not applying to 12 units.',
      status: 'In Progress',
      priority: 'High',
      dueDate: iso(now + 1000*60*60*24),
      createdAt: iso(now - 1000*60*60*24*1),
      updatedAt: iso(now - 1000*60*60*3)
    }
  ];

  db.callLogs = [
    {
      id: 'log_9001',
      contactId: 'c_001',
      caseId: 'case_101',
      type: 'inbound',
      direction: 'inbound',
      ani: '+15551234567',
      durationSec: 487,
      disposition: 'Callback Scheduled',
      notes: 'Discussed invoice. Agreed to review credit within 48h. Will call back Thu.',
      timestamp: iso(now - 1000*60*60*24*1),
      createdAt: iso(now - 1000*60*60*24*1)
    },
    {
      id: 'log_9002',
      contactId: 'c_001',
      caseId: null,
      type: 'outbound',
      direction: 'outbound',
      ani: '+15551234567',
      durationSec: 210,
      disposition: 'Information Provided',
      notes: 'Follow up on PO match. Sent PDF of corrected invoice.',
      timestamp: iso(now - 1000*60*60*24*3),
      createdAt: iso(now - 1000*60*60*24*3)
    },
    {
      id: 'log_9003',
      contactId: 'c_002',
      caseId: 'case_201',
      type: 'inbound',
      direction: 'inbound',
      ani: '+15559876543',
      durationSec: 640,
      disposition: 'Resolved',
      notes: 'Rate limit increase approved for 14 days. Ticket closed.',
      timestamp: iso(now - 1000*60*60*24*7),
      createdAt: iso(now - 1000*60*60*24*7)
    },
    {
      id: 'log_9004',
      contactId: 'c_003',
      caseId: 'case_301',
      type: 'inbound',
      direction: 'inbound',
      ani: '+15552223344',
      durationSec: 355,
      disposition: 'Escalated',
      notes: 'Renewal pricing discussion. Sent to AE for custom quote.',
      timestamp: iso(now - 1000*60*60*24*1),
      createdAt: iso(now - 1000*60*60*24*1)
    },
    {
      id: 'log_9005',
      contactId: 'c_004',
      caseId: 'case_401',
      type: 'inbound',
      direction: 'inbound',
      ani: '+15554447788',
      durationSec: 1290,
      disposition: 'In Progress',
      notes: 'Long debug session on device firmware. Engineering engaged. Next update tomorrow 9am.',
      timestamp: iso(now - 1000*60*60*4),
      createdAt: iso(now - 1000*60*60*4)
    },
    {
      id: 'log_9006',
      contactId: 'c_005',
      caseId: null,
      type: 'inbound',
      direction: 'inbound',
      ani: '+15555551212',
      durationSec: 95,
      disposition: 'Resolved',
      notes: 'Quick question about SSO. Sent doc link. Happy customer.',
      timestamp: iso(now - 1000*60*60*24*2),
      createdAt: iso(now - 1000*60*60*24*2)
    }
  ];
}

function normalizePhone(p) {
  if (!p) return '';
  return p.replace(/\D/g, '').slice(-10); // last 10 digits
}

function findContactByPhone(phone) {
  const norm = normalizePhone(phone);
  if (!norm) return null;
  return db.contacts.find(c => normalizePhone(c.phone) === norm) || null;
}

// --- API ---

app.get('/api/health', (req, res) => {
  res.json({ ok: true, lastUpdated: db.meta.lastUpdated, counts: {
    contacts: db.contacts.length,
    cases: db.cases.length,
    callLogs: db.callLogs.length
  }});
});

// Contacts
app.get('/api/contacts', (req, res) => {
  res.json(db.contacts);
});

app.get('/api/contacts/:id', (req, res) => {
  const contact = db.contacts.find(c => c.id === req.params.id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });
  res.json(contact);
});

app.post('/api/contacts', (req, res) => {
  const c = req.body;
  if (!c.firstName || !c.lastName || !c.phone) {
    return res.status(400).json({ error: 'firstName, lastName, phone required' });
  }
  const contact = {
    id: 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    firstName: c.firstName,
    lastName: c.lastName,
    phone: c.phone,
    email: c.email || '',
    company: c.company || '',
    title: c.title || '',
    address: c.address || '',
    notes: c.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.contacts.push(contact);
  saveDB();
  res.status(201).json(contact);
});

app.put('/api/contacts/:id', (req, res) => {
  const idx = db.contacts.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Contact not found' });
  const updated = {
    ...db.contacts[idx],
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString()
  };
  db.contacts[idx] = updated;
  saveDB();
  res.json(updated);
});

// Cases
app.get('/api/cases', (req, res) => {
  let result = db.cases;
  if (req.query.contactId) {
    result = result.filter(ca => ca.contactId === req.query.contactId);
  }
  res.json(result);
});

app.post('/api/cases', (req, res) => {
  const ca = req.body;
  if (!ca.contactId || !ca.subject) {
    return res.status(400).json({ error: 'contactId and subject required' });
  }
  const contactExists = db.contacts.some(c => c.id === ca.contactId);
  if (!contactExists) return res.status(400).json({ error: 'Invalid contactId' });

  const newCase = {
    id: 'case_' + Date.now().toString(36),
    contactId: ca.contactId,
    subject: ca.subject,
    description: ca.description || '',
    status: ca.status || 'Open',
    priority: ca.priority || 'Medium',
    dueDate: ca.dueDate || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.cases.push(newCase);
  saveDB();
  res.status(201).json(newCase);
});

app.put('/api/cases/:id', (req, res) => {
  const idx = db.cases.findIndex(ca => ca.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Case not found' });
  const updated = {
    ...db.cases[idx],
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString()
  };
  db.cases[idx] = updated;
  saveDB();
  res.json(updated);
});

// Call Logs
app.get('/api/call-logs', (req, res) => {
  let result = [...db.callLogs];
  if (req.query.contactId) {
    result = result.filter(l => l.contactId === req.query.contactId);
  }
  // newest first
  result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(result);
});

app.post('/api/call-logs', (req, res) => {
  const log = req.body;
  if (!log.contactId || !log.disposition) {
    return res.status(400).json({ error: 'contactId and disposition required' });
  }
  const contactExists = db.contacts.some(c => c.id === log.contactId);
  if (!contactExists) return res.status(400).json({ error: 'Invalid contactId' });

  const newLog = {
    id: 'log_' + Date.now().toString(36),
    contactId: log.contactId,
    caseId: log.caseId || null,
    type: log.type || 'inbound',
    direction: log.direction || 'inbound',
    ani: log.ani || '',
    durationSec: Number(log.durationSec || 0),
    disposition: log.disposition,
    notes: log.notes || '',
    timestamp: log.timestamp || new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  db.callLogs.push(newLog);
  saveDB();
  res.status(201).json(newLog);
});

// Activities (derived merged timeline for a contact)
app.get('/api/activities', (req, res) => {
  const cid = req.query.contactId;
  if (!cid) return res.status(400).json({ error: 'contactId required' });

  const activities = [];

  db.cases.filter(c => c.contactId === cid).forEach(ca => {
    activities.push({
      id: ca.id,
      type: 'case',
      timestamp: ca.createdAt,
      title: `Case: ${ca.subject}`,
      subtitle: `${ca.status} • ${ca.priority}`,
      details: ca.description,
      meta: { caseId: ca.id, status: ca.status, priority: ca.priority, dueDate: ca.dueDate }
    });
    if (ca.updatedAt && ca.updatedAt !== ca.createdAt) {
      activities.push({
        id: ca.id + '-u',
        type: 'case-update',
        timestamp: ca.updatedAt,
        title: `Case updated: ${ca.subject}`,
        subtitle: `${ca.status}`,
        details: '',
        meta: { caseId: ca.id }
      });
    }
  });

  db.callLogs.filter(l => l.contactId === cid).forEach(l => {
    activities.push({
      id: l.id,
      type: 'call',
      timestamp: l.timestamp,
      title: `${l.direction === 'inbound' ? 'Inbound' : 'Outbound'} Call`,
      subtitle: `${l.disposition} • ${Math.floor(l.durationSec / 60)}m ${l.durationSec % 60}s`,
      details: l.notes,
      meta: { callLogId: l.id, ani: l.ani, caseId: l.caseId }
    });
  });

  // Sort newest first
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(activities);
});

// Screen pop lookup — used by UI + external integration
app.post('/api/screenpop', (req, res) => {
  const { phone, contactId } = req.body || {};
  let contact = null;

  if (contactId) {
    contact = db.contacts.find(c => c.id === contactId) || null;
  }
  if (!contact && phone) {
    contact = findContactByPhone(phone);
  }

  if (!contact) {
    return res.json({ matched: false, contact: null, message: 'No matching contact found' });
  }

  // Return rich payload for the frontend
  const cases = db.cases.filter(c => c.contactId === contact.id);
  const recentLogs = db.callLogs
    .filter(l => l.contactId === contact.id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  res.json({
    matched: true,
    contact,
    recentCases: cases,
    recentLogs,
    suggestedAction: cases.some(c => c.status !== 'Closed') ? 'Review open cases' : 'Log new interaction'
  });
});

// /demo — render the skill's process log (GOAL.md) as HTML so the artifact
// documents its own creation. Makes the skill's work visible inside the app.
app.get('/demo', (req, res) => {
  let raw = '';
  try {
    raw = fs.readFileSync(path.join(__dirname, 'GOAL.md'), 'utf8');
  } catch {
    raw = '# GOAL.md not found\n\nRun this project from the repo root.';
  }

  function escHtml(s) {
    return s.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');
  }
  function applyBold(s) {
    const parts = s.split('**');
    return parts.map((p, i) => i % 2 === 1 ? '<strong>' + p + '</strong>' : p).join('');
  }
  function applyCode(s) {
    const parts = s.split('`');
    return parts.map((p, i) => i % 2 === 1 ? '<code class="bg-slate-100 px-1 rounded text-sm font-mono">' + p + '</code>' : p).join('');
  }
  function applyLinks(s) {
    let out = '';
    let i = 0;
    while (i < s.length) {
      const start = s.indexOf('[', i);
      if (start === -1) { out += s.slice(i); break; }
      const textEnd = s.indexOf('](', start);
      if (textEnd === -1) { out += s.slice(i); break; }
      const urlEnd = s.indexOf(')', textEnd + 2);
      if (urlEnd === -1) { out += s.slice(i); break; }
      out += s.slice(i, start) + '<a href="' + s.slice(textEnd + 2, urlEnd) + '" class="text-blue-600 underline">' + s.slice(start + 1, textEnd) + '</a>';
      i = urlEnd + 1;
    }
    return out;
  }
  function inline(line) {
    return applyLinks(applyCode(applyBold(escHtml(line))));
  }

  const lines = raw.split('\n');
  let html = '';
  let inList = false;
  for (const line of lines) {
    if (line.startsWith('# '))        { if (inList) { html += '</ul>'; inList = false; } html += '<h1 class="text-2xl font-bold mt-8 mb-3 text-slate-900">' + inline(line.slice(2)) + '</h1>'; }
    else if (line.startsWith('## '))  { if (inList) { html += '</ul>'; inList = false; } html += '<h2 class="text-lg font-semibold mt-6 mb-2 text-slate-800">' + inline(line.slice(3)) + '</h2>'; }
    else if (line.startsWith('### ')) { if (inList) { html += '</ul>'; inList = false; } html += '<h3 class="font-semibold mt-4 mb-1 text-slate-700">' + inline(line.slice(4)) + '</h3>'; }
    else if (line.startsWith('- '))   { if (!inList) { html += '<ul class="list-disc pl-5 my-2 space-y-1 text-slate-700">'; inList = true; } html += '<li>' + inline(line.slice(2)) + '</li>'; }
    else if (line.trim() === '')      { if (inList) { html += '</ul>'; inList = false; } html += '<div class="my-2"></div>'; }
    else                              { if (inList) { html += '</ul>'; inList = false; } html += '<p class="text-slate-700 my-1">' + inline(line) + '</p>'; }
  }
  if (inList) html += '</ul>';

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Goal Process Log</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; font-size: 15px; line-height: 1.6; background: #f8fafc; color: #334155; min-height: 100vh; }
    .wrap { max-width: 740px; margin: 0 auto; padding: 2.5rem 1.5rem; }
    .header { display: flex; align-items: center; gap: .75rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0; margin-bottom: 2rem; font-size: .75rem; color: #94a3b8; }
    .header a { margin-left: auto; color: #2563eb; text-decoration: none; }
    .header a:hover { text-decoration: underline; }
    h1 { font-size: 1.4rem; font-weight: 700; color: #0f172a; margin: 2rem 0 .6rem; }
    h2 { font-size: 1.05rem; font-weight: 600; color: #1e293b; margin: 1.5rem 0 .4rem; }
    h3 { font-weight: 600; color: #334155; margin: 1rem 0 .25rem; }
    p  { color: #475569; margin: .25rem 0; }
    ul { list-style: disc; padding-left: 1.4rem; margin: .5rem 0; color: #475569; }
    li { margin: .2rem 0; }
    code { background: #f1f5f9; padding: .1rem .3rem; border-radius: 4px; font-size: .85em; font-family: ui-monospace, monospace; }
    strong { font-weight: 600; color: #1e293b; }
    a { color: #2563eb; }
    .footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; font-size: .75rem; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <span style="font-weight:600;text-transform:uppercase;letter-spacing:.1em">grok-goal-skill</span>
      <span>|</span>
      <span>Process log written by the <code>/goal</code> skill as it worked</span>
      <a href="/">Back to CRM</a>
    </div>
    <div>${html}</div>
    <div class="footer">
      Rendered from <code>GOAL.md</code> at runtime.
      Run <code>node verify.js</code> for independent end-to-end verification (no LLM involved).
    </div>
  </div>
</body>
</html>`);
});

// Fallback: serve index for any non-api route (nice for SPA feel if needed)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Boot
loadDB();
app.listen(PORT, () => {
  console.log(`CRM MockUp server running on http://localhost:${PORT}`);
  console.log(`Data file: ${DATA_FILE}`);
  console.log(`Seeded contacts: ${db.contacts.length}`);
});
