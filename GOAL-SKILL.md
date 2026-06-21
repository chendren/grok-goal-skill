# The /goal Skill — The Real Subject of This Repository

I created the `/goal` skill to extend Grok Build for my personal use cases.

This repository exists first and foremost to demonstrate that skill. The CRM application was used **only as a Proof of Concept** to validate the skill under realistic conditions.

## What is the `/goal` Skill?

The `/goal` skill is a structured orchestrator designed for ambitious, long-running tasks in Grok Build.

When invoked with `/goal <objective>`, it:

1. Treats the provided text as the **authoritative completion condition**.
2. Immediately creates:
   - `GOAL.md` (human-readable objective, acceptance criteria, status)
   - `.grok/goal.json` (persistent machine state)
3. Seeds a disciplined todo scaffold.
4. Enters a strict pursuit loop of **plan → execute small batch → verify immediately → record progress**.

It refuses to declare success until the deliverable has been opened and the key user flows have been proven at runtime.

## Why I Built This Skill

I created the `/goal` skill because I needed a more reliable way to tackle ambitious, multi-step projects with Grok Build. I wanted to move beyond:

- Loose conversational loops
- Custom-built agent swarms
- Incremental "just keep prompting" approaches

The `/goal` skill brings:
- Explicit success criteria from the start
- Layered verification discipline
- Mandatory runtime proof
- Self-documenting process artifacts

I built it specifically for my personal use cases.

## How the Skill Was Used Here

I gave the skill one detailed prompt describing a realistic Amazon Connect CRM requirement (used purely as a test case).

The skill then autonomously:
- Created this project's `GOAL.md`
- Broke the work into a canonical sequence of execute/verify phases
- Drove incremental implementation with constant verification
- Enforced runtime testing (actually opening the browser and running the full call flow)
- Produced high-quality documentation as a side effect

See the resulting `GOAL.md` in this repo for the actual process log.

## The POC Test Case

I deliberately chose a challenging requirement as the test workload for my new skill:

**Build a lightweight, embeddable CRM panel for Amazon Connect that supports real screen pops and bidirectional actions.**

This forced the skill to demonstrate competence across:
- Full-stack development (Node + frontend)
- External API integration (Amazon Connect Streams + postMessage)
- Persistence and state management
- Iframe compatibility
- Production-demo quality standards
- Verification under constraints

The resulting application (internally called ConnectCRM) is functional and useful as a demo — but it is secondary to the demonstration of the skill itself.

## Key Takeaways from This Exercise

- A single well-scoped `/goal` invocation can produce a complete, verified application.
- The skill naturally generates excellent artifacts (`GOAL.md`, process history).
- Strict acceptance criteria + runtime verification dramatically improves reliability.
- This approach is highly repeatable.

I created this skill for my personal workflows and am sharing this project as an example of what it enables.

## Related Concepts

| Approach                    | Characteristics                              | Strengths                     | Weaknesses                     |
|----------------------------|----------------------------------------------|-------------------------------|--------------------------------|
| Conversational LLM loops   | Back-and-forth prompting                     | Fast iteration                | Low repeatability, drift       |
| Bespoke AI agents          | Custom orchestrators & tools                 | Domain-specific power         | High maintenance, brittle      |
| `/goal` skill (this)       | Structured objective + verify discipline     | High fidelity, self-documenting, repeatable | Requires clear initial spec    |

This project serves as evidence that Grok Build now offers a strong, first-class primitive for goal-oriented delivery.

## Files That Document the Skill Usage

- `GOAL.md` — The actual goal definition and verification record
- `PROMPT.md` — The single prompt used
- `README.md` — High-level positioning of the skill as the main deliverable
- This file (`GOAL-SKILL.md`)

---

The CRM code in this repository is a byproduct. The demonstration of the `/goal` skill that I created for my personal use cases is the primary artifact.
