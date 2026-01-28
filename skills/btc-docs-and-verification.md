---
name: btc-docs-and-verification
description: >
  Behavioral Trading Companion documentation + verification discipline.
  Use this skill when completing tasks, changing schemas/contracts, or making architecture decisions.
version: 1.0.0
---

# BTC Docs + Verification Discipline

## Purpose
Keep the repo trustworthy across sessions by enforcing:
- verification before “done”
- consistent documentation updates
- strict separation of decisions vs implementation logs

---

## When to use this skill
Use when:
- a task is completed
- schemas or service contracts change
- storage/migration changes
- routing/navigation structure changes
- you are asked “what changed?” or “is this aligned with docs?”

---

## Non-negotiables
### Verification
- Do not claim completion unless `npm run verify` passes.
- If verify passes with warnings (e.g., toolchain warnings), note them explicitly but do not treat them as failures unless tests/lint/typecheck/build fail.

### SESSION_LOG.md
Append an entry when a task completes that includes:
- goal
- work completed (bullet list)
- files created/modified
- verification output summary (lint/typecheck/test/build)
- status + next step

### TDD.md
Update TDD only when it affects:
- entity schemas
- service contracts
- storage schema/migrations
- testing strategy that changes the expected contracts

### PRD.md / PTD.md
Update only when:
- product scope, features, or flows change
- route map / pillar definitions change
- acceptance criteria or user flows change

### DECISIONS.md
Only add a Decision when it is:
- stable
- architectural/tooling/scope-boundary
- likely to remain true for months

Never put task logs, implementation detail, or brainstorming into DECISIONS.md.

---

## “Which doc do I edit?” quick rule
- “We decided X forever” → DECISIONS.md
- “We built X in this task” → SESSION_LOG.md
- “The system contract/schema is X” → TDD.md
- “The product behavior/flow is X” → PRD/PTD.md
