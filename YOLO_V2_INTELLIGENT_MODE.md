# 🧠 YOLO v2.0 - Intelligent Debugging Mode

**Real fixes only. AI-powered. Built-in debugging.**

## What Changed from v1?

### YOLO v1 Problems ❌
- **Fake fixes**: Auto-fix functions only ran tests/formatting
- **No real analysis**: 2-3 second "fixes" that didn't touch actual code
- **Polluted history**: 20+ commits with only artifact changes
- **No root cause identification**: Just kept cycling without understanding failures

### YOLO v2 Solutions ✅
- **Intelligent debugging**: Built-in deep dive analysis
- **AI integration**: Uses GitHub Copilot CLI for real fix suggestions
- **Real code changes only**: Detects and commits only meaningful changes
- **Root cause analysis**: Identifies exact nodes and fields causing failures
- **Manual intervention**: Pauses when AI provides insights for you to review

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  YOLO v2.0 - Intelligent Cycle                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │  Run All Quality Gates         │
         │  - Harness                     │
         │  - IR Validation               │
         │  - Parity                      │
         │  - Determinism                 │
         └────────────────────────────────┘
                          │
                ┌─────────┴──────────┐
                │                    │
           ✅ All Pass          ❌ Failures
                │                    │
                ▼                    ▼
         ┌──────────┐      ┌──────────────────────┐
         │ SUCCESS! │      │ Intelligent Debugging │
         │  DONE    │      └──────────────────────┘
         └──────────┘                 │
                          ┌───────────┴───────────┐
                          │                       │
                    IR Validation           Other Failures
                          │                       │
                          ▼                       ▼
              ┌───────────────────────┐  ┌──────────────────┐
              │ debug-ir-schema.js    │  │ intelligent-     │
              │ - Deep dive analysis  │  │   autofix.js     │
              │ - NodeRef validation  │  │ - AI queries     │
              │ - Root cause ID       │  │ - Fix suggestions│
              └───────────────────────┘  └──────────────────┘
                          │                       │
                ┌─────────┴──────────┐           │
                │                    │           │
           Auto-fixed           Has Insights     │
                │                    │           │
                ▼                    ▼           ▼
         ┌──────────┐      ┌─────────────────────────┐
         │  Commit  │      │  PAUSE for Manual Fix   │
         │  Changes │      │  Review artifacts/      │
         └──────────┘      └─────────────────────────┘
```

## Components

### 1. `yolo-v2-intelligent.ps1` (Main Runner)
The orchestrator that runs cycles and coordinates intelligent debugging.

**Features:**
- Quality gate testing with timeouts
- Real change detection (filters out artifacts)
- AI-powered fix integration
- Pause/resume for manual intervention
- Comprehensive progress reporting

**Parameters:**
```powershell
.\scripts\yolo-v2-intelligent.ps1 `
    -MaxCycles 100 `
    -CycleTimeoutMinutes 120 `
    -EnableAIFixes $true `
    -Mode "Intelligent"
```

### 2. `debug-ir-schema.js` (IR Debugger)
Deep dive IR validation debugging with root cause analysis.

**What it does:**
1. Loads IR schema and compiles validator
2. Validates all IR files or specific test case
3. Groups errors by path
4. Identifies problematic nodes
5. Validates NodeRef fields (pattern: `^[^_]+_[T01]+$`)
6. Performs root cause analysis
7. Writes detailed artifacts

**Output:**
- `artifacts/debug-ir-full.json` - Complete analysis
- `artifacts/debug-ir-summary.json` - Quick reference

**Example root cause:**
```
🔍 ROOT CAUSE 1:
   Issue: Boolean value in NodeRef field
   Field: expression
   Explanation: The "expression" field is expected to be a NodeRef (string) or null, but contains a boolean value.
   Likely Location: src/ir/nodes.js - Check FunctionDecl, ArrowFunctionExpression classes
   Fix Strategy: Change field name from "expression" to "isExpression" to avoid conflict with schema NodeRef expectations
```

### 3. `intelligent-autofix.js` (AI Integration)
Uses GitHub Copilot CLI for real fix suggestions.

**Features:**
- Detects `gh copilot` or standalone `copilot` CLI
- Collects test failure outputs
- Queries AI with detailed context
- Writes actionable suggestions to markdown

**Requirements:**
```bash
# Install GitHub Copilot CLI
gh extension install github/gh-copilot

# Or install standalone Copilot CLI
# (follow GitHub's installation guide)
```

**Output:**
- `artifacts/ai-fix-suggestions.md` - AI-generated fix strategies

## Usage Guide

### Quick Start

```powershell
# Run YOLO v2 with intelligent debugging
.\scripts\yolo-v2-intelligent.ps1
```

### Common Scenarios

#### Scenario 1: Fully Autonomous (when AI can auto-fix)
```powershell
# YOLO will run cycles, apply auto-fixes, and commit changes
.\scripts\yolo-v2-intelligent.ps1 -MaxCycles 50

# Expected output:
# Cycle 1: Detects IR validation failure
# Cycle 1: Runs debug-ir-schema.js
# Cycle 1: Auto-fixes issue
# Cycle 1: Commits real changes
# Cycle 2: All gates pass → SUCCESS!
```

#### Scenario 2: Manual Intervention Needed
```powershell
# YOLO runs until it needs manual help
.\scripts\yolo-v2-intelligent.ps1

# Expected output:
# Cycle 1: Detects IR validation failure
# Cycle 1: Runs debug-ir-schema.js
# Cycle 1: Identifies root cause but can't auto-fix
# ⏸️  PAUSED: Review artifacts/debug-ir-full.json
# Then apply suggested fix and re-run

# After you fix:
.\scripts\yolo-v2-intelligent.ps1  # Resume
```

#### Scenario 3: Debugging Only (no auto-fixes)
```powershell
# Just run intelligent debugging without attempting fixes
.\scripts\yolo-v2-intelligent.ps1 -EnableAIFixes $false
```

### Manual Tool Usage

#### Debug specific IR test:
```bash
node scripts/debug-ir-schema.js "arrow_function"
```

#### Run AI analysis:
```bash
node scripts/intelligent-autofix.js
```

## How It Detects Real Changes

YOLO v2 filters out "fake" changes:

```powershell
function Test-ForRealChanges {
    $status = & git status --porcelain
    
    # Filter out artifact-only changes
    $realChanges = $status | Where-Object { 
        $_ -notmatch "artifacts/" -and 
        $_ -notmatch "coverage/" -and 
        $_ -notmatch "\.json$" -and
        $_ -notmatch "reports/"
    }
    
    return ($realChanges.Count -gt 0)
}
```

**Real changes** = modifications to:
- `.js` files (src/, scripts/)
- `.md` documentation
- Configuration files

**Ignored changes** = modifications to:
- `artifacts/` directory
- `coverage/` directory
- `.json` test outputs
- `reports/` directory

## Success Criteria

YOLO v2 considers a fix "successful" when:

1. ✅ Test passes that previously failed
2. ✅ Real code changes detected (not just artifacts)
3. ✅ No new test failures introduced
4. ✅ Commit includes meaningful changes

## Lessons Learned from v1

### Red Flags We Ignore Now:
- ❌ 2-3 second "fixes" (real fixes take minutes)
- ❌ Only artifact files changed
- ❌ No code modifications in src/
- ❌ Test still failing after "fix"

### Green Flags We Look For:
- ✅ Root cause identified with explanation
- ✅ Fix strategy provided with file locations
- ✅ Code changes in src/ directory
- ✅ Test transitions from fail → pass
- ✅ AI provided specific recommendations

## Troubleshooting

### Issue: "No Copilot CLI found"
```bash
# Install GitHub Copilot CLI extension
gh extension install github/gh-copilot

# Verify installation
gh copilot --help
```

### Issue: "debug-ir-schema.js not found"
```bash
# The file should be recreated - it's in scripts/
ls scripts/debug-ir-schema.js

# If missing, copy from this README's examples
```

### Issue: YOLO keeps pausing
This is **by design**! YOLO v2 pauses when it identifies root causes but can't auto-fix. This ensures you review AI insights and apply appropriate fixes rather than committing fake changes.

**Solution:** Review the artifacts, apply the suggested fix, then re-run YOLO.

### Issue: No progress after many cycles
Check if:
1. AI suggestions are too generic → Provide more context
2. Root cause is architectural → May need design changes
3. Tests have environment-specific issues → Fix environment first

## Future Enhancements

- [ ] **Parallel gate testing** - Run tests concurrently
- [ ] **Progressive fixes** - Start with simple fixes, escalate to complex
- [ ] **Fix verification** - Re-run specific test after fix to confirm
- [ ] **Learning mode** - Remember successful fix patterns
- [ ] **Clarity Cannon integration** - Use CC-* functions for command generation
- [ ] **Multi-file fixes** - Apply changes across related files
- [ ] **Rollback on regression** - Auto-revert if new failures introduced

## Contributing

When improving YOLO v2, follow these principles:

1. **Trust but verify** - AI suggestions are starting points, not final solutions
2. **Real changes only** - Never commit unless src/ files modified
3. **Root cause first** - Identify why before attempting how
4. **Pause when uncertain** - Better to ask for help than fake it
5. **Document insights** - Write learnings to artifacts for future reference

---

**Remember**: The goal isn't to fix everything autonomously. The goal is to **intelligently identify root causes** and **apply real fixes** - even if that means pausing for human insight.

🧠 **Think → Analyze → Fix → Verify → Commit**

Not: ~~Test → Format → Commit artifacts → Repeat~~
