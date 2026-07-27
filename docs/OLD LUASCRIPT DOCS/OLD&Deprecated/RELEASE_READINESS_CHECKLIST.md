# ✅ Release Readiness Checklist

Use this checklist to verify your system is ready for releases.

## 🚀 Pre-Release (Before Your First Release)

### Dependencies & Tools
- [ ] Node.js 14+ installed (`node --version`)
- [ ] Git configured (`git config --list | grep user`)
- [ ] npm installed (`npm --version`)
- [ ] GitHub access (`gh auth status`)

### Project Setup
- [ ] LUASCRIPT cloned locally
- [ ] Dependencies installed (`npm ci`)
- [ ] Branch configured (develop/main)
- [ ] Tests passing (`npm test`)

### Documentation Review
- [ ] Read [RELEASE_QUICK_START.md](RELEASE_QUICK_START.md)
- [ ] Read [RELEASE_PROCESS.md](RELEASE_PROCESS.md)
- [ ] Understand semantic versioning
- [ ] Understand conventional commits

### Scripts Available
- [ ] `npm run release:patch` works
- [ ] `npm run release:preview` shows output
- [ ] `npm run release:status` runs
- [ ] `node test/release.test.js` passes

---

## 📋 Before Each Release

### Code Quality
- [ ] Run `npm test` - all passing
- [ ] Run `npm run lint` - warnings acceptable
- [ ] Run `npm run test:perf` - gates passing
- [ ] Run `npm run test:gates` - completeness passing

### Git Status
- [ ] `git status` - working directory clean
- [ ] `git log --oneline -5` - recent commits visible
- [ ] Commits use conventional format (feat:, fix:, etc.)
- [ ] No uncommitted changes

### Release Readiness
- [ ] `npm run release:status` - shows READY
- [ ] No branch protection violations
- [ ] Code reviewed (if required)
- [ ] Tests green on main/develop

### Documentation
- [ ] Changelog meaningful
- [ ] Version bump reasonable
- [ ] No breaking changes (or documented)
- [ ] Migration guide (if breaking)

---

## 🎯 During Release

### Preview Phase
- [ ] Run `npm run release:preview` with bump type
- [ ] Review output shows correct version
- [ ] Changelog looks good
- [ ] Artifacts will be found

### Release Phase
- [ ] Run `npm run release:<type>` (patch/minor/major)
- [ ] Observe version bump
- [ ] Observe changelog generation
- [ ] Observe git tag creation

### GitHub Phase
- [ ] Tag pushed to GitHub
- [ ] GitHub Actions workflow started
- [ ] Monitor at: https://github.com/ssdajoker/LUASCRIPT/actions
- [ ] All workflow steps pass

### Release Phase
- [ ] GitHub release created
- [ ] Artifacts uploaded
- [ ] Checksums verified
- [ ] Release marked as latest

---

## 🔍 After Release

### Artifact Verification
- [ ] `npm run artifacts:verify` passes
- [ ] CHECKSUMS.txt matches artifacts
- [ ] Downloads work from release page
- [ ] Artifact sizes reasonable

### Release Page
- [ ] https://github.com/ssdajoker/LUASCRIPT/releases shows release
- [ ] Version number correct
- [ ] Changelog formatted properly
- [ ] Artifacts listed and downloadable

### Version Confirmation
- [ ] `package.json` updated
- [ ] Git tag visible (`git tag -l`)
- [ ] GitHub release shows commit
- [ ] npm package updated (if published)

### Communication
- [ ] Team notified
- [ ] Release notes shared
- [ ] Changelog updated
- [ ] Status documentation updated

---

## ⚠️ Troubleshooting Checklist

### If Release Fails

**Tests failing?**
- [ ] Run `npm test` locally
- [ ] Check error messages
- [ ] Fix issues
- [ ] Commit fixes
- [ ] Try release again

**Git issues?**
- [ ] Check `git status`
- [ ] Commit uncommitted changes
- [ ] Verify branch is main or develop
- [ ] Check branch protection rules

**Release tag issues?**
- [ ] Check existing tags: `git tag -l`
- [ ] Delete failed tag if needed: `git tag -d v1.0.1`
- [ ] Delete remote tag: `git push origin :v1.0.1`
- [ ] Try release again

**Artifact issues?**
- [ ] Check build outputs
- [ ] Verify artifact paths
- [ ] Check signing errors
- [ ] Review workflow logs

### If Release Succeeds But Has Issues

**Wrong version released?**
- [ ] Don't delete release yet
- [ ] Check what went wrong
- [ ] Make hotfix
- [ ] Release new patch version
- [ ] Mark old release as broken

**Missing changelog entry?**
- [ ] Edit GitHub release
- [ ] Update release notes
- [ ] Re-commit CHANGELOG.md if needed
- [ ] Use next release to fix

**Artifacts missing?**
- [ ] Check release artifacts tab
- [ ] Verify build logs
- [ ] Check artifact signing errors
- [ ] Re-run build if needed

---

## 🔐 Security Checklist

### Artifact Integrity
- [ ] CHECKSUMS.txt generated
- [ ] SHA256 sums match artifacts
- [ ] GPG signatures available (if configured)
- [ ] Verification instructions provided

### Access Control
- [ ] Branch protection enforced
- [ ] Required reviews completed
- [ ] No direct main branch pushes
- [ ] Status checks passed

### Audit Trail
- [ ] Commits properly formatted
- [ ] Git history preserved
- [ ] Release notes documented
- [ ] Changelog maintained

---

## 📊 Monitoring Checklist

### During Release
- [ ] GitHub Actions shows progress
- [ ] No unexpected errors
- [ ] Workflows complete in reasonable time
- [ ] Artifacts appear in release

### After Release
- [ ] Release visible on GitHub
- [ ] Artifacts downloadable
- [ ] Checksums correct
- [ ] No security warnings

### Long-term
- [ ] Track release frequency
- [ ] Monitor artifact sizes
- [ ] Review release notes quality
- [ ] Check for missed releases

---

## 🎓 Learning Checklist

### Understanding Release Process
- [ ] Understand what each script does
- [ ] Know the release workflow
- [ ] Familiar with troubleshooting
- [ ] Can handle common issues

### Understanding Quality Gates
- [ ] Know what gates check
- [ ] Understand why gates matter
- [ ] Can interpret gate results
- [ ] Know how to debug gate failures

### Understanding Security
- [ ] Understand artifact signing
- [ ] Know how to verify checksums
- [ ] Understand GPG (if used)
- [ ] Know security best practices

---

## ✅ Release Confidence Scoring

Rate your readiness (1-5 scale):

```
1 = Not ready
2 = Somewhat ready
3 = Ready
4 = Very confident
5 = Expert
```

**Pre-Release Readiness:**
- Dependencies & tools: ___/5
- Project setup: ___/5
- Documentation review: ___/5
- Script verification: ___/5
- **Average**: ___/5

**For Your First Release:**
- Target: 4-5 average
- If less than 3: Review docs more
- If less than 2: Ask for help

---

## 🚀 GO/NO-GO Decision

**Release Go/No-Go Criteria:**

✅ **GO if:**
- [ ] All tests passing
- [ ] Release status shows READY
- [ ] Git working directory clean
- [ ] Version number decided
- [ ] Changelog prepared
- [ ] Team notified

❌ **NO-GO if:**
- [ ] Tests failing
- [ ] Release status shows issues
- [ ] Uncommitted changes
- [ ] Undefined version
- [ ] Empty changelog
- [ ] Breaking changes undocumented

**Final Decision:** 🟢 GO / 🔴 NO-GO

If NO-GO, fix issues and reassess.

---

## 📝 Release Notes Template

When releasing, document:

```markdown
## Release v1.0.1

### Release Date
2025-01-15

### Features
- List new features here

### Fixes
- List bugs fixed here

### Breaking Changes
- None (or list if present)

### Migration Guide
- Instructions if needed

### Downloads
- Available on release page
- Verify with CHECKSUMS.txt

### Verify Artifacts
sha256sum -c CHECKSUMS.txt
```

---

## 🎯 Post-Release Reflection

After each release, reflect:

**What went well?**
- 

**What could improve?**
- 

**What did you learn?**
- 

**Anything to document?**
- 

---

## 📞 Support Resources

### Quick Help
- [RELEASE_QUICK_START.md](RELEASE_QUICK_START.md)

### Detailed Guide
- [RELEASE_PROCESS.md](RELEASE_PROCESS.md)

### Troubleshooting
- Section in RELEASE_PROCESS.md

### Examples
- See examples/extensions/ for patterns

---

**Ready to release? Use this checklist before each release!** ✅

_Remember: A good release is a boring release. Automation prevents surprises._ 🚀
