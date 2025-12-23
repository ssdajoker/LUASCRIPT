# Status Consistency Checker

Automated documentation alignment system ensuring all docs reference the **source of truth**: [PROJECT_STATUS.md](PROJECT_STATUS.md).

## Overview

The status consistency checker prevents documentation drift by:
1. Verifying **PROJECT_STATUS.md** exists and is valid
2. Ensuring **key docs** contain required links to source of truth
3. Detecting **deprecated docs** without migration pointers
4. Checking for **claim contradictions** across documentation

## Why It Matters

**Problem:**
- Multiple docs claim different project status
- Deprecated guides mislead new contributors
- README conflicts with DEVELOPMENT_WORKFLOW
- No single source of truth

**Solution:**
- Enforce PROJECT_STATUS.md as canonical reference
- Require links to source of truth in key docs
- Flag deprecated docs without pointers
- Detect contradictions automatically

## How It Works

### Source of Truth

**[PROJECT_STATUS.md](PROJECT_STATUS.md)** is the canonical reference for:
- Current project state
- Active/completed features
- Health checkpoints
- Known issues
- Roadmap items

**All other docs must:**
- Link to PROJECT_STATUS.md
- Defer to it for status claims
- Update it when status changes

### Key Documents

These docs are monitored for required links:

- **README.md** - Must link to PROJECT_STATUS.md
- **DEVELOPMENT_WORKFLOW.md** - Must reference source of truth
- **CONTRIBUTING.md** - Should mention PROJECT_STATUS.md

### Checks Performed

#### 1. Source of Truth Exists
```
✅ PROJECT_STATUS.md exists and is valid
```
- File exists at workspace root
- File is readable
- File has meaningful content (>100 chars)

#### 2. Required Links Present
```
✅ All required links present
```
- README.md contains "PROJECT_STATUS.md" or "source of truth"
- DEVELOPMENT_WORKFLOW.md references PROJECT_STATUS.md
- Links are explicit (not just file names)

#### 3. Deprecated Docs Have Pointers
```
⚠️  Deprecated doc found: legacy_transpiler.md
    Missing pointer to current docs
```
- Detects patterns: `legacy_*.md`, `old_*.md`, `*_deprecated.md`
- Checks for migration pointers
- Warns if pointer missing

#### 4. No Claim Contradictions
```
⚠️  Claim mismatch detected:
    README.md claims "coverage: 85%"
    PROJECT_STATUS.md claims "coverage: 23.6%"
```
- Scans for status claims (coverage, test counts, etc.)
- Compares against PROJECT_STATUS.md
- Flags significant discrepancies

## CI Integration

### Workflow

```yaml
- name: Check status consistency
  run: npm run status:check
  continue-on-error: false  # Blocking gate
```

**Position:** Before core verification
**Timing:** ~5 seconds
**Failure:** Build fails if errors detected

### Output

**Success:**
```
✅ Status consistency check PASSED
Errors: 0 | Warnings: 0
```

**Failure:**
```
❌ Status consistency check FAILED
Errors: 2 | Warnings: 1

Errors:
  • README.md missing required link to PROJECT_STATUS.md
  • PROJECT_STATUS.md not found
```

## Using the Checker

### Daily Development

```bash
# Run locally before commit
npm run status:check
```

**Typical workflow:**
1. Make changes to features
2. Update PROJECT_STATUS.md
3. Run status check
4. Fix any errors/warnings
5. Commit changes

### Fixing Errors

#### Error: Missing Required Link

**Problem:**
```
❌ README.md missing required link to PROJECT_STATUS.md
```

**Fix:** Add link to README.md:
```markdown
For current project status, see [PROJECT_STATUS.md](PROJECT_STATUS.md).
```

#### Error: Source of Truth Missing

**Problem:**
```
❌ PROJECT_STATUS.md not found
```

**Fix:** Create PROJECT_STATUS.md at workspace root:
```markdown
# Project Status

[Source of truth template...]
```

#### Warning: Deprecated Doc Without Pointer

**Problem:**
```
⚠️  Deprecated doc: legacy_parser.md
    Missing pointer to current docs
```

**Fix:** Add migration notice to `legacy_parser.md`:
```markdown
# Legacy Parser (DEPRECATED)

**⚠️ This document is deprecated.**  
See [src/parser/README.md](src/parser/README.md) for current parser docs.
```

#### Warning: Claim Contradiction

**Problem:**
```
⚠️  Coverage claim mismatch:
    README.md: "85% coverage"
    PROJECT_STATUS.md: "23.6% coverage"
```

**Fix:** Update README.md to match source of truth:
```markdown
<!-- Before -->
Coverage: 85%

<!-- After -->
Coverage: See [PROJECT_STATUS.md](PROJECT_STATUS.md) for current metrics
```

### Best Practices

1. **Update source of truth first:** Always update PROJECT_STATUS.md before other docs
2. **Link, don't duplicate:** Reference PROJECT_STATUS.md instead of repeating claims
3. **Mark deprecated docs:** Add clear migration pointers to legacy files
4. **Run before commit:** Check consistency before pushing
5. **Fix warnings promptly:** Don't let warnings accumulate

## Configuration

In `scripts/status-consistency-check.js`:

```javascript
const config = {
  sourceOfTruth: 'PROJECT_STATUS.md',
  
  keyDocs: [
    'README.md',
    'DEVELOPMENT_WORKFLOW.md',
    'CONTRIBUTING.md'
  ],
  
  deprecatedPatterns: [
    'legacy_*.md',
    'old_*.md',
    '*_deprecated.md',
    '*_obsolete.md'
  ],
  
  requiredLinks: [
    {
      file: 'README.md',
      mustContain: ['PROJECT_STATUS.md', 'source of truth']
    },
    {
      file: 'DEVELOPMENT_WORKFLOW.md',
      mustContain: ['PROJECT_STATUS.md']
    }
  ]
};
```

## Output Format

### Success
```
🔍 Status Consistency Checker
Source of Truth: PROJECT_STATUS.md

📋 Status Consistency Check Results
────────────────────────────────────
✅ PROJECT_STATUS.md exists and is valid
✅ All required links present
✅ No deprecated docs found
✅ No consistency issues detected
────────────────────────────────────

Errors: 0 | Warnings: 0

💡 Recommendations:
  • Documentation is consistent ✅
────────────────────────────────────

✅ Status consistency check PASSED
```

### With Warnings
```
🔍 Status Consistency Checker
Source of Truth: PROJECT_STATUS.md

📋 Status Consistency Check Results
────────────────────────────────────
✅ PROJECT_STATUS.md exists and is valid
✅ All required links present
⚠️  Deprecated doc found: legacy_api.md
✅ No consistency issues detected
────────────────────────────────────

Errors: 0 | Warnings: 1

💡 Recommendations:
  • Add migration pointer to legacy_api.md
────────────────────────────────────

✅ Status consistency check PASSED (with warnings)
```

### With Errors
```
🔍 Status Consistency Checker
Source of Truth: PROJECT_STATUS.md

📋 Status Consistency Check Results
────────────────────────────────────
❌ PROJECT_STATUS.md not found
❌ README.md missing required link
✅ No deprecated docs found
✅ No consistency issues detected
────────────────────────────────────

Errors: 2 | Warnings: 0

💡 Recommendations:
  • Create PROJECT_STATUS.md at workspace root
  • Add link to PROJECT_STATUS.md in README.md
────────────────────────────────────

❌ Status consistency check FAILED
```

## Integration with Quality Bar

Status consistency is the **first** quality gate in CI:

1. **Status consistency** - Docs align (this document)
2. **Performance regression gate** - No perf drift
3. **Coverage quality bar** - Meets baseline thresholds
4. **Diff coverage** - New code meets 70% coverage

All gates are **blocking**.

## Troubleshooting

### Check Passes Locally, Fails in CI

**Cause:** File system differences (line endings, etc.)

**Fix:**
- Run `npm run status:check` locally
- Compare output with CI logs
- Ensure files committed correctly

### False Positive: Link Detected But Check Fails

**Cause:** Link format not recognized

**Current patterns:**
- `PROJECT_STATUS.md` (exact match)
- `source of truth` (phrase match)
- Case-insensitive

**Fix:** Use explicit format:
```markdown
See [PROJECT_STATUS.md](PROJECT_STATUS.md) for current status.
```

### Warning for Non-Deprecated File

**Cause:** File name matches deprecated pattern

**Patterns:**
- `legacy_*.md`
- `old_*.md`
- `*_deprecated.md`

**Fix:** Rename file or add exception to config

## Related

- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Source of truth
- [Performance Gate](PERFORMANCE_GATE.md) - Performance regression detection
- [Quality Bar Ratchet](QUALITY_BAR_RATCHET.md) - Coverage thresholds
- [Development Workflow](DEVELOPMENT_WORKFLOW.md) - CI/CD process

---

**Questions?** See `scripts/status-consistency-check.js` for implementation details.
