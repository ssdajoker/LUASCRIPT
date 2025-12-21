# Release Hygiene Quick Start

Fast reference for common release tasks.

## 🚀 One-Command Release

```bash
# Preview what will happen
npm run release:preview

# Perform release
npm run release:patch    # or :minor, :major
```

That's it! The command will:
- ✅ Bump version
- ✅ Generate changelog
- ✅ Sign artifacts
- ✅ Create git tag
- ✅ Push to GitHub (triggers release workflow)

## 📋 Pre-Release Checklist

```bash
# 1. Check readiness
npm run release:status

# 2. Review changes
git status

# 3. Run tests
npm test

# 4. Check gates
npm run test:perf
npm run test:gates
```

## 🔄 Release Workflow

```
Your commit
    ↓
git push origin develop
    ↓
Pull request (reviewed)
    ↓
Merge to main
    ↓
Tag pushed (v1.0.1)
    ↓
GitHub Actions triggers
    ↓
Release published ✨
```

## 🛠️ Common Tasks

### Bump Version Only
```bash
node scripts/version-bump.js patch
```

### Generate Changelog
```bash
node scripts/changelog-generator.js
```

### Sign Artifacts
```bash
node scripts/sign-artifacts.js 1.0.1
```

### Verify Artifacts
```bash
npm run artifacts:verify
```

### List Artifacts
```bash
npm run artifacts:list
```

## 📖 Full Documentation

See [RELEASE_PROCESS.md](RELEASE_PROCESS.md) for comprehensive documentation.

## ⚠️ Troubleshooting

**Working directory not clean?**
```bash
git add .
git commit -m "chore: prepare release"
```

**Tests failing?**
```bash
npm test  # Run locally first
npm run lint:fix
git add .
git commit -m "fix: resolve test failures"
```

**Need to rollback?**
```bash
git tag -d v1.0.1
git push origin :v1.0.1
```

---

## 🎯 Release Success Criteria

Before releasing, ensure:
- [ ] `npm test` passes
- [ ] `npm run lint` passes
- [ ] `npm run test:perf` passes
- [ ] `npm run test:gates` passes
- [ ] Git working directory clean
- [ ] CHANGELOG meaningful
- [ ] No breaking changes (or documented)

## 📊 Monitoring

After release, monitor:
- GitHub Actions: https://github.com/ssdajoker/LUASCRIPT/actions
- Release page: https://github.com/ssdajoker/LUASCRIPT/releases
- Artifact downloads from release page

## 🔐 Security

All artifacts are:
- ✅ Signed with SHA256 checksums
- ✅ Verified before upload
- ✅ Optionally signed with GPG (if available)
- ✅ Tracked in CHECKSUMS.txt

Users can verify:
```bash
sha256sum -c CHECKSUMS.txt
```

---

Need help? See [RELEASE_PROCESS.md](RELEASE_PROCESS.md) or check GitHub Actions logs.
