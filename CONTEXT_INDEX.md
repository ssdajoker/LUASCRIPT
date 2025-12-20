# LUASCRIPT Context Index

**Central guide for navigating context files, instruction sets, and agent workflows.**

---

## 📋 Instruction Files by Purpose

### For Copilot Agent
- **[copilot-instructions.md](copilot-instructions.md)** — Copilot-specific rules, expected behaviors, and collaboration guidelines
- **[COPILOT_GEMINI_HANDOFF.md](COPILOT_GEMINI_HANDOFF.md)** — Latest handoff notes and work-queue state from Copilot to Gemini

### For Gemini Agent
- **[gemini-instructions.md](gemini-instructions.md)** — Gemini-specific operating instructions and constraints
- **[GEMINI.md](GEMINI.md)** — Quick-reference context guide for Gemini: lists workflows, rules, and triggers

### Shared / Coordination
- **[assistant_coordination.md](assistant_coordination.md)** — Shared protocol, priorities, MCP work-queue, and coordination rules
- **[DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)** — Team development practices including code review, auto-merge, and amend workflows

---

## 🔄 Automation & Workflows

### GitHub Actions Workflows
Located in `.github/workflows/`:
- **parity-ir.yml** — Main CI gate: runs parity tests + IR report + perf checks
- **auto-merge.yml** — Auto-enables GitHub squash auto-merge on PR approval + green CI
- **auto-fix-bot.yml** — Auto-commits IR/parity fixes on CI failure; updates PR

### MCP Work-Queue
- Track via **assistant_coordination.md** `[MCP-WORK-QUEUE]` section
- Add/update with `npm run mcp:serve` logs
- Coordinate handoffs in **COPILOT_GEMINI_HANDOFF.md**

---

## 📖 How to Load Context

### For Quick Debugging
1. Read: [GEMINI.md](GEMINI.md) or [copilot-instructions.md](copilot-instructions.md) (depending on agent)
2. Skim: [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) (auto-merge + amend workflow sections)
3. If coordination needed: [COPILOT_GEMINI_HANDOFF.md](COPILOT_GEMINI_HANDOFF.md) (latest state)

### For Bug Fixes / Feature Work
1. Load: [assistant_coordination.md](assistant_coordination.md) (priorities + MCP state)
2. Load: [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) (branch/commit guidance)
3. Load: agent-specific instructions ([copilot-instructions.md](copilot-instructions.md) or [gemini-instructions.md](gemini-instructions.md))
4. Cross-ref: [COPILOT_GEMINI_HANDOFF.md](COPILOT_GEMINI_HANDOFF.md) (if agent coordination needed)

### For Infrastructure / CI Work
1. Load: [GEMINI.md](GEMINI.md) (.github/workflows/ references)
2. Load: [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) (auto-merge + CI sections)
3. Load: `parity-ir.yml`, `auto-merge.yml`, `auto-fix-bot.yml` (from `.github/workflows/`)

---

## 🎯 Workflows by Use Case

### Code Review & Merging
- Read: [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) § "Code Review Requirements" + "Auto-merge"
- Trigger: Approval + Parity and IR Gates pass → auto-merge enables automatically

### Conflict Resolution
- Read: [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) § "Amend Workflow"
- Use: `git commit --amend --no-edit` + `git push --force-with-lease`
- Note: auto-fix-bot may auto-commit; wait for completion before re-pushing

### New Feature Development
1. Read: [assistant_coordination.md](assistant_coordination.md) (priorities)
2. Read: agent-specific instructions
3. Create feature branch from main
4. Work in non-draft PR for CI validation
5. Request review → auto-merge triggers on approval

### Agent Handoff / Coordination
1. Update: **COPILOT_GEMINI_HANDOFF.md** with current state, blockers, next steps
2. Set **MCP-WORK-QUEUE** in **assistant_coordination.md**
3. Both agents monitor this file for work-queue updates

---

## 📝 Quick Reference: File Contents

| File | Lines | Purpose |
|------|-------|---------|
| copilot-instructions.md | ~80 | Copilot behavior rules & expectations |
| gemini-instructions.md | ~80 | Gemini behavior rules & constraints |
| GEMINI.md | ~22-23 | Gemini context guide (workflows + quick rules) |
| COPILOT_GEMINI_HANDOFF.md | ~50 | Latest handoff state + work-queue |
| assistant_coordination.md | ~100+ | Shared protocol, priorities, MCP guidance |
| DEVELOPMENT_WORKFLOW.md | ~150+ | Code review, branching, auto-merge, amend guidance |
| .github/workflows/parity-ir.yml | ~70+ | Main CI gate (parity + IR + perf checks) |
| .github/workflows/auto-merge.yml | ~72 | Auto-merge enabler on green CI + approval |
| .github/workflows/auto-fix-bot.yml | ~74 | Auto-fix committer on CI failure |

---

## 🔗 Navigation Links

**Instruction Files:**
- [copilot-instructions.md](copilot-instructions.md)
- [gemini-instructions.md](gemini-instructions.md)
- [GEMINI.md](GEMINI.md)
- [COPILOT_GEMINI_HANDOFF.md](COPILOT_GEMINI_HANDOFF.md)
- [assistant_coordination.md](assistant_coordination.md)
- [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)

**Workflows:**
- [.github/workflows/parity-ir.yml](.github/workflows/parity-ir.yml)
- [.github/workflows/auto-merge.yml](.github/workflows/auto-merge.yml)
- [.github/workflows/auto-fix-bot.yml](.github/workflows/auto-fix-bot.yml)

**External Guides:**
- [README.md](README.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

---

**Last Updated:** Auto-generated by CI. Manual updates encouraged.
