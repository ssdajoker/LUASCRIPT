# CI/CD Pipeline Deployment Checklist

## ✅ Phase 1: Code & Configuration (Complete)

- [x] ESLint config updated - 0 errors, 101 warnings
- [x] `npm run lint` allows 200 warnings (temporary Phase 1/4)
- [x] `npm run verify` works locally
- [x] Workflows created:
  - [x] `.github/workflows/ci-lean.yml` - Fast gate
  - [x] `.github/workflows/auto-merge-lean.yml` - Auto-merge logic
- [x] Documentation created:
  - [x] `CI_CD_LEAN_SETUP.md` - Full setup guide
  - [x] `CI_CD_QUICK_REF.md` - Developer reference
  - [x] `scripts/setup-branch-protection.sh` - CLI setup script

**Status**: ✅ DONE - Ready for GitHub configuration

---

## ⏳ Phase 2: GitHub Actions Setup (Manual - 5 min)

### 2.1 Enable Workflows

Go to: **Your repo → Actions → All workflows**

- [ ] `CI (Lean)` - Click **Enable** if disabled
- [ ] `Auto-Merge on CI Green` - Click **Enable** if disabled

**Or via CLI**:
```bash
gh workflow enable ci-lean.yml -R ssdajoker/LUASCRIPT
gh workflow enable auto-merge-lean.yml -R ssdajoker/LUASCRIPT
```

### 2.2 Configure Branch Protection for `main`

**Option A: Web UI (Recommended for first-time)**

Go to: **Settings → Branches → Add rule**

- [ ] Branch name: `main`
- [ ] ✅ Require status checks to pass
  - [ ] Add: `gate (18)`
  - [ ] Add: `gate (20)`
- [ ] ✅ Require 1 approval
- [ ] ✅ Dismiss stale reviews on new commits
- [ ] ✅ Require branches to be up to date
- [ ] ✅ Allow auto-merge
- [ ] ☐ Require signed commits (optional)
- [ ] ☐ Include administrators (leave unchecked)

**Option B: GitHub CLI (Scripted)**

```bash
bash scripts/setup-branch-protection.sh
```

---

## 🧪 Phase 3: Test the Pipeline (10 min)

### 3.1 Create test PR

```bash
git checkout -b test/ci-demo
echo "# CI Test" > TEST_CI.md
git add .
git commit -m "test: verify CI pipeline"
git push origin test/ci-demo
gh pr create --base main --title "Test: CI Pipeline" --body "Validating CI/CD setup"
```

### 3.2 Watch CI run

```bash
# Monitor run status
gh run list --branch test/ci-demo

# View logs when complete
gh run view <RUN_ID> --log

# Check PR status
gh pr view
```

**Expected outcome**:
- [ ] Both `gate (18)` and `gate (20)` jobs pass ✓
- [ ] Bot comments on PR with results
- [ ] No auto-merge yet (needs approval)

### 3.3 Test approval flow

```bash
# Approve the PR
gh pr review --approve

# Watch auto-merge trigger
gh run list --workflow auto-merge-lean.yml | head -3
```

**Expected outcome**:
- [ ] Auto-merge workflow starts
- [ ] PR merges automatically
- [ ] Branch closed with squash merge

### 3.4 Verify on main

```bash
git fetch origin main
git log --oneline origin/main | head -3
# Should show your test commit with "Test: CI Pipeline" message
```

---

## 📋 Phase 4: Real-World Testing (Do with first real PR)

When you have a real feature/fix to merge:

1. [ ] Create branch: `git checkout -b fix/your-issue`
2. [ ] Make changes
3. [ ] Push and create PR: `gh pr create --base main`
4. [ ] Wait for CI (2-5 minutes)
5. [ ] Approve: `gh pr review --approve`
6. [ ] Auto-merge happens automatically ✨
7. [ ] Verify in `git log`

---

## 📊 Phase 5: Monitoring & Maintenance

### Weekly check

```bash
# See recent CI runs
gh run list --workflow ci-lean.yml --limit 10

# Check lint warning trend
npm run lint 2>&1 | grep "problems"
```

### Lint backlog phases

Currently at: **Phase 1/4**

| Phase | Warnings | When | Action |
|-------|----------|------|--------|
| 1 | 200 | NOW | Codex/team cleanup |
| 2 | 100 | 1-2w | Update `package.json` |
| 3 | 50 | 3-4w | Update `package.json` |
| 4 | 0 | 4-6w | Production ready |

**To upgrade phase**:
```json
// In package.json
"refactor:lint": "eslint src/**/*.js --max-warnings 100"  // Change 200 → 100
```

---

## 🎯 Success Criteria

All items checked = ✅ Pipeline Live:

- [ ] Workflows enabled in Actions
- [ ] Branch protection configured for `main`
- [ ] Test PR passed CI
- [ ] Auto-merge worked on test PR
- [ ] Team is notified
- [ ] First real PR tested

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Workflows don't show in Actions** | Check `.github/workflows/` files exist and YAML is valid |
| **CI fails on Node setup** | Verify `npm ci` works locally first |
| **Auto-merge doesn't trigger** | Check: (1) PR approved, (2) Not draft, (3) Branch protection enabled |
| **Tests fail on Windows** | Check line endings: `git config core.autocrlf` |
| **Artifacts not uploading** | Verify paths exist: check `npm run verify` output locally |

---

## 📚 References

- [CI_CD_LEAN_SETUP.md](CI_CD_LEAN_SETUP.md) - Detailed setup
- [CI_CD_QUICK_REF.md](CI_CD_QUICK_REF.md) - Developer quick start
- `.github/workflows/ci-lean.yml` - Workflow source
- `.github/workflows/auto-merge-lean.yml` - Auto-merge logic
- `package.json` - Scripts & config

---

## 📝 Sign-Off

- [ ] All phases complete
- [ ] Team briefed on new workflow
- [ ] First PR tested successfully
- [ ] Ready for production use

**Started**: 2025-12-20
**Target completion**: Same day (Phase 2) + 1-2 days (Phase 3-4)
