# Deployment Checklist: Codex + Gemini Integration

## Pre-Deployment Verification

- [ ] All files created:
  - [ ] `.codex/config.yaml`
  - [ ] `codex-instructions.md`
  - [ ] `scripts/codex-work-consumer.js`
  - [ ] `.github/workflows/gemini-pr-review.yml`
  - [ ] `.github/workflows/codex-test-gates.yml`
  - [ ] `COORDINATION.md`
  - [ ] `CODEX_SETUP_GUIDE.md`

- [ ] Local Gemini removed:
  - [ ] `scripts/gemini-work-consumer.js` deleted
  - [ ] `.gemini/` directory deleted
  - [ ] `.work-queue/` directory deleted

- [ ] Config files verified:
  - [ ] `.codex/config.yaml` has valid YAML syntax
  - [ ] `codex-instructions.md` has complete workflows
  - [ ] `gemini-instructions.md` updated for GitHub-only
  - [ ] `COORDINATION.md` has three-agent protocol

- [ ] NPM scripts added:
  - [ ] `npm run codex:poll` available
  - [ ] `npm run codex:status` available
  - [ ] `npm run sync-status` available
  - [ ] `npm run coordination:status` available

## Environment Setup

- [ ] GitHub CLI authenticated: `gh auth status`
- [ ] Git user configured: `git config --list | grep user`
- [ ] Node.js v20+: `node --version`
- [ ] Lua 5.4+: `lua -v`
- [ ] LuaJIT: `luajit -v`

## GitHub Secrets Configuration

- [ ] `GITHUB_TOKEN` available in Actions (built-in)
- [ ] GitHub Actions workflows visible in repository
- [ ] Workflows not blocked by branch protection rules

## First Test Run

1. **Start Codex polling**:
   ```bash
   npm run codex:poll &
   ```

2. **Create test issue**:
   ```bash
   gh issue create \
     --title "test: check async parsing" \
     --body "Sample test case for Codex integration" \
     --label "codex-work,priority:medium"
   ```

3. **Monitor Codex**:
   - [ ] Codex logs show: "Polling GitHub for work items..."
   - [ ] Within 5 seconds: "Found 1 work item(s)"
   - [ ] Within 10 seconds: "Claiming work item..."
   - [ ] Within 15 seconds: "State updated..."

4. **Simulate fix** (manual for first test):
   ```bash
   # In another terminal, while Codex is waiting
   echo "# Test fix" >> src/phase1_core_parser.js
   ```

5. **Trigger Codex push**:
   - In Codex terminal: Type "done" and press Enter
   - [ ] Should push to `codex/fix-*` branch
   - [ ] GitHub Actions should trigger automatically

6. **Verify GitHub Actions**:
   ```bash
   gh run list --workflow codex-test-gates.yml --limit 1
   ```

7. **Verify Gemini Agent**:
   ```bash
   gh run list --workflow gemini-pr-review.yml --limit 1
   ```

8. **Check PR Status**:
   ```bash
   gh pr list --state open
   ```

## Success Criteria

**First run successful if**:
- [ ] Codex claimed issue within 5 seconds
- [ ] GitHub Actions triggered on push
- [ ] PR created automatically
- [ ] Gemini review posted (check PR comments)
- [ ] PR labeled `#ready-for-review` (if tests pass)
- [ ] No manual interventions needed

**Integration complete if**:
- [ ] >3 successful cycles with zero manual commits
- [ ] Crash recovery tested (stop Codex, restart, resumes)
- [ ] Error escalation tested (failing test creates new issue)
- [ ] All documentation reviewed and understood

## Rollback Plan

If issues encountered:

1. **Stop services**:
   ```bash
   npm run codex:reset
   git checkout main
   ```

2. **Revert workflow files**:
   ```bash
   git restore .github/workflows/codex-test-gates.yml
   git restore .github/workflows/gemini-pr-review.yml
   ```

3. **Remove new files**:
   ```bash
   rm -rf .codex/
   rm codex-instructions.md COORDINATION.md CODEX_SETUP_GUIDE.md
   ```

## Monitoring Dashboard

After deployment, use these commands:

```bash
# Daily status check
npm run coordination:status

# Codex health
npm run codex:status && npm run codex:logs | tail -20

# GitHub activity
gh run list --workflow codex-test-gates.yml --workflow gemini-pr-review.yml --limit 5

# PR queue
gh pr list --state open

# Merged PRs
gh pr list --state closed --limit 10 | head -5
```

## Post-Deployment Tasks

- [ ] Share `CODEX_SETUP_GUIDE.md` with team
- [ ] Pin `COORDINATION.md` in GitHub wiki
- [ ] Verify all workflows in GitHub Actions
- [ ] Run first test cycle
- [ ] Monitor for 24 hours
- [ ] Gather team feedback

---

**Status**: Ready for deployment ✅
