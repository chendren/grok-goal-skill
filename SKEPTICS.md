# Skeptics

Direct answers to the objections developers actually make about this kind of project.

---

## "The model self-reported that it passed. That's not verification."

Correct — and that's why `verify.js` exists. Run it yourself:

```bash
npm start &
node verify.js
```

`verify.js` is 200 lines of plain `fetch()` calls. It starts the server, hits every API endpoint, checks seed data, runs a screen pop against a known ANI, creates contacts/cases/logs, asserts validation rejects bad input, and confirms persistence on re-fetch. It has no dependency on Grok, no LLM, and no knowledge of how the app was built. Exit 0 means it passed. Read the source and decide whether you trust it.

The SKILL.md also mandates that the verification subagent be spawned separately from the implementation subagent — explicitly without access to the implementation context — so it is writing assertions against GOAL.md criteria, not rubber-stamping output it helped produce.

---

## "This is just a system prompt. Any experienced prompter does this."

Partly true. The skill is a structured system prompt. What it adds over ad-hoc prompting:

- Forces measurable acceptance criteria before any code is written. Vague goals get rejected.
- Enforces a specific failure mode: the model cannot declare completion without a runtime test (`open` + no JS errors). Most ad-hoc loops skip this.
- External state (GOAL.md, goal.json) survives compaction. The objective does not drift as context compresses.
- The pursuit loop is explicit and mechanical. The model follows it rather than re-inventing its approach each turn.

The question is not whether a skilled prompter could replicate this. It is whether they do, consistently, across every project. The skill makes it the default.

---

## "The model parameter hints in SKILL.md don't actually work — spawn_subagent uses model: inherit."

This was a real defect in an earlier version, now corrected. The tier table in SKILL.md describes advisory session behavior, not `spawn_subagent` parameters:

- `grok-composer-2.5-fast` means: switch the active session model before spawning a lightweight subgoal
- `grok-build` means: use the default session model (no change needed)

The table is guidance for how to set context, not a spawn-time API claim. The bundled Grok Build agents inherit from the session model, so choosing the right session model before spawning controls what runs.

---

## "The skill can get stuck in an infinite loop and burn all your tokens."

`goal.json` includes a `max_turns` field. When the pursuit loop reads state at turn start, it checks whether `turns_used >= max_turns` and surfaces a status update instead of continuing. Default is 25 turns, overridable in the initial goal.json write.

The skill also checkpoints state at the start of each turn, not only after milestones, so a compaction event does not cause the loop to restart from scratch.

---

## "The state file is written by the same model that controls the loop. It can lie."

It can. All persistent state here is advisory — the model writes GOAL.md and goal.json as working documents, not as cryptographically signed evidence. The authoritative evidence is `verify.js` output and the git history.

If you need tamper-evident goal state, that requires an external observer process that the model cannot write to. This skill does not claim to provide that.

---

## "The CRM is a toy. It doesn't prove this approach works on hard problems."

The CRM is the test workload, not the deliverable. Whether this approach works on your hard problem depends on how measurable you can make the acceptance criteria. The skill is as useful as the spec you give it.

For harder problems: use `/plan` first to get acceptance criteria reviewed before `/goal` runs. The skill explicitly supports this handoff.

---

## "The workspace ID cache will go stale if the git remote changes."

Correct. The cache (`.ws-<cwd-hash>.id`) is keyed on the working directory path, not the remote URL. If you change the remote and need a fresh workspace ID, delete the cache file:

```bash
rm ~/.grok/goals/.ws-*.id
```

This is a documented, acceptable tradeoff for a demo-context tool.
