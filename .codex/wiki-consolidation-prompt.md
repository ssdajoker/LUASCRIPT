# Codex Task: Wiki Consolidation & Organization

**Objective**: Consolidate all LUASCRIPT documentation into a high-quality, navigable wiki that separates old from new while preserving the programming journey timeline.

---

## Current State Analysis

### Problem
The repository has 100+ markdown files scattered across the root directory with:
- Duplicate content across similar files
- No clear navigation structure
- Mix of active (CI/CD) and deprecated (old planning) documents
- No organized timeline of project evolution
- Poor discoverability for both contributors and new readers

### Solution Scope
Create a structured wiki with:
1. **Clear information architecture**
2. **Deprecated vs. Active documents** (marked clearly)
3. **Timeline/Journey section** (preserves your programming evolution)
4. **Navigation dashboard**
5. **Optimized for readability and discoverability**

---

## Wiki Structure (Target Architecture)

```
📚 LUASCRIPT Wiki (New Organized Structure)
│
├── 📖 HOME / README
│   └── Quick intro + navigation guide
│
├── 🚀 QUICK START
│   ├── Installation & setup
│   ├── First transpilation
│   └── Common tasks
│
├── 🏗️ ARCHITECTURE & DESIGN
│   ├── System overview
│   ├── IR (Intermediate Representation)
│   ├── Transpilation pipeline
│   ├── Code generation
│   └── Type system
│
├── 🔧 DEVELOPMENT
│   ├── Local setup
│   ├── Running tests
│   ├── Contributing guidelines
│   └── Code standards
│
├── 🤖 CI/CD (ACTIVE - Current)
│   ├── CI/CD Lean Setup (active)
│   ├── Auto-merge workflow
│   ├── Branch protection
│   ├── Lint backlog strategy
│   └── Deployment guide
│
├── 📊 PROJECT TIMELINE (Legacy → Current)
│   ├── Phase 1-4: Initial development
│   ├── Phase 5-6: IR integration
│   ├── Phase 7-8: Transpiler refinement
│   ├── Phase 9: Production readiness
│   ├── Refactoring phases (deprecated planning)
│   └── Journey milestones
│
├── 📋 DEPRECATED DOCS (Historical)
│   ├── Old planning docs (marked [DEPRECATED])
│   ├── Superseded designs (with "see instead:" pointers)
│   ├── Old CI/CD approaches (marked [LEGACY])
│   ├── Exploration dead-ends (with context)
│   └── Timeline context (why they were important)
│
├── 📚 REFERENCE
│   ├── API documentation
│   ├── CLI reference
│   ├── Configuration options
│   └── Troubleshooting guide
│
└── 🎯 STATUS & TRACKING
    ├── Current project status
    ├── Known issues
    ├── Roadmap
    └── Progress metrics
```

---

## Consolidation Rules

### Rule 1: Identify & Categorize Files

**ACTIVE DOCUMENTS** (Keep, organize into main sections):
- CI_CD_*.md (all 7 files) → CI/CD section
- src/validation/* → Architecture/Type system
- IR documentation → Architecture/IR section
- Current README.md → HOME section

**DEPRECATED DOCUMENTS** (Archive with timestamp, add [DEPRECATED] prefix):
- Old phase planning files
- Superseded refactoring guides
- Legacy CI/CD approaches (non-lean)
- Old gemini/codex integration attempts
- Exploration documents that led nowhere

**TIMELINE DOCUMENTS** (Create journey section):
- Map all docs to project phases
- Show evolution from concept → production
- Include "why this approach" context
- Link deprecated to active equivalent

### Rule 2: Create Navigation

Each wiki page should have:
```markdown
---
**Status**: [ACTIVE|DEPRECATED|ARCHIVED]
**Phase**: [1-9 or current]
**Last updated**: YYYY-MM-DD
**Related**: [links to related pages]
**Replaces**: [if superseded]
**See instead**: [if deprecated, link to active equivalent]
---

[Content]

---
**Navigation**:
← [Previous]  |  [Up]  |  [Next] →
```

### Rule 3: Consolidate Duplicates

**Action**: For files with duplicate content:
1. Identify the most complete/recent version
2. Merge unique content from others
3. Create redirect note in duplicates: "See [canonical doc] instead"
4. Keep one source of truth per topic

**Examples**:
- `CI_CD_QUICK_REF.md` + `CI_CD_QUICK_REFERENCE.md` → Single "Quick Reference"
- Multiple `SUMMARY.md` files → One "Project Status"
- `DEPLOYMENT_CHECKLIST.md` + `CI_CD_SETUP_CHECKLIST.md` → Merged

### Rule 4: Mark Timeline Context

For deprecated/old docs, add metadata:
```markdown
[DEPRECATED - Phase 3]
This document describes the approach used in Phase 3 (2025-10-15 to 2025-11-20).
See [current approach] for the modern replacement.

**Why it's deprecated**: [brief explanation]
**What changed**: [key differences]
**Historical value**: [why it's worth keeping in timeline]
```

### Rule 5: Create Jump Points

Create "Choose Your Path" sections:
```markdown
## I want to...

- **Learn what this project is** → [Architecture Overview]
- **Set up CI/CD** → [CI/CD Lean Setup] (current) 
  - *Old approaches*: [Legacy CI/CD] [DEPRECATED]
- **Understand the IR** → [Canonical IR Spec]
- **Contribute code** → [Development Guide]
- **See the journey** → [Project Timeline]
```

---

## Specific Tasks

### Task 1: Create Wiki Homepage
**File**: `wiki/README.md` or `docs/INDEX.md`
**Content**:
- 1-paragraph project summary
- 5 key links (Quick Start, Architecture, CI/CD, Contributing, Timeline)
- Navigation diagram
- Status badge (Production Ready, 0 Errors, 101 Warnings)

### Task 2: Organize Main Sections

**2a. Quick Start** (`docs/quick-start/`)
- Extract from various README files
- Step-by-step: install → first transpilation
- Common tasks (compile, test, debug)

**2b. Architecture** (`docs/architecture/`)
- System overview (merge from design docs)
- IR specification (from canonical_ir_spec.md)
- Type system (from ir-validator, type docs)
- Pipeline flow (from transpiler docs)

**2c. CI/CD (ACTIVE)** (`docs/ci-cd/`)
- Merge all 7 CI_CD_*.md files
- Keep: lean setup, quick ref, architecture, checklists
- Remove duplication (consolidate similar content)
- Add: Status badge (✅ Production Ready)

**2d. Development** (`docs/development/`)
- Local setup
- Running tests (test/* docs)
- Contributing guidelines
- Code standards
- Troubleshooting

**2e. Timeline** (`docs/timeline/` or `docs/journey/`)
- Create index of all phases
- Map each phase to relevant docs
- Show progression: Phase 1 → 9 + Current
- Include context (why each phase, what was learned)

**2f. Deprecated** (`docs/deprecated/` or `docs/legacy/`)
- Old planning docs (with [DEPRECATED] prefix)
- Legacy CI/CD (with link to current)
- Exploration docs (with "why it didn't work" context)
- Superseded designs (with "see instead" pointer)

### Task 3: Create Navigation Index

**File**: `docs/NAVIGATION.md` or sidebar config
```markdown
# Wiki Navigation

## Main Sections
- [Home](#) - Project overview
- [Quick Start](#) - Get up and running
- [Architecture](#) - How it works
- [Development](#) - Contributing
- [CI/CD](#) - Automation (active)
- [Timeline](#) - Project evolution
- [Reference](#) - API, CLI, etc.

## By Role
- **User**: [Quick Start] → [Usage Guide]
- **Developer**: [Development] → [Architecture] → [Contributing]
- **DevOps**: [CI/CD] → [Deployment]
- **Researcher**: [Timeline] → [Architecture] → [Deep Dives]
- **Historian**: [Timeline] → [Deprecated] (journey)
```

### Task 4: Mark Deprecated Docs

**Action**: For each deprecated file:
1. Add frontmatter: `[DEPRECATED - Phase X]`
2. Add timestamp: `Superseded: 2025-12-20`
3. Add pointer: `See [Current Doc] instead`
4. Move to `docs/deprecated/`
5. Update root references

**Example format**:
```markdown
# [DEPRECATED - Phase 5] Old Planning Approach

**Status**: 🔴 DEPRECATED (Phase 5, 2025-11-15)  
**Reason**: Superseded by improved approach  
**See instead**: [Current Approach Document]

---

## Historical Context
This document describes the planning approach from Phase 5...
Why it was important then:
- ...

Why it changed:
- ...

---

## Archive
This document is kept for timeline/journey purposes.
[View current version]
```

### Task 5: Create Consolidated CI/CD Section

**Current files** (7):
1. CI_CD_LEAN_SETUP.md
2. CI_CD_QUICK_REF.md
3. CI_CD_SETUP_CHECKLIST.md
4. CI_CD_ARCHITECTURE.md
5. CI_CD_COMPLETE_SUMMARY.md
6. EXECUTIVE_SUMMARY_CI_CD.md
7. CI_CD_FILE_MANIFEST.md

**Consolidation**:
- **Main**: CI_CD_LEAN_SETUP.md (keep, it's most complete)
- **Quick Ref**: Keep as separate (2-min reads are valuable)
- **Checklist**: Merge into Setup as section
- **Summary**: Create executive overview (consolidate 2 summary files)
- **Architecture**: Keep separate (technical readers need it)
- **Manifest**: Deprecate (info is in setup/summary)

**Result**: 4 files in CI/CD section (clean, no duplication)

### Task 6: Create Timeline Index

**File**: `docs/timeline/INDEX.md`
```markdown
# LUASCRIPT Development Timeline

## Phase 1-4: Foundation (2025-06 to 2025-09)
- Core transpiler implementation
- [Docs](phase1-4/)
- Status: Completed

## Phase 5-6: IR Integration (2025-09 to 2025-10)
- Intermediate representation layer
- [Docs](phase5-6/)
- Status: Completed

## Phase 7-8: Refinement (2025-10 to 2025-11)
- Transpiler optimization
- [Docs](phase7-8/)
- Status: Completed

## Phase 9: Production (2025-11 to 2025-12)
- Production readiness
- [Docs](phase9/)
- Status: Completed

## Current: Automation & DevOps (2025-12+)
- CI/CD automation
- Code quality (0 errors, 101 warnings)
- [Current Status](../status.md)
- Status: Active

## Old Planning (Deprecated)
- [Legacy approaches](../deprecated/)
- Superseded by improved methods
- Kept for historical timeline
```

---

## Output Structure (Final)

```
docs/
├── INDEX.md                          (Wiki home)
├── NAVIGATION.md                     (Navigation guide)
├── quick-start/
│   ├── README.md
│   ├── installation.md
│   └── first-transpilation.md
├── architecture/
│   ├── README.md (overview)
│   ├── system-design.md
│   ├── ir-specification.md
│   ├── type-system.md
│   └── pipeline.md
├── ci-cd/
│   ├── README.md (overview + status badge)
│   ├── setup.md
│   ├── quick-reference.md
│   ├── architecture.md
│   ├── checklist.md
│   └── troubleshooting.md
├── development/
│   ├── README.md
│   ├── local-setup.md
│   ├── testing.md
│   ├── contributing.md
│   └── standards.md
├── timeline/
│   ├── INDEX.md
│   ├── phase-1-4.md
│   ├── phase-5-6.md
│   ├── phase-7-8.md
│   ├── phase-9.md
│   └── current-status.md
├── deprecated/
│   ├── README.md (why these exist)
│   ├── [DEPRECATED] old-planning-1.md
│   ├── [DEPRECATED] legacy-ci-v1.md
│   └── ...
└── reference/
    ├── api.md
    ├── cli.md
    ├── troubleshooting.md
    └── glossary.md
```

---

## Quality Standards

Each wiki page should:
- [ ] Have clear title & purpose
- [ ] Start with status badge (ACTIVE|DEPRECATED|ARCHIVED)
- [ ] Include "Last updated" date
- [ ] Have navigation (← Prev | Up | Next →)
- [ ] Link to related pages
- [ ] Use consistent formatting
- [ ] Be <3000 words (split if needed)
- [ ] Include "Quick links" section
- [ ] Have "Need help?" section

---

## Timeline Preservation Strategy

**Goal**: Keep journey visible while organizing

**Approach**:
1. **Active timeline** in main `timeline/` section
   - Shows progression Phase 1 → 9 → Current
   - Links to relevant active docs
   
2. **Deprecated timeline** in `deprecated/` section
   - Shows exploration, dead-ends, superseded approaches
   - Explains why each was tried and what was learned
   - Links to modern replacements
   
3. **Journey context** in each section
   - "How we got here" blurbs
   - "What changed since Phase X" callouts
   - Why certain decisions were made

4. **Master timeline** (`timeline/INDEX.md`)
   - Visual chronology of entire project
   - Phase descriptions
   - Key learnings at each phase
   - Links to detailed docs

---

## Optimization Goals

### Navigation
- **Before**: 100+ files, unclear structure, hard to find anything
- **After**: Organized sections, clear paths, "Choose your journey" options
- **Target**: New reader can find any info in <2 clicks

### Discoverability
- Homepage with 5-10 key links
- Navigation sidebar/index
- Search-friendly organization
- Clear "you are here" indicators

### Consolidation
- Reduce duplication: 100+ files → ~30 organized pages
- Merge similar content: multiple summaries → 1 executive summary
- Clear relationships: "see also" links throughout

### Timeline
- Preserve journey: show evolution, not just current state
- Context: why things changed, what was learned
- Historical value: keep deprecated docs but clearly mark them

---

## Success Criteria

- [ ] All documentation organized into logical sections
- [ ] 0 broken links (internal links all work)
- [ ] Deprecated docs clearly marked with [DEPRECATED] prefix
- [ ] Navigation works (can traverse entire wiki)
- [ ] Timeline shows project evolution (Phase 1 → Current)
- [ ] CI/CD section consolidated (4 pages, no duplication)
- [ ] Homepage has clear entry points
- [ ] Duplicate content merged (reduce file count by 60%)
- [ ] Each page has status badge, updated date, navigation
- [ ] New readers can find answers in <2 clicks

---

## Additional Context

### Current Pain Points
1. 100+ files scattered in root → confusing
2. Duplicate content (multiple summaries, refs)
3. Old planning docs still visible → outdated info
4. No clear navigation → hard to discover
5. CI/CD section has 7 files → should be 3-4
6. Timeline scattered → not obvious evolution

### Why This Matters
- **Contributor onboarding**: New devs lost in docs
- **Knowledge preservation**: Old approaches valuable for learning
- **Maintenance burden**: Multiple copies to keep in sync
- **Project narrative**: Worth showing the journey

### This Wiki Will Be
- **Beautiful**: Well-organized, easy to navigate
- **Complete**: All active docs, properly organized
- **Historical**: Timeline shows evolution, journey preserved
- **Practical**: Quick-start, checklists, troubleshooting
- **Maintainable**: Clear structure, easy to add/update

---

## Notes for Codex

- Preserve all content (nothing deleted, just reorganized)
- Keep deprecated docs (historical value)
- Be aggressive about consolidating duplicates
- Mark all deprecated clearly but keep them accessible
- Create clear navigation (users should rarely be "lost")
- Preserve the journey timeline aspect
- Test all links after reorganization
- Consider creating a "sitemap" visual
- Add breadcrumb navigation to each page

---

**Status**: Ready for Codex implementation  
**Priority**: High (improves discoverability, maintainability)  
**Estimated effort**: 4-6 hours (documentation only, no code changes)  
**Timeline**: Can be done in parallel with other work
