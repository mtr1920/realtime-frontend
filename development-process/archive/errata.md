# Errata and Updates

This file documents known divergences between the plan documents and the current repository state. It is additive and does not replace the original content.

## Known Divergences
1) Path rename
   - The original DevelopmentProcess path has been renamed to development-process.
   - References that still point to DevelopmentProcess should be treated as historical.

2) Originals removed
   - The originals/ directory has been removed to reduce redundancy.
   - Historical references in frontmatter remain for provenance only.

3) Tracker status drift
   - tracker/tasks.md marks Authentication (Phase 2) as not started.
   - The codebase already includes auth flows (LoginForm, AuthProvider, auth store, and ProtectedRoute).

4) file-tree.txt snapshot
   - file-tree.txt is a snapshot and does not reflect the current repo shape (it omits .claude and some package-level details).
