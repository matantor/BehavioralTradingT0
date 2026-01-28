# VERIFYING.md — Verification Contract

Claude must verify its work before claiming completion.

## Verification Ladder (run in order)
1. Lint / formatting
2. Type checking
3. Unit tests
4. Build
5. Smoke test (user flows)

## Reporting Requirements
Every completion message must include:
- Exact commands run
- Pass/fail result
- If failed: what failed, what changed, rerun output

## If Verification Commands Do Not Exist
- Do NOT claim verification.
- Create the missing commands/scripts as part of the task.
- Then run them and report results.

## If Execution Is Impossible
- State exactly why (environment, missing deps).
- Run the next-best checks.
- Provide a manual verification checklist.

## Minimum Smoke Flows
These flows must always work after UI changes:
- `/` → onboarding or dashboard redirect
- Dashboard navigation cards
- Portfolio list → position detail
- Journal add → filter → detail
- Thoughts list → thought detail
- Link items → relation appears
- Settings → reset data
