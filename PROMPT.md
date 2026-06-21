# The Single Prompt That Built This Project

This entire application — ConnectCRM, including the backend, UI, Amazon Connect integration, tests via verification loops, documentation, and this GitHub repository — was created from **one prompt** using Grok Build's `/goal` skill.

## The Original Prompt (verbatim)

```
/goal Build a lightweight, self-contained web UI CRM application from scratch that can be embedded as a third-party app in Amazon Connect (iframe or CCP integration) and behaves like a real Salesforce-style integrated CRM.

Requirements:
- Modern, clean, responsive web UI (Tailwind preferred) that looks and functions like a Salesforce Service Console panel.
- Full contact/lead 360° view with recent cases, interactions, and activity timeline.
- Real backend: lightweight Node.js/Express (or Fastify) API server with CRUD for Contacts, Cases, and Call Logs (use simple JSON file or in-memory DB for persistence, easy to swap with real DB).
- Real event hooks: Integrate with Amazon Connect Streams API so that on incoming call / contact creation the UI automatically does a screen pop and populates customer data (lookup by ANI/phone).
- Bidirectional sync: Agent can log call outcome, create/update a case, or update contact notes — these must be pushed back to the CRM via real API calls.
- Embed instructions: Provide a ready-to-use HTML snippet + configuration so it can be added as a third-party app in the Amazon Connect agent workspace.
- Salesforce-like features: Quick actions (Create Case, Log Call, Send Email stub), search, filters, due dates, priority.
- Demo-friendly: Seed data + a way to simulate incoming calls (either via button or real Connect integration).
- Make it production-demo ready: clean code, no console errors, proper error handling, responsive.

Acceptance criteria (must all be true to be done):
- Can be run locally with one command for frontend + backend.
- When a call comes in (via Connect Streams or simulation), the CRM UI auto-populates with matching contact + history.
- Agent can create/log a case or disposition and it persists via the real API.
- The app works when embedded as an iframe in Amazon Connect.
- All major CRM-style flows work end-to-end.
- Includes clear README with setup, embed instructions, and curl examples for the APIs.
- Verified by actually opening the app, simulating a full call → data population → log outcome flow with no JS errors.

Follow the goal skill process strictly: create detailed GOAL.md, use incremental execute + verify cycles, layered testing (structure + integration + runtime), and only declare complete when the runtime deliverable actually works as a real integrated CRM inside Amazon Connect.
```

## What Happened Next

- The `/goal` orchestrator immediately:
  1. Created `GOAL.md` capturing the objective + parsed acceptance criteria.
  2. Initialized `.grok/goal.json` for machine state.
  3. Seeded a strict todo scaffold with canonical phases (goal-setup → goal-plan → many execute/verify pairs → goal-test-runtime → goal-complete).
  4. Followed the pursuit loop religiously: read state, update todos, execute small batches, observe, **verify immediately** at multiple layers, record via `update_goal`.

No clarifying questions were asked (per steering rules for vibe/spec prompts). The model treated the entire block as the authoritative completion condition.

The result is what you see in this repository.

This demonstrates a repeatable pattern for ambitious, verifiable software delivery using Grok Build.
