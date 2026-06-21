# The Prompt That Demonstrated the /goal Skill

This repository (`grok-goal-skill`) exists primarily to demonstrate the `/goal` skill that I created to extend Grok Build for my personal use cases.

A realistic requirement to build a lightweight Salesforce-style CRM for Amazon Connect embedding was used **strictly as a Proof of Concept** to test the skill.

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

## What This Prompt Was Really Testing

The CRM requirements were deliberately chosen because they are:

- Non-trivial
- Require full-stack work
- Involve real external integration (Amazon Connect)
- Demand bidirectional state
- Need to work in an iframe context
- Require production-demo quality with zero errors

This made it an excellent test case for the `/goal` skill I created for my personal use cases.

See [GOAL-SKILL.md](./GOAL-SKILL.md) for how the skill processed this prompt.
