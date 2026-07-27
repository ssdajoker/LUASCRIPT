## Description
<!-- Clearly describe what changes you made and why -->
Fixes #(issue number) or implements feature...

### Motivation
Why is this change needed? What problem does it solve?

### Changes Made
- [ ] Change 1
- [ ] Change 2
- [ ] Change 3

---

## Documentation Updates
<!-- Check the boxes that apply to your changes -->

- [ ] **No docs needed** (styling, minor fixes, refactoring with no API changes)
- [ ] **Updated existing docs** in:
  - [ ] README.md
  - [ ] PROJECT_STATUS.md
  - [ ] DEVELOPMENT_WORKFLOW.md
  - [ ] Component README (e.g., docs/architecture/README.md)
  - [ ] Other: _______________

- [ ] **Created new docs** in:
  - [ ] docs/___________
  - [ ] Other: _______________

**If no docs updated**: Why? (e.g., "Minor refactoring, no API changes" or "Deferred with #[issue-number]")

---

## Test Coverage
<!-- Check the boxes that apply -->

- [ ] **No tests needed** (docs-only, styling, configuration)
- [ ] **Added new tests** for functionality in:
  - [ ] test/transpiler/
  - [ ] test/ir/
  - [ ] test/backends/
  - [ ] test/utils/
  - [ ] Other: _______________

- [ ] **Updated existing tests** for:
  - [ ] Behavior changes
  - [ ] Bug fixes
  - [ ] Performance improvements

**Test Results**:
```
npm test: [PASS/FAIL]
npm run test:coverage: [coverage %]
npm run test:parity: [PASS/FAIL]
```

**If no tests added**: Why? (e.g., "Refactoring only, all existing tests pass")

---

## Status & Consistency
<!-- Verify that PROJECT_STATUS.md is the source of truth -->

- [ ] Reviewed PROJECT_STATUS.md (source of truth for project status)
- [ ] If status changed, updated:
  - [ ] PROJECT_STATUS.md
  - [ ] DEVELOPMENT_WORKFLOW.md
  - [ ] docs/status/PROJECT_HEALTH.md

**Any status changes in this PR?**
- [ ] No changes to project status
- [ ] Status updated: _______________
- [ ] Reference: See PROJECT_STATUS.md for context

---

## Performance & Quality

- [ ] Ran: `npm run lint` (no new linting errors)
- [ ] Ran: `npm test` (all tests pass)
- [ ] Ran: `npm run test:coverage` (coverage maintained)
- [ ] Performance impact: _____ (none / minimal / [see notes])

**Performance Notes** (if applicable):
- Benchmarks checked: (e.g., "transpile-simple, ir-parse-complex")
- Expected change: (e.g., "±2% variance expected")
- Reference: See [PERFORMANCE_SLO.md](PERFORMANCE_SLO.md)

---

## Related Issues & Context
<!-- Link related documentation and wiki entries -->

- Resolves: #(issue number)
- Related to: #(issue number)
- **Wiki References**:
  - [Project Status & Health](docs/status/PROJECT_HEALTH.md)
  - [Architecture](docs/architecture/README.md)
  - [Timeline](docs/timeline/README.md)
  - Other: _______________

---

## Pre-Submission Checklist

- [ ] PR title follows convention: `[CATEGORY] description` (e.g., `[feat] add pattern support`)
- [ ] PR description is clear and detailed
- [ ] I've linked related issues/documentation
- [ ] I've added docs alongside code changes (if needed)
- [ ] I've added/updated tests (if needed)
- [ ] I've verified all tests pass locally
- [ ] I understand the [Completeness Gate](COMPLETENESS_GATE.md) requirements
- [ ] If breaking changes, I've updated [PROJECT_STATUS.md](PROJECT_STATUS.md)
- [ ] If workflow changes, I've updated [docs/ci-cd/](docs/ci-cd/README.md)

---

## Automated Gates Will Check

**Completeness Gate** (`pr-completeness-gate.yml`) - Verifies:
- ✅ Code changes have doc updates (if applicable)
- ✅ Feature/fix code has test updates (if applicable)
- ✅ Status files are consistent
- ✅ Relevant wiki links are suggested

**Performance SLO Gate** (`perf-slo-gate.yml`) - Verifies:
- ✅ No regression >10% on key benchmarks
- ✅ ±5% variance is acceptable

**Lint & Test Gates** - Verifies:
- ✅ No linting errors
- ✅ All tests pass
- ✅ Coverage maintained/improved

**If any gate fails**: Review bot comment, make fixes, push changes - gates re-run automatically.

---

## Questions?

- **Docs/Tests Completeness?** → [COMPLETENESS_GATE.md](COMPLETENESS_GATE.md)
- **Performance Budget?** → [PERFORMANCE_SLO.md](PERFORMANCE_SLO.md)
- **Development Process?** → [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)
- **Project Status?** → [PROJECT_STATUS.md](PROJECT_STATUS.md)
- **Project History?** → [docs/timeline/](docs/timeline/README.md)

---

**Thank you for contributing! 🚀**
- [ ] Performance improved
- [ ] Performance degraded (explain why this is acceptable)

## Breaking Changes
List any breaking changes and migration steps:

## Additional Notes
Any additional information that reviewers should know.
