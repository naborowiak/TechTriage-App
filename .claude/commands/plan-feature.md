# /plan-feature

Run the full multi-agent development workflow for a feature, bug fix, or refactor.

## Instructions

Follow the Multi-Agent Workflow defined in CLAUDE.md:

1. **Determine scope**: Does this task require Backend_Dev, Frontend_Dev, or both? Check the Directory Ownership Map in CLAUDE.md.

2. **Check exemption**: Does this qualify for the Small Change Exemption? (≤3 files, ≤50 lines, trivial type, no auth/payments/schema). If yes, use `/quick-fix` instead.

3. **Plan phase**: Spawn the appropriate Dev agent(s) as Task subagents using the Planning Mode prompt templates from CLAUDE.md. Pass them the task description. They produce structured plans (no code).

4. **Skeptic review**: Spawn The_Skeptic as a Task subagent using the Review Mode prompt template from CLAUDE.md. Pass it ALL plans from step 3. Wait for the verdict.

5. **Process verdict**:
   - APPROVED → proceed to implementation
   - APPROVED_WITH_CONDITIONS → note conditions, pass to implementers
   - REJECTED → feed rationale back to planners, restart from step 3

6. **Implement**: Spawn Dev agent(s) as Task subagents using the Implementation Mode prompt templates. Pass the approved plan and any Skeptic conditions. Backend_Dev implements first for cross-boundary changes.

7. **Verify**: Run `npx tsc --noEmit` and `npx vite build` to confirm no regressions.

8. **Log**: Add a Decision Log entry to CLAUDE.md between the `<!-- DECISIONS START -->` and `<!-- DECISIONS END -->` markers.

## Task to implement

$ARGUMENTS
