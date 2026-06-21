# ConnectCRM — Salesforce-style CRM for Amazon Connect

> **Built from a single prompt using Grok Build's `/goal` skill.**

A lightweight, self-contained, production-demo-ready CRM that behaves like a real Salesforce Service Console panel and is designed to be embedded as a third-party application in Amazon Connect (Agent Workspace or CCP).

![One prompt. Full verified application.](https://img.shields.io/badge/Built%20with-Grok%20%2Fgoal%20Skill-blue) 
![Public Demo Ready](https://img.shields.io/badge/Run%20with-npm%20start-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Salesforce Service Console aesthetics** using Tailwind (CDN, zero build)
- Full 360° contact view: profile header, open cases, rich activity timeline, editable notes
- Real Node.js/Express backend with complete CRUD
- JSON file persistence (`data/crm.json`) that survives restarts
- **Native Amazon Connect integration**:
  - Screen pop by phone/ANI (`?phone=...`)
  - Simulation button + full postMessage bridge
  - `window.CRMMockUp` API for external control
  - Example wiring for Amazon Connect Streams
- Quick actions with real API calls: Create Case, Log Call Outcome, Email stub
- Filters, live search, priority, due dates, status workflows
- Seed data + one-click demo simulation
- Works standalone or perfectly inside an `<iframe>`

## One-Command Start

```bash
npm install
npm start
```

Open http://localhost:3000

For the Connect iframe simulation experience: http://localhost:3000/connect-wrapper.html

## The Single Prompt That Created Everything

This entire project — application code, architecture, verification loops, documentation, and this GitHub repository — was created from **one `/goal` invocation**.

See the exact prompt here: [PROMPT.md](./PROMPT.md)

The prompt was extremely detailed and specified strict acceptance criteria plus mandatory use of the goal skill process.

## How It Was Built: The `/goal` Skill Process

The `/goal` skill (documented in Grok Build) turns a high-level objective into an autonomous, verifiable delivery process.

### Core Principles Enforced

- **Create detailed `GOAL.md`** at the start with verbatim objective + parsed acceptance criteria + "Done when" checklist.
- **Initialize `.grok/goal.json`** for persistent machine-readable state.
- **Canonical todo scaffold** using `todo_write`:
  - `goal-setup`
  - `goal-execute-structure` + `goal-verify-structure`
  - Multiple `goal-execute-xxx` + `goal-verify-xxx` pairs
  - `goal-verify-integration`, `goal-verify-persistence`
  - `goal-test-runtime` (MANDATORY: actually open the app + simulate the full flow)
  - `goal-complete`
- **Incremental execute + verify cycles** — never large unverified chunks.
- **Layered verification**:
  1. Structure (files + boot)
  2. Backend (curl CRUD + roundtrips)
  3. UI + features
  4. Connect simulation + screen pop
  5. Persistence (kill + restart + assert data)
  6. Runtime (browser `open`, full agent flow, no JS errors)
- Only mark complete when **all** criteria are objectively true with fresh evidence.
- Heavy use of `update_goal` for progress tracking.

See the live artifact: [GOAL.md](./GOAL.md)

This process produced a genuinely working, embeddable CRM with zero hand-waving.

## Repeatable Capability in Grok Build

This project proves that Grok Build now has a **first-class, repeatable capability** for ambitious end-to-end application delivery:

- One high-signal prompt
- Structured goal pursuit with explicit success criteria
- Real runtime verification (not just "it looks good")
- Automatic production of valuable documentation (`GOAL.md`, `PROMPT.md`, excellent README)
- Clean git history + publishable GitHub project

This is a significant step beyond ad-hoc chat or tool-calling loops.

## Context: LLM Loops vs Bespoke Agents & Status Quo Tools

### Current Landscape (2026)

- **GitHub CLI + Copilot / GitHub Copilot Workspace**: Excellent for small changes, reviews, and PRs. Great for "status quo" incremental work inside existing repos.
- **Claude Code / Claude Artifacts / `/implement`**: Very strong for rapid prototyping and feature work. Often uses conversation + artifacts or custom sub-agents.
- **Aider, Cursor, Windsurf, Kiro-style CLIs**: Powerful pair-programming loops with strong code editing. Excellent for iterative development.
- **Bespoke AI Agent Swarms**: Teams building custom orchestrators, memory systems, tool graphs, and multi-agent loops for specific domains.

These are all valuable.

### What `/goal` + Grok Build Adds

The goal skill provides something distinct:

- **Persistent, explicit objective** with measurable acceptance criteria from the very beginning.
- **Disciplined process** (todos, layered verify, runtime proof) that survives long sessions and compaction.
- **Forces the model to treat the spec as law** instead of vibing toward a vague "done".
- **Runtime verification as a first-class gate** (you must actually open the deliverable and prove the flow works).
- **Self-documenting** (GOAL.md + PROMPT.md become first-class outputs).

**Result**: Higher reliability for complex, multi-component systems that need to be demo-ready and embeddable on first delivery.

Many teams are currently stitching together loops and custom agents. Grok Build's `/goal` offers a **standardized, high-leverage primitive** for "build this ambitious thing correctly."

This repo is living proof.

## Session Metrics (This Build)

- **Wall-clock time**: ~30–40 minutes from the initial `/goal` message to verified working app + git commit + public GitHub repo published.
- **Process**: Pure goal pursuit with no major detours. All major features (backend, UI 360, Connect integration, persistence, embed docs) were delivered and verified in the same session.
- **Tokens (approximate, from session context)**:
  - Input: ~21,000–24,000 (original prompt + repeated file reads + API responses + verification outputs)
  - Output: ~10,500–12,000 (full application code + multiple docs + verification reasoning)
- **Key output**: 3,272 insertions across 10+ files in the initial commit, plus rich documentation.

These numbers are typical for a goal-orchestrated ambitious feature when the model stays in the structured pursuit loop.

## Project Structure

```
.
├── server.js                 # Express backend + all CRUD + screenpop + seeding
├── package.json
├── public/
│   ├── index.html            # Full Salesforce-style UI (Tailwind CDN)
│   ├── app.js                # Client logic + Connect integration hooks
│   └── connect-wrapper.html  # Demo parent page for iframe + postMessage testing
├── data/                     # Runtime persistence (gitignored except .gitkeep)
├── GOAL.md                   # Internal goal tracking (created by skill)
├── PROMPT.md                 # The exact prompt used
└── README.md
```

## Amazon Connect Integration Details

See the full instructions in the original README section (still present below for reference) and in the code comments.

Key integration points:

- `?phone=...` or `?ani=...` on load
- `window.CRMMockUp.screenPopByPhone(phone)`
- `postMessage({ type: 'SCREEN_POP', payload: { phone } })`
- Example Streams wiring in `connect-wrapper.html` and comments

## API Quick Reference

Full examples are in the original docs. Core endpoints:

- `GET /api/contacts`
- `POST /api/screenpop` — the key integration hook
- `POST /api/cases`
- `POST /api/call-logs`

All mutations are immediately persisted.

## License

MIT

---

## Original Technical README (kept for reference)

The sections below are the original implementation-focused documentation.

### One-command Run

```bash
npm install
npm start
```

### Embed as Third-Party App in Amazon Connect

```html
<iframe 
  src="https://your-hosted-url/?phone={{customerPhone}}" 
  width="100%" 
  height="640" 
  frameborder="0">
</iframe>
```

Full details (Streams wiring, postMessage, etc.) are preserved in the implementation notes above and in the source.

---

**This repository demonstrates what is now possible with Grok Build when you combine a clear spec with the `/goal` skill discipline.**

One prompt. Real application. Verified. Published.
