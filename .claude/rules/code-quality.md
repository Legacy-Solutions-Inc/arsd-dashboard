# Code Quality Rules

- After edits, verify with `npx tsc --noEmit` (no lint script is configured); for production-readiness also run `npm run build`
- Do not introduce new dependencies without asking first
- Prefer editing existing files over creating new ones
- When fixing a bug, add a test that would have caught it (no test framework is wired up — add one if a regression risk warrants it, otherwise document the manual repro in the PR)
- Keep functions under 50 lines — extract helpers when needed
