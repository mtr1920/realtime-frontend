# Claude Code Prompts - Frontend

Special-case prompts for specific scenarios. The main workflow is in `CLAUDE.md` (Sprint Startup Ritual, Definition of Done, Working Agreement).

---

## Resume Interrupted Session

Use when resuming task after a break or interruption.

```
Resume the interrupted development session and continue execution autonomously.

Use the **development-process/** directory as the single source of truth for status, plans, and progress tracking.

1. Restore baseline health:

   * Run all required type checks, linters, and tests.
   * Fix only issues necessary to achieve a clean, passing baseline. Do not refactor or introduce unrelated changes.

2. Read and strictly follow all instructions in `CLAUDE.md`.

3. Determine current state:

   * Inspect all plans, task trackers, and changelogs inside **development-process/**.
   * Cross-reference commit history, codebase state, and `tracker/tasks.md` to identify the next appropriate planned task that is incomplete.

4. Execute work iteratively:

   * Select one appropriate planned task.
   * Implement the task fully with real, production-ready logic.
   * Do not add new scope, features, or abstractions beyond what the task requires.

5. Post-implementation validation:

   * Invoke the most relevant review agent(s) (code review, system architecture, or other applicable specialists).
   * Address all identified issues immediately and re-run verification until the implementation is clean and aligned.

6. Documentation and state sync:

   * Update all relevant changelogs, trackers, and status files in **development-process/** to reflect completed work and current state.

7. Repeat:

   * Move to the next appropriate planned task and repeat steps 4–6 until no planned tasks remain.

Guardrails:

* Always read and understand relevant files before making changes.
* Implement correct, general solutions for all valid cases.
* Keep changes minimal and tightly scoped.
* Remove any temporary files created during the process.

```

---

## Phase Gate Check

Use when all tasks in a phase are complete.

```
Run phase gate verification for the current phase.

1. Confirm all tasks in the phase are marked `[x]` in tasks.md
2. Check if any deferred tasks were supposed to be done in this phase
3. Run: `pnpm typecheck:web && pnpm lint:web && pnpm build:web && pnpm test:web`
4. Run code-reviewer agent to check architecture compliance
5. Update tasks.md to mark phase as "Complete ✅"
6. Add phase completion summary to changelog.md

Report phase summary and wait for confirmation before starting next phase.
```

---

## Integration Sync with Backend

Use when coordinating frontend-backend integration.

```
Check frontend-backend integration compatibility.

Frontend side:
- API client in `shared/services/api-client.ts`
- WebSocket client in `features/session/services/websocket.service.ts`
- Types in `types/` directory

Backend contracts at:
- `/home/mtr/Projects/RealtimeApp/realtime-backend/packages/contracts/src/api/`
- `/home/mtr/Projects/RealtimeApp/realtime-backend/packages/protocol/`

Verify:
1. Request/response types match backend contracts
2. WebSocket message envelope format matches protocol spec
3. Auth flow (JWT → realtime token) is implemented correctly
4. Error handling matches backend error format

Report any gaps or mismatches.
```

---

## Component Development

Use when building a new component.

```
Build component: [component name]

Before writing:
1. Check if similar component exists in `shared/ui/` or current feature
2. Determine location: reusable → `shared/ui/`, feature-specific → `features/[x]/components/`

While writing:
- TypeScript interfaces for props
- `forwardRef` if component accepts ref
- `cn()` utility for conditional classes
- Keep under 300 lines
- Extract hooks if logic > 50 lines

After writing:
- Add to barrel export if public API
- Add test file
- Verify accessibility (semantic HTML, ARIA)
```

# Review and validate project

Run three specialized subagents in parallel: **ux-engineer**, **frontend-architect**, and **state-management-engineer**.

Task:

1. Read and understand the entire codebase relevant to the issue before proposing any conclusions or changes.
2. Each subagent independently reviews the code from their perspective:

   * **ux-engineer**: evaluate UI/UX behavior, user flows, accessibility, visual/state feedback, and interaction consistency.
   * **frontend-architect**: evaluate component structure, rendering logic, data flow, performance, and architectural correctness.
   * **state-management-engineer**: evaluate state ownership, synchronization, side effects, lifecycle handling, concurrency, and edge cases.
3. Verify the code actually runs and behaves as intended. Do not rely on assumptions—trace real execution paths and state transitions.
4. Identify the root cause issue(s), clearly distinguishing symptoms from underlying problems.
5. Cross-validate findings across agents and reconcile any disagreements.
6. Produce a **single consolidated fix plan** that includes:

   * The precise root cause(s)
   * Why the issue occurs
   * The minimal set of changes required to fix it
   * Files/modules to modify
   * Any risks or edge cases to watch for
7. Do **not** implement changes yet—only produce the fix plan.

Guardrails:

* Implement real reasoning based on the actual code, not hypothetical patterns.
* Keep the solution minimal; do not propose refactors, abstractions, or features that are not strictly required.
* Do not remove or rewrite working code unless necessary to fix the issue.
* If information is missing, explicitly state what must be inspected next rather than guessing.

Success criteria:

* The issue is clearly identified with evidence from the code.
* The fix plan is actionable, minimal, and unambiguous.
* All three perspectives are reflected and aligned.

