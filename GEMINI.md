# GEMINI Context Guide

## Load These Files
- .github/workflows/parity-ir.yml — CI gate that triggers auto-merge/auto-fix.
- .github/workflows/auto-merge.yml — Enables GitHub auto-merge (squash) on PR success with approval.
- .github/workflows/auto-fix-bot.yml — On parity/IR failure, refreshes IR report + parity tests and auto-commits/pushes diffs.
- assistant_coordination.md — Coordination rules, priorities, and MCP work-queue guidance.
- gemini-instructions.md — Gemini-specific operating instructions.
- copilot-instructions.md — Partner expectations and shared rules.
- COPILOT_GEMINI_HANDOFF.md — Latest handoff notes/tasks and work-queue state.

## How to Use
1) Load the files above into context before acting.
2) Follow amend workflow for conflict fixes: `git commit --amend --no-edit` then `git push --force-with-lease`.
3) Let auto-merge handle merges after the Parity and IR Gates workflow succeeds and the PR has approval; do not manually merge.
4) If Parity and IR Gates fails, auto-fix-bot may push commits; avoid racing it—re-run CI after it finishes.
5) Keep PRs non-draft when ready; auto-merge requires non-draft + ≥1 approval + green Parity and IR Gates.

## Triggers (recap)
- Parity and IR Gates (push/PR to main) runs parity tests + IR report, uploads `reports/canonical_ir_status.md`.
- auto-merge.yml: runs on Parity and IR Gates success (PR), enables auto-merge if open, non-draft, approved.
- auto-fix-bot.yml: runs on Parity and IR Gates failure (PR), refreshes IR report + parity tests, auto-commits if diffs, comments on PR.
