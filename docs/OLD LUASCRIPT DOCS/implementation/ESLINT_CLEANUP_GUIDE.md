# ESLint Cleanup & Strategy Guide

## 📋 Overview

This document outlines the ESLint strategy, scoped rules, and cleanup approach for the LUASCRIPT project.

---

## 🎯 Tiered Linting Strategy

### Tier 1: IR Core (STRICTEST) 🔴
**Location**: `src/ir/core/**/*.js`  
**Status**: BLOCKING (0 warnings)  
**Maintainers**: Core IR team  
**Update Frequency**: Continuous  

**Rules**:
- ✅ No unused variables (error)
- ✅ No undefined variables (error)
- ✅ Semicolons required (error)
- ✅ Double quotes required (error)
- ✅ 2-space indentation (error)
- ✅ Max complexity: 10 (warn)
- ⚠️ Console calls (warn)

**Goal**: Production-ready IR foundation  
**Current Status**: TBD (needs audit)

---

### Tier 2: IR Extended (MODERATE) 🟡
**Location**: `src/ir/transforms/**/*.js`, `src/ir/validators/**/*.js`  
**Status**: WARNING (max 50 warnings)  
**Maintainers**: IR transformation team  
**Update Frequency**: Weekly cleanup target  

**Rules**:
- ⚠️ No unused variables (warn)
- ⚠️ No undefined variables (warn)
- ⚠️ Semicolons recommended (warn)
- ⚠️ Quote consistency (warn)
- ⚠️ Max complexity: 15 (warn)

**Goal**: Maintainable IR transforms  
**Acceptable**: Well-documented edge cases  

---

### Tier 3: Backend Code (RELAXED) 🟢
**Location**: `src/backends/**/*.js`  
**Status**: WARNING (max 100 warnings)  
**Maintainers**: Backend teams  
**Update Frequency**: Sprint-based cleanup  

**Rules**:
- ⚠️ Unused variables (warn)
- ⚠️ Semicolons (warn)
- ⚠️ Quote consistency (warn)
- ⚠️ Max complexity: 20 (warn)

**Goal**: Flexible backend implementations  
**Acceptable**: Diverse coding styles per backend  

---

### Tier 4: General Code (MOST RELAXED) 🟢
**Location**: `src/**/*.js`, `lib/**/*.js`  
**Status**: WARNING (max 200 warnings)
**Maintainers**: All developers
**Update Frequency**: Monthly cleanup sprint (Week 1) + per-PR check

**Rules**:
- ⚠️ Unused variables (warn)
- ⚠️ Semicolons (warn)
- ⚠️ Quotes (warn)
- ⚠️ Indentation (warn)

**Goal**: Code consistency baseline
**Acceptable**: Various coding approaches

---

## 🔧 ESLint Configuration

### File: `eslint.config.js`

```javascript
// Structure:
- Ignores: node_modules, dist, build, coverage, .git
- 5 scoped rule sets (core → general)
- Each tier inherits from previous, loosens constraints
- Test files get special globals (describe, it, expect)
```

### Running ESLint

```bash
# Check IR core only
npm exec eslint src/ir/core/**/*.js

# Check IR extended
npm exec eslint src/ir/transforms/**/*.js --max-warnings 50

# Check all IR code
npm exec eslint src/ir/**/*.js

# Check specific backend
npm exec eslint src/backends/llvm/**/*.js --max-warnings 100

# Check all code
npm exec eslint src/**/*.js --max-warnings 200

# Fix auto-fixable issues
npm exec eslint src/ir/core/**/*.js --fix

# Generate HTML report
npm exec eslint src/**/*.js --format html --output-file lint-report.html
```

---

## 📊 Lint Cleanup Roadmap

### Phase 1: IR Core Stabilization (Weeks 1-2)

**Goal**: 0 warnings in `src/ir/core/**/*.js`  
**Status**: 🔴 TO DO  
**Estimated Time**: 5-8 hours  

**Tasks**:
1. [ ] Run `npm exec eslint src/ir/core/**/*.js` - Get baseline
2. [ ] Categorize errors:
   - [ ] Unused variables → Remove or prefix with `_`
   - [ ] Undefined variables → Import or define
   - [ ] Missing semicolons → Add
   - [ ] Quote inconsistency → Normalize to double quotes
   - [ ] Indentation issues → Fix to 2 spaces
3. [ ] Create PR for core fixes
4. [ ] Review and merge
5. [ ] Update CI to enforce blocking gate

**Acceptance**: ✅ All core files pass ESLint with 0 warnings

---

### Phase 2: IR Extended (Weeks 3-4)

**Goal**: ≤ 50 warnings in `src/ir/transforms/**/*.js` and `src/ir/validators/**/*.js`  
**Status**: 🟡 TO DO  
**Estimated Time**: 6-10 hours  

**Tasks**:
1. [ ] Baseline current warnings
2. [ ] Prioritize fixes:
   - [ ] Critical issues (undefined, unused variables)
   - [ ] Style issues (semicolons, quotes)
   - [ ] Complex functions (refactor if > 15 complexity)
3. [ ] Fix high-priority issues
4. [ ] Document exceptions (if any)
5. [ ] Create PR with documentation

**Acceptance**: ✅ Warnings ≤ 50, all tracked in comments

---

### Phase 3: Backend Alignment (Weeks 5-6)

**Goal**: ≤ 100 warnings in `src/backends/**/*.js`  
**Status**: 🟢 TO DO  
**Estimated Time**: 8-12 hours  

**Tasks**:
1. [ ] Per-backend assessment
2. [ ] Fix critical issues (undefined variables, etc.)
3. [ ] Document backend-specific patterns
4. [ ] Create per-backend PRs (LLVM, WASM, Python, etc.)

**Acceptance**: ✅ Backend code at ≤ 100 warnings threshold

---

### Phase 4: General Code (Ongoing)

**Goal**: ≤ 200 warnings in `src/**/*.js` and `lib/**/*.js`
**Status**: 🟢 TO DO
**Estimated Time**: Continuous improvement

**Tasks**:
1. [ ] Maintain general code quality
2. [ ] New code reviews enforce thresholds (Tier 4 lint must run in PRs with `npx eslint "src/**/*.js" "lib/**/*.js" --max-warnings 200`)
3. [ ] Periodic cleanup sprints (first week of every month; focus on top offenders from latest Tier 4 report)
4. [ ] Tech debt tracking (log high-complexity hotspots and indentation fixes in sprint notes)
5. [ ] Regression guard: reject changes that raise the total Tier 4 warning count above the 200 cap

---

## 🚀 Execution Plan

### Week 1: Setup & Core Audit
```
Day 1-2: ESLint config implementation
Day 3-4: IR core audit (baseline)
Day 5:   Fix critical issues, create PR
```

### Week 2: Core Completion
```
Day 1-3: Complete IR core fixes
Day 4-5: Review, testing, merge
```

### Week 3-4: Extended IR
```
Similar pattern as core, but for transforms/validators
```

### Week 5+: Backend & General
```
Per-backend assessment and cleanup
```

---

## 📝 CI/CD Integration

### Blocking Gate (IR Core)
```yaml
- name: Lint IR code (blocking)
  run: npx eslint src/ir/core/**/*.js --max-warnings 0
  continue-on-error: false
```

### Warning Gates
```yaml
- name: Lint IR extended
  run: npx eslint src/ir/transforms/**/*.js --max-warnings 50
  continue-on-error: true

- name: Lint backends
  run: npx eslint src/backends/**/*.js --max-warnings 100
  continue-on-error: true

- name: Lint general code
  run: npx eslint src/**/*.js --max-warnings 200
  continue-on-error: true
```

---

## 💡 Quick Reference

### ESLint Rules by Error Type

| Error | Fix | Priority |
|-------|-----|----------|
| Unused variable | Remove or prefix `_` | HIGH |
| Undefined variable | Import or define | HIGH |
| Missing semicolon | Add `;` | MEDIUM |
| Wrong quotes | Change to `"` | MEDIUM |
| Bad indentation | Fix to 2 spaces | LOW |
| High complexity | Refactor function | MEDIUM |

### Common Fixes

```javascript
// Unused variable - PREFIX WITH _
function process(data, _unused) { return data; }

// Undefined variable - ADD IMPORT
import { helper } from './helpers.js';

// Missing semicolon - ADD SEMICOLON
const x = 5;

// Wrong quotes - NORMALIZE
const str = "double quotes"; // not single

// High complexity - REFACTOR
// Break into smaller functions or extract conditions
```

---

## 📊 Metrics & Tracking

### Baseline Metrics (From Initial Run)
```
Date: 2025-12-23
Scope: Tier 4 run with `--max-warnings 200`
Notes: No `lib/**/*.js` files present in repo

IR Core: 21 errors (indentation, unused args), 4 warnings (complexity)
IR Extended: 0 errors, 0 warnings (n/a in this run)
Backends: 0 errors, 0 warnings (n/a in this run)
General (other src): 4 warnings (complexity)
Total: 25 errors, 13 warnings
```

### Progress Tracking
```
Week 1: Core audit complete ✓
Week 2: Core fixes in progress
Week 3: Extended IR phase starts
Week 4: Backend phase starts
Week 5: General cleanup
Week 6+: Maintenance mode
```

---

## ❓ FAQ

**Q: Can I ignore ESLint warnings?**  
A: Only with documented reason in comment. IR Core has no exceptions.

**Q: What if a lint rule doesn't apply?**  
A: Use `// eslint-disable-line` with specific rule name and reason.

**Q: How do I fix complex functions?**  
A: Refactor into smaller functions, extract conditions, use helper functions.

**Q: Can backends have different styles?**  
A: Yes, within the 100-warning threshold per backend.

**Q: What about test files?**  
A: Test files have relaxed rules (describe, it, expect as globals).

---

## 🔗 Related Documentation

- [CI/CD Health Status](./CI_CD_HEALTH_STATUS.md)
- [GitHub Workflows](./.github/workflows/)
- [Lint Gate Configuration](./eslint.config.js)

---

**Last Updated**: 2024  
**Scope**: LUASCRIPT ESLint Strategy & Cleanup  
**Owner**: Development Team
