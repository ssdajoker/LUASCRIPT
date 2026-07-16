# Quick CI/CD Reference

## Local Development Workflow

### Before creating a PR:

```bash
# Verify locally (fast - ~30-60s)
npm run verify

# Check lint (warning-only, won't fail build)
npm run lint
```

### Create PR and let CI do the rest:

```bash
# Create branch
git checkout -b fix/issue-number

# Make changes
git add .
git commit -m "fix: issue description"

# Push and create PR (auto-triggers CI)
gh pr create --base main

# CI runs automatically
# → When approved: auto-merge → done
```

---

## Available Commands

| Command | What it does | Blocks? |
|---------|-------------|---------|
| `npm run verify` | Harness + IR validation + parity + determinism | ✅ Yes (blocking) |
| `npm run lint` | ESLint all code (max 200 warnings) | ❌ No (warnings only) |
| `npm test` | Core + Phase1 tests | ✅ Yes |
| `npm run harness` | IR harness tests | ✅ Yes |
| `npm run test:parity` | Parity verification | ✅ Yes |

---

## CI Gate Flow

```
Push PR
  ↓
CI starts (node 18 + node 20)
  ├─ npm run verify ✅ (fast)
  └─ npm run lint ⚠️ (warning-only)
  ↓
Test results uploaded
  ↓
You review + approve in VS Code
  ↓
Auto-merge triggers
  ├─ Check CI passed? ✅
  ├─ Check approved? ✅
  └─ Squash merge → main
  ↓
PR closed ✨
```

---

## Common Issues

### "CI passed but won't auto-merge"
- Ensure PR is approved (1+ review)
- Check branch is up to date: `git fetch origin main && git rebase`

### "Lint is too strict"
- Currently allows 200 warnings (temporary)
- Status: Phase 1/4 backlog cleanup
- Track progress: `npm run lint | tail -1`

### "Want to manually trigger CI"
- Re-push to branch: `git commit --allow-empty && git push`
- Or use: `gh workflow run ci-lean.yml --ref feature-branch`

---

## Lint Backlog Phases

| When | Max Warnings | Status |
|------|------------|--------|
| Now  | 200 | 🔴 Codex/team cleanup |
| 1-2w | 100 | 🟡 Phase 2 |
| 3-4w | 50  | 🟡 Phase 3 |
| 4-6w | 0   | 🟢 Production ready |

---

## Need Help?

- **CI failed?** → `gh run view <RUN_ID> --log`
- **Check PR status?** → `gh pr view`
- **Download test results?** → `gh run download <RUN_ID>`
- **Manual merge?** → `gh pr merge --squash`

---

See **[CI_CD_LEAN_SETUP.md](CI_CD_LEAN_SETUP.md)** for detailed setup guide.
