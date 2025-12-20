# Assistant Coordination (Copilot + Gemini)

## Role Definition

- **Copilot**: Test expander and breadcrumb creator
  - Extends test coverage by uncommenting/adding harness and parity cases
  - Runs `npm run harness` to validate IR pipeline
  - Submits test failures as work items to MCP work queue (automatic in harness)
  - Checks `/sync-status` before expanding to avoid conflicts
  
- **Gemini**: Failure resolver and implementation specialist
  - Polls `/work-queue` for high-priority tasks (parse/emit/lower errors)
  - Claims work items atomically to prevent conflicts
  - Implements fixes in parser/lowerer/emitter based on work item context
  - Marks work complete after validation with `npm run harness`

## Async Workflow via MCP Work Queue

### Copilot's Workflow
1. **Expand coverage**: Uncomment/add test cases in harness or parity suite
2. **Run tests**: `npm run harness` (auto-submits failures to `/submit-work`)
3. **Check status**: `curl http://localhost:8787/sync-status` to see pending work
4. **Wait if needed**: If Gemini is active, let work items be completed
5. **Validate fixes**: Re-run harness after Gemini marks work complete
6. **Iterate**: Continue expanding coverage or switch to next feature

### Gemini's Workflow
1. **Check status**: `curl http://localhost:8787/sync-status` to see activity
2. **List tasks**: `curl http://localhost:8787/work-queue?action=list&assignee=gemini`
3. **Claim high-priority**: `curl "http://localhost:8787/work-queue?action=claim&id=X&agent=gemini"`
4. **Implement fix**: Update parser/lowerer/emitter based on context
5. **Validate**: Run `npm run harness` to verify fix
6. **Mark complete**: `curl "http://localhost:8787/work-queue?action=complete&id=X&result=fixed&agent=gemini"`
7. **Repeat**: Poll for next task

### Work Item Priority
- **High**: Parse errors, missing IR nodes, emitter crashes (blocking harness)
- **Medium**: Semantic errors, missing features, optimization failures
- **Low**: Documentation gaps, warning cleanup, refactoring suggestions

## Traditional Coordination Rules

- **Lead/Secondary**: Copilot leads on quick iterations and harness/parity-visible changes; Gemini focuses on longer refactors or background research. Either can escalate to the other on failures.
- **Escalation**: On failing tests or unclear IR/Lua semantics, ask the other assistant for a second opinion and merge the safer diff.
- **Artifacts**: Always refresh context packs (`context_pack.json`, `context_pack_gemini.json`) so both assistants share MCP endpoints and instructions.
- **Safety**: Keep MCP calls advisory and time-bounded; never block tests on MCP availability.
- **Logging**: When feasible, log suggestions/outcomes to `artifacts/assistant_journal.json` (via script) to track quality.
- **No auto-commits**: CI should not push; artifacts only.
