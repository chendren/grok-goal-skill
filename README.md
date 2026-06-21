# grok-goal-skill

**This skill did not exist in Grok Build.** I created it after seeing the power of structured autonomous looping in Claude Code’s `/goal` and the Ralph Wiggum technique. LLM looping until a clear goal is verifiably met is far more powerful than bespoke agents or constant manual prompting. This is my personal extension for Grok Build.

## Origin & Motivation

After using Claude Code’s `/goal` and the Ralph Wiggum looping pattern, the difference became obvious:

- Ad-hoc prompting and custom one-off agents create high friction and inconsistent results.
- **Persistent, goal-driven looping** with clear verification is dramatically more reliable for complex work.

Grok Build did not have an equivalent first-class mechanism, so I built one as a personal extension.

This repo exists to illustrate the repeatable pattern:

**Clear objective + /goal skill discipline → High-reliability delivery**

It shows the difference between traditional LLM loops / bespoke agents and the structured, verifiable goal pursuit I created for my personal use cases.

## What This Repo Actually Is

- A **demonstration** of the `/goal` skill in action.
- A **case study** in structured, goal-driven development using Grok.
- Evidence that complex, multi-component applications with real integration requirements (Amazon Connect screen pop + bidirectional sync + iframe embedding) can be delivered with high fidelity using the goal skill process.

The included CRM application is **not** the point. It is the test workload.

## How This Project Was Built

Everything here (application + all documentation) was generated from **one prompt** using the `/goal` skill.

See the exact prompt: [PROMPT.md](./PROMPT.md)

The skill enforced:
- Explicit `GOAL.md` with measurable acceptance criteria
- Canonical todo-driven execute + verify cycles
- Layered testing (structure → backend → integration → persistence → runtime)
- Mandatory real runtime verification ("open the app and prove the full flow works")
- Self-documenting outputs

Full details: [GOAL-SKILL.md](./GOAL-SKILL.md)

## The POC Workload (CRM)

To properly test the skill, I chose a non-trivial real-world scenario:

- Build a Salesforce-style CRM panel that can be embedded in Amazon Connect
- Must support real screen pops via ANI/phone
- Must support bidirectional actions (create case, log call outcome) that persist via real APIs
- Must work when loaded as an iframe
- Must be runnable with one command
- Must be production-demo ready with zero console errors

This requirement forced the skill (and the model) to handle:
- Full-stack development
- External system integration (Amazon Connect Streams)
- Persistence
- UI/UX constraints
- Verification under realistic constraints

The resulting CRM (called ConnectCRM internally) is a solid, self-contained demo — but its real value is proving what the `/goal` skill can achieve.

## Key Artifacts

| File              | Purpose |
|-------------------|--------|
| `GOAL.md`         | The live goal definition and verification log created by the skill |
| `PROMPT.md`       | The single prompt that triggered the entire build |
| `GOAL-SKILL.md`   | Deep explanation of the `/goal` skill and how it was used |
| `README.md`       | This file — positions the skill as the primary deliverable |

## Session Results

- Built from **one prompt**
- All acceptance criteria met with runtime proof
- Full working application + high-quality documentation
- Clean git history and public GitHub project
- Approximate duration: 30–40 minutes of active work

See the metrics and process details in the documentation files.

## Why This Matters

I built this skill for my own workflows because I needed a more disciplined way to deliver complex projects with Grok Build. This repo exists to illustrate the repeatable pattern I use:

**Clear objective + `/goal` skill discipline → High-reliability delivery**

It shows the difference between traditional LLM loops and bespoke agents and the structured, verifiable goal pursuit I created for my personal use cases.

## Running the POC

```bash
npm install
npm start
```

Open http://localhost:3000 to see the CRM that was built as the test case.

The technical implementation details are still present in the code and older sections of the docs for reference.

## Attributions & Sources

The ideas and patterns behind this skill come from:

- **Geoffrey Huntley** — Ralph Wiggum technique (the original “autonomous loop until done” pattern)  
  https://ghuntley.com/ralph/

- **Anthropic** — Claude Code `/goal` command  
  https://code.claude.com/docs/en/goal

- **xAI** — Grok Build platform  
  https://x.ai/news/grok-build-cli

- **Amazon Connect** (used in the proof-of-concept)  
  - Streams API: https://github.com/amazon-connect/amazon-connect-streams  
  - Third-party apps: https://docs.aws.amazon.com/connect/latest/adminguide/3p-apps.html

- **Salesforce CTI patterns** (reference for realistic CRM integration behavior)  
  https://github.com/amazon-connect/amazon-connect-salesforce-cti

## Mentors

Special thanks to my mentors for their guidance, insights, and inspiration in AI, agentic systems, Amazon Connect, and generative AI patterns:

- Chris Lott ([@chrislott](https://github.com/chrislott))
- Court Schuett ([@schuettc](https://github.com/schuettc))

## License

MIT

---

**This is primarily a demonstration of the `/goal` skill I created for my personal use cases. The CRM was only the Proof of Concept used to validate it.**