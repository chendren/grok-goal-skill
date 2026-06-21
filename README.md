# ConnectCRM — Salesforce-style CRM for Amazon Connect

Lightweight, self-contained, production-demo-ready CRM panel that can be embedded as a third-party application inside Amazon Connect (Agent Workspace / CCP iframe).

## Features
- Modern Salesforce Service Console look and feel (Tailwind)
- Full 360° Contact view: profile, cases, activity timeline, editable notes
- Real Node.js + Express backend with CRUD APIs
- JSON file persistence (`data/crm.json`) — survives restarts
- **Amazon Connect integration**:
  - Screen pop by ANI/phone (query param or simulation)
  - Full bidirectional sync — agent actions (Create Case, Log Call, Update Notes) POST/PUT to real APIs
  - `window.CRMMockUp` + `postMessage` bridge for Streams API integration
- Quick actions: Create Case, Log Call Outcome (disposition), Email stub
- Filters, search, due dates, priority pills, status workflows
- Seed data + one-click simulation for demos
- Works as standalone or embedded iframe

## One-command Run

```bash
npm install
npm start
```

App runs at: http://localhost:3000

## Demo Flow (Full End-to-End)

1. Open http://localhost:3000
2. Click **Simulate Incoming Call** → choose a seeded contact (e.g. Alex Rivera)
3. UI auto-populates with the contact 360° view + history (screen pop)
4. Click **Create Case** — fill and create. Case appears immediately.
5. Click **Log Call** — choose disposition + notes. Call appears in timeline.
6. Edit notes in the right panel and click SAVE (or blur).
7. Refresh page / restart server — all data persists.
8. Test `?phone=+15551234567` in URL to screen pop directly.

## API Examples (curl)

Health:
```bash
curl http://localhost:3000/api/health
```

List contacts:
```bash
curl http://localhost:3000/api/contacts
```

Screen pop lookup (real integration point):
```bash
curl -X POST http://localhost:3000/api/screenpop \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1 (555) 123-4567"}'
```

Create a case:
```bash
curl -X POST http://localhost:3000/api/cases \
  -H "Content-Type: application/json" \
  -d '{
    "contactId":"c_001",
    "subject":"Urgent shipping delay",
    "description":"Customer waiting on 3 pallets",
    "priority":"High",
    "dueDate":"2026-06-25T17:00:00.000Z"
  }'
```

Log a call:
```bash
curl -X POST http://localhost:3000/api/call-logs \
  -H "Content-Type: application/json" \
  -d '{
    "contactId":"c_001",
    "disposition":"Resolved",
    "notes":"Customer happy after credit applied.",
    "durationSec": 312,
    "ani":"+15551234567"
  }'
```

## Embed as Third-Party App in Amazon Connect

### Simple iframe (quick test)
```html
<iframe 
  src="https://your-hosted-crm.example.com/?phone={{customerPhone}}" 
  width="100%" 
  height="600" 
  frameborder="0"
  allow="microphone; camera">
</iframe>
```

### Recommended production pattern

1. Host this app (or a copy) at a stable HTTPS URL.
2. In Amazon Connect:
   - Go to **Agent Workspace** configuration (or legacy CCP)
   - Add a **Third-party application** / custom iframe panel
   - Use a URL template that includes the phone number or contact attributes:
     ```
     https://your-crm-host/?phone={{CustomerNumber}}&contactId={{ContactId}}
     ```
3. (Advanced) Load Amazon Connect Streams in a parent page and forward events:

```js
// Example parent wrapper (host this + iframe the CRM)
connect.contact(contact => {
  contact.onConnecting(() => {
    const phone = contact.getInitialConnection()?.getEndpoint()?.phoneNumber;
    const frame = document.getElementById('crm-frame');
    if (frame && phone) {
      frame.contentWindow.postMessage({
        type: 'SCREEN_POP',
        payload: { phone }
      }, '*');
    }
  });
});
```

The CRM listens to `postMessage` with `type: 'SCREEN_POP'` or `'CONNECT_INCOMING'`.

You can also call the exposed bridge from browser console:
```js
document.querySelector('iframe').contentWindow
  .CRMMockUp.screenPopByPhone('+15551234567');
```

## Local Development Notes

- All changes to contacts/cases/logs are saved to `./data/crm.json`
- To reset demo data, simply delete `data/crm.json` and restart
- Tailwind served via CDN (zero build step)
- The app is designed to be resilient when embedded

## Phone Matching

Lookup normalizes to the last 10 digits of the phone number. This works with almost all real ANI formats coming from Connect.

## Production Readiness Checklist (Demo Grade)

- Clean responsive UI with no JS errors on load and flows
- Real backend API (no mocks)
- Persistence across restarts
- Full screen pop + create/log roundtrip verified
- Iframe compatible
- Clear embed + integration docs

## License

MIT — use freely for demos, workshops, and POCs.
