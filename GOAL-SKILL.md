# The /goal Skill in Grok Build

This document explains the skill that was used to build ConnectCRM from a single prompt.

## What is the `/goal` Skill?

The goal skill is a structured orchestrator for long-running, ambitious tasks in Grok Build / xAI's Grok tooling.

When you invoke `/goal <detailed objective>`, the system:

1. Treats the text after `/goal` as the **authoritative completion condition**.
2. Immediately writes:
   - `GOAL.md` (human-readable objective + acceptance criteria + status)
   - `.grok/goal.json` (machine state)
3. Seeds a strict todo list using the canonical phase pattern.
4. Enters a disciplined **pursuit loop**:
   - Read current state + GOAL.md
   - Update todos (one `in_progress` at a time)
   - Plan the next minimal valuable batch
   - Execute
   - Observe results
   - **Verify immediately** (multiple layers)
   - Record progress with `update_goal`
   - Loop until all criteria are met with evidence

It only declares success when the runtime deliverable has been opened and proven.

## Key Artifacts

- **GOAL.md**: Lives in the project root. Contains the original objective, parsed acceptance criteria, status, and a progress log.
- **.grok/goal.json**: Internal state for resuming across sessions/compaction.
- **todo_write tool**: Used heavily to maintain visible progress with phases like:
  - `goal-setup`
  - `goal-execute-structure` / `goal-verify-structure`
  - `goal-execute-feature-X` / `goal-verify-feature-X`
  - `goal-verify-integration`
  - `goal-verify-persistence`
  - `goal-test-runtime`
  - `goal-complete`

## The Discipline (Mandatory Patterns)

From the skill definition:

- **Layered verification** from the very beginning (structure → integration → persistence → deterministic runtime).
- **Runtime test is non-negotiable**: "Actually open the deliverable... confirm working... no errors."
- **Incremental batches**: Small feature + immediate verify instead of big-bang implementation.
- **Persistence roundtrips**: Save → restart → assert exact state.
- **No sloppiness**: Real evidence required before marking complete.
- Use of `update_goal(completed: true)` only after successful final verification.

## How This Project Used the Skill

1. User issued a rich `/goal` prompt with explicit requirements + strict acceptance criteria.
2. The orchestrator created `GOAL.md` and the todo scaffold in the first steps.
3. Work proceeded through many execute/verify pairs.
4. Every major capability (CRUD, UI 360, screen pop, quick actions, persistence, iframe compatibility) was implemented and **verified** before moving on.
5. Final `goal-test-runtime` phase: server started, browser opened (`open http://localhost:3000`), full flow executed (incoming call simulation → contact populated → case created → call logged → data survived restart) with zero JS errors.
6. Only after all criteria were demonstrably true was the goal marked complete.
7. We then committed the work and published this public repository.

## Why This Matters

Traditional LLM usage often relies on:
- Long conversational loops ("make this better", "now add X")
- Custom agent frameworks that the user must maintain

The `/goal` skill provides a **standardized, high-signal, verifiable delivery primitive** inside Grok Build.

Benefits observed in this project:
- Extremely high requirement fidelity (the spec was treated as law)
- Excellent self-documentation
- Strong evidence of correctness (runtime proof)
- Fast path from idea to shareable, production-demo-quality artifact

This pattern is now repeatable for other ambitious projects.

## Related Concepts

- **LLM Loops**: Iterative back-and-forth (Aider, Cursor, Claude Artifacts, custom ReAct loops).
- **Bespoke Agents**: Custom-built multi-agent systems for narrow domains.
- **Goal-Oriented Execution**: Explicit objective + acceptance criteria + structured verification (what `/goal` brings).

We believe a mature combination of all three will be common, but having first-class goal pursuit as a built-in capability dramatically increases leverage for "build this real thing" requests.

## Files Related to This Skill in the Repo

- `GOAL.md` — The live goal tracking file for this project
- `PROMPT.md` — The exact prompt that triggered the skill
- `.grok/goal.json` — Machine state (committed for transparency)
- This `GOAL-SKILL.md` — Explanation

---

The ConnectCRM project is a reference implementation of what high-quality, single-prompt, goal-driven development looks like in Grok Build.
