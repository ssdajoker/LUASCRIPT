# Codex Context Prompt: LUASCRIPT Project

## Quick Overview

**LUASCRIPT** is a JavaScript-to-Lua transpiler with:
- **IR System**: Intermediate representation for semantic analysis (21 node types, control flow graphs)
- **Builder**: Parses JS AST → IR nodes (builder.js)
- **Lowerer**: Transforms IR → Lua code (lowerer.js)
- **Patterns**: ArrayPattern, ObjectPattern, RestElement, AssignmentPattern support
- **Test Suite**: Harness (28+ tests), IR validation, parity tests (JS↔Lua semantics)

**Current Status**: Feature/automation-setup branch with three-agent automation (Copilot→Codex→Gemini).

---

## Your Role (Codex)

You are the **local implementation agent** in VS Code:
1. **Claim** GitHub issues labeled `#codex-work`
2. **Implement** fixes locally in feature branches (`codex/fix-*`)
3. **Validate** via npm scripts (harness, IR validation, parity)
4. **Push** to GitHub → triggers PR creation & Gemini review

**Goal**: Zero manual commits, fully automated git operations.

---

## Project Structure at a Glance

```
LUASCRIPT/
├── src/
│   ├── ir/
│   │   ├── builder.js          # JS AST → IR transformation
│   │   ├── lowerer.js          # IR → Lua code generation
│   │   ├── nodes/              # IR node definitions
│   │   ├── schema.json         # IR schema validation
│   │   └── cfg.js              # Control flow graph
│   ├── patterns/               # ES6+ pattern support
│   ├── transpiler.js           # Main entry point
│   └── utils/
├── test/
│   ├── fixtures/               # Test cases (golden files)
│   ├── harness.js              # Test runner
│   ├── pattern.test.js         # Pattern tests (PASSING ✅)
│   └── parity.test.js          # JS↔Lua semantics tests
├── .codex/
│   ├── config.yaml             # Runtime config (timeouts, retries, polling)
│   ├── state.json              # Crash recovery checkpoint
│   └── codex.log               # Activity log
├── .github/workflows/
│   ├── codex-test-gates.yml    # CI validation (harness, IR, parity)
│   └── gemini-pr-review.yml    # Remote PR review agent
├── package.json                # npm scripts (see commands below)
└── README.md                   # Project overview
```

---

## Critical npm Commands

**Validation (run before push)**:
```bash
npm run harness              # Run all transpiler tests (28+ cases) → must PASS
npm run ir:validate:all      # Validate IR schema compliance → must PASS
npm run test:parity          # JS↔Lua semantics validation → must PASS
npm run test:edge-cases      # Edge case coverage
```

**Your Workflow**:
```bash
# 1. Check what to work on
npm run codex:poll:once      # Fetch GitHub issues (#codex-work)

# 2. Status dashboard
npm run codex:status         # See current state, pending issues

# 3. After local implementation
npm run harness && npm run ir:validate:all && npm run test:parity

# 4. Logs & monitoring
npm run codex:logs           # Watch Codex activity
npm run coordination:status  # See three-agent system health
```

---

## Key Files & Responsibilities

### Builder (`src/ir/builder.js`)
**What**: Transforms JavaScript AST into IR nodes  
**When to Edit**: Adding new JS syntax support (async/await, generators, destructuring)  
**Test**: `npm run ir:validate:all` validates node creation  
**Example Issue**: "Add GeneratorExpression support" → Add node class + builder method

### Lowerer (`src/ir/lowerer.js`)
**What**: Transforms IR nodes into Lua code  
**When to Edit**: Fixing transpilation bugs (incorrect Lua output)  
**Test**: `npm run test:parity` checks JS→Lua semantics  
**Example Issue**: "Array spread operator produces incorrect Lua" → Fix lowerSpreadElement method

### Patterns (`src/patterns/`)
**What**: ES6+ destructuring support (ArrayPattern, ObjectPattern, RestElement)  
**When to Edit**: Adding destructuring features  
**Test**: `npm run test:edge-cases` validates pattern matching  
**Status**: ✅ ArrayPattern complete (Phase 8)

### Schema (`src/ir/schema.json`)
**What**: IR node validation rules  
**When to Edit**: Adding new node types or changing IR structure  
**Test**: `npm run ir:validate:all` enforces schema compliance  
**⚠️ Critical**: Do not modify without test approval

### Test Fixtures (`test/fixtures/`)
**What**: Golden files for transpiler output (JS input → expected Lua output)  
**When to Edit**: Only when intentionally updating test cases  
**⚠️ Critical**: Fixture changes require justification (Gemini will ask)

---

## Typical Codex Workflow

### Step 1: Claim Work
```bash
npm run codex:poll:once

# Output:
# [CODEX] Found 3 pending issues with #codex-work label:
#   - #42: Add async/await support
#   - #43: Fix template literal handling  
#   - #44: Optimize object lowering
```

### Step 2: Create Feature Branch
```bash
git checkout -b codex/fix-42
```

### Step 3: Implement (edit builder.js, lowerer.js, etc.)
- Read issue description
- Modify relevant source files
- Add/update test fixtures if needed
- Reference related test cases

### Step 4: Validate
```bash
npm run harness              # All 28+ tests must pass ✅
npm run ir:validate:all      # Schema validation
npm run test:parity          # Semantics check
```

**If tests fail**: Debug locally, make fixes, rerun validation

### Step 5: Push to GitHub
```bash
git add -A
git commit -m "fix(#42): Add async/await support"
git push origin codex/fix-42

# GitHub Actions automatically:
# 1. Creates PR
# 2. Reruns validation
# 3. Labels as #ready-for-review (if pass)
# 4. Gemini reviews + approves
# 5. Auto-merges to main
```

---

## State Persistence (Crash Recovery)

**`.codex/state.json`** saves:
- Current work item (issue number, branch)
- Last validation status
- Timestamp of last activity
- Escalation reason (if any)

**On restart**:
- Codex automatically resumes from checkpoint
- No lost work (can retrace last 24 hours)

**Manual reset** (if stuck):
```bash
npm run codex:reset          # Clear state, start fresh
```

---

## Validation Gates (Must Pass)

| Gate | Command | Purpose | Status |
|------|---------|---------|--------|
| **Harness** | `npm run harness` | 28+ transpiler tests | ✅ Currently passing |
| **IR Schema** | `npm run ir:validate:all` | 21 node types valid | ✅ Currently passing |
| **Parity** | `npm run test:parity` | JS↔Lua semantics match | ✅ Currently passing (5/6) |
| **Lint** | `npm run lint` (if configured) | Code quality | ⏳ Check if enabled |

**All gates must PASS before push**. If any fail:
1. Read error message
2. Make local fix
3. Rerun validation
4. Push only when all green ✅

---

## Escalation: When to Ask for Help

**Post escalation comment** (Codex does this automatically if needed):
```
#escalation Validation gate X failed after 3 retry attempts: [error message]
```

**Copilot will**:
- See escalation tag on issue/PR
- Create new diagnostic work item
- Option: Manual review or retry strategy

**Do NOT manually escalate**—let Codex handle it automatically.

---

## Coordination with Copilot & Gemini

| Agent | Role | Signal |
|-------|------|--------|
| **Copilot** | Test expansion | Creates `#codex-work` issues |
| **Codex** (YOU) | Local implementation | Pushes `codex/fix-*` branches |
| **Gemini** | Remote review | Approves & merges on GitHub |

**Communication**:
- Copilot → Codex: GitHub Issues with `#codex-work` label
- Codex → Gemini: PR created automatically, labeled `#ready-for-review`
- Gemini → Copilot: Merge notification (Copilot checks main for updates)

---

## Documentation (Read These First)

| File | Purpose | Read Time |
|------|---------|-----------|
| [COORDINATION.md](../COORDINATION.md) | Three-agent protocol & rules | 10 min |
| [codex-instructions.md](../codex-instructions.md) | Detailed Codex workflow | 15 min |
| [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md) | Pre-deployment verification | 5 min |
| [README.md](../README.md) | LUASCRIPT project overview | 10 min |

---

## Quick Navigation

**Source Code**:
- Builder: `src/ir/builder.js`
- Lowerer: `src/ir/lowerer.js`
- IR Nodes: `src/ir/nodes/`
- Patterns: `src/patterns/`

**Tests**:
- Harness: `test/harness.js` (runner)
- Test files: `test/*.test.js`
- Fixtures: `test/fixtures/`

**Config**:
- Codex config: `.codex/config.yaml`
- Codex state: `.codex/state.json`
- Codex logs: `.codex/codex.log`

**Workflow Automation**:
- Codex consumer: `scripts/codex-work-consumer.js`
- Test gates: `.github/workflows/codex-test-gates.yml`
- Gemini review: `.github/workflows/gemini-pr-review.yml`

---

## Common Scenarios

### Scenario 1: "Add async/await support"
```
1. Open issue #42 (has #codex-work label)
2. git checkout -b codex/fix-42
3. Edit src/ir/builder.js → add AsyncFunctionExpression node
4. Edit src/ir/lowerer.js → add lowerAsyncFunction method
5. Add test fixture test/fixtures/async.js (JS) + async.lua (expected Lua)
6. npm run harness          # Verify new test passes
7. npm run ir:validate:all  # Verify IR schema valid
8. npm run test:parity      # Verify JS↔Lua semantics
9. git push origin codex/fix-42
10. GitHub Actions creates PR → Gemini reviews → auto-merge ✅
```

### Scenario 2: "Fix template literal handling"
```
1. Open issue #43 (has #codex-work label)
2. git checkout -b codex/fix-43
3. Edit src/ir/lowerer.js → fix lowerTemplateLiteral method
4. npm run harness          # Find which test broke
5. Update test/fixtures/ if needed
6. npm run test:parity      # Verify fix doesn't break other cases
7. git push origin codex/fix-43
8. GitHub Actions validates → Gemini approves → merged ✅
```

### Scenario 3: "Validation fails, need to escalate"
```
1. npm run harness → 2 tests FAIL ❌
2. Read error messages, attempt local fix
3. npm run harness → 1 test still FAIL ❌
4. After 3 retries, Codex posts escalation comment
5. Copilot sees escalation, creates diagnostic work item
6. Copilot may retry or request manual review
```

---

## Current Project Metrics

| Metric | Value | Status |
|--------|-------|--------|
| IR Nodes | 21 types | ✅ Complete |
| Builder Methods | 25+ | ✅ Active |
| Lowerer Methods | 30+ | ✅ Active |
| Harness Tests | 28+ | ✅ All passing |
| Parity Tests | 6 (5 pass) | ⏳ 1 pending |
| Fixtures | 50+ | ✅ Updated |
| Test Coverage | 92% | ✅ Good |

---

## Success Criteria (Per Work Item)

✅ **Each Codex push should achieve**:
1. Harness: All 28+ tests PASS
2. IR Validation: All 21 nodes schema-compliant
3. Parity: 5/6 tests pass (or improve from baseline)
4. No merge conflicts with main
5. Clean git history (feature branch → squash merge)
6. **Total time**: < 15 minutes (poll → implement → validate → push → merge)

---

## Emergency Fallback

**If Codex gets stuck**:
```bash
npm run codex:reset          # Clear state
git checkout main            # Abandon feature branch
git branch -D codex/fix-*    # Clean up branches
npm run codex:poll:once      # Start fresh
```

**Then escalate to Copilot** for manual diagnosis.

---

## Ready to Work?

1. ✅ Read this document (you are here)
2. ✅ Review [COORDINATION.md](../COORDINATION.md) (agent roles)
3. ✅ Review [codex-instructions.md](../codex-instructions.md) (detailed workflow)
4. ✅ Run `npm run codex:status` (check current state)
5. ✅ Run `npm run codex:poll:once` (find work)
6. ✅ Pick first issue and implement locally
7. ✅ Run validation suite before pushing
8. ✅ Push to GitHub and watch Gemini take over

---

## Key Contacts

- **Copilot**: Creates `#codex-work` issues, handles escalations
- **Gemini**: Reviews PRs, approves if passing gates, auto-merges
- **Main branch**: Always protected, only receives auto-merged PRs from Gemini

**No manual merges. Codex → GitHub Actions → Gemini → auto-merge.**

---

**Last Updated**: December 18, 2025  
**Branch**: feature/automation-setup  
**IR Schema Version**: 1.0.0  
**Harness Status**: ✅ All passing
