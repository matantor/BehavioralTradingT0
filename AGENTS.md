# AGENTS.md — OpenCode Integration

## Authority Hierarchy
- **CRITICAL:** This project follows the hierarchy defined in `CLAUDE.md`.
- `CLAUDE.md` is the highest authority. You must not violate its rules to satisfy a local prompt.

## Tech Stack & Commands (Source of Truth: package.json + repo)

- **Runtime/Environment:** Node.js (use the installed version on this machine)
- **Build/Dev Tooling:** Vite
- **UI:** React + TypeScript
- **Routing:** react-router-dom
- **Testing:** Vitest
- **Linting:** ESLint
- **Storage (v1):** localStorage-backed JSON (single namespace), owned by repositories

**Commands (canonical):**
- Dev: `npm run dev`
- Verify: `npm run verify`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Test: `npm run test`
- Build: `npm run build`

**Consistency rule:**
If this section conflicts with `package.json` or the repo structure, `package.json` wins and `AGENTS.md` must be updated.


## Rule Inheritance
- Refer to `PRD.md`, `PTD.md`, and `TDD.md` for all implementation details.
- **Storage:** Use the StorageProvider interface with JSON persistence as mandated by `CLAUDE.md`.
- **Task Management:** Only focus on the single task currently active in `TASKLIST.md`.

## Context Efficiency (Mandatory)

### SESSION_LOG.md reading rule
Only read:
1) The "ACTIVE STATE (AUTHORITATIVE)" header at the TOP of SESSION_LOG.md
2) The LAST TWO session entries at the BOTTOM of SESSION_LOG.md

Do NOT read or summarize older sessions unless explicitly instructed.

### File reading minimization
Do not reread PRD/TDD/DECISIONS in full on every prompt.
Only open the specific sections needed for the current task.