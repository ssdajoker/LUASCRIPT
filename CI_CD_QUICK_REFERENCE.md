# CI/CD Quick Reference Guide

**Quick Links**:
- [Full Health Status](./CI_CD_HEALTH_STATUS.md)
- [Lint Cleanup Guide](./ESLINT_CLEANUP_GUIDE.md)
- [Action Items](./CI_CD_ACTION_ITEMS.md)

---

## 🚀 QUICK START

### I Want to...

#### **Run Linting Locally**
```bash
# Check IR core (strictest)
npm run lint:core

# Check IR extended
npm run lint:extended

# Check backends
npm run lint:backends

# Check everything
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Generate HTML report
npm run lint:report
```

#### **Debug CI Failures**
1. Check GitHub Actions tab on PR
2. Look at failing step (usually "Lint IR code" or "Run harness")
3. Copy error message
4. Run locally: `npm run lint` or `npm run verify`
5. Review [CI_CD_HEALTH_STATUS.md](./CI_CD_HEALTH_STATUS.md) for details

#### **Create a Feature Branch**
```bash
# Best practices:
git checkout -b feature/my-feature
# OR for Codex work:
git checkout -b codex/fix-my-issue

# Push and create PR
# CI will run automatically
# Check status in GitHub Actions
```

#### **Fix a Lint Error**
```bash
# See what the error is
npm run lint:core  # for IR code

# Common fixes:
# 1. Remove unused variable: const x = 5;  // Not used
#    → DELETE the line

# 2. Undefined variable: someFunction()
#    → ADD import: import { someFunction } from './helpers.js';

# 3. Missing semicolon: const x = 5
#    → ADD: const x = 5;

# 4. Auto-fix many issues:
npm run lint:fix
```

#### **Understand Why a PR is Blocked**
```
PR Blocked? FORENSIC DIAGNOSIS REQUIRED:

1. ❌ "Lint IR code" failed?
   → STOP: Run forensic triage
   → Execute: npm run diagnose:lint
   → See FORENSIC_DIAGNOSTIC_PROCEDURES.md
   → Generate forensic report before fixing

2. ❌ "Run core verification gate" failed?
   → STOP: Run forensic triage
   → Execute: npm run diagnose:verify
   → Check: node src/utils/diagnostic-framework.js
   → Examine IR structure with root cause analysis

3. ❌ "Harness tests" failed?
   → STOP: Run forensic triage
   → Execute: npm run diagnose:harness
   → Analyze transpiler output differences
   → Document failure patterns

4. ❌ "Status checks" failed?
   → STOP: Full forensic analysis
   → All gate failures require diagnosis
   → See FORENSIC_DIAGNOSTIC_PROCEDURES.md

5. ✅ All green?
   → Forensic reports archived in artifacts/forensics/
   → Auto-merge in progress (if enabled)
   → Or wait for code review

🔬 FORENSIC RULE: Never bypass a gate. Fix the root cause.
```

---

## 📊 CURRENT STATUS

| Component | Status | Action |
|-----------|--------|--------|
| **IR Linting** | 🔴 BLOCKING | [Fix lint errors](./ESLINT_CLEANUP_GUIDE.md) |
| **Auto-Merge** | 🔴 BLOCKED | Wait for lint fixes |
| **CI Workflows** | ✅ UPDATED | Ready to use |
| **Performance Tracking** | ✅ ACTIVE | Monitor in artifacts |

---

## 🎯 QUALITY GATE HIERARCHY

### 🔬 Forensic Diagnosis Gate (WEIGHT: 8) 🆕
**Trigger**: ANY gate failure  
**Purpose**: Root cause analysis before "fix" is accepted  
**Requirements**:
- Deep diagnostic analysis using YOLO v2.0 + diagnostic-framework.js
- Evidence artifacts (logs, IR dumps, stack traces)
- Forensic report (JSON + Markdown) documenting root cause
- Specific fix proposal with verification plan
**Status**: ✅ ACTIVE - Enforced on all failures  
**Owner**: Forensic Team / AI Agents  

**Forensic Process**:
```
Gate Failure → STOP → Triage → Root Cause Analysis → Evidence Collection
    → Fix Proposal → Execute First Fix → Verify → Document → Commit
```

**Anti-Pattern (BLOCKED)**: Changing gate requirements to pass without fixing root cause  
**Correct Pattern**: Fix the underlying problem, then verify gate passes naturally

---

## 🎯 LINTING TIERS

### Tier 1: IR Core ⚠️ STRICT
**Path**: `src/ir/core/**/*.js`  
**Gate**: 0 warnings (blocking)  
**Owner**: IR Team  
**Status**: 🔴 RED (200+ errors)  

### Tier 2: IR Extended ⚠️ MODERATE
**Path**: `src/ir/transforms/**/*.js`, `src/ir/validators/**/*.js`  
**Gate**: ≤50 warnings  
**Owner**: Core IR Team  
**Status**: ✅ Maintained (<35 warnings)

### Tier 3: Backends 🟢 RELAXED
**Path**: `src/backends/**/*.js`  
**Gate**: ≤100 warnings  
**Owner**: Backend Leads (LLVM/WASM/Python)  
**Status**: ✅ On track (<85 warnings)

### Tier 4: General Code 🟢 RELAXED
**Path**: `src/**/*.js`  
**Gate**: ≤200 warnings  
**Owner**: All Teams  
**Status**: ✅ Sustainable (<150 warnings)  

---

## 🔧 COMMON ERRORS & FIXES

| Error | Cause | Fix | Time |
|-------|-------|-----|------|
| "undefined variable" | Not imported | `import { x } from 'file'` | 2 min |
| "unused variable" | Defined but not used | Delete or prefix `_` | 1 min |
| "missing semicolon" | Style | Add `;` at end of line | 30 sec |
| "unexpected quotes" | Inconsistent | Change to `"double"` | 1 min |
| "indentation" | Spacing | Fix to 2 spaces | 1 min |
| "function too complex" | Logic | Refactor/extract | 10-30 min |

---

## 📈 PERFORMANCE BENCHMARKS

**Established Baselines** (from parity-ir.yml):

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Execution Time | < 100ms | ~80ms (transpiler only) | ✅ Established |
| Memory Usage | < 50MB | ~25MB (IR + backends) | ✅ Established |
| IR Size | < 500KB | ~200KB (avg program) | ✅ Established |
| Parity Score | > 98% | 99.1% (Lua gen) | ✅ Established |

**Tracking**: View in parity-ir.yml artifacts (30-day history)

---

## 🚨 IF STUCK

### "My PR is blocked by linting"

**Step 1**: See the error
```bash
npm run lint:core
# If error in src/ir/core, this will show it
```

**Step 2**: Understand the error
```
Use this guide or: grep-search for the rule in eslint.config.js
```

**Step 3**: Fix it
```bash
npm run lint:fix    # Try auto-fix first
# OR manual fix using the table above
```

**Step 4**: Verify
```bash
npm run lint:core   # Should pass now
```

**Step 5**: Push
```bash
git add .
git commit -m "fix: resolve lint errors in IR core"
git push
# CI will re-run automatically
```

### "The lint gate keeps failing"

**Check**:
1. What code did you change? Is it in `src/ir/core/`?
2. Are you following the fix guide above?
3. Can you run `npm run lint:core` locally without errors?

**If still stuck**:
- Review [ESLINT_CLEANUP_GUIDE.md](./ESLINT_CLEANUP_GUIDE.md)
- Check [CI_CD_HEALTH_STATUS.md](./CI_CD_HEALTH_STATUS.md) for context
- Ask team lead for help

### "Auto-merge isn't working"

**Reason**: Probably lint gate failing (see above)

**Verify**:
1. Check all status checks are ✅ green
2. All reviews approved
3. No conflicts with main/develop

**If all green and still blocked**:
- Check branch protection rules (admin only)
- See [CI_CD_HEALTH_STATUS.md](./CI_CD_HEALTH_STATUS.md) auto-merge section

---

## 📋 LINT PHASES TIMELINE

```
Week 1-2: ✓ IR Core (0 warnings)        [Current: In Progress]
Week 3-4: ⏳ IR Extended (≤50 warnings)  [Queued]
Week 5-6: ⏳ Backends (≤100 warnings)    [Queued]
Week 6+:  ⏳ General (≤200 warnings)     [Ongoing]
```

**Status**: 🟡 Yellow - Week 1 active  
**Target**: Green by end of Week 2  

---

## 💻 USEFUL COMMANDS

```bash
# Lint operations
npm run lint              # Check all code
npm run lint:core        # Check IR core (STRICT)
npm run lint:extended    # Check IR extended
npm run lint:backends    # Check backends
npm run lint:fix         # Auto-fix issues
npm run lint:report      # Generate HTML report

# Verification
npm run verify           # Core verification gate
npm run harness          # Transpiler tests
npm run test:parity      # Parity tests
npm run test:performance # Performance benchmarks
npm run ir:report        # IR status report

# Combined
npm run all-gates        # Run all verification gates
```

---

## 📞 WHO TO ASK

| Question | Owner |
|----------|-------|
| "Why is my PR blocked?" | Check this guide first, then ask Tech Lead |
| "How do I fix lint errors?" | ESLINT_CLEANUP_GUIDE.md or ask Lead Dev |
| "What's the linting strategy?" | CI_CD_HEALTH_STATUS.md or ask Tech Lead |
| "Is auto-merge enabled?" | Check branch protection or ask Admin |
| "How's the cleanup going?" | Check CI_CD_ACTION_ITEMS.md or ask Team |
| "Performance regression?" | Check artifacts or ask Perf Team |

---

## ✅ CHECKLIST FOR PR REVIEW

Before pushing your PR:

```
Code Quality:
[ ] Ran `npm run lint:fix` to auto-fix
[ ] Ran `npm run lint` locally and it passes
[ ] No new lint violations introduced

Testing:
[ ] Ran `npm run verify` and it passes
[ ] If modifying IR: `npm run ir:report` passes
[ ] If adding feature: `npm run harness` passes

Process:
[ ] Created branch from main/develop
[ ] Committed with clear message
[ ] Pushed to remote
[ ] Checked GitHub Actions status
[ ] If CI red: Fixed and pushed again
[ ] Ready for review when all green ✅
```

---

## 🎓 LEARNING RESOURCES

- [ESLint Cleanup Guide](./ESLINT_CLEANUP_GUIDE.md) - Deep dive into linting strategy
- [CI/CD Health Status](./CI_CD_HEALTH_STATUS.md) - Full technical details
- [Action Items](./CI_CD_ACTION_ITEMS.md) - Week-by-week plan
- [ESLint Config](./eslint.config.js) - Rules and scoping
- [GitHub Workflows](./.github/workflows/) - Actual CI configuration

---

## 🔗 LINKS

- **GitHub Actions**: [View Workflows](../../.github/workflows/)
- **PR Status**: Check GitHub Checks tab
- **Build Artifacts**: Actions → Workflow → Artifacts tab
- **Performance Trending**: Check parity-ir.yml artifacts

---

**Last Updated**: 2024  
**Scope**: Quick reference for CI/CD & Linting  
**Level**: For all developers
