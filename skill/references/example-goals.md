# Example Goals for /goal

Use these as models when writing objectives. Good goals are **specific**, **measurable**, and **verifiable** with concrete commands or file assertions.

## Excellent (Recommended)

```
All tests under tests/ pass (`npm test -- --coverage`), eslint reports 0 errors, and the new "Quick Start" section in README.md exactly matches the three code snippets in docs/examples.md.
```

```
A new file `dist/bundle.js` is produced by `npm run build`, its size is under 180kB (gzip), and `node -e "require('./dist/bundle.js')" ` runs without throwing.
```

```
Create src/utils/sum.ts exporting `export function sum(a: number, b: number): number`. Add tests/utils.test.ts with at least 4 cases (positives, negatives, zero, large). `npm test` passes with 0 failures. tsc --noEmit succeeds.
```

```
The Contact Flow "MainMenu" transfers on digit 1 to queue "Sales" and on digit 2 to "Support". Verified by grepping the exported flow JSON for the expected transfer block ARNs and running the local flow simulator with sample DTMF.
```

## Good Enough

```
hello-goal.txt exists in cwd and contains exactly the string "GOAL ACHIEVED" with no leading/trailing whitespace or extra newlines.
```

```
The auth module is migrated to the v2 client. All existing auth tests still pass and no calls to the deprecated v1 SDK remain in src/auth/.
```

## Poor (Too Vague — Clarify First)

- "Improve the auth system"
- "Finish the dashboard"
- "Make everything work"
- "Add the feature"

When given a vague goal, first write a clarified version into GOAL.md with explicit acceptance criteria and verification steps, then proceed.

## Tips for Writing Conditions

1. Name the exact verification command(s) the user would run.
2. Specify file contents or exact output when possible.
3. Include non-functional requirements when relevant (size, latency, error rate).
4. List side-effects that must **not** occur ("no new console.errors", "existing tests unaffected").
5. Use "and" to combine independent checks.
6. Prefer "exactly matches" over "contains" when precision matters.

## Using with Other Commands

```
/goal <obj>          # Start
/always-approve      # Or /yolo — for hands-free
# ... walk away ...

/goal status
/goal pause
/goal resume
/goal clear
```

For background:

```
/loop 10m /goal pursue   # (or schedule a check that resumes)
```

Start large ambiguous goals with `/plan` first, then fold the approved plan into the goal objective.
