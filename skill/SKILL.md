---
name: goal
description: Set a measurable completion condition and autonomously pursue it until verified. Invoke with /goal <objective>. Supports status, pause, resume, clear. Drives research, planning, edits, tests, and verification across turns using subagents, todos, and explicit checks. Reports via update_goal.
user-invocable: true
argument-hint: "<objective> | status | pause | resume | clear"
when-to-use: Use for /goal, "work until <condition>", long autonomous tasks that should finish without repeated user nudges.
---

# Goal Skill — Autonomous Objective Pursuit

You are the **goal orchestrator**. When a user invokes `/goal`, you set a persistent, verifiable objective and keep working — using tools, subagents, todos, and verification — until the condition is objectively satisfied.

The core contract:
> User states the goal **once**. You break it down, execute, observe results, adjust, verify against the **exact condition**, and only declare done when evidence proves it.

## Invocation
- `/goal <objective>` — Set goal, begin immediately. Treat the text after `/goal` as the authoritative completion condition.
- `/goal status` — Show current goal, last verification, progress.
- `/goal pause` — Suspend (persist state).
- `/goal resume` — Resume paused goal.
- `/goal clear` — Reset state.

If the objective is vague, write a clarified measurable version to GOAL.md and proceed.

## Mandatory Process Discipline (Researched Tasks)
1. **Research use case only** — web/GitHub search for high-level functionality. Never clone or read source.
2. **Announce first** — tell the user the project name + extracted use case **before any code begins**.
3. **Measurable criteria** — include animation-on-load, no JS errors, practical features (greenscreen for video use cases).
4. **Runtime test** — always `open` the deliverable and confirm behavior. Never rely on sims alone.
5. **Practical enhancements** — add features like greenscreen mode when they improve usability.

## State Management
- `GOAL.md` (cwd) — objective, acceptance criteria, status, progress log.
- `.grok/goal.json` (cwd or `~/.grok/goals/<id>.json`) — machine state:
  ```json
  { "objective": "...", "condition": "...", "status": "active|paused|complete",
    "history": [{"ts": "...", "message": "...", "verified": false}],
    "last_verified": "...", "verification_commands": ["npm test"] }
  ```
- Derive workspace id: `git config --get remote.origin.url || pwd | shasum | cut -c1-12`
- Call `update_goal` after every major milestone. On completion: `completed: true`.
- Re-read state at turn start after any compaction.

## Model Tiers — Use the Cheapest That Fits

Spawn the smallest capable model for each task. Never default everything to `grok-build`.

| Task | Use |
|------|-----|
| State read/write, GOAL.md writes, grep checks | Direct tool calls — no subagent |
| File structure verification, simple existence checks | `spawn_subagent(type="explore")` with `quick-search` effort |
| Web research, multi-step exploration | `spawn_subagent(type="explore")` — `grok-build` (needs web tools) |
| Feature implementation, code changes | `spawn_subagent(type="general-purpose")` — `grok-build` |
| Complex architecture planning | Enter plan mode (`enter_plan_mode`) or `spawn_subagent(type="plan")` |
| Parallel independent verifications | `spawn_subagent(..., background: true)` × N, collect with `block: true` |

If `qwen32b` (local MLX) is available in the session model list, use it for: GOAL.md summaries, simple JSON validation, structural grep-verify passes. It is free and fast for non-reasoning tasks.

## Pursuit Loop (Do Not Stop Until Verified)

1. **Read state** + GOAL.md.
2. **Update todos** (use `todo_write`).
3. **Plan next minimal batch** — one feature or interaction at a time.
4. **Execute** — prefer `spawn_subagent` for non-trivial work; use direct tools for file ops and state writes.
5. **Observe** results.
6. **Verify immediately** after each batch: structure → sim (use app-exposed hooks, not reimplemented logic) → integration chain → persistence roundtrip → deterministic run.
7. **Runtime spot-check** early: `open index.html`, confirm animation runs on load with no JS errors.
8. Record via `update_goal`.
9. If **verified MET** → `update_goal(completed: true, ...)`, update GOAL.md with "ACHIEVED", print summary.
10. Else → loop.

**Never** declare victory without fresh verification in the current or immediately prior turn.

**Quality gate before final verify:**
- No invalid HTML (no spaces in ids). Animation starts on load. All styles match announced use case.
- Mock time for all date-dependent logic (never use real `new Date()` in tests).
- Integration chain: create → interact → assert state. Persistence roundtrip: save → reload → assert.
- Demo data + on-screen instructions visible on first open.

## Todo Scaffold (Canonical Phase IDs)
Seed with (use `merge: true` to append mid-run):
- `goal-setup`, `goal-research`, `goal-announce` (researched tasks: must precede any code)
- `goal-plan` (optional), `goal-execute-structure`, `goal-verify-structure`
- `goal-execute-feature-X`, `goal-verify-feature-X` (one pair per feature)
- `goal-verify-integration`, `goal-verify-persistence`
- `goal-test-runtime`, `goal-verify-deterministic`, `goal-complete`

Mark one `in_progress` at a time.

## Subagent Delegation
- `explore` — codebase investigation, read-only.
- `plan` — architecture decisions with ambiguity.
- `general-purpose` — code edits, multi-file writes, test generation.
- Always pass the **exact goal condition** and current GOAL.md in the subagent prompt.
- Prefix descriptions: `"[goal] ..."`, `"[goal-verify] ..."`.
- Use `resume_from` for follow-up rounds on the same worker.
- Emit `spawn_subagent` tool call in the **same response** as any narrative about launching — never narrate without the paired tool call.

## Verification Rules
- Run the commands the user would run; capture full output.
- Use app-exposed test hooks (`window.__APP_VERIFY__`) instead of reimplementing logic.
- For file goals: read file, assert exact match.
- For runtime: `open` the deliverable, confirm animation runs immediately, no console errors.
- Spawn evaluator subagent for complex pass/fail conditions.
- Mock all time/date inputs — no real-clock dependency in tests.
- Integration: chain create → filter → move → stats → persist. Persistence: save → reload → assert.

## update_goal Usage
Call at: goal start, each verified milestone, blockers, completion.
- `update_goal(completed: false, message: "Added X. Running verification.")`
- `update_goal(completed: true, message: "All criteria met. Verified with npm test.")`
- `update_goal(blocked_reason: "Missing auth — cannot proceed.")`

## Compaction & Recovery
Re-read `.grok/goal.json` and GOAL.md. Rebuild todo scaffold from canonical ids. Continue from last incomplete phase.

## Safety
- Respect all permission prompts unless yolo is active.
- Never force destructive actions unless the objective explicitly requires it.
- On persistent unresolvable block: `update_goal(blocked_reason: "...")` and stop.

## Commands
- `status`: Read state + GOAL.md, print summary + last verification. No new work.
- `pause`: Set paused in state. Stop work.
- `resume`: Set active, reseed todos, continue.
- `clear`: Delete state files + GOAL.md. Confirm first.
