/**
 * ConnectCRM — Salesforce-style Service Console
 * Client application for Amazon Connect third-party app embedding.
 * All state changes go through the real backend API.
 */

const API = '/api';

// App state
let state = {
  contacts: [],
  cases: [],
  callLogs: [],
  selectedContactId: null,
  currentFilter: 'all',
  searchTerm: ''
};

// Utilities
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `crm-toast px-4 py-2.5 rounded-xl shadow-lg border text-sm flex items-center gap-x-2 max-w-[300px] ${
    type === 'success' ? 'bg-white border-emerald-200 text-emerald-800' :
    type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200'
  }`;
  el.innerHTML = `
    <div class="flex-1">${message}</div>
    <button class="text-slate-400 hover:text-slate-600 text-xs">×</button>
  `;
  container.appendChild(el);
  
  el.querySelector('button').onclick = () => el.remove();
  
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 4200);
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { 
    month: 'short', day: 'numeric', 
    hour: 'numeric', minute: '2-digit' 
  });
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-10);
}

// API helpers
async function apiGet(path) {
  const res = await fetch(API + path);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPut(path, body) {
  const res = await fetch(API + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Data loading
async function loadAllData() {
  try {
    const [contacts, cases, callLogs] = await Promise.all([
      apiGet('/contacts'),
      apiGet('/cases'),
      apiGet('/call-logs')
    ]);
    state.contacts = contacts;
    state.cases = cases;
    state.callLogs = callLogs;
    
    renderContactList();
    updateContactCount();
    
    // Re-render current 360 if one is selected
    if (state.selectedContactId) {
      await renderContact360(state.selectedContactId);
    }
  } catch (err) {
    console.error('Failed to load data', err);
    showToast('Failed to load CRM data. Check backend.', 'error');
  }
}

async function refreshAllData() {
  await loadAllData();
  showToast('Data refreshed');
}

// Contact list
function updateContactCount() {
  const el = document.getElementById('contact-count');
  if (el) el.textContent = state.contacts.length;
}

function setContactFilter(filter) {
  state.currentFilter = filter;
  
  // Update active button styles
  ['all', 'open-cases', 'recent'].forEach(f => {
    const btn = document.getElementById('filter-' + f);
    if (!btn) return;
    if (f === filter) {
      btn.className = 'active-filter text-xs px-2 py-0.5 bg-[#0176D3] text-white rounded';
    } else {
      btn.className = 'text-xs px-2 py-0.5 hover:bg-slate-100 text-slate-600 border rounded';
    }
  });
  
  renderContactList();
}

function filterContacts() {
  state.searchTerm = (document.getElementById('sidebar-search')?.value || '').toLowerCase();
  renderContactList();
}

function getFilteredContacts() {
  let list = [...state.contacts];
  
  // Search
  if (state.searchTerm) {
    const q = state.searchTerm;
    list = list.filter(c =>
      (c.firstName + ' ' + c.lastName).toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.company || '').toLowerCase().includes(q)
    );
  }
  
  // Filter
  if (state.currentFilter === 'open-cases') {
    const openContactIds = new Set(
      state.cases.filter(ca => ca.status !== 'Closed').map(ca => ca.contactId)
    );
    list = list.filter(c => openContactIds.has(c.id));
  }
  
  if (state.currentFilter === 'recent') {
    const recentIds = new Set(
      state.callLogs
        .filter(l => (Date.now() - new Date(l.timestamp)) < 1000 * 60 * 60 * 72)
        .map(l => l.contactId)
    );
    list = list.filter(c => recentIds.has(c.id));
  }
  
  // Sort by most recently active (latest call or case update)
  list.sort((a, b) => {
    const getLatest = (cid) => {
      const calls = state.callLogs.filter(l => l.contactId === cid);
      const casesFor = state.cases.filter(c => c.contactId === cid);
      const t1 = calls.length ? Math.max(...calls.map(c => +new Date(c.timestamp))) : 0;
      const t2 = casesFor.length ? Math.max(...casesFor.map(c => +new Date(c.updatedAt))) : 0;
      return Math.max(t1, t2);
    };
    return getLatest(b.id) - getLatest(a.id);
  });
  
  return list;
}

function renderContactList() {
  const container = document.getElementById('contact-list');
  if (!container) return;
  
  const filtered = getFilteredContacts();
  
  if (filtered.length === 0) {
    container.innerHTML = `<div class="p-6 text-xs text-slate-400 text-center">No matching contacts.</div>`;
    return;
  }
  
  container.innerHTML = filtered.map(contact => {
    const openCases = state.cases.filter(c => c.contactId === contact.id && c.status !== 'Closed').length;
    const lastCall = state.callLogs
      .filter(l => l.contactId === contact.id)
      .sort((x, y) => new Date(y.timestamp) - new Date(x.timestamp))[0];
    
    const isActive = contact.id === state.selectedContactId;
    
    return `
      <div onclick="selectContact('${contact.id}')" 
           class="contact-row px-4 py-[9px] border-b cursor-pointer flex gap-x-3 items-center ${isActive ? 'active' : ''}">
        <div class="w-8 h-8 rounded-xl flex-shrink-0 bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center text-[13px] font-semibold">
          ${contact.firstName[0]}${contact.lastName[0]}
        </div>
        
        <div class="min-w-0 flex-1">
          <div class="font-semibold truncate">${contact.firstName} ${contact.lastName}</div>
          <div class="flex items-center gap-x-2 text-[11px]">
            <span class="text-slate-500 truncate">${contact.phone}</span>
            ${openCases > 0 ? `<span class="px-1 text-[9px] font-bold text-rose-600 bg-rose-100 rounded">OPEN ${openCases}</span>` : ''}
          </div>
          ${lastCall ? `<div class="text-[10px] text-slate-400 truncate">${lastCall.disposition}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

async function selectContact(contactId) {
  state.selectedContactId = contactId;
  
  // Hide welcome
  document.getElementById('welcome-panel').classList.add('hidden');
  document.getElementById('contact-360').classList.remove('hidden');
  
  renderContactList(); // highlight active row
  await renderContact360(contactId);
}

function clearSelection() {
  state.selectedContactId = null;
  document.getElementById('welcome-panel').classList.remove('hidden');
  document.getElementById('contact-360').classList.add('hidden');
  renderContactList();
  
  // hide screenpop indicator
  const ind = document.getElementById('screenpop-indicator');
  if (ind) ind.classList.add('hidden');
}

async function renderContact360(contactId) {
  const contact = state.contacts.find(c => c.id === contactId);
  if (!contact) {
    clearSelection();
    return;
  }
  
  // Header
  document.getElementById('contact-avatar').innerHTML = `${contact.firstName[0]}${contact.lastName[0]}`;
  document.getElementById('contact-name').textContent = `${contact.firstName} ${contact.lastName}`;
  document.getElementById('contact-company-pill').textContent = contact.company || '';
  document.getElementById('contact-title').textContent = contact.title || '';
  
  const phoneLink = document.getElementById('contact-phone');
  phoneLink.querySelector('span').textContent = contact.phone;
  
  const emailLink = document.getElementById('contact-email');
  emailLink.querySelector('span').textContent = contact.email || '—';
  
  // Details
  const details = document.getElementById('contact-details');
  details.innerHTML = `
    <div><span class="font-semibold text-slate-400">Email:</span> <span class="data-value">${contact.email || '—'}</span></div>
    <div><span class="font-semibold text-slate-400">Phone:</span> <span class="data-value">${contact.phone}</span></div>
    <div><span class="font-semibold text-slate-400">Company:</span> ${contact.company || '—'}</div>
    <div><span class="font-semibold text-slate-400">Address:</span> ${contact.address || '—'}</div>
  `;
  
  document.getElementById('contact-updated').textContent = formatDateTime(contact.updatedAt);
  
  // Notes
  const notesEl = document.getElementById('contact-notes');
  notesEl.value = contact.notes || '';
  notesEl.onblur = saveContactNotes;
  
  // Cases
  await renderCasesForContact(contactId);
  
  // Timeline
  await renderTimeline(contactId);
}

async function renderCasesForContact(contactId) {
  const tbody = document.getElementById('cases-table-body');
  const noCases = document.getElementById('no-cases');
  
  const cases = state.cases.filter(c => c.contactId === contactId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  document.getElementById('case-count-badge').textContent = cases.length;
  
  if (cases.length === 0) {
    tbody.innerHTML = '';
    noCases.classList.remove('hidden');
    return;
  }
  noCases.classList.add('hidden');
  
  tbody.innerHTML = cases.map(c => `
    <tr class="hover:bg-slate-50">
      <td class="pl-4 py-2 pr-3">
        <div class="font-medium text-slate-800 leading-tight">${c.subject}</div>
        <div class="text-[11px] text-slate-500 line-clamp-1">${c.description || ''}</div>
      </td>
      <td class="py-2">
        <span class="salesforce-pill priority-${c.priority.toLowerCase()}">${c.priority}</span>
      </td>
      <td class="py-2">
        <span class="salesforce-pill status-${c.status.toLowerCase().replace(/\s+/g,'-')}">${c.status}</span>
      </td>
      <td class="py-2 text-xs text-slate-500">${c.dueDate ? formatDate(c.dueDate) : '—'}</td>
      <td class="py-2 pr-3 text-right">
        <button onclick="event.stopImmediatePropagation(); updateCaseStatus('${c.id}', '${c.status}')" 
                class="text-[10px] px-2 py-0.5 border rounded hover:bg-white text-slate-500">
          ${c.status === 'Closed' ? 'Reopen' : 'Update'}
        </button>
      </td>
    </tr>
  `).join('');
}

async function renderTimeline(contactId) {
  const container = document.getElementById('activity-timeline');
  
  try {
    const activities = await apiGet(`/activities?contactId=${contactId}`);
    
    if (activities.length === 0) {
      container.innerHTML = `<div class="text-xs text-slate-400 px-1">No activity recorded yet.</div>`;
      return;
    }
    
    container.innerHTML = activities.slice(0, 12).map(act => {
      const icon = act.type === 'call' ? 'fa-phone' : 
                   act.type === 'case' ? 'fa-folder-plus' : 'fa-edit';
      const color = act.type === 'call' ? 'bg-emerald-100 text-emerald-700' : 
                    act.type === 'case' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600';
      
      return `
        <div class="timeline-item flex gap-3">
          <div class="w-7 h-7 mt-0.5 flex-shrink-0 rounded-full ${color} flex items-center justify-center">
            <i class="fa-solid ${icon} text-xs"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-baseline justify-between">
              <div class="font-semibold text-sm text-slate-800">${act.title}</div>
              <div class="text-[10px] text-slate-500 tabular-nums ml-3 flex-shrink-0">${formatDateTime(act.timestamp)}</div>
            </div>
            <div class="text-xs text-slate-500">${act.subtitle}</div>
            ${act.details ? `<div class="text-xs mt-0.5 text-slate-600 leading-tight">${act.details}</div>` : ''}
            ${act.meta && act.meta.caseId ? `<div class="text-[10px] mt-0.5"><span class="px-1 bg-slate-100 rounded text-slate-500 font-mono">${act.meta.caseId}</span></div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    container.innerHTML = `<div class="text-xs text-red-500">Failed to load activity.</div>`;
  }
}

// Quick Actions
let currentContactForModal = null;

function openCreateCaseModal() {
  if (!state.selectedContactId) return;
  currentContactForModal = state.selectedContactId;
  
  // Prefill defaults
  document.getElementById('case-subject').value = '';
  document.getElementById('case-description').value = '';
  document.getElementById('case-priority').value = 'Medium';
  
  // Default due date = +3 days
  const d = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
  const ds = d.toISOString().split('T')[0];
  document.getElementById('case-due').value = ds;
  
  document.getElementById('create-case-modal').classList.remove('hidden');
  document.getElementById('create-case-modal').classList.add('flex');
}

function closeCreateCaseModal() {
  const m = document.getElementById('create-case-modal');
  m.classList.add('hidden');
  m.classList.remove('flex');
}

async function submitNewCase() {
  const subject = document.getElementById('case-subject').value.trim();
  const description = document.getElementById('case-description').value.trim();
  const priority = document.getElementById('case-priority').value;
  const dueDate = document.getElementById('case-due').value;
  
  if (!subject) {
    alert('Subject is required');
    return;
  }
  
  try {
    const created = await apiPost('/cases', {
      contactId: currentContactForModal,
      subject,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null
    });
    
    // Optimistic update
    state.cases.push(created);
    closeCreateCaseModal();
    showToast('Case created successfully');
    
    await renderContact360(currentContactForModal);
    renderContactList();
  } catch (e) {
    console.error(e);
    showToast('Failed to create case: ' + e.message, 'error');
  }
}

async function updateCaseStatus(caseId, currentStatus) {
  const newStatus = currentStatus === 'Closed' ? 'Open' : (currentStatus === 'Open' ? 'In Progress' : 'Closed');
  
  try {
    const updated = await apiPut(`/cases/${caseId}`, { status: newStatus });
    
    // Update local
    const idx = state.cases.findIndex(c => c.id === caseId);
    if (idx !== -1) state.cases[idx] = updated;
    
    showToast(`Case ${newStatus}`);
    
    if (state.selectedContactId) {
      await renderContact360(state.selectedContactId);
    }
    renderContactList();
  } catch (e) {
    showToast('Failed to update case', 'error');
  }
}

function openLogCallModal() {
  if (!state.selectedContactId) return;
  
  const contact = state.contacts.find(c => c.id === state.selectedContactId);
  document.getElementById('log-call-contact-info').innerHTML = `${contact.firstName} ${contact.lastName} • ${contact.phone}`;
  
  document.getElementById('call-notes').value = '';
  document.getElementById('call-duration').value = '240';
  document.getElementById('call-disposition').value = 'Resolved';
  
  const m = document.getElementById('log-call-modal');
  m.classList.remove('hidden');
  m.classList.add('flex');
}

function closeLogCallModal() {
  const m = document.getElementById('log-call-modal');
  m.classList.remove('flex');
  m.classList.add('hidden');
}

async function submitCallLog() {
  const contactId = state.selectedContactId;
  if (!contactId) return;
  
  const disposition = document.getElementById('call-disposition').value;
  const notes = document.getElementById('call-notes').value.trim();
  const duration = parseInt(document.getElementById('call-duration').value, 10) || 0;
  
  const contact = state.contacts.find(c => c.id === contactId);
  
  try {
    const log = await apiPost('/call-logs', {
      contactId,
      disposition,
      notes,
      durationSec: duration,
      ani: contact.phone,
      direction: 'inbound',
      type: 'inbound'
    });
    
    state.callLogs.push(log);
    closeLogCallModal();
    showToast('Call logged and saved to CRM');
    
    await renderContact360(contactId);
    renderContactList();
  } catch (e) {
    showToast('Failed to log call: ' + e.message, 'error');
  }
}

function openEmailModal() {
  const contact = state.contacts.find(c => c.id === state.selectedContactId);
  if (!contact) return;
  
  const subject = encodeURIComponent(`Follow-up: ${contact.firstName} ${contact.lastName}`);
  const body = encodeURIComponent('Hi ' + contact.firstName + ',\n\n');
  
  // Stub: open mailto (real CRM would use email service or case creation)
  window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
  showToast('Email client opened (stub — integrate real email provider in production)');
}

function openEditContactModal() {
  const c = state.contacts.find(x => x.id === state.selectedContactId);
  if (!c) return;
  
  const newPhone = prompt('Phone:', c.phone);
  if (newPhone === null) return;
  
  const newEmail = prompt('Email:', c.email);
  if (newEmail === null) return;
  
  const newCompany = prompt('Company:', c.company);
  if (newCompany === null) return;
  
  const newNotes = prompt('Notes (quick edit):', c.notes);
  if (newNotes === null) return;
  
  updateContactFields(c.id, {
    phone: newPhone,
    email: newEmail,
    company: newCompany,
    notes: newNotes
  });
}

async function updateContactFields(contactId, fields) {
  try {
    const updated = await apiPut(`/contacts/${contactId}`, fields);
    const idx = state.contacts.findIndex(c => c.id === contactId);
    state.contacts[idx] = updated;
    
    showToast('Contact updated');
    renderContactList();
    if (state.selectedContactId === contactId) {
      await renderContact360(contactId);
    }
  } catch (e) {
    showToast('Update failed: ' + e.message, 'error');
  }
}

async function saveContactNotes() {
  const notesEl = document.getElementById('contact-notes');
  if (!state.selectedContactId || !notesEl) return;
  
  const contact = state.contacts.find(c => c.id === state.selectedContactId);
  if (!contact) return;
  
  if (notesEl.value === contact.notes) return; // no change
  
  try {
    const updated = await apiPut(`/contacts/${state.selectedContactId}`, { notes: notesEl.value });
    const idx = state.contacts.findIndex(c => c.id === state.selectedContactId);
    state.contacts[idx] = updated;
    
    // silent save feedback
    const orig = notesEl.style.borderColor;
    notesEl.style.borderColor = '#86efac';
    setTimeout(() => notesEl.style.borderColor = orig || '', 600);
  } catch (e) {
    showToast('Failed to save notes', 'error');
  }
}

// === SCREEN POP / AMAZON CONNECT INTEGRATION ===

function showSimulateModal() {
  const modal = document.getElementById('simulate-modal');
  const list = document.getElementById('simulate-ani-list');
  
  list.innerHTML = state.contacts.map(c => `
    <button onclick="triggerSimulatedCall('${c.phone}', '${c.id}'); closeSimulateModal();"
            class="w-full flex justify-between items-center text-left px-3 py-[7px] border rounded-lg mb-1 hover:bg-emerald-50 hover:border-emerald-200 text-sm">
      <div>
        <span class="font-semibold">${c.firstName} ${c.lastName}</span>
        <span class="ml-2 text-xs text-slate-500">${c.company}</span>
      </div>
      <div class="font-mono text-xs text-emerald-700">${c.phone}</div>
    </button>
  `).join('');
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeSimulateModal() {
  const modal = document.getElementById('simulate-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function triggerSimulatedCallFromInput() {
  const phone = document.getElementById('custom-ani').value.trim();
  if (!phone) return;
  closeSimulateModal();
  performScreenPop(phone);
}

async function triggerSimulatedCall(phone, contactId) {
  // Called from modal buttons
  await performScreenPop(phone, contactId);
}

async function performScreenPop(phone, preferredContactId) {
  try {
    // Prefer direct lookup first for speed (also works offline for demo)
    let matched = state.contacts.find(c => normalizePhone(c.phone) === normalizePhone(phone));
    
    if (!matched && preferredContactId) {
      matched = state.contacts.find(c => c.id === preferredContactId);
    }
    
    // Call the real backend screenpop endpoint (demonstrates integration point)
    const payload = preferredContactId ? { phone, contactId: preferredContactId } : { phone };
    const result = await apiPost('/screenpop', payload);
    
    if (!result.matched && !matched) {
      showToast(`No contact matched for ${phone}`, 'error');
      return;
    }
    
    const contact = matched || result.contact;
    
    // Select + highlight as screen pop
    state.selectedContactId = contact.id;
    
    document.getElementById('welcome-panel').classList.add('hidden');
    document.getElementById('contact-360').classList.remove('hidden');
    
    // Show indicator
    const ind = document.getElementById('screenpop-indicator');
    const txt = document.getElementById('screenpop-text');
    txt.textContent = `SCREEN POP • ${phone}`;
    ind.classList.remove('hidden');
    ind.classList.add('flex');
    
    // Refresh full data then render
    await loadAllData();
    await renderContact360(contact.id);
    renderContactList();
    
    showToast(`Screen pop: ${contact.firstName} ${contact.lastName}`);
    
    // Optional: if in a Connect iframe environment, we could notify parent
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'CRM_SCREENPOP_COMPLETE', contactId: contact.id, phone }, '*');
    }
  } catch (err) {
    console.error('Screen pop failed', err);
    showToast('Screen pop error — see console', 'error');
  }
}

// Connect Streams API integration hooks
// These are designed to be called by a parent wrapper that loads amazon-connect-streams
window.CRMMockUp = {
  // Primary hook — call this from Streams event handlers
  screenPopByPhone: async function(phone, contactData) {
    await performScreenPop(phone);
  },
  
  // Direct contact id pop (if Connect provides internal id)
  screenPopByContactId: async function(contactId) {
    const contact = state.contacts.find(c => c.id === contactId);
    if (contact) {
      await performScreenPop(contact.phone, contact.id);
    }
  },
  
  // Allow parent or simulator to force state refresh
  refresh: refreshAllData,
  
  // Expose current state for debugging / integration tests
  getState: () => ({ ...state }),
  
  // Programmatic quick actions (useful for E2E or external tools)
  createCase: async (contactId, subject, description = '', priority = 'Medium') => {
    const created = await apiPost('/cases', { contactId, subject, description, priority });
    await loadAllData();
    return created;
  },
  logCall: async (contactId, disposition, notes = '', durationSec = 180) => {
    const c = state.contacts.find(x => x.id === contactId);
    const log = await apiPost('/call-logs', {
      contactId,
      disposition,
      notes,
      durationSec,
      ani: c ? c.phone : ''
    });
    await loadAllData();
    return log;
  }
};

// Listen for postMessage (for iframe + Amazon Connect wrapper scenarios)
window.addEventListener('message', async (event) => {
  const data = event.data || {};
  
  if (data.type === 'CONNECT_INCOMING' || data.type === 'SCREEN_POP') {
    const phone = data.payload?.phone || data.phone || data.ani;
    const contactId = data.payload?.contactId || data.contactId;
    if (phone || contactId) {
      await performScreenPop(phone, contactId);
    }
  }
  
  if (data.type === 'CONNECT_REFRESH') {
    await refreshAllData();
  }
});

// Global search wiring
function setupGlobalSearch() {
  const input = document.getElementById('global-search');
  if (!input) return;
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = input.value.trim();
      if (/^\+?\d[\d\s().-]{7,}$/.test(val)) {
        // Looks like a phone — try screen pop
        performScreenPop(val);
        input.value = '';
      } else {
        // filter contacts
        state.searchTerm = val.toLowerCase();
        document.getElementById('sidebar-search').value = val;
        renderContactList();
      }
    }
  });
  
  // Also live filter if not obviously phone
  input.addEventListener('input', () => {
    const v = input.value.trim().toLowerCase();
    if (v.length > 1 && !/^\+?\d/.test(v)) {
      state.searchTerm = v;
      document.getElementById('sidebar-search').value = input.value;
      renderContactList();
    }
  });
}

// New contact modal (simple)
function showNewContactModal() {
  const first = prompt('First name:');
  if (!first) return;
  const last = prompt('Last name:', '');
  if (last === null) return;
  const phone = prompt('Phone (E.164 or formatted):', '+1 (555) 000-0000');
  if (!phone) return;
  
  apiPost('/contacts', {
    firstName: first,
    lastName: last,
    phone
  }).then(newC => {
    state.contacts.push(newC);
    renderContactList();
    showToast('Contact created');
    selectContact(newC.id);
  }).catch(err => {
    showToast('Create failed: ' + err.message, 'error');
  });
}

function dialContact() {
  const c = state.contacts.find(x => x.id === state.selectedContactId);
  if (!c) return;
  // In a real Connect integration this would use the CCP to make outbound call
  showToast(`Dialing ${c.phone} (stub — integrate with Amazon Connect Voice in production)`);
}

function emailContact() {
  openEmailModal();
}

// Query param support for direct screen pop (iframe embed friendly)
function handleInitialQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const phone = params.get('phone') || params.get('ani');
  const contactId = params.get('contactId');
  
  if (phone || contactId) {
    // Wait until data is loaded
    setTimeout(() => {
      performScreenPop(phone, contactId);
    }, 420);
  }
}

// Initialization
async function init() {
  console.log('%c[ConnectCRM] Initializing Salesforce-style CRM for Amazon Connect...', 'color:#64748b');
  
  // Tailwind script already injected via CDN
  // Configure a bit of Salesforce navy flavor
  if (window.tailwind) {
    window.tailwind.config = {
      theme: {
        extend: {
          colors: {
            'sf-blue': '#0176D3'
          }
        }
      }
    };
  }
  
  // Boot data
  await loadAllData();
  
  // Initial filter state
  document.getElementById('filter-all').classList.add('active-filter');
  
  // Global search
  setupGlobalSearch();
  
  // Query param screen pop (very important for Connect embed)
  handleInitialQueryParams();
  
  // Make sure the app is accessible to parent frames / Connect wrappers
  window.CRMMockUp.refresh = refreshAllData;
  
  // Helpful dev note
  console.log('%c[ConnectCRM] Ready. Use window.CRMMockUp.screenPopByPhone("+15551234567") or ?phone=... in URL.', 'color:#64748b');
  
  // Optional: if loaded inside an Amazon Connect context you may see `connect` global from streams
  if (window.connect) {
    console.log('[ConnectCRM] Detected Amazon Connect Streams global. Wiring basic listeners.');
    try {
      // Example wiring — only fires if parent page also initialized CCP + Streams
      connect.contact(contact => {
        contact.onIncoming(() => {
          const phone = contact.getConnections?.()?.[0]?.getEndpoint?.()?.phoneNumber ||
                        contact.getAttribute?.('CustomerNumber') ||
                        contact.getAttributes?.()?.customerPhone?.value;
          if (phone) {
            performScreenPop(phone);
          }
        });
      });
    } catch (e) {
      // Streams not fully available — that's okay. Simulation + query param still work.
    }
  }
  
  // Expose a couple of test contacts on console for easy demo
  window.__DEMO = {
    popAlex: () => performScreenPop('+1 (555) 123-4567'),
    popJordan: () => performScreenPop('+15559876543')
  };
}

// Boot
init();
